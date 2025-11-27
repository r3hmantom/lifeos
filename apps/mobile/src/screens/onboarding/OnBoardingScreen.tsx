import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useRef, useState } from "react";
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    Layout,
    SlideInLeft,
    SlideInRight,
    SlideOutLeft,
    SlideOutRight
} from "react-native-reanimated";
import { Colors } from "../../constants/colors";
import { ONBOARDING_QUESTIONS } from "./questions";

const { width } = Dimensions.get("window");

interface Question {
    id: number;
    question: string;
    type: string;
    options?: string[];
    conditional_on?: number;
    fields?: any[];
}

// Flatten all questions into a single array for linear navigation
const FLAT_QUESTIONS = Object.values(ONBOARDING_QUESTIONS).flat() as Question[];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const scrollViewRef = useRef<ScrollView>(null);

    // Filter questions based on conditions
    const activeQuestion = useMemo(() => {
        return FLAT_QUESTIONS[currentIndex];
    }, [currentIndex]);

    const totalSteps = FLAT_QUESTIONS.length;
    const progress = ((currentIndex + 1) / totalSteps) * 100;

    const handleNext = (value: any) => {
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
            // Optional: Add validation feedback here
            return;
        }

        const newAnswers = { ...answers, [activeQuestion.id]: value };
        setAnswers(newAnswers);

        // Find next valid question
        let nextIndex = currentIndex + 1;
        while (nextIndex < FLAT_QUESTIONS.length) {
            const nextQ = FLAT_QUESTIONS[nextIndex];
            if (!nextQ.conditional_on || newAnswers[nextQ.conditional_on]) {
                break;
            }
            nextIndex++;
        }

        if (nextIndex < FLAT_QUESTIONS.length) {
            setDirection('forward');
            setCurrentIndex(nextIndex);
        } else {
            console.log("Onboarding Complete:", newAnswers);
            Alert.alert("All Set!", "Your profile has been created.");
        }
    };

    const handleBack = () => {
        let prevIndex = currentIndex - 1;
        while (prevIndex >= 0) {
            const prevQ = FLAT_QUESTIONS[prevIndex];
            if (!prevQ.conditional_on || answers[prevQ.conditional_on]) {
                break;
            }
            prevIndex--;
        }

        if (prevIndex >= 0) {
            setDirection('backward');
            setCurrentIndex(prevIndex);
        }
    };

    const handleSaveAndExit = () => {
        Alert.alert("Save & Exit", "Your progress has been saved. You can continue later.");
    };

    const renderQuestionInput = () => {
        const q = activeQuestion;
        const currentAnswer = answers[q.id];

        switch (q.type) {
            case 'text':
            case 'number':
            case 'time':
                return (
                    <TextInput
                        style={styles.input}
                        placeholder={q.type === 'time' ? "HH:MM" : "Type your answer..."}
                        placeholderTextColor={Colors.gray[400]}
                        value={currentAnswer || ''}
                        onChangeText={(text) => setAnswers({ ...answers, [q.id]: text })}
                        keyboardType={q.type === 'number' ? 'numeric' : 'default'}
                        autoFocus
                        onSubmitEditing={() => handleNext(answers[q.id])}
                    />
                );

            case 'select':
            case 'boolean':
                const options = q.type === 'boolean'
                    ? ['Yes', 'No']
                    : (q.options || []);

                return (
                    <View style={styles.optionsContainer}>
                        {options.map((opt: string, idx: number) => {
                            const val = q.type === 'boolean' ? (opt === 'Yes') : opt;
                            const isSelected = currentAnswer === val;
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                                    onPress={() => handleNext(val)}
                                >
                                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                        {opt}
                                    </Text>
                                    {isSelected && <Ionicons name="checkmark-circle" size={24} color={Colors.white} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                );

            case 'multi_select':
                const selectedItems = (currentAnswer as string[]) || [];
                return (
                    <View style={styles.optionsContainer}>
                        {q.options?.map((opt: string, idx: number) => {
                            const isSelected = selectedItems.includes(opt);
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                                    onPress={() => {
                                        const newSelection = isSelected
                                            ? selectedItems.filter(i => i !== opt)
                                            : [...selectedItems, opt];
                                        setAnswers({ ...answers, [q.id]: newSelection });
                                    }}
                                >
                                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                        {opt}
                                    </Text>
                                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                        {isSelected && <Ionicons name="checkmark" size={16} color={Colors.white} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => handleNext(selectedItems)}
                        >
                            <Text style={styles.primaryBtnText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'group':
                // Simplified group handler for "Course Details"
                // In a real app, this would be a dynamic form builder
                return (
                    <View>
                        <Text style={styles.subLabel}>Add your items below</Text>
                        <TouchableOpacity
                            style={styles.dashedBtn}
                            onPress={() => Alert.alert("Add Item", "This would open a modal to add details.")}
                        >
                            <Ionicons name="add" size={24} color={Colors.gray[500]} />
                            <Text style={styles.dashedBtnText}>Add Entry</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.primaryBtn, { marginTop: 20 }]}
                            onPress={() => handleNext(true)}
                        >
                            <Text style={styles.primaryBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                );

            default:
                return <Text>Unsupported type: {q.type}</Text>;
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="dark" />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={[styles.navBtn, currentIndex === 0 && styles.navBtnHidden]}
                        disabled={currentIndex === 0}
                    >
                        <Ionicons name="chevron-back" size={24} color={Colors.black} />
                    </TouchableOpacity>

                    <View style={styles.progressBarBg}>
                        <Animated.View
                            style={[styles.progressBarFill, { width: `${progress}%` }]}
                            layout={Layout.springify()}
                        />
                    </View>

                    <TouchableOpacity onPress={handleSaveAndExit}>
                        <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View
                            key={activeQuestion.id}
                            entering={direction === 'forward' ? SlideInRight.duration(300) : SlideInLeft.duration(300)}
                            exiting={direction === 'forward' ? SlideOutLeft.duration(300) : SlideOutRight.duration(300)}
                            style={styles.questionContainer}
                        >
                            <Text style={styles.stepIndicator}>
                                Step {currentIndex + 1} of {totalSteps}
                            </Text>

                            <Text style={styles.questionTitle}>
                                {activeQuestion.question}
                            </Text>

                            <View style={styles.inputContainer}>
                                {renderQuestionInput()}
                            </View>

                            {/* Continue button for text inputs */}
                            {['text', 'number', 'time'].includes(activeQuestion.type) && (
                                <TouchableOpacity
                                    style={styles.fab}
                                    onPress={() => handleNext(answers[activeQuestion.id])}
                                >
                                    <Ionicons name="arrow-forward" size={24} color={Colors.white} />
                                </TouchableOpacity>
                            )}
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        marginBottom: 10,
    },
    navBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: Colors.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    navBtnHidden: {
        opacity: 0,
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: Colors.gray[200],
        borderRadius: 3,
        marginHorizontal: 20,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 3,
    },
    saveText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.gray[600],
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    questionContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    stepIndicator: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    questionTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.black,
        marginBottom: 32,
        lineHeight: 36,
    },
    inputContainer: {
        width: '100%',
    },
    input: {
        backgroundColor: Colors.white,
        padding: 20,
        borderRadius: 16,
        fontSize: 18,
        color: Colors.black,
        borderWidth: 1,
        borderColor: Colors.gray[200],
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    optionsContainer: {
        gap: 12,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.gray[200],
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    optionCardSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.gray[800],
    },
    optionTextSelected: {
        color: Colors.white,
        fontWeight: '600',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.gray[300],
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderColor: Colors.white,
    },
    primaryBtn: {
        backgroundColor: Colors.black,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 0,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.black,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    subLabel: {
        fontSize: 16,
        color: Colors.gray[600],
        marginBottom: 12,
    },
    dashedBtn: {
        borderWidth: 2,
        borderColor: Colors.gray[300],
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        backgroundColor: Colors.gray[50],
    },
    dashedBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.gray[500],
    }
});
