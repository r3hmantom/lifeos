import { ApiService, ChatMessage } from '@/src/services/api';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
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
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: "Hi! I'm your LifeOS assistant. I can help you plan your schedule, manage tasks, or answer questions about your goals." }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage: ChatMessage = { role: 'user', content: inputText.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            // Prepare context (could be enhanced with actual selected IDs)
            const context = {
                date: new Date().toISOString().split('T')[0],
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            };

            const response = await ApiService.assistant.chat({
                messages: [...messages, userMessage],
                context
            });

            const assistantMessage: ChatMessage = { role: 'assistant', content: response.message };
            setMessages(prev => [...prev, assistantMessage]);

            // Handle intents
            if (response.intent === 'schedule_generated' || response.intent === 'schedule_modified') {
                // Optionally notify user or refresh schedule if we were on dashboard
                // For now, the message usually confirms this.
            }

        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing your request." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Assistant</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((msg, index) => (
                    <View
                        key={index}
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
                ))}
                {isLoading && (
                    <View style={styles.loadingBubble}>
                        <ActivityIndicator size="small" color={Colors.gray[500]} />
                    </View>
                )}
            </ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <View style={[styles.inputContainer, { paddingBottom: 12 + insets.bottom }]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
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
        </View>
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
        paddingTop: 10, // for multiline
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
});
