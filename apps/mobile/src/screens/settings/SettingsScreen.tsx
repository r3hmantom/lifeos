import { ApiService, TimetableSlot, UserSettings } from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActionSheetIOS,
    ActivityIndicator,
    Alert,
    Keyboard,
    LayoutAnimation,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';
import Colors from '../../constants/colors';
import Fonts from '../../constants/fonts';
import { hapticsMedium, hapticsSelection, hapticsSuccess } from '../../utils/haptics';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SettingsScreen() {
    const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [timeInput, setTimeInput] = useState('');
    const [activityInput, setActivityInput] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [timetableData, settingsData] = await Promise.all([
                ApiService.timetable.getAll(),
                ApiService.settings.get()
            ]);
            setTimetable(timetableData);
            setSettings(settingsData);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const toggleSlot = async (id: string, currentStatus: boolean) => {
        hapticsSelection();
        // Optimistic update
        setTimetable(current =>
            current.map(slot =>
                slot.id === id ? { ...slot, isActive: !slot.isActive } : slot
            )
        );

        try {
            await ApiService.timetable.update(id, { isActive: !currentStatus });
        } catch (e) {
            // Revert on error
            setTimetable(current =>
                current.map(slot =>
                    slot.id === id ? { ...slot, isActive: currentStatus } : slot
                )
            );
            Alert.alert("Error", "Failed to update status");
        }
    };

    const handleAddNew = () => {
        hapticsMedium();
        setEditingId(null);
        setTimeInput('');
        setActivityInput('');
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsFormVisible(true);
    };

    const handleEdit = (slot: TimetableSlot) => {
        hapticsMedium();
        setEditingId(slot.id);
        setTimeInput(slot.time);
        setActivityInput(slot.activity);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsFormVisible(true);
    };

    const handleSave = async () => {
        if (!timeInput.trim() || !activityInput.trim()) {
            Alert.alert('Missing Information', 'Please enter both time and activity.');
            return;
        }

        hapticsSuccess();

        try {
            if (editingId) {
                // Update existing
                const updatedSlot = await ApiService.timetable.update(editingId, {
                    time: timeInput.trim(),
                    activity: activityInput.trim()
                });

                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setTimetable(current =>
                    current.map(slot =>
                        slot.id === editingId ? updatedSlot : slot
                    )
                );
            } else {
                // Create new
                const newSlot = await ApiService.timetable.create({
                    time: timeInput.trim(),
                    activity: activityInput.trim(),
                    isActive: true,
                });

                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setTimetable([...timetable, newSlot]);
            }

            // Reset form
            setIsFormVisible(false);
            setEditingId(null);
            setTimeInput('');
            setActivityInput('');
            Keyboard.dismiss();
        } catch (e) {
            Alert.alert("Error", "Failed to save slot");
        }
    };

    const handleCancel = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsFormVisible(false);
        setEditingId(null);
        Keyboard.dismiss();
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Slot",
            "Are you sure you want to remove this time slot?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await ApiService.timetable.delete(id);
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setTimetable(current => current.filter(slot => slot.id !== id));
                            if (editingId === id) handleCancel();
                        } catch (e) {
                            Alert.alert("Error", "Failed to delete slot");
                        }
                    }
                }
            ]
        );
    };

    const toggleNotifications = async (value: boolean) => {
        if (!settings) return;
        hapticsSelection();
        const oldSettings = { ...settings };
        setSettings({ ...settings, notificationsEnabled: value });

        try {
            await ApiService.settings.update({ notificationsEnabled: value });
        } catch (e) {
            setSettings(oldSettings);
            Alert.alert("Error", "Failed to update notifications");
        }
    };

    const changeTheme = () => {
        const options = ['Light', 'Dark', 'System', 'Cancel'];
        const cancelButtonIndex = 3;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex,
                },
                (buttonIndex) => {
                    if (buttonIndex !== cancelButtonIndex) {
                        handleThemeChange(options[buttonIndex].toLowerCase() as any);
                    }
                }
            );
        } else {
            Alert.alert(
                "Select Theme",
                "Choose your preferred app theme",
                [
                    { text: "Light", onPress: () => handleThemeChange('light') },
                    { text: "Dark", onPress: () => handleThemeChange('dark') },
                    { text: "System", onPress: () => handleThemeChange('system') },
                    { text: "Cancel", style: "cancel" }
                ]
            );
        }
    };

    const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
        if (!settings) return;
        hapticsSelection();
        const oldSettings = { ...settings };
        setSettings({ ...settings, theme });

        try {
            await ApiService.settings.update({ theme });
        } catch (e) {
            setSettings(oldSettings);
            Alert.alert("Error", "Failed to update theme");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Timetable Configuration</Text>
                    <Text style={styles.sectionSubtitle}>
                        Customize your daily schedule template. Active slots will be generated for your daily plan.
                    </Text>

                    {isFormVisible && (
                        <View style={styles.formContainer}>
                            <Text style={styles.formHeader}>{editingId ? 'Edit Slot' : 'New Time Slot'}</Text>

                            <Text style={styles.label}>Time</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 08:00 AM"
                                placeholderTextColor={Colors.gray[400]}
                                value={timeInput}
                                onChangeText={setTimeInput}
                            />

                            <Text style={styles.label}>Activity</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Morning Jog"
                                placeholderTextColor={Colors.gray[400]}
                                value={activityInput}
                                onChangeText={setActivityInput}
                            />

                            <View style={styles.formActions}>
                                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                                    <Text style={styles.saveButtonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <View style={styles.card}>
                        {loading ? (
                            <ActivityIndicator size="small" color={Colors.primary} style={{ padding: 20 }} />
                        ) : timetable.length === 0 ? (
                            <Text style={{ padding: 20, textAlign: 'center', color: Colors.gray[500] }}>
                                No slots configured. Add one below.
                            </Text>
                        ) : (
                            timetable.map((slot, index) => (
                                <View key={slot.id} style={[
                                    styles.row,
                                    index !== timetable.length - 1 && styles.divider
                                ]}>
                                    <TouchableOpacity
                                        style={styles.rowContent}
                                        onPress={() => handleEdit(slot)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.textContainer}>
                                            <Text style={[styles.timeText, !slot.isActive && styles.inactiveText]}>
                                                {slot.time}
                                            </Text>
                                            <Text style={[styles.activityText, !slot.isActive && styles.inactiveText]}>
                                                {slot.activity}
                                            </Text>
                                        </View>
                                        <View style={styles.editHint}>
                                            <Ionicons name="pencil" size={14} color={Colors.gray[400]} />
                                            <Text style={styles.editHintText}>Edit</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <View style={styles.actions}>
                                        <Switch
                                            value={slot.isActive}
                                            onValueChange={() => toggleSlot(slot.id, slot.isActive)}
                                            trackColor={{ false: Colors.gray[200], true: Colors.primary }}
                                            thumbColor={Colors.white}
                                        />
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDelete(slot.id)}
                                        >
                                            <Ionicons name="trash-outline" size={20} color={Colors.gray[400]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                {!isFormVisible && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleAddNew}>
                        <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                        <Text style={styles.actionButtonText}>Add New Time Slot</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Preferences</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.settingLabel}>Notifications</Text>
                            <Switch
                                value={settings?.notificationsEnabled ?? false}
                                onValueChange={toggleNotifications}
                                trackColor={{ false: Colors.gray[200], true: Colors.primary }}
                                thumbColor={Colors.white}
                                disabled={!settings}
                            />
                        </View>
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.row} onPress={changeTheme} disabled={!settings}>
                            <Text style={styles.settingLabel}>Theme</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.valueText}>
                                    {settings?.theme ? settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1) : 'Loading...'}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginTop: 40,
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: Fonts.primary.bold,
        color: Colors.text.primary,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.primary.semiBold,
        color: Colors.text.primary,
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.secondary,
        marginBottom: 16,
        lineHeight: 20,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: Colors.gray[100],
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    rowContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    editHint: {
        flexDirection: 'row',
        alignItems: 'center',
        opacity: 0, // Hidden by default, could show on press or just rely on the icon
    },
    editHintText: {
        fontSize: 12,
        color: Colors.gray[400],
        marginLeft: 4,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    deleteButton: {
        padding: 4,
    },
    timeText: {
        fontSize: 14,
        fontFamily: Fonts.primary.medium,
        color: Colors.primary,
        marginBottom: 4,
    },
    activityText: {
        fontSize: 16,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.primary,
    },
    inactiveText: {
        color: Colors.gray[400],
        textDecorationLine: 'line-through',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: Colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
        marginBottom: 24,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 16,
        fontFamily: Fonts.primary.medium,
        color: Colors.primary,
    },
    settingLabel: {
        fontSize: 16,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.primary,
    },
    valueText: {
        fontSize: 14,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.secondary,
        marginRight: 8,
    },
    formContainer: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
    },
    formHeader: {
        fontSize: 18,
        fontFamily: Fonts.primary.semiBold,
        color: Colors.text.primary,
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontFamily: Fonts.primary.medium,
        color: Colors.gray[600],
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.gray[50],
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.primary,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.gray[100],
    },
    saveButton: {
        backgroundColor: Colors.primary,
    },
    cancelButtonText: {
        color: Colors.gray[600],
        fontFamily: Fonts.primary.semiBold,
        fontSize: 16,
    },
    saveButtonText: {
        color: Colors.white,
        fontFamily: Fonts.primary.semiBold,
        fontSize: 16,
    },
});