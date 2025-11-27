import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  Platform,
  UIManager,
  LayoutAnimation,
  TextInput,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import Fonts from '../../constants/fonts';
import { hapticsSelection, hapticsSuccess, hapticsMedium } from '../../utils/haptics';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TimeSlot = {
  id: string;
  time: string;
  activity: string;
  isActive: boolean;
};

const DEFAULT_TIMETABLE: TimeSlot[] = [
  { id: '1', time: '07:00 AM', activity: 'Morning Routine', isActive: true },
  { id: '2', time: '09:00 AM', activity: 'Deep Work', isActive: true },
  { id: '3', time: '12:00 PM', activity: 'Lunch Break', isActive: true },
  { id: '4', time: '01:00 PM', activity: 'Meetings & Calls', isActive: true },
  { id: '5', time: '05:00 PM', activity: 'Exercise', isActive: true },
  { id: '6', time: '07:00 PM', activity: 'Dinner & Relax', isActive: true },
];

export default function SettingsScreen() {
  const [timetable, setTimetable] = useState<TimeSlot[]>(DEFAULT_TIMETABLE);
  
  // Form State
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [timeInput, setTimeInput] = useState('');
  const [activityInput, setActivityInput] = useState('');

  const toggleSlot = (id: string) => {
    hapticsSelection();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTimetable(current =>
      current.map(slot =>
        slot.id === id ? { ...slot, isActive: !slot.isActive } : slot
      )
    );
  };

  const handleAddNew = () => {
    hapticsMedium();
    setEditingId(null);
    setTimeInput('');
    setActivityInput('');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFormVisible(true);
  };

  const handleEdit = (slot: TimeSlot) => {
    hapticsMedium();
    setEditingId(slot.id);
    setTimeInput(slot.time);
    setActivityInput(slot.activity);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFormVisible(true);
  };

  const handleSave = () => {
    if (!timeInput.trim() || !activityInput.trim()) {
        Alert.alert('Missing Information', 'Please enter both time and activity.');
        return;
    }

    hapticsSuccess();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (editingId) {
        // Update existing
        setTimetable(current =>
            current.map(slot =>
                slot.id === editingId
                    ? { ...slot, time: timeInput.trim(), activity: activityInput.trim() }
                    : slot
            )
        );
    } else {
        // Create new
        const newSlot: TimeSlot = {
            id: Date.now().toString(),
            time: timeInput.trim(),
            activity: activityInput.trim(),
            isActive: true,
        };
        setTimetable([...timetable, newSlot]);
    }

    // Reset form
    setIsFormVisible(false);
    setEditingId(null);
    setTimeInput('');
    setActivityInput('');
    Keyboard.dismiss();
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
                onPress: () => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setTimetable(current => current.filter(slot => slot.id !== id));
                    if (editingId === id) handleCancel();
                }
            }
        ]
    );
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
            {timetable.map((slot, index) => (
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
                        onValueChange={() => toggleSlot(slot.id)}
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
            ))}
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
            <TouchableOpacity style={styles.row}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row}>
              <Text style={styles.settingLabel}>Theme</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.valueText}>Light</Text>
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