import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../constants/colors";
import Fonts from "../../constants/fonts";

const { width } = Dimensions.get("window");

// Mock Data for Timeline
const SCHEDULE_ITEMS = [
    { id: "1", start: 9, duration: 1.5, title: "Deep Work: Coding", category: "Work", color: "#E0F2FE", textColor: "#0369A1" },
    { id: "2", start: 11, duration: 1, title: "Team Standup", category: "Meeting", color: "#FCE7F3", textColor: "#BE185D" },
    { id: "3", start: 13, duration: 1, title: "Lunch Break", category: "Health", color: "#DCFCE7", textColor: "#15803D" },
    { id: "4", start: 14.5, duration: 2, title: "Design Review", category: "Work", color: "#F3E8FF", textColor: "#7E22CE" },
    { id: "5", start: 17, duration: 1, title: "Gym", category: "Health", color: "#FFEDD5", textColor: "#C2410C" },
];

const UPCOMING_TASKS = [
    { id: "t1", title: "Review PR #42", due: "Today", icon: "git-pull-request-outline" },
    { id: "t2", title: "Pay electricity bill", due: "Tomorrow", icon: "receipt-outline" },
    { id: "t3", title: "Call Mom", due: "Sunday", icon: "call-outline" },
];

export default function DashboardScreen() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const formattedTime = useMemo(() => {
        return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, [currentTime]);

    const currentTask = useMemo(() => {
        const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
        return SCHEDULE_ITEMS.find(item => currentHour >= item.start && currentHour < item.start + item.duration);
    }, [currentTime]);

    // Generate 24h time slots
    const timeSlots = Array.from({ length: 24 }, (_, i) => i);

    const renderTimeSlot = (hour: number) => {
        const itemsInSlot = SCHEDULE_ITEMS.filter(item => Math.floor(item.start) === hour);
        const isCurrentHour = currentTime.getHours() === hour;

        return (
            <View key={hour} style={styles.timeSlotContainer}>
                {/* Time Label */}
                <View style={styles.timeLabelContainer}>
                    <Text style={[styles.timeLabel, isCurrentHour && styles.timeLabelActive]}>
                        {hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                    </Text>
                </View>

                {/* Timeline Content */}
                <View style={styles.timelineContent}>
                    <View style={styles.gridLine} />
                    {itemsInSlot.map(item => (
                        <View
                            key={item.id}
                            style={[
                                styles.eventCard,
                                {
                                    backgroundColor: item.color,
                                    top: (item.start % 1) * 60, // Offset based on minutes
                                    height: item.duration * 60, // Height based on duration (1h = 60px approx)
                                }
                            ]}
                        >
                            <Text style={[styles.eventTitle, { color: item.textColor }]} numberOfLines={1}>
                                {item.title}
                            </Text>
                            <Text style={[styles.eventCategory, { color: item.textColor }]}>
                                {item.category}
                            </Text>
                        </View>
                    ))}
                    {/* Current Time Indicator Line */}
                    {isCurrentHour && (
                        <View style={[styles.currentTimeLine, { top: currentTime.getMinutes() }]} >
                            <View style={styles.currentTimeDot} />
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Top Section: Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.dateText}>
                            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                        </Text>
                        <View style={styles.timeContainer}>
                            <Text style={styles.largeTime}>{formattedTime}</Text>
                            {/* Current Task Indicator */}
                            <View style={styles.currentTaskPill}>
                                <View style={[styles.statusDot, { backgroundColor: currentTask ? Colors.success : Colors.gray[400] }]} />
                                <Text style={styles.currentTaskText} numberOfLines={1}>
                                    {currentTask ? `Now: ${currentTask.title}` : "Free Time"}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.profileButton}>
                        <Ionicons name="person-circle-outline" size={32} color={Colors.text.primary} />
                    </TouchableOpacity>
                </View>

                {/* Middle Section: Timeline */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>Timeline</Text>
                    <View style={styles.timelineContainer}>
                        {timeSlots.slice(6, 23).map(renderTimeSlot)}
                        {/* Slicing 6am to 11pm for cleaner initial view, could be full 24h */}
                    </View>
                </View>

                {/* Bottom Section: Tasks */}
                <View style={styles.sectionContainer}>
                    <View style={styles.tasksHeaderRow}>
                        <Text style={styles.sectionHeader}>Up Next</Text>
                        <TouchableOpacity>
                            <Ionicons name="add-circle" size={24} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tasksList}>
                        {UPCOMING_TASKS.map(task => (
                            <TouchableOpacity key={task.id} style={styles.taskItem}>
                                <View style={styles.taskIconBg}>
                                    <Ionicons name={task.icon as any} size={20} color={Colors.gray[600]} />
                                </View>
                                <View style={styles.taskContent}>
                                    <Text style={styles.taskTitle}>{task.title}</Text>
                                    <Text style={styles.taskDue}>{task.due}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={Colors.gray[300]} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    dateText: {
        fontSize: 14,
        fontFamily: Fonts.primary.medium,
        color: Colors.gray[500],
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    timeContainer: {
        flexDirection: 'column', // Stacked for cleaner mobile layout, or row if space permits
        gap: 8,
    },
    largeTime: {
        fontSize: 42,
        fontFamily: Fonts.primary.bold,
        color: Colors.text.primary,
        letterSpacing: -1,
    },
    currentTaskPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.gray[100],
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    currentTaskText: {
        fontSize: 13,
        fontFamily: Fonts.primary.medium,
        color: Colors.text.secondary,
    },
    profileButton: {
        padding: 4,
    },

    // Timeline Styles
    sectionContainer: {
        marginBottom: 32,
    },
    sectionHeader: {
        fontSize: 18,
        fontFamily: Fonts.primary.bold,
        color: Colors.text.primary,
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    timelineContainer: {
        paddingHorizontal: 24,
    },
    timeSlotContainer: {
        flexDirection: 'row',
        height: 60, // Fixed height per hour slot
    },
    timeLabelContainer: {
        width: 50,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        paddingTop: 0, // Align with top grid line
    },
    timeLabel: {
        fontSize: 12,
        fontFamily: Fonts.primary.medium,
        color: Colors.gray[400],
    },
    timeLabelActive: {
        color: Colors.primary,
        fontFamily: Fonts.primary.bold,
    },
    timelineContent: {
        flex: 1,
        position: 'relative',
    },
    gridLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: Colors.gray[100],
    },
    eventCard: {
        position: 'absolute',
        left: 10,
        right: 0,
        borderRadius: 12,
        padding: 10,
        justifyContent: 'center',
    },
    eventTitle: {
        fontSize: 13,
        fontFamily: Fonts.primary.semiBold,
        marginBottom: 2,
    },
    eventCategory: {
        fontSize: 11,
        fontFamily: Fonts.primary.medium,
        opacity: 0.8,
    },
    currentTimeLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: Colors.error,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    currentTimeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.error,
        marginLeft: -4,
    },

    // Tasks Styles
    tasksHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 24,
    },
    tasksList: {
        paddingHorizontal: 24,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.primary,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    taskIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.gray[50],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 15,
        fontFamily: Fonts.primary.medium,
        color: Colors.text.primary,
        marginBottom: 2,
    },
    taskDue: {
        fontSize: 12,
        fontFamily: Fonts.primary.regular,
        color: Colors.gray[500],
    },
});
