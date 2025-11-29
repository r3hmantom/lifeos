exports.scheduleGenerationPrompt = (date, goals, memories, preferences) => {
  return `
You are an AI assistant that generates a daily schedule for a user.
Date: ${date}
Timezone: ${preferences?.timezone || "UTC"}
Start of Day: ${preferences?.startOfDay || "09:00"}
End of Day: ${preferences?.endOfDay || "22:00"}

Active Goals:
${JSON.stringify(goals, null, 2)}

Active Memories/Commitments (Fixed Events):
${JSON.stringify(memories, null, 2)}

Task:
Generate a daily schedule that prioritizes tasks moving the user closer to their goals while respecting fixed commitments (memories).
- "focus" in goals indicates the area of life.
- "priority" in goals indicates importance.
- Memories are fixed events with specific dates/times.

Output Format:
Return ONLY a valid JSON array of objects. Do not include markdown formatting or explanations.
Each object should have:
- title: string
- description: string
- startTime: string (HH:mm format)
- endTime: string (HH:mm format)
- type: string (one of: "fixed_commitment", "goal_task", "routine", "other")
- relatedId: string (optional, the id of the goal or memory this task relates to)

Example JSON:
[
  {
    "title": "Morning Jog",
    "description": "Health goal activity",
    "startTime": "07:00",
    "endTime": "07:30",
    "type": "goal_task",
    "relatedId": "goal-id-here"
  }
]
`;
};
