import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import DashboardScreen from "@/src/screens/dashboard/DashboardScreen";
import MemoriesScreen from "@/src/screens/memories/MemoriesScreen";
import GoalsScreen from "@/src/screens/goals/GoalsScreen";
import Colors from "@/src/constants/colors";
import Fonts from "@/src/constants/fonts";

const Tab = createMaterialTopTabNavigator();

export default function DashboardLayout() {
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
                    height: 60,
                    paddingBottom: 5,
                },
                tabBarIndicatorStyle: {
                    display: 'none', // Hide the top indicator line typical of material tabs
                },
                tabBarLabelStyle: {
                    fontFamily: Fonts.primary.medium,
                    fontSize: 10,
                    textTransform: 'none',
                },
                tabBarIconStyle: {
                    // width: 24,
                    // height: 24,
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
                name="Memories"
                component={MemoriesScreen}
                options={{
                    tabBarLabel: 'Memories',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "images" : "images-outline"} size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}