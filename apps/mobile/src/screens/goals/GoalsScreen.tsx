import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
  Keyboard,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import Fonts from '../../constants/fonts';
import { hapticsLight, hapticsMedium, hapticsSuccess, hapticsSelection } from '../../utils/haptics';

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Priority = 'High' | 'Medium' | 'Low';

type Goal = {
  id: string;
  title: string;
  focus: string;
  deadline: string;
  priority: Priority;
  isActive: boolean;
};

const STATIC_GOALS: Goal[] = [
  {
    id: '1',
    title: 'Learn Spanish',
    focus: 'Personal Development',
    deadline: '6 Months',
    priority: 'Medium',
    isActive: true,
  },
  {
    id: '2',
    title: 'Launch Mobile App',
    focus: 'Career',
    deadline: '3 Months',
    priority: 'High',
    isActive: true,
  },
  {
    id: '3',
    title: 'Run 10k',
    focus: 'Health',
    deadline: '1 Month',
    priority: 'Low',
    isActive: false,
  },
];

const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];
const DEADLINE_PRESETS = ['1 Week', '1 Month', '3 Months', '6 Months', '1 Year'];

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>(STATIC_GOALS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [focus, setFocus] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');

  const toggleExpand = (id: string) => {
    hapticsLight();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleForm = () => {
    hapticsMedium();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFormVisible(!isFormVisible);
  };

  const toggleActive = (id: string) => {
    hapticsSelection();
    setGoals(current =>
      current.map(g =>
        g.id === id ? { ...g, isActive: !g.isActive } : g
      )
    );
  };

  const handleAddGoal = () => {
    if (!title.trim() || !focus.trim()) return;

    hapticsSuccess();
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: title.trim(),
      focus: focus.trim(),
      deadline: deadline || 'No deadline',
      priority,
      isActive: true,
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setGoals([newGoal, ...goals]);
    
    // Reset form
    setTitle('');
    setFocus('');
    setDeadline('');
    setPriority('Medium');
    setIsFormVisible(false);
    Keyboard.dismiss();
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'High': return '#FF6B6B'; // Soft Red
      case 'Medium': return '#4ECDC4'; // Soft Teal
      case 'Low': return '#95A5A6'; // Grayish Blue
      default: return Colors.primary;
    }
  };

  const getPriorityBg = (p: Priority) => {
    switch (p) {
      case 'High': return '#FFF0F0';
      case 'Medium': return '#E0F7FA';
      case 'Low': return '#F5F5F5';
      default: return Colors.gray[50];
    }
  };

  const renderItem = ({ item }: { item: Goal }) => {
    const isExpanded = expandedId === item.id;
    const priorityColor = item.isActive ? getPriorityColor(item.priority) : Colors.gray[400];
    const priorityBg = item.isActive ? getPriorityBg(item.priority) : Colors.gray[100];

    return (
      <TouchableOpacity
        style={[
            styles.card, 
            { borderLeftColor: priorityColor, borderLeftWidth: 4 },
            !item.isActive && styles.cardInactive
        ]}
        activeOpacity={0.9}
        onPress={() => toggleExpand(item.id)}
      >
        <View style={styles.cardHeader}>
          <TouchableOpacity
            onPress={(e) => {
                e.stopPropagation();
                toggleActive(item.id);
            }}
            style={styles.checkboxContainer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
                name={item.isActive ? "checkbox" : "square-outline"}
                size={24}
                color={item.isActive ? Colors.primary : Colors.gray[400]}
            />
            <Text style={[
                styles.checkboxLabel,
                { color: item.isActive ? Colors.primary : Colors.gray[400] }
            ]}>
                {item.isActive ? "Active" : "Inactive"}
            </Text>
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={[styles.cardTitle, !item.isActive && styles.textInactive]}>{item.title}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.badge, { backgroundColor: priorityBg }]}>
                <Text style={[styles.badgeText, { color: priorityColor }]}>{item.priority}</Text>
              </View>
              <Text style={styles.focusText}>{item.focus}</Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.gray[400]}
          />
        </View>

        {isExpanded && (
          <View style={styles.cardBody}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.gray[500]} />
              <Text style={styles.detailText}>Deadline: {item.deadline}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="locate-outline" size={16} color={Colors.gray[500]} />
              <Text style={styles.detailText}>Focus Area: {item.focus}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Goals</Text>
        <TouchableOpacity style={styles.addButton} onPress={toggleForm}>
          <Ionicons name={isFormVisible ? "close" : "add"} size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {isFormVisible && (
        <View style={styles.formContainer}>
          <Text style={styles.formHeader}>New Goal</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Goal Title (e.g. Learn Guitar)"
            placeholderTextColor={Colors.gray[400]}
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Focus Area (e.g. Hobbies)"
            placeholderTextColor={Colors.gray[400]}
            value={focus}
            onChangeText={setFocus}
          />

          <Text style={styles.label}>Priority</Text>
          <View style={styles.chipContainer}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.chip,
                  priority === p && { backgroundColor: getPriorityColor(p) }
                ]}
                onPress={() => {
                  hapticsSelection();
                  setPriority(p);
                }}
              >
                <Text style={[
                  styles.chipText,
                  priority === p && { color: Colors.white }
                ]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Deadline</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollChips}>
            {DEADLINE_PRESETS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.chip,
                  deadline === d && { backgroundColor: Colors.primary }
                ]}
                onPress={() => {
                  hapticsSelection();
                  setDeadline(d);
                }}
              >
                <Text style={[
                  styles.chipText,
                  deadline === d && { color: Colors.white }
                ]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder="Or type custom deadline..."
            placeholderTextColor={Colors.gray[400]}
            value={deadline}
            onChangeText={setDeadline}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleAddGoal}>
            <Text style={styles.submitButtonText}>Create Goal</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={goals}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
            <View style={styles.infoContainer}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>
                    Mark goals as <Text style={styles.infoHighlight}>Active</Text> to include them in your daily plan.
                </Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15', // 15 is hex opacity ~8%
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.primary.regular,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  infoHighlight: {
    fontFamily: Fonts.primary.bold,
    color: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  formContainer: {
    backgroundColor: Colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formHeader: {
    fontSize: 18,
    fontFamily: Fonts.primary.semiBold,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: Fonts.primary.regular,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.primary.medium,
    color: Colors.gray[600],
    marginBottom: 8,
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  scrollChips: {
    flexDirection: 'row',
    marginBottom: 8,
    maxHeight: 40,
  },
  chip: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontFamily: Fonts.primary.medium,
    color: Colors.gray[700],
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.primary.semiBold,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  cardInactive: {
    opacity: 0.7,
    backgroundColor: Colors.gray[50],
    borderLeftColor: Colors.gray[400],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    width: 50,
  },
  checkboxLabel: {
    fontSize: 10,
    fontFamily: Fonts.primary.medium,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: Fonts.primary.semiBold,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  textInactive: {
    textDecorationLine: 'line-through',
    color: Colors.text.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: Fonts.primary.bold,
  },
  focusText: {
    fontSize: 14,
    fontFamily: Fonts.primary.medium,
    color: Colors.gray[500],
  },
  cardBody: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 15,
    fontFamily: Fonts.primary.regular,
    color: Colors.text.secondary,
  },
});
