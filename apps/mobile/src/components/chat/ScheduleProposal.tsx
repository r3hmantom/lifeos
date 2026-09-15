import { ProposedScheduleItem } from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Colors from '../../constants/colors';
import Fonts from '../../constants/fonts';

interface ScheduleProposalProps {
    items: ProposedScheduleItem[];
    acceptedIndices?: Set<number>;
    rejectedIndices?: Set<number>;
    loadingIndices?: Set<number>;
    onAcceptAll: () => void;
    onRejectAll: () => void;
    onAcceptItem: (index: number) => void;
    onRejectItem: (index: number) => void;
    onEditItem?: (index: number) => void;
}

export default function ScheduleProposal({
    items,
    acceptedIndices = new Set(),
    rejectedIndices = new Set(),
    loadingIndices = new Set(),
    onAcceptAll,
    onRejectAll,
    onAcceptItem,
    onRejectItem,
    onEditItem,
}: ScheduleProposalProps) {
    const handleAcceptItem = (index: number) => {
        onAcceptItem(index);
    };

    const handleRejectItem = (index: number) => {
        onRejectItem(index);
    };

    const handleAcceptAll = () => {
        onAcceptAll();
    };

    const handleRejectAll = () => {
        onRejectAll();
    };

    const formatTime = (timeStr: string) => {
        // timeStr is in HH:mm format
        const [hours, minutes] = timeStr.split(':').map(Number);
        const hour12 = hours % 12 || 12;
        const ampm = hours < 12 ? 'AM' : 'PM';
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'fixed_commitment':
                return { bg: '#FFEDD5', text: '#C2410C' };
            case 'goal_task':
                return { bg: '#F3E8FF', text: '#7E22CE' };
            case 'routine':
                return { bg: '#E0F2FE', text: '#0369A1' };
            default:
                return { bg: '#F3F4F6', text: '#374151' };
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Proposed Schedule</Text>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.acceptAllButton]}
                    onPress={handleAcceptAll}
                >
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Accept All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.rejectAllButton]}
                    onPress={handleRejectAll}
                >
                    <Ionicons name="close-circle" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Reject All</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.itemsContainer}>
                {items.map((item, index) => {
                    const isAccepted = acceptedIndices.has(index);
                    const isRejected = rejectedIndices.has(index);
                    const isLoading = loadingIndices.has(index);
                    const typeColors = getTypeColor(item.type);

                    return (
                        <View
                            key={index}
                            style={[
                                styles.itemCard,
                                isAccepted && styles.itemCardAccepted,
                                isRejected && styles.itemCardRejected,
                            ]}
                        >
                            <View style={[styles.itemColorBar, { backgroundColor: typeColors.bg }]} />
                            <View style={styles.itemContent}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemTitle}>{item.title}</Text>
                                    {isAccepted && !isLoading && (
                                        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                                    )}
                                    {isRejected && !isLoading && (
                                        <Ionicons name="close-circle" size={20} color={Colors.error} />
                                    )}
                                    {isLoading && (
                                        <ActivityIndicator size="small" color={Colors.primary} />
                                    )}
                                </View>
                                {item.description && (
                                    <Text style={styles.itemDescription}>{item.description}</Text>
                                )}
                                <View style={styles.itemTimeRow}>
                                    <View style={styles.timeBadge}>
                                        <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
                                        <Text style={styles.timeText}>
                                            {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                        </Text>
                                    </View>
                                    <View style={[styles.typeBadge, { backgroundColor: typeColors.bg }]}>
                                        <Text style={[styles.typeText, { color: typeColors.text }]}>
                                            {item.type.replace('_', ' ')}
                                        </Text>
                                    </View>
                                </View>
                                {!isAccepted && !isRejected && !isLoading && (
                                    <View style={styles.itemActions}>
                                        {onEditItem && (
                                            <TouchableOpacity
                                                style={[styles.itemActionButton, styles.editButton]}
                                                onPress={() => onEditItem(index)}
                                            >
                                                <Ionicons name="create-outline" size={16} color="white" />
                                                <Text style={styles.itemActionText}>Edit</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={[styles.itemActionButton, styles.acceptButton]}
                                            onPress={() => handleAcceptItem(index)}
                                        >
                                            <Ionicons name="checkmark" size={16} color="white" />
                                            <Text style={styles.itemActionText}>Accept</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.itemActionButton, styles.rejectButton]}
                                            onPress={() => handleRejectItem(index)}
                                        >
                                            <Ionicons name="close" size={16} color="white" />
                                            <Text style={styles.itemActionText}>Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginVertical: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        padding: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: Fonts.primary.bold,
        color: Colors.text.primary,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    acceptAllButton: {
        backgroundColor: Colors.success,
    },
    rejectAllButton: {
        backgroundColor: Colors.error,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontFamily: Fonts.primary.semiBold,
    },
    itemsContainer: {
        padding: 12,
        gap: 12,
    },
    itemCard: {
        flexDirection: 'row',
        backgroundColor: Colors.background.secondary,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    itemCardAccepted: {
        borderColor: Colors.success,
        backgroundColor: '#F0FDF4',
    },
    itemCardRejected: {
        borderColor: Colors.error,
        backgroundColor: '#FEF2F2',
        opacity: 0.6,
    },
    itemColorBar: {
        width: 4,
    },
    itemContent: {
        flex: 1,
        padding: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemTitle: {
        fontSize: 15,
        fontFamily: Fonts.primary.semiBold,
        color: Colors.text.primary,
        flex: 1,
    },
    itemDescription: {
        fontSize: 13,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.secondary,
        marginBottom: 8,
    },
    itemTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: 12,
        fontFamily: Fonts.primary.medium,
        color: Colors.text.secondary,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    typeText: {
        fontSize: 11,
        fontFamily: Fonts.primary.medium,
        textTransform: 'capitalize',
    },
    itemActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    itemActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
        flex: 1,
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: Colors.success,
    },
    rejectButton: {
        backgroundColor: Colors.error,
    },
    editButton: {
        backgroundColor: Colors.primary,
    },
    itemActionText: {
        color: 'white',
        fontSize: 13,
        fontFamily: Fonts.primary.semiBold,
    },
});

