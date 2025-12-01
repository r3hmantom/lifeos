const prisma = require("../config/db");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config");
const { chatSystemPrompt } = require("../prompts/templates");

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

exports.chat = async (req, res) => {
  const { messages, context } = req.body;

  try {
    // Fetch selected goals and memories if IDs are provided
    let selectedGoals = [];
    let selectedMemories = [];

    if (context?.selectedGoalIds?.length > 0) {
      selectedGoals = await prisma.goal.findMany({
        where: {
          id: { in: context.selectedGoalIds },
          userId: req.userId,
        },
      });
    }

    if (context?.selectedMemoryIds?.length > 0) {
      selectedMemories = await prisma.memory.findMany({
        where: {
          id: { in: context.selectedMemoryIds },
          userId: req.userId,
        },
      });
    }

    // Fetch current schedule for context
    const targetDate = context?.date ? new Date(context.date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const currentSchedule = await prisma.scheduleItem.findMany({
      where: {
        userId: req.userId,
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { startTime: "asc" },
    });

    const systemPrompt = chatSystemPrompt({
      date: context?.date || new Date().toISOString().split("T")[0],
      timezone: context?.timezone || "UTC",
      selectedGoals,
      selectedMemories,
      currentSchedule,
    });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: '{"message": "I am ready to help.", "intent": "chat"}' }],
        },
        ...messages.slice(0, -1).map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
      ],
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanText);
    } catch (e) {
      // If direct parse fails, try to extract JSON object from the text
      const firstOpen = cleanText.indexOf("{");
      const lastClose = cleanText.lastIndexOf("}");
      
      if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        const potentialJson = cleanText.substring(firstOpen, lastClose + 1);
        try {
          parsedResponse = JSON.parse(potentialJson);
        } catch (e2) {
          // If extraction also fails, fallback to chat
          parsedResponse = {
            message: text,
            intent: "chat",
          };
        }
      } else {
        // Fallback if no JSON found
        parsedResponse = {
          message: text,
          intent: "chat",
        };
      }
    }

    const setTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const d = new Date(targetDate);
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    // Handle Schedule Modifications
    if (
      parsedResponse.intent === "schedule_modified" &&
      parsedResponse.data?.modifications
    ) {
      await prisma.$transaction(async (tx) => {
        for (const mod of parsedResponse.data.modifications) {
          if (mod.action === "create") {
            await tx.scheduleItem.create({
              data: {
                title: mod.data.title,
                description: mod.data.description,
                startTime: setTime(mod.data.startTime),
                endTime: setTime(mod.data.endTime),
                type: mod.data.type || "manual",
                userId: req.userId,
                isCompleted: false,
              },
            });
          } else if (mod.action === "update") {
            const updateData = {};
            if (mod.data.title) updateData.title = mod.data.title;
            if (mod.data.description) updateData.description = mod.data.description;
            if (mod.data.startTime) updateData.startTime = setTime(mod.data.startTime);
            if (mod.data.endTime) updateData.endTime = setTime(mod.data.endTime);
            if (mod.data.type) updateData.type = mod.data.type;
            if (mod.data.isCompleted !== undefined) updateData.isCompleted = mod.data.isCompleted;

            await tx.scheduleItem.update({
              where: { id: mod.id, userId: req.userId },
              data: updateData,
            });
          } else if (mod.action === "delete") {
            await tx.scheduleItem.delete({
              where: { id: mod.id, userId: req.userId },
            });
          }
        }
      });

      // Fetch updated schedule to return
      const updatedSchedule = await prisma.scheduleItem.findMany({
        where: {
          userId: req.userId,
          startTime: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { startTime: "asc" },
      });

      parsedResponse.data.schedule = {
        date: context.date,
        items: updatedSchedule,
      };
    }

    // Note: For "schedule_generated", "goal_proposed", and "memory_proposed",
    // we do NOT save to the database automatically.
    // We return the proposed data to the frontend for user confirmation/modification.
    // The frontend will then call the respective creation endpoints.

    return res.json(parsedResponse);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to process chat request" });
  }
};
