import { useApp } from '@/src/context/AppContext';
import { ApiService, Memory } from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    LayoutAnimation,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';
import Colors from '../../constants/colors';
import Fonts from '../../constants/fonts';
import { hapticsSelection, hapticsSuccess } from '../../utils/haptics';

// Enable LayoutAnimation for Android
if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TAG_COLORS = [
    { bg: '#E3F2FD', text: '#1565C0' }, // Blue
    { bg: '#F3E5F5', text: '#7B1FA2' }, // Purple
    { bg: '#E8F5E9', text: '#2E7D32' }, // Green
    { bg: '#FFF3E0', text: '#EF6C00' }, // Orange
    { bg: '#FFEBEE', text: '#C62828' }, // Red
    { bg: '#E0F2F1', text: '#00695C' }, // Teal
];

const getTagColor = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % TAG_COLORS.length;
    return TAG_COLORS[index];
};

export default function MemoriesScreen() {
    const navigation = useNavigation<any>();
    const { checkState } = useApp();
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);

    useEffect(() => {
        loadMemories();
    }, []);

    const loadMemories = async () => {
        try {
            const data = await ApiService.memories.getAll();
            setMemories(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    const toggleForm = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsFormVisible(!isFormVisible);
    };

    const toggleActive = async (id: string) => {
        hapticsSelection();
        const memory = memories.find(m => m.id === id);
        if (!memory) return;

        const originalState = memory.isActive;

        // Optimistic update
        setMemories(current =>
            current.map(m =>
                m.id === id ? { ...m, isActive: !m.isActive } : m
            )
        );

        try {
            await ApiService.memories.update(id, { isActive: !originalState });
        } catch (e) {
            // Revert on error
            setMemories(current =>
                current.map(m =>
                    m.id === id ? { ...m, isActive: originalState } : m
                )
            );
            Alert.alert("Error", "Failed to update memory status");
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Memory",
            "Are you sure you want to delete this memory?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await ApiService.memories.delete(id);
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setMemories(current => current.filter(m => m.id !== id));
                        } catch (e) {
                            Alert.alert("Error", "Failed to delete memory");
                        }
                    }
                }
            ]
        );
    };

    const handleAddMemory = async () => {
        if (!title.trim() || !description.trim()) return;

        setSubmitting(true);
        const newTags = tagInput
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        try {
            const newMemory = await ApiService.memories.create({
                title: title.trim(),
                description: description.trim(),
                tags: newTags.length > 0 ? newTags : ['Memory'],
                date: new Date().toISOString(),
            });

            hapticsSuccess();
            await checkState(); // Update context to reflect user has created memory

            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setMemories([newMemory, ...memories]);

            // Reset form
            setTitle('');
            setDescription('');
            setTagInput('');
            setIsFormVisible(false);
            Keyboard.dismiss();

            // If this was the first memory, alert the user
            Alert.alert("Memory Added", "Great! Your fixed commitments are stored.", [
                { text: "Continue", onPress: () => navigation.navigate('Dashboard') } // Dashboard will handle next redirect
            ]);

        } catch (e) {
            Alert.alert("Error", "Failed to save memory");
        } finally {
            setSubmitting(false);
        }
    };

    const renderItem = ({ item }: { item: Memory }) => {
        const isExpanded = expandedId === item.id;

        return (
            <TouchableOpacity
                style={[styles.card, !item.isActive && styles.cardInactive]}
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
                        <View style={styles.tagsContainer}>
                            {item.tags.map((tag, index) => {
                                const colors = getTagColor(tag);
                                return (
                                    <View key={index} style={[styles.tag, { backgroundColor: item.isActive ? colors.bg : Colors.gray[100] }]}>
                                        <Text style={[styles.tagText, { color: item.isActive ? colors.text : Colors.gray[500] }]}>#{tag}</Text>
                                    </View>
                                );
                            })}
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
                        <Text style={styles.cardDescription}>{item.description}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.cardDate}>{new Date(item.date).toLocaleDateString()}</Text>
                            <TouchableOpacity
                                onPress={() => handleDelete(item.id)}
                                style={{ padding: 8 }}
                            >
                                <Ionicons name="trash-outline" size={20} color={Colors.error} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Memories</Text>
                <TouchableOpacity style={styles.addButton} onPress={toggleForm}>
                    <Ionicons name={isFormVisible ? "close" : "add"} size={24} color={Colors.white} />
                </TouchableOpacity>
            </View>

            {isFormVisible && (
                <View style={styles.formContainer}>
                    <Text style={styles.formHeader}>New Memory</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Title"
                        placeholderTextColor={Colors.gray[400]}
                        value={title}
                        onChangeText={setTitle}
                    />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="What's on your mind?"
                        placeholderTextColor={Colors.gray[400]}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Tags (comma separated)"
                        placeholderTextColor={Colors.gray[400]}
                        value={tagInput}
                        onChangeText={setTagInput}
                    />
                    <TouchableOpacity style={styles.submitButton} onPress={handleAddMemory} disabled={submitting}>
                        {submitting ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.submitButtonText}>Save Memory</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={memories}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={styles.infoContainer}>
                            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                            <Text style={styles.infoText}>
                                Mark memories as <Text style={styles.infoHighlight}>Active</Text> to reflect on them in your daily plan.
                            </Text>
                        </View>
                    }
                />)}
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
        marginBottom: 12,
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
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
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
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 12,
        fontFamily: Fonts.primary.medium,
    },
    cardBody: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.gray[100],
    },
    cardDescription: {
        fontSize: 15,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.secondary,
        lineHeight: 22,
        marginBottom: 12,
    },
    cardDate: {
        fontSize: 12,
        fontFamily: Fonts.primary.regular,
        color: Colors.gray[400],
        textAlign: 'right',
    },
});
