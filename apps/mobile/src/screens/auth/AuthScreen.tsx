import { hapticsSelection, hapticsSuccess, hapticsWarning } from '@/src/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Colors from '../../constants/colors';
import { BorderRadius, FontSizes, Spacing } from '../../constants/dimensions';
import Fonts from '../../constants/fonts';

interface AuthScreenProps {
    onAuthSuccess?: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
    const router = useRouter();
    const [mode, setMode] = useState<'signup' | 'login'>('signup');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const isFormValid = () => {
        if (mode === 'signup') {
            return formData.name.trim() !== '' &&
                formData.email.trim() !== '' &&
                formData.password.trim() !== '';
        } else {
            return formData.email.trim() !== '' &&
                formData.password.trim() !== '';
        }
    };

    const handleContinue = () => {
        if (isFormValid()) {
            hapticsSuccess();
            // Here you would normally handle authentication
            console.log(`${mode} attempted with:`, formData);

            if (onAuthSuccess) {
                onAuthSuccess();
            } else {
                router.replace('/dashboard');
            }
        } else {
            hapticsWarning();
            console.log('Form is invalid');
        }
    };

    const toggleMode = () => {
        hapticsSelection();

        setMode(mode === 'signup' ? 'login' : 'signup');
        // Clear form when switching modes
        setFormData({
            name: '',
            email: '',
            password: '',
        });
    };

    const renderInputField = (
        icon: keyof typeof Ionicons.glyphMap,
        label: string,
        placeholder: string,
        value: string,
        onChangeText: (text: string) => void,
        secureTextEntry = false
    ) => (
        <View style={styles.inputContainer}>

            <View style={styles.inputLabelContainer}>
                <Ionicons name={icon} size={15} color={Colors.gray[400]} style={styles.inputIcon} />
                <Text style={styles.inputLabel}>{label}</Text>
            </View>
            <View style={styles.inputWrapper}>


                <TextInput
                    style={styles.textInput}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.gray[400]}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry}
                    autoCapitalize={secureTextEntry ? 'none' : 'words'}
                    keyboardType={label === 'EMAIL' ? 'email-address' : 'default'}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View >
                        {/* Header Section */}
                        <View style={styles.headerSection}>
                            <Text style={styles.mainHeading}>
                                {mode === 'signup' ? 'Sign up with email' : 'Log in with email'}
                            </Text>
                            <Text style={styles.subText}>
                                {mode === 'signup'
                                    ? 'Sign up to start your planning journey and keep your data safe.'
                                    : 'Welcome back! Enter your credentials to continue.'
                                }
                            </Text>
                        </View>

                        {/* Form Section */}
                        <View style={styles.formSection}>
                            {/* Name Field - Only for Sign Up */}
                            {mode === 'signup' && renderInputField(
                                'person-outline',
                                'NAME',
                                'Your Name',
                                formData.name,
                                (text) => handleInputChange('name', text)
                            )}

                            {/* Email Field */}
                            {renderInputField(
                                'mail-outline',
                                'EMAIL',
                                'e.g. hello@asta.com',
                                formData.email,
                                (text) => handleInputChange('email', text)
                            )}

                            {/* Password Field */}
                            {renderInputField(
                                'key-outline',
                                'PASSWORD',
                                'Strong Password',
                                formData.password,
                                (text) => handleInputChange('password', text),
                                true
                            )}




                        </View>
                    </View>


                    {/* Continue Button */}
                    <View style={styles.continueButtonSection}>
                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                isFormValid() ? styles.continueButtonEnabled : styles.continueButtonDisabled
                            ]}
                            onPress={handleContinue}
                            disabled={!isFormValid()}

                        >
                            <Text style={[
                                styles.continueButtonText,
                                isFormValid() ? styles.continueButtonTextEnabled : styles.continueButtonTextDisabled
                            ]}>
                                Continue
                            </Text>
                        </TouchableOpacity>
                        {/* Switch Mode */}
                        <TouchableOpacity onPress={toggleMode} style={styles.switchModeContainer}>
                            <Text style={styles.switchModeText}>
                                {mode === 'signup' ? 'Have an account? ' : "Don't have an account? "}
                                <Text style={styles.switchModeLink}>
                                    {mode === 'signup' ? 'Log in' : 'Sign up'}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.lg,
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    headerSection: {
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: Spacing.xxl,
        marginTop: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    mainHeading: {
        fontSize: FontSizes.xxxl,
        fontFamily: Fonts.primary.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.md,
        lineHeight: 38,
    },
    subText: {
        fontSize: FontSizes.md,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.secondary,
        lineHeight: 22,
    },
    formSection: {
        // flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: Spacing.xxl,
    },
    inputContainer: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        display: 'flex',
        flexDirection: 'row',
        gap: Spacing.sm,
        fontSize: FontSizes.xs,
        fontFamily: Fonts.primary.semiBold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
        letterSpacing: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: BorderRadius.md,
        // paddingHorizontal: Spacing.md,
        // paddingVertical: Spacing.md,
        backgroundColor: Colors.background.primary,
    },
    inputIcon: {
        // paddingRight: Spacing.xxl,
        display: "flex",
    },
    textInput: {
        flex: 1,
        fontSize: FontSizes.md,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.primary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    continueButton: {
        borderRadius: BorderRadius.full,
        paddingVertical: Spacing.md + 4,
        marginTop: Spacing.lg,
        marginBottom: Spacing.xs,
    },
    continueButtonEnabled: {
        backgroundColor: Colors.black,
    },
    continueButtonDisabled: {
        backgroundColor: Colors.gray[200],
    },
    continueButtonText: {
        textAlign: 'center',
        fontSize: FontSizes.md,
        fontFamily: Fonts.primary.semiBold,
    },
    continueButtonTextEnabled: {
        color: Colors.white,
    },
    continueButtonTextDisabled: {
        color: Colors.gray[400],
    },
    switchModeContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    switchModeText: {
        fontSize: FontSizes.sm,
        fontFamily: Fonts.primary.regular,
        color: Colors.text.secondary,
    },
    switchModeLink: {
        fontFamily: Fonts.primary.medium,
        color: Colors.text.primary,
        textDecorationLine: 'underline',
    },

    continueButtonSection: {
        marginBottom: Spacing.xxl
    }
    ,
    inputLabelContainer: {
        display: 'flex',
        flexDirection: 'row',
        gap: Spacing.sm,
    }
});