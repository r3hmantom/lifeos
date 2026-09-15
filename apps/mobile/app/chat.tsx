import ChatScreen from "@/src/screens/chat/ChatScreen";
import { Stack } from "expo-router";

export default function ChatLayout() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ChatScreen />
        </>
    );
}
