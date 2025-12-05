const prisma = require("../config/db");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config");
const { scheduleGenerationPrompt } = require("../prompts/templates");

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

exports.getDailySchedule = async (req, res) => {
  const { date } = req.query;
  const targetDate = date ? new Date(date) : new Date();

  // Set start and end of the day
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const items = await prisma.scheduleItem.findMany({
      where: {
        userId: req.userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return res.json({
      date: targetDate.toISOString().split("T")[0],
      items,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch schedule" });
  }
};

exports.createScheduleItem = async (req, res) => {
  const { title, description, startTime, endTime, type, relatedId } = req.body;

  try {
    const newItem = await prisma.scheduleItem.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        type: type || "manual",
        relatedId,
        userId: req.userId,
        isCompleted: false,
      },
    });

    return res.json(newItem);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create schedule item" });
  }
};

exports.updateScheduleItem = async (req, res) => {
  const { id } = req.params;
  const { title, description, startTime, endTime, type, isCompleted } =
    req.body;

  try {
    const updatedItem = await prisma.scheduleItem.update({
      where: { id, userId: req.userId },
      data: {
        title,
        description,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        type,
        isCompleted,
      },
    });

    return res.json(updatedItem);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update schedule item" });
  }
};

exports.deleteScheduleItem = async (req, res) => {
  const { id } = req.params;

  try {
    // If id is 'daily', it's actually the daily clear request being routed incorrectly
    // or we need to handle it specifically if the route pattern matches.
    // However, Express routing usually prioritizes specific paths before params.
    // But here, we might need a specific controller function for the daily delete.
    
    await prisma.scheduleItem.delete({
      where: { id, userId: req.userId },
    });

    return res.json({ message: "Schedule item deleted successfully" });
  } catch (err) {
    // Check for record not found error
    if (err.code === 'P2025') {
        return res.status(404).json({ error: "Schedule item not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Failed to delete schedule item" });
  }
};

exports.clearDailySchedule = async (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: "Date parameter is required" });
  }

  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const result = await prisma.scheduleItem.deleteMany({
      where: {
        userId: req.userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return res.json({ message: "Daily schedule cleared successfully", count: result.count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to clear daily schedule" });
  }
};

exports.generateSchedule = async (req, res) => {
  const { timezone, date, preferences, goalIds, memoryIds, customPrompt } = req.body;

  try {
    const targetDate = date ? new Date(date) : new Date();
    const dateString = targetDate.toISOString().split("T")[0];

    // Build where clauses for goals and memories
    const goalWhere = { userId: req.userId, isActive: true };
    if (goalIds && goalIds.length > 0) {
      goalWhere.id = { in: goalIds };
    }

    const memoryWhere = { userId: req.userId, isActive: true };
    if (memoryIds && memoryIds.length > 0) {
      memoryWhere.id = { in: memoryIds };
    }

    // Fetch active goals and memories
    const [activeGoals, activeMemories] = await Promise.all([
      prisma.goal.findMany({ where: goalWhere }),
      prisma.memory.findMany({ where: memoryWhere }),
    ]);

    // Helper to set time on the target date
    const setTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const d = new Date(targetDate);
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    // Generate Prompt
    const prompt = scheduleGenerationPrompt(
      dateString,
      activeGoals,
      activeMemories,
      { timezone, ...preferences },
      customPrompt
    );

    // Call AI Service
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from AI response
    // Clean up markdown code blocks if present
    const jsonString = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    let generatedItems = [];
    try {
      generatedItems = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse AI response:", text);
      return res.status(500).json({ error: "AI generated invalid format" });
    }

    // Transform and Save to Database
    const createdItems = await Promise.all(
      generatedItems.map((item) => {
        return prisma.scheduleItem.create({
          data: {
            title: item.title,
            description: item.description,
            startTime: setTime(item.startTime),
            endTime: setTime(item.endTime),
            type: item.type,
            relatedId: item.relatedId,
            userId: req.userId,
            isCompleted: false,
          },
        });
      })
    );

    return res.json({
      message: "Schedule generated successfully",
      schedule: {
        date: dateString,
        items: createdItems,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate schedule" });
  }
};

exports.batchCreateScheduleItems = async (req, res) => {
  const { date, items } = req.body;

  try {
    const createdItems = await Promise.all(
      items.map((item) => {
        return prisma.scheduleItem.create({
          data: {
            title: item.title,
            description: item.description,
            startTime: new Date(item.startTime),
            endTime: new Date(item.endTime),
            type: item.type || "manual",
            relatedId: item.relatedId,
            userId: req.userId,
            isCompleted: item.isCompleted || false,
          },
        });
      })
    );

    return res.json({ message: "Schedule items saved successfully", count: createdItems.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to save schedule items" });
  }
};
