import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AppProvider, useApp } from "../src/context/AppContext";

function AuthObserver({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'onboarding';
    const inSplash = segments[0] === 'splash';

    if (inSplash) return;

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to the sign-in page.
      router.replace('/auth');
    } else if (isAuthenticated && segments[0] === 'auth') {
      // Redirect away from the sign-in page.
      router.replace('/dashboard');
    }
  }, [isAuthenticated, segments, isLoading]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AppProvider>
      <AuthObserver>
        <Stack
          screenOptions={{ headerShown: false }}
          initialRouteName="splash"
        >
          <Stack.Screen name="splash" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="chat" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </AuthObserver>
    </AppProvider>
  );
}
