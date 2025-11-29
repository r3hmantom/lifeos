import { ApiService, UserSettings } from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActionSheetIOS,
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';
import Colors from '../../constants/colors';
import Fonts from '../../constants/fonts';
import { hapticsSelection } from '../../utils/haptics';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SettingsScreen() {
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const settingsData = await ApiService.settings.get();
            setSettings(settingsData);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to load settings");
        } finally {
            setLoading(false);
        }
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
                {loading && (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 20 }} />
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
});