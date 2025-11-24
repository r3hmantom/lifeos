import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName="splash"
    >
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
