import { ApiService, InsightMetrics } from '@/src/services/api';
import { useApp } from '@/src/context/AppContext';
import { hapticsLight } from '@/src/utils/haptics';
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState, useEffect } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';
import Fonts from '../../constants/fonts';

export default function InsightsScreen() {
    const { insightsRefreshTrigger } = useApp();
    const [metrics, setMetrics] = useState<InsightMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const fetchInsights = async () => {
        try {
            const data = await ApiService.insights.get();
            setMetrics(data);
        } catch (error) {
            console.error("Failed to fetch insights", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch on first mount only
    useFocusEffect(
        useCallback(() => {
            if (!hasLoadedOnce) {
                setHasLoadedOnce(true);
                fetchInsights();
            }
        }, [hasLoadedOnce])
    );

    // Refresh when trigger changes
    useEffect(() => {
        if (hasLoadedOnce && insightsRefreshTrigger > 0) {
            fetchInsights();
        }
    }, [insightsRefreshTrigger, hasLoadedOnce]);

    const onRefresh = () => {
        hapticsLight();
        setRefreshing(true);
        fetchInsights();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Productivity Insights</Text>
                <Text style={styles.subtitle}>Track your progress and habits</Text>
            </View>

            {/* Score Card */}
            <View style={styles.scoreCard}>
                <View style={styles.scoreHeader}>
                    <Ionicons name="speedometer-outline" size={24} color="white" />
                    <Text style={styles.scoreLabel}>Productivity Score</Text>
                </View>
                <Text style={styles.scoreValue}>{metrics?.productivityScore || 0}</Text>
                <Text style={styles.scoreSubtext}>Keep up the good work!</Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <View style={[styles.iconContainer, { backgroundColor: Colors.success + '20' }]}>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                    </View>
                    <Text style={styles.statValue}>{metrics?.completedTasks || 0}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '20' }]}>
                        <Ionicons name="list" size={24} color={Colors.primary} />
                    </View>
                    <Text style={styles.statValue}>{metrics?.totalTasks || 0}</Text>
                    <Text style={styles.statLabel}>Total Tasks</Text>
                </View>
            </View>

            {/* Category Distribution */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category Distribution</Text>
                <View style={styles.card}>
                    {metrics?.categoryDistribution && Object.entries(metrics.categoryDistribution).map(([category, count], index) => (
                        <View key={category} style={[styles.categoryRow, index !== 0 && styles.borderTop]}>
                            <View style={styles.categoryInfo}>
                                <View style={styles.categoryDot} />
                                <Text style={styles.categoryName}>{category}</Text>
                            </View>
                            <Text style={styles.categoryCount}>{count} tasks</Text>
                        </View>
                    ))}
                    {(!metrics?.categoryDistribution || Object.keys(metrics.categoryDistribution).length === 0) && (
                        <Text style={styles.emptyText}>No data available yet.</Text>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
        marginTop: 40,
    },
    title: {
        fontSize: 28,
        fontFamily: Fonts.primary.bold,
        color: Colors.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.secondary,
    },
    scoreCard: {
        backgroundColor: Colors.primary,
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    scoreHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    scoreLabel: {
        color: 'white',
        fontFamily: Fonts.primary.medium,
        fontSize: 16,
        opacity: 0.9,
    },
    scoreValue: {
        color: 'white',
        fontFamily: Fonts.primary.bold,
        fontSize: 48,
        marginBottom: 4,
    },
    scoreSubtext: {
        color: 'white',
        fontFamily: Fonts.primary.regular,
        fontSize: 14,
        opacity: 0.8,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 24,
        fontFamily: Fonts.primary.bold,
        color: Colors.text.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        fontFamily: Fonts.primary.medium,
        color: Colors.text.secondary,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.primary.bold,
        color: Colors.text.primary,
        marginBottom: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    borderTop: {
        borderTopWidth: 1,
        borderTopColor: Colors.gray[100],
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    categoryName: {
        fontSize: 16,
        fontFamily: Fonts.primary.medium,
        color: Colors.text.primary,
    },
    categoryCount: {
        fontSize: 14,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.secondary,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.text.secondary,
        fontFamily: Fonts.primary.regular,
        padding: 20,
    },
});
