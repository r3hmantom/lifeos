import { ProposedScheduleItem } from '@/src/services/api';
import { hapticsLight, hapticsMedium, hapticsSuccess, hapticsSelection } from '@/src/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import Fonts from '../../constants/fonts';

interface TimeSlotEditorProps {
    visible: boolean;
    item: ProposedScheduleItem | null;
    itemIndex: number;
    onSave: (index: number, editedItem: ProposedScheduleItem) => void;
    onClose: () => void;
}

export default function TimeSlotEditor({
    visible,
    item,
    itemIndex,
    onSave,
    onClose,
}: TimeSlotEditorProps) {
    const insets = useSafeAreaInsets();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startHour, setStartHour] = useState('9');
    const [startMinute, setStartMinute] = useState('00');
    const [startAmPm, setStartAmPm] = useState<'AM' | 'PM'>('AM');
    const [endHour, setEndHour] = useState('5');
    const [endMinute, setEndMinute] = useState('00');
    const [endAmPm, setEndAmPm] = useState<'AM' | 'PM'>('PM');

    // Convert 24-hour to 12-hour format
    const convert24To12 = (time24: string): { hour: string; minute: string; amPm: 'AM' | 'PM' } => {
        let hour24: number;
        let minute: string;

        if (time24.includes('T')) {
            // ISO format
            const date = new Date(time24);
            hour24 = date.getHours();
            minute = date.getMinutes().toString().padStart(2, '0');
        } else {
            // HH:mm format
            const [h, m] = time24.split(':').map(Number);
            hour24 = h;
            minute = m.toString().padStart(2, '0');
        }

        let hour12 = hour24;
        let amPm: 'AM' | 'PM' = 'AM';

        if (hour24 === 0) {
            hour12 = 12;
        } else if (hour24 === 12) {
            amPm = 'PM';
        } else if (hour24 > 12) {
            hour12 = hour24 - 12;
            amPm = 'PM';
        }

        return { hour: hour12.toString(), minute, amPm };
    };

    // Convert 12-hour to 24-hour format
    const convert12To24 = (hour: string, minute: string, amPm: 'AM' | 'PM'): string => {
        let hour24 = parseInt(hour, 10);

        if (amPm === 'PM' && hour24 !== 12) {
            hour24 += 12;
        } else if (amPm === 'AM' && hour24 === 12) {
            hour24 = 0;
        }

        return `${hour24.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
    };

    useEffect(() => {
        if (item) {
            setTitle(item.title);
            setDescription(item.description || '');

            // Convert times to 12-hour format
            const start12 = convert24To12(item.startTime);
            setStartHour(start12.hour);
            setStartMinute(start12.minute);
            setStartAmPm(start12.amPm);

            const end12 = convert24To12(item.endTime);
            setEndHour(end12.hour);
            setEndMinute(end12.minute);
            setEndAmPm(end12.amPm);
        }
    }, [item]);

    const handleHourChange = (value: string, isStart: boolean) => {
        hapticsLight();
        // Allow empty for better UX
        if (value === '') {
            if (isStart) {
                setStartHour('');
            } else {
                setEndHour('');
            }
            return;
        }

        // Remove non-digits
        const digits = value.replace(/\D/g, '');
        if (digits === '') {
            if (isStart) {
                setStartHour('');
            } else {
                setEndHour('');
            }
            return;
        }

        const num = parseInt(digits, 10);
        // Allow 1-12 for 12-hour format
        if (num >= 1 && num <= 12) {
            if (isStart) {
                setStartHour(num.toString());
            } else {
                setEndHour(num.toString());
            }
        } else if (num > 12) {
            // Auto-correct to 12 if user types something like 13
            if (isStart) {
                setStartHour('12');
            } else {
                setEndHour('12');
            }
        }
    };

    const handleMinuteChange = (value: string, isStart: boolean) => {
        hapticsLight();
        // Allow empty for better UX
        if (value === '') {
            if (isStart) {
                setStartMinute('');
            } else {
                setEndMinute('');
            }
            return;
        }

        // Remove non-digits
        const digits = value.replace(/\D/g, '');
        if (digits === '') {
            if (isStart) {
                setStartMinute('');
            } else {
                setEndMinute('');
            }
            return;
        }

        const num = parseInt(digits, 10);
        if (num >= 0 && num <= 59) {
            // Auto-format with leading zero for single digits
            const formatted = num.toString().padStart(2, '0');
            if (isStart) {
                setStartMinute(formatted);
            } else {
                setEndMinute(formatted);
            }
        } else if (num > 59) {
            // Auto-correct to 59 if user types something like 60
            if (isStart) {
                setStartMinute('59');
            } else {
                setEndMinute('59');
            }
        }
    };

    const handleSave = () => {
        if (!item) return;

        hapticsMedium();
        // Validate title
        if (!title.trim()) {
            Alert.alert('Invalid Input', 'Please enter a title');
            return;
        }

        // Validate times are filled and default minutes to '00' if empty
        if (!startHour) {
            Alert.alert('Invalid Time', 'Please enter a valid start time');
            return;
        }

        if (!endHour) {
            Alert.alert('Invalid Time', 'Please enter a valid end time');
            return;
        }

        // Default minutes to '00' if empty
        const finalStartMinute = startMinute || '00';
        const finalEndMinute = endMinute || '00';

        // Convert 12-hour to 24-hour format
        const startTime24 = convert12To24(startHour, finalStartMinute, startAmPm);
        const endTime24 = convert12To24(endHour, finalEndMinute, endAmPm);

        // Validate that end time is after start time
        const [startHours, startMinutes] = startTime24.split(':').map(Number);
        const [endHours, endMinutes] = endTime24.split(':').map(Number);
        const startTotal = startHours * 60 + startMinutes;
        const endTotal = endHours * 60 + endMinutes;

        if (endTotal <= startTotal) {
            Alert.alert('Invalid Time', 'End time must be after start time');
            return;
        }

        // Create edited item
        const editedItem: ProposedScheduleItem = {
            ...item,
            title: title.trim(),
            description: description.trim() || undefined,
            startTime: startTime24,
            endTime: endTime24,
        };

        hapticsSuccess();
        onSave(itemIndex, editedItem);
        onClose();
    };

    if (!item) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <View style={styles.modalContent}>
                    <View style={[styles.modalHeader]}>
                        <Text style={styles.modalTitle}>Edit Time Slot</Text>
                        <TouchableOpacity 
                            onPress={() => {
                                hapticsLight();
                                onClose();
                            }} 
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={24} color={Colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalBodyWrapper}>
                        <ScrollView 
                            style={styles.modalBody} 
                            contentContainerStyle={styles.modalBodyContent}
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                        >
                            <View style={styles.formSection}>
                                <Text style={styles.sectionLabel}>Title</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Enter title"
                                    placeholderTextColor={Colors.gray[400]}
                                    multiline={false}
                                />
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.sectionLabel}>Description</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textArea]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Enter description (optional)"
                                    placeholderTextColor={Colors.gray[400]}
                                    multiline={true}
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>

                            <View style={styles.timeInputContainer}>
                                <Text style={styles.sectionLabel}>Start Time</Text>
                                <View style={styles.timePickerContainer}>
                                    <View style={styles.timePickerRow}>
                                        <View style={styles.timePickerGroup}>
                                            <Text style={styles.timePickerLabel}>Hour</Text>
                                            <TextInput
                                                style={styles.timePickerInput}
                                                value={startHour}
                                                onChangeText={(text) => handleHourChange(text, true)}
                                                placeholder="9"
                                                placeholderTextColor={Colors.gray[400]}
                                                keyboardType="numeric"
                                                maxLength={2}
                                                selectTextOnFocus
                                            />
                                        </View>
                                        <Text style={styles.timeSeparator}>:</Text>
                                        <View style={styles.timePickerGroup}>
                                            <Text style={styles.timePickerLabel}>Minute</Text>
                                            <TextInput
                                                style={styles.timePickerInput}
                                                value={startMinute || '00'}
                                                onChangeText={(text) => handleMinuteChange(text, true)}
                                                placeholder="00"
                                                placeholderTextColor={Colors.gray[400]}
                                                keyboardType="numeric"
                                                maxLength={2}
                                                selectTextOnFocus
                                            />
                                        </View>
                                        <View style={styles.amPmContainer}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.amPmButton,
                                                    startAmPm === 'AM' && styles.amPmButtonActive
                                                ]}
                                                onPress={() => {
                                                    hapticsSelection();
                                                    setStartAmPm('AM');
                                                }}
                                            >
                                                <Text style={[
                                                    styles.amPmText,
                                                    startAmPm === 'AM' && styles.amPmTextActive
                                                ]}>AM</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.amPmButton,
                                                    startAmPm === 'PM' && styles.amPmButtonActive
                                                ]}
                                                onPress={() => {
                                                    hapticsSelection();
                                                    setStartAmPm('PM');
                                                }}
                                            >
                                                <Text style={[
                                                    styles.amPmText,
                                                    startAmPm === 'PM' && styles.amPmTextActive
                                                ]}>PM</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.timeInputContainer}>
                                <Text style={styles.sectionLabel}>End Time</Text>
                                <View style={styles.timePickerContainer}>
                                    <View style={styles.timePickerRow}>
                                        <View style={styles.timePickerGroup}>
                                            <Text style={styles.timePickerLabel}>Hour</Text>
                                            <TextInput
                                                style={styles.timePickerInput}
                                                value={endHour}
                                                onChangeText={(text) => handleHourChange(text, false)}
                                                placeholder="5"
                                                placeholderTextColor={Colors.gray[400]}
                                                keyboardType="numeric"
                                                maxLength={2}
                                                selectTextOnFocus
                                            />
                                        </View>
                                        <Text style={styles.timeSeparator}>:</Text>
                                        <View style={styles.timePickerGroup}>
                                            <Text style={styles.timePickerLabel}>Minute</Text>
                                            <TextInput
                                                style={styles.timePickerInput}
                                                value={endMinute || '00'}
                                                onChangeText={(text) => handleMinuteChange(text, false)}
                                                placeholder="00"
                                                placeholderTextColor={Colors.gray[400]}
                                                keyboardType="numeric"
                                                maxLength={2}
                                                selectTextOnFocus
                                            />
                                        </View>
                                        <View style={styles.amPmContainer}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.amPmButton,
                                                    endAmPm === 'AM' && styles.amPmButtonActive
                                                ]}
                                                onPress={() => {
                                                    hapticsSelection();
                                                    setEndAmPm('AM');
                                                }}
                                            >
                                                <Text style={[
                                                    styles.amPmText,
                                                    endAmPm === 'AM' && styles.amPmTextActive
                                                ]}>AM</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.amPmButton,
                                                    endAmPm === 'PM' && styles.amPmButtonActive
                                                ]}
                                                onPress={() => {
                                                    hapticsSelection();
                                                    setEndAmPm('PM');
                                                }}
                                            >
                                                <Text style={[
                                                    styles.amPmText,
                                                    endAmPm === 'PM' && styles.amPmTextActive
                                                ]}>PM</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </View>

                    <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 32 }]}>
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity
                                style={[styles.footerButton, styles.cancelButton]}
                                onPress={() => {
                                    hapticsLight();
                                    onClose();
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.footerButton, styles.saveButton]}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.background.primary,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        minHeight: '80%',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: Fonts.primary.bold,
        color: Colors.text.primary,
    },
    closeButton: {
        padding: 4,
    },
    modalBodyWrapper: {
        flex: 1,
        minHeight: 420,
    },
    modalBody: {
        flex: 1,
    },
    modalBodyContent: {
        padding: 20,
        paddingBottom: 100,
        flexGrow: 1,
    },
    formSection: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 14,
        fontFamily: Fonts.primary.semiBold,
        color: Colors.text.primary,
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: Colors.gray[50],
        borderWidth: 1,
        borderColor: Colors.gray[300],
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.primary,
        minHeight: 48,
    },
    textArea: {
        minHeight: 100,
        paddingTop: 16,
    },
    timeInputContainer: {
        marginBottom: 24,
    },
    timePickerContainer: {
        backgroundColor: Colors.gray[50],
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.gray[300],
    },
    timePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    timePickerGroup: {
        alignItems: 'center',
        gap: 8,
    },
    timePickerLabel: {
        fontSize: 12,
        fontFamily: Fonts.primary.medium,
        color: Colors.text.secondary,
        textTransform: 'uppercase',
    },
    timePickerInput: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: Colors.gray[300],
        borderRadius: 8,
        width: 70,
        height: 60,
        textAlign: 'center',
        fontSize: 24,
        fontFamily: Fonts.primary.bold,
        color: Colors.text.primary,
    },
    timeSeparator: {
        fontSize: 24,
        fontFamily: Fonts.primary.bold,
        color: Colors.text.primary,
        marginTop: 20,
    },
    amPmContainer: {
        flexDirection: 'row',
        gap: 4,
        marginTop: 20,
        marginLeft: 8,
    },
    amPmButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: Colors.gray[300],
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        minWidth: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    amPmButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    amPmText: {
        fontSize: 14,
        fontFamily: Fonts.primary.semiBold,
        color: Colors.text.secondary,
    },
    amPmTextActive: {
        color: 'white',
    },
    modalFooter: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: Colors.gray[200],
        backgroundColor: Colors.background.primary,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    footerButton: {
        flex: 1,
        paddingVertical: 14,
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
        fontSize: 16,
        fontFamily: Fonts.primary.semiBold,
        color: Colors.text.primary,
    },
    saveButtonText: {
        fontSize: 16,
        fontFamily: Fonts.primary.semiBold,
        color: 'white',
    },
});

