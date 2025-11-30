import Colors from "@/src/constants/colors";
import Fonts from "@/src/constants/fonts";
import DashboardScreen from "@/src/screens/dashboard/DashboardScreen";
import GoalsScreen from "@/src/screens/goals/GoalsScreen";
import InsightsScreen from "@/src/screens/insights/InsightsScreen";
import MemoriesScreen from "@/src/screens/memories/MemoriesScreen";
import SettingsScreen from "@/src/screens/settings/SettingsScreen";
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createMaterialTopTabNavigator();

export default function DashboardLayout() {
    const insets = useSafeAreaInsets();
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const hideSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    return (
        <Tab.Navigator
            initialRouteName="Dashboard"
            tabBarPosition="bottom"
            screenOptions={{
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.gray[400],
                tabBarStyle: {
                    backgroundColor: Colors.background.primary,
                    borderTopWidth: 1,
                    borderTopColor: Colors.gray[100],
                    elevation: 0, // Remove shadow on Android
                    shadowOpacity: 0, // Remove shadow on iOS
                    height: isKeyboardVisible ? 0 : 65 + insets.bottom,
                    paddingBottom: isKeyboardVisible ? 0 : insets.bottom + 5,
                    marginBottom: 0,
                    display: isKeyboardVisible ? 'none' : 'flex',
                },
                tabBarIndicatorStyle: {
                    display: 'none', // Hide the top indicator line typical of material tabs
                },
                tabBarLabelStyle: {
                    fontFamily: Fonts.primary.medium,
                    fontSize: 10,
                    textTransform: 'none',
                },
                tabBarItemStyle: {
                    padding: 0,
                },

                swipeEnabled: true,
                animationEnabled: true,
            }}
        >
            <Tab.Screen
                name="Goals"
                component={GoalsScreen}
                options={{
                    tabBarLabel: 'Goals',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "trophy" : "trophy-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Today',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Insights"
                component={InsightsScreen}
                options={{
                    tabBarLabel: 'Insights',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Memories"
                component={MemoriesScreen}
                options={{
                    tabBarLabel: 'Memories',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "images" : "images-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'Settings',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}