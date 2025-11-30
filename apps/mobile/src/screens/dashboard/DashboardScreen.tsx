import { useApp } from '@/src/context/AppContext';
import { ApiService, ScheduleItem } from '@/src/services/api';
import { hapticsSuccess } from '@/src/utils/haptics';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../constants/colors";
import Fonts from "../../constants/fonts";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
    const navigation = useNavigation<any>();
    const router = useRouter();
    const { hasCreatedMemory, hasCreatedGoal, isScheduleGenerated, checkState } = useApp();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingSchedule, setLoadingSchedule] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    // Navigation Logic for Onboarding Flow
    useEffect(() => {
        const checkFlow = async () => {
            // Small delay to ensure context is loaded and UI is ready
            await new Promise(r => setTimeout(r, 500));

            if (!hasCreatedMemory) {
                Alert.alert("Welcome!", "First, let's add some fixed commitments like your university schedule.", [
                    { text: "OK", onPress: () => navigation.navigate('Memories') }
                ]);
            } else if (!hasCreatedGoal) {
                Alert.alert("Great!", "Now, let's define some goals you want to achieve.", [
                    { text: "OK", onPress: () => navigation.navigate('Goals') }
                ]);
            }
        };
        checkFlow();
    }, [hasCreatedMemory, hasCreatedGoal, navigation]);

    // Fetch Schedule
    useEffect(() => {
        if (isScheduleGenerated) {
            loadSchedule();
        }
    }, [isScheduleGenerated]);

    const loadSchedule = async () => {
        setLoadingSchedule(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const scheduleResult = await ApiService.schedule.getDaily(today);
            setScheduleItems(scheduleResult.items || []);
        } catch (e) {
            console.error("Failed to load schedule", e);
        } finally {
            setLoadingSchedule(false);
        }
    };

    const handleGenerateSchedule = async () => {
        setIsGenerating(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

            const result = await ApiService.schedule.generate({
                date: today,
                timezone: timezone,
                preferences: {
                    startOfDay: "09:00",
                    endOfDay: "22:00"
                }
            });

            hapticsSuccess();
            Alert.alert("Success", result.message);
            await checkState(); // Update context flags
            await loadSchedule();
        } catch (e) {
            Alert.alert("Error", "Failed to generate schedule");
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOpenChat = () => {
        router.push('/chat' as any);
    };

    const formattedTime = useMemo(() => {
        return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, [currentTime]);

    const currentTask = useMemo(() => {
        const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
        return scheduleItems.find(item => {
            const start = new Date(item.startTime).getHours();
            const end = new Date(item.endTime).getHours();
            // Simple check, can be improved with full date parsing
            return currentHour >= start && currentHour < end;
        });
    }, [currentTime, scheduleItems]);

    const parseTime = (timeStr: string) => {
        try {
            const lower = timeStr.toLowerCase().trim();
            const isPm = lower.includes('pm');
            const isAm = lower.includes('am');
            const cleanTime = lower.replace(/[a-z]/g, '').trim();
            const [h, m] = cleanTime.split(':').map(Number);

            let hour = h;
            if (isPm && hour < 12) hour += 12;
            if (isAm && hour === 12) hour = 0;

            return { hour, minute: m || 0 };
        } catch {
            return { hour: 0, minute: 0 };
        }
    };

    // Generate 24h time slots
    const timeSlots = Array.from({ length: 24 }, (_, i) => i);

    const renderTimeSlot = (hour: number) => {
        // Filter items that start in this hour
        const itemsInSlot = scheduleItems.filter(item => {
            const startHour = new Date(item.startTime).getHours();
            return startHour === hour;
        });

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
                    {itemsInSlot.map(item => {
                        const start = new Date(item.startTime);
                        const end = new Date(item.endTime);
                        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                        const startMinutes = start.getMinutes();

                        // Determine color based on type
                        let bgColor = "#E0F2FE";
                        let textColor = "#0369A1";
                        if (item.type === 'goal_task') {
                            bgColor = "#F3E8FF";
                            textColor = "#7E22CE";
                        } else if (item.type === 'fixed_commitment') {
                            bgColor = "#FFEDD5";
                            textColor = "#C2410C";
                        }

                        return (
                            <View
                                key={item.id}
                                style={[
                                    styles.eventCard,
                                    {
                                        backgroundColor: bgColor,
                                        top: (startMinutes / 60) * 60,
                                        height: durationHours * 60,
                                    }
                                ]}
                            >
                                <Text style={[styles.eventTitle, { color: textColor }]} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                <Text style={[styles.eventCategory, { color: textColor }]}>
                                    {item.description || item.type}
                                </Text>
                            </View>
                        )
                    })}

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
                    {loadingSchedule ? (
                        <ActivityIndicator size="large" color={Colors.primary} />
                    ) : scheduleItems.length === 0 && !hasCreatedMemory ? (
                        <Text style={{ paddingHorizontal: 24, color: Colors.gray[500] }}>
                            Start by adding your memories (fixed schedule).
                        </Text>
                    ) : (
                        <View style={styles.timelineContainer}>
                            {timeSlots.map(renderTimeSlot)}
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* Generate Schedule FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleOpenChat}
            >
                <Ionicons name="chatbubble-ellipses" size={24} color="white" />
                <Text style={styles.fabText}>AI Assistant</Text>
            </TouchableOpacity>
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
        flexDirection: 'column',
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
        height: 60,
    },
    timeLabelContainer: {
        width: 50,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        paddingTop: 0,
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

    // FAB Styles
    fab: {
        position: 'absolute',
        bottom: 30, // Increased from 20 to ensure visibility
        right: 20,
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        gap: 8,
        zIndex: 100, // Ensure it's on top
    },
    fabText: {
        color: 'white',
        fontFamily: Fonts.primary.bold,
        fontSize: 16,
    }
});
