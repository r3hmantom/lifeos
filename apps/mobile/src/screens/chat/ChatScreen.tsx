import { ApiService, ChatMessage, ChatResponse, ProposedScheduleItem } from '@/src/services/api';
import ScheduleProposal from '@/src/components/chat/ScheduleProposal';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import Fonts from '../../constants/fonts';


export default function ChatScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    const params = useLocalSearchParams<{ chatId?: string }>();
    const insets = useSafeAreaInsets();
    const { checkState, refreshInsights, refreshSchedule } = useApp();
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatId, setChatId] = useState<string | undefined>(params.chatId);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const [pendingScheduleProposal, setPendingScheduleProposal] = useState<ProposedScheduleItem[] | null>(null);
    const [proposalMessageIndex, setProposalMessageIndex] = useState<number>(-1);
    const [acceptedScheduleIndices, setAcceptedScheduleIndices] = useState<Set<number>>(new Set());
    const [rejectedScheduleIndices, setRejectedScheduleIndices] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (chatId) {
            loadChatMessages();
        } else {
            // New chat - show welcome message
            setMessages([
                { role: 'assistant', content: "Hi! I'm your LifeOS assistant. I can help you plan your schedule, manage tasks, or answer questions about your goals." }
            ]);
        }
    }, [chatId]);

    const loadChatMessages = async () => {
        if (!chatId) return;
        
        setLoadingMessages(true);
        try {
            const response = await ApiService.assistant.getChatMessages(chatId);
            const loadedMessages = response.messages.map(msg => ({
                ...msg,
                content: msg.content || '',
            }));
            setMessages(loadedMessages);
            
            // Check for schedule proposals in loaded messages - handle both array and object formats
            // Also check which items are already saved
            for (let index = 0; index < loadedMessages.length; index++) {
                const msg = loadedMessages[index];
                if (msg.role === 'assistant' && msg.metadata?.intent === 'schedule_generated' && msg.metadata?.data?.schedule) {
                    const rawSchedule = msg.metadata.data.schedule;
                    let items: ProposedScheduleItem[] = [];

                    // Helper to normalize item data
                    const normalizeItem = (d: any): ProposedScheduleItem => {
                        return {
                            title: d.title,
                            description: d.description,
                            startTime: d.startTime, // Keep as-is (HH:mm or ISO)
                            endTime: d.endTime, // Keep as-is (HH:mm or ISO)
                            type: d.type || 'work',
                        };
                    };

                    // Handle both array format and object with items property
                    if (Array.isArray(rawSchedule)) {
                        items = rawSchedule.map(normalizeItem);
                    } else if (rawSchedule?.items && Array.isArray(rawSchedule.items)) {
                        items = rawSchedule.items.map(normalizeItem);
                    }

                    if (items.length > 0) {
                        // Check which items are already saved in the backend
                        const today = new Date().toISOString().split('T')[0];
                        const acceptedIndices = new Set<number>();
                        
                        try {
                            const savedSchedule = await ApiService.schedule.getDaily(today);
                            const savedItems = savedSchedule.items || [];
                            
                            // Match proposed items with saved items
                            items.forEach((proposedItem, itemIndex) => {
                                // Helper to normalize time for comparison
                                const normalizeTime = (timeStr: string): string => {
                                    if (timeStr.includes('T')) {
                                        // ISO format - extract HH:mm
                                        const date = new Date(timeStr);
                                        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                                    }
                                    return timeStr; // Already HH:mm
                                };
                                
                                const proposedStart = normalizeTime(proposedItem.startTime);
                                const proposedEnd = normalizeTime(proposedItem.endTime);
                                
                                // Check if there's a matching saved item
                                const isSaved = savedItems.some(savedItem => {
                                    const savedStart = normalizeTime(savedItem.startTime);
                                    const savedEnd = normalizeTime(savedItem.endTime);
                                    
                                    // Match by title and time (within 1 minute tolerance)
                                    return savedItem.title === proposedItem.title &&
                                           savedStart === proposedStart &&
                                           savedEnd === proposedEnd;
                                });
                                
                                if (isSaved) {
                                    acceptedIndices.add(itemIndex);
                                }
                            });
                        } catch (error) {
                            console.error("Failed to check saved schedule items", error);
                        }
                        
                        setPendingScheduleProposal(items);
                        setProposalMessageIndex(index);
                        setAcceptedScheduleIndices(acceptedIndices);
                        setRejectedScheduleIndices(new Set());
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load chat messages", error);
            Alert.alert("Error", "Failed to load chat messages");
        } finally {
            setLoadingMessages(false);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage: ChatMessage = { role: 'user', content: inputText.trim() };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputText('');
        setIsLoading(true);

        try {
            // Prepare context
            const context = {
                date: new Date().toISOString().split('T')[0],
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            };

            const response = await ApiService.assistant.chat({
                messages: chatId ? [userMessage] : newMessages, // If continuing chat, only send new message
                chatId,
                context
            });

            // Update chatId if this is a new chat
            if (response.chatId && !chatId) {
                setChatId(response.chatId);
            }

            // Parse response - check for embedded JSON in markdown code blocks (matching web app)
            let responseData = response;
            let displayMessage = response.message;

            // Check for embedded JSON in markdown code blocks
            const jsonMatch = response.message.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    const parsed = JSON.parse(jsonMatch[1]);
                    // If the parsed JSON has an intent, use it as the source of truth for data
                    if (parsed.intent && parsed.intent !== 'chat') {
                        responseData = parsed;
                        // Clean up the message to remove the JSON block for display purposes
                        displayMessage = response.message.replace(/```(?:json)?\s*[\s\S]*?\s*```/, '').trim();
                    }
                } catch (e) {
                    console.error('Failed to parse embedded JSON', e);
                }
            }

            // Create assistant message with metadata
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: displayMessage,
                metadata: {
                    intent: responseData.intent,
                    data: responseData.data,
                }
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Handle schedule proposals - matching web app behavior
            if (responseData.intent === 'schedule_generated' && responseData.data?.schedule) {
                const rawSchedule = responseData.data.schedule;
                const today = new Date().toISOString().split('T')[0];
                let items: ProposedScheduleItem[] = [];

                // Helper to normalize item data (matching web app logic)
                const normalizeItem = (d: any): ProposedScheduleItem => {
                    let start = d.startTime;
                    let end = d.endTime;

                    // If time is already in ISO format, keep it
                    // If time is just HH:mm, we'll handle it when creating schedule items
                    // For now, keep the HH:mm format for display in ScheduleProposal component
                    return {
                        title: d.title,
                        description: d.description,
                        startTime: start, // Keep as HH:mm for display
                        endTime: end, // Keep as HH:mm for display
                        type: d.type || 'work',
                    };
                };

                // Handle both array format and object with items property
                if (Array.isArray(rawSchedule)) {
                    items = rawSchedule.map(normalizeItem);
                } else if (rawSchedule?.items && Array.isArray(rawSchedule.items)) {
                    items = rawSchedule.items.map(normalizeItem);
                }

                if (items.length > 0) {
                    setPendingScheduleProposal(items);
                    setProposalMessageIndex(messages.length); // Index after adding assistant message
                    setAcceptedScheduleIndices(new Set());
                    setRejectedScheduleIndices(new Set());
                }
            }

            // Handle schedule modifications (auto-saved by backend)
            if (responseData.intent === 'schedule_modified') {
                // Refresh insights and schedule when schedule is modified
                refreshInsights();
                refreshSchedule();
            }

            // Handle goal proposals - create goal when AI proposes it
            if (responseData.intent === 'goal_proposed' && responseData.data?.goal) {
                try {
                    const goalData = responseData.data.goal;
                    await ApiService.goals.create({
                        title: goalData.title,
                        focus: goalData.focus || 'General',
                        deadline: goalData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default to 30 days
                        priority: goalData.priority || 'Medium',
                    });
                    
                    await checkState();
                    refreshInsights();
                    refreshSchedule();
                } catch (error) {
                    console.error("Failed to create goal from AI proposal", error);
                }
            }

            // Handle memory proposals - create memory when AI proposes it
            if (responseData.intent === 'memory_proposed' && responseData.data?.memory) {
                try {
                    const memoryData = responseData.data.memory;
                    await ApiService.memories.create({
                        title: memoryData.title,
                        description: memoryData.description || '',
                        date: memoryData.date || new Date().toISOString(),
                    });
                    
                    await checkState();
                    refreshInsights();
                    refreshSchedule();
                } catch (error) {
                    console.error("Failed to create memory from AI proposal", error);
                }
            }

        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I encountered an error processing your request. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptAllSchedule = async () => {
        if (!pendingScheduleProposal) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const targetDate = new Date(today);

            // Mark all as accepted first
            const allIndices = new Set(pendingScheduleProposal.map((_, i) => i));
            setAcceptedScheduleIndices(allIndices);
            setRejectedScheduleIndices(new Set());

            // Convert schedule items to proper format for batch create
            const itemsToSave = pendingScheduleProposal.map(item => {
                // Handle time format - could be HH:mm or ISO string
                let startTime: Date;
                let endTime: Date;

                if (item.startTime.includes('T')) {
                    // Already ISO format
                    startTime = new Date(item.startTime);
                } else {
                    // HH:mm format - convert to ISO
                    const [startHours, startMinutes] = item.startTime.split(':').map(Number);
                    startTime = new Date(targetDate);
                    startTime.setHours(startHours, startMinutes, 0, 0);
                }

                if (item.endTime.includes('T')) {
                    // Already ISO format
                    endTime = new Date(item.endTime);
                } else {
                    // HH:mm format - convert to ISO
                    const [endHours, endMinutes] = item.endTime.split(':').map(Number);
                    endTime = new Date(targetDate);
                    endTime.setHours(endHours, endMinutes, 0, 0);
                }

                return {
                    title: item.title,
                    description: item.description,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    type: item.type,
                    isCompleted: false,
                };
            });

            // Use batch create for better performance (matching web app)
            await ApiService.schedule.batchCreate({
                date: today,
                items: itemsToSave,
            });

            setPendingScheduleProposal(null);
            setProposalMessageIndex(-1);
            setAcceptedScheduleIndices(new Set());
            setRejectedScheduleIndices(new Set());
            
            // Refresh schedule data
            await checkState();
            
            // Refresh insights and schedule when time slot is accepted
            refreshInsights();
            refreshSchedule();
            
            // Add confirmation message
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Great! I've added all the schedule items to your calendar."
            }]);

            Alert.alert("Success", "Schedule items have been added to your calendar!");
        } catch (error) {
            console.error("Failed to accept schedule", error);
            Alert.alert("Error", "Failed to add schedule items. Please try again.");
            // Reset on error
            setAcceptedScheduleIndices(new Set());
        }
    };

    const handleRejectAllSchedule = () => {
        setPendingScheduleProposal(null);
        setProposalMessageIndex(-1);
        setAcceptedScheduleIndices(new Set());
        setRejectedScheduleIndices(new Set());
        setMessages(prev => [...prev, {
            role: 'user',
            content: "I'd like to reject this schedule proposal."
        }]);
        
        // Refresh insights and schedule when time slot is rejected
        refreshInsights();
        refreshSchedule();
    };

    const handleAcceptItem = async (index: number) => {
        if (!pendingScheduleProposal) return;

        try {
            const item = pendingScheduleProposal[index];
            const today = new Date().toISOString().split('T')[0];
            const targetDate = new Date(today);

            // Handle time format - could be HH:mm or ISO string
            let startTime: Date;
            let endTime: Date;

            if (item.startTime.includes('T')) {
                // Already ISO format
                startTime = new Date(item.startTime);
            } else {
                // HH:mm format - convert to ISO
                const [startHours, startMinutes] = item.startTime.split(':').map(Number);
                startTime = new Date(targetDate);
                startTime.setHours(startHours, startMinutes, 0, 0);
            }

            if (item.endTime.includes('T')) {
                // Already ISO format
                endTime = new Date(item.endTime);
            } else {
                // HH:mm format - convert to ISO
                const [endHours, endMinutes] = item.endTime.split(':').map(Number);
                endTime = new Date(targetDate);
                endTime.setHours(endHours, endMinutes, 0, 0);
            }

            await ApiService.schedule.create({
                title: item.title,
                description: item.description,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                type: item.type,
                isCompleted: false,
            });

            // Refresh schedule data
            await checkState();

            // Refresh insights and schedule when time slot is accepted
            refreshInsights();
            refreshSchedule();

            // Mark item as accepted
            setAcceptedScheduleIndices(prev => new Set(prev).add(index));
            setRejectedScheduleIndices(prev => {
                const newSet = new Set(prev);
                newSet.delete(index);
                return newSet;
            });
        } catch (error) {
            console.error("Failed to accept schedule item", error);
            Alert.alert("Error", "Failed to add schedule item. Please try again.");
        }
    };

    const handleRejectItem = (index: number) => {
        if (!pendingScheduleProposal) return;
        
        // Mark item as rejected
        setRejectedScheduleIndices(prev => new Set(prev).add(index));
        setAcceptedScheduleIndices(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
        });
        
        // Refresh insights and schedule when time slot is rejected
        refreshInsights();
        refreshSchedule();
    };

    const startNewChat = () => {
        setChatId(undefined);
        setMessages([
            { role: 'assistant', content: "Hi! I'm your LifeOS assistant. I can help you plan your schedule, manage tasks, or answer questions about your goals." }
        ]);
        setPendingScheduleProposal(null);
        setProposalMessageIndex(-1);
        setAcceptedScheduleIndices(new Set());
        setRejectedScheduleIndices(new Set());
        setShowHistory(false);
    };

    const renderMessage = (msg: ChatMessage, index: number) => {
        const isScheduleProposal = 
            msg.role === 'assistant' &&
            msg.metadata?.intent === 'schedule_generated' &&
            msg.metadata?.data?.schedule &&
            index === proposalMessageIndex &&
            pendingScheduleProposal;

        return (
            <View key={msg.id || index}>
                <View
                    style={[
                        styles.messageBubble,
                        msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                    ]}
                >
                    <Text style={[
                        styles.messageText,
                        msg.role === 'user' ? styles.userText : styles.assistantText
                    ]}>
                        {msg.content}
                    </Text>
                </View>
                {isScheduleProposal && pendingScheduleProposal && (
                    <ScheduleProposal
                        items={pendingScheduleProposal}
                        acceptedIndices={acceptedScheduleIndices}
                        rejectedIndices={rejectedScheduleIndices}
                        onAcceptAll={handleAcceptAllSchedule}
                        onRejectAll={handleRejectAllSchedule}
                        onAcceptItem={handleAcceptItem}
                        onRejectItem={handleRejectItem}
                    />
                )}
            </View>
        );
    };

    if (loadingMessages) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading chat...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Assistant</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => setShowHistory(true)}
                        style={styles.historyButton}
                    >
                        <Ionicons name="time-outline" size={24} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={startNewChat}
                        style={styles.newChatButton}
                    >
                        <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 60 : 0}
                style={{ flex: 1 }}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesList}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    keyboardShouldPersistTaps="handled"
                >
                    {messages.map((msg, index) => renderMessage(msg, index))}
                    {isLoading && (
                        <View style={styles.loadingBubble}>
                            <ActivityIndicator size="small" color={Colors.gray[500]} />
                        </View>
                    )}
                </ScrollView>

                <View style={[styles.inputContainer, { paddingBottom: 12 + insets.bottom }]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                        onSubmitEditing={sendMessage}
                        onFocus={() => {
                            setTimeout(() => {
                                scrollViewRef.current?.scrollToEnd({ animated: true });
                            }, 100);
                        }}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Chat History Modal */}
            <Modal
                visible={showHistory}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowHistory(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
                            <Text style={styles.modalTitle}>Chat History</Text>
                            <TouchableOpacity
                                onPress={() => setShowHistory(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={Colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.historyContainer}>
                            <ChatHistoryList
                                onSelectChat={(id) => {
                                    setChatId(id || undefined);
                                    setShowHistory(false);
                                }}
                                currentChatId={chatId}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Helper function to format chat date
function formatChatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }
}

// Chat History List Component
function ChatHistoryList({ onSelectChat, currentChatId }: { onSelectChat: (chatId: string) => void; currentChatId?: string }) {
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadChats();
    }, []);

    const loadChats = async () => {
        setLoading(true);
        setError(null);
        try {
            const chatList = await ApiService.assistant.getChats(50, 0);
            setChats(chatList);
            console.log("chatList", chatList);
        } catch (error: any) {
            console.error("Failed to load chats", error);
            // Check if it's a 404 or route not found error
            const errorMessage = error?.message || 'Unknown error';
            if (errorMessage.includes('Cannot GET') || errorMessage.includes('404')) {
                setError("Chat history feature is not available. Please ensure the backend is running and the route is registered.");
            } else {
                setError("Failed to load chat history. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        Alert.alert(
            "Delete Chat",
            "Are you sure you want to delete this chat?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await ApiService.assistant.deleteChat(chatId);
                            loadChats();
                            if (currentChatId === chatId) {
                                onSelectChat(''); // Clear current chat - will be converted to undefined
                            }
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete chat");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.historyLoading}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.historyError}>
                <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
                <Text style={styles.historyErrorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadChats}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (chats.length === 0) {
        return (
            <View style={styles.historyEmpty}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray[400]} />
                <Text style={styles.historyEmptyText}>No chat history</Text>
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.historyList}
            contentContainerStyle={styles.historyListContent}
            showsVerticalScrollIndicator={true}
        >
            {chats.map((chat) => (
                <TouchableOpacity
                    key={chat.id}
                    style={[
                        styles.historyItem,
                        currentChatId === chat.id && styles.historyItemActive
                    ]}
                    onPress={() => onSelectChat(chat.id)}
                >
                    <View style={styles.historyItemContent}>
                        <Text style={styles.historyItemTitle} numberOfLines={1}>
                            {chat.title || "New Chat"}
                        </Text>
                        <View style={styles.historyItemMeta}>
                            <Text style={styles.historyItemDate}>
                                {formatChatDate(chat.updatedAt)}
                            </Text>
                            {chat.messageCount !== undefined && chat.messageCount > 0 && (
                                <View style={styles.messageCountBadge}>
                                    <Text style={styles.messageCountText}>
                                        {chat.messageCount} {chat.messageCount === 1 ? 'message' : 'messages'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleDeleteChat(chat.id)}
                        style={styles.deleteButton}
                    >
                        <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.primary.bold,
        color: Colors.text.primary,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    historyButton: {
        padding: 4,
    },
    newChatButton: {
        padding: 4,
    },
    messagesList: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    messagesContent: {
        padding: 16,
        gap: 12,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        alignSelf: 'flex-start',
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    messageText: {
        fontSize: 15,
        fontFamily: Fonts.primary.regular,
        lineHeight: 22,
    },
    userText: {
        color: 'white',
    },
    assistantText: {
        color: Colors.text.primary,
    },
    loadingBubble: {
        alignSelf: 'flex-start',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        marginBottom: 8,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.secondary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: Colors.gray[100],
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.gray[100],
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingTop: 10,
        maxHeight: 100,
        fontFamily: Fonts.primary.regular,
        fontSize: 16,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: Colors.gray[300],
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.background.primary,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '85%',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    historyContainer: {
        flex: 1,
        overflow: 'hidden',
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
    // History list styles
    historyList: {
        flex: 1,
    },
    historyListContent: {
        paddingBottom: 20,
        paddingHorizontal: 0,
    },
    historyLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        minHeight: 200,
    },
    historyEmpty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        minHeight: 200,
    },
    historyEmptyText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.secondary,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    historyItemActive: {
        backgroundColor: Colors.gray[50],
    },
    historyItemContent: {
        flex: 1,
    },
    historyItemTitle: {
        fontSize: 16,
        fontFamily: Fonts.primary.semiBold,
        color: Colors.text.primary,
        marginBottom: 4,
    },
    historyItemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    historyItemDate: {
        fontSize: 12,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.secondary,
    },
    messageCountBadge: {
        backgroundColor: Colors.gray[200],
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    messageCountText: {
        fontSize: 11,
        fontFamily: Fonts.primary.medium,
        color: Colors.text.secondary,
    },
    deleteButton: {
        padding: 8,
        marginLeft: 8,
    },
    historyError: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        minHeight: 200,
    },
    historyErrorText: {
        marginTop: 16,
        fontSize: 14,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 14,
        fontFamily: Fonts.primary.semiBold,
    },
});
