// src/utils/haptics.ts

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Optional: You can disable haptics on non-mobile platforms if needed,
// though expo-haptics generally handles this gracefully.
const isMobile = Platform.OS === "ios" || Platform.OS === "android";

/**
 * Triggers a light impact haptic feedback.
 */
export const hapticsLight = () => {
  if (isMobile) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

/**
 * Triggers a medium impact haptic feedback.
 */
export const hapticsMedium = () => {
  if (isMobile) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

/**
 * Triggers a success notification haptic feedback.
 */
export const hapticsSuccess = () => {
  if (isMobile) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

/**
 * Triggers a warning notification haptic feedback.
 */
export const hapticsWarning = () => {
  if (isMobile) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};

/**
 * Triggers a selection haptic feedback (good for mode toggles).
 */
export const hapticsSelection = () => {
  if (isMobile) {
    Haptics.selectionAsync();
  }
};
