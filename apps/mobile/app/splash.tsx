import Fonts from '@/src/constants/fonts';
import {
    IBMPlexSans_300Light,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
    useFonts,
} from '@expo-google-fonts/ibm-plex-sans';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

const SPLASH_DELAY = 100; // 3 seconds

export default function SplashScreen() {

    const router = useRouter();

    const [fontsLoaded] = useFonts({
        IBMPlexSans_300Light,
        IBMPlexSans_400Regular,
        IBMPlexSans_500Medium,
        IBMPlexSans_600SemiBold,
        IBMPlexSans_700Bold,
    });

    // Animated values
    const firstLineOpacity = useRef(new Animated.Value(0)).current;
    const firstLineTranslateY = useRef(new Animated.Value(30)).current;

    const secondLineOpacity = useRef(new Animated.Value(0)).current;
    const secondLineTranslateY = useRef(new Animated.Value(30)).current;

    const thirdLineOpacity = useRef(new Animated.Value(0)).current;
    const thirdLineTranslateY = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        // Helper to create animation sequence for a line
        const createLineAnimation = (opacity: Animated.Value, translateY: Animated.Value, delay: number) => {
            return Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 800,
                    delay: delay,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 800,
                    delay: delay,
                    useNativeDriver: true,
                }),
            ]);
        };

        // Start all animations
        Animated.parallel([
            createLineAnimation(firstLineOpacity, firstLineTranslateY, 0),
            createLineAnimation(secondLineOpacity, secondLineTranslateY, 600),
            createLineAnimation(thirdLineOpacity, thirdLineTranslateY, 1200),
        ]).start();

        // Navigate to auth screen after splash delay
        const timer = setTimeout(() => {
            router.replace('/dashboard');
        }, SPLASH_DELAY);

        return () => clearTimeout(timer);
    }, []);

    // --- Font Loading Check ---
    if (!fontsLoaded) {
        return null; // Don't render anything until fonts are loaded
    }

    return (
        <View style={styles.container}>
            <View style={styles.textContainer}>
                <Animated.View
                    style={{
                        opacity: firstLineOpacity,
                        transform: [{ translateY: firstLineTranslateY }],
                    }}
                >
                    <Text style={styles.text}>meet asta.</Text>
                </Animated.View>

                <Animated.View
                    style={{
                        opacity: secondLineOpacity,
                        transform: [{ translateY: secondLineTranslateY }],
                    }}
                >
                    <Text style={styles.text}>your ultimate</Text>
                </Animated.View>

                <Animated.View
                    style={{
                        opacity: thirdLineOpacity,
                        transform: [{ translateY: thirdLineTranslateY }],
                    }}
                >
                    <Text style={styles.text}>companion</Text>
                </Animated.View>
            </View>

            <View style={styles.imageContainer}>
                <Image
                    source={require('../assets/images/mascot.png')}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 300,
    },
    text: {
        fontSize: 35,
        fontFamily: Fonts.primary.bold,
        color: '#000000',
        marginVertical: 0,
        textAlign: 'center',
    },
    imageContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        alignItems: 'flex-start',
    },
    image: {
        width: 300,
        height: 300
    },
});