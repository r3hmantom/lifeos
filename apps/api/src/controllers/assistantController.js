const prisma = require("../config/db");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config");
const { chatSystemPrompt } = require("../prompts/templates");

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

exports.chat = async (req, res) => {
  const { messages, context, chatId } = req.body;

  try {
    // Get or create chat session
    let chat;
    if (chatId) {
      // Verify chat belongs to user
      chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          userId: req.userId,
        },
      });
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
    } else {
      // Create new chat session
      const firstUserMessage = messages.find((m) => m.role === "user");
      const title = firstUserMessage?.content?.substring(0, 50) || "New Chat";
      chat = await prisma.chat.create({
        data: {
          userId: req.userId,
          title: title.length > 50 ? title + "..." : title,
        },
      });
    }

    // Fetch goals and memories
    // If specific IDs are selected (e.g. from Web UI), use those
    // Otherwise (e.g. Mobile App), fetch all active ones
    let selectedGoals = [];
    let selectedMemories = [];

    if (context?.selectedGoalIds?.length > 0) {
      selectedGoals = await prisma.goal.findMany({
        where: {
          id: { in: context.selectedGoalIds },
          userId: req.userId,
        },
      });
    } else {
      selectedGoals = await prisma.goal.findMany({
        where: {
          userId: req.userId,
          isActive: true,
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
    } else {
      selectedMemories = await prisma.memory.findMany({
        where: {
          userId: req.userId,
          isActive: true,
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

    // Load previous messages from database if continuing a chat
    let allMessages = [];
    let lastMessage;
    
    if (chatId) {
      // Load all previous messages from database
      const dbMessages = await prisma.chatMessage.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
      });
      allMessages = dbMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // Only use the last message from request (the new user message)
      if (messages.length > 0) {
        lastMessage = messages[messages.length - 1];
        allMessages.push(lastMessage);
      } else {
        return res.status(400).json({ error: "At least one message is required" });
      }
    } else {
      // New chat - use all messages from request
      allMessages = messages;
      if (messages.length === 0) {
        return res.status(400).json({ error: "At least one message is required" });
      }
      lastMessage = messages[messages.length - 1];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const geminiChat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: '{"message": "I am ready to help.", "intent": "chat"}' }],
        },
        ...allMessages.slice(0, -1).map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
      ],
    });

    const result = await geminiChat.sendMessage(lastMessage.content);
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

    // Save messages to database
    await prisma.$transaction(async (tx) => {
      // Save user message (only if it's new, not already in DB)
      if (!chatId || messages.length > 0) {
        await tx.chatMessage.create({
          data: {
            chatId: chat.id,
            role: "user",
            content: lastMessage.content,
          },
        });
      }

      // Save assistant response
      await tx.chatMessage.create({
        data: {
          chatId: chat.id,
          role: "assistant",
          content: parsedResponse.message || text,
          metadata: parsedResponse,
        },
      });

      // Update chat updatedAt timestamp and title if needed
      const updateData = { updatedAt: new Date() };
      // Auto-update title from first user message if title is still default
      if (!chat.title || chat.title === "New Chat") {
        const firstUserMsg = allMessages.find((m) => m.role === "user");
        if (firstUserMsg) {
          const newTitle = firstUserMsg.content.substring(0, 50);
          updateData.title = newTitle.length > 50 ? newTitle + "..." : newTitle;
        }
      }

      await tx.chat.update({
        where: { id: chat.id },
        data: updateData,
      });
    });

    return res.json({
      ...parsedResponse,
      chatId: chat.id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to process chat request" });
  }
};

// Get all chats for the user
exports.getChats = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const chats = await prisma.chat.findMany({
      where: {
        userId: req.userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: parseInt(limit),
      skip: parseInt(offset),
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    return res.json({
      chats: chats.map((chat) => ({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messageCount: chat._count.messages,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch chats" });
  }
};

// Get messages for a specific chat
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    // Verify chat belongs to user
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: req.userId,
      },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        chatId,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: parseInt(limit),
      skip: parseInt(offset),
      select: {
        id: true,
        role: true,
        content: true,
        metadata: true,
        createdAt: true,
      },
    });

    return res.json({
      chatId,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        metadata: msg.metadata,
        createdAt: msg.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch chat messages" });
  }
};

// Create a new chat
exports.createChat = async (req, res) => {
  try {
    const { title } = req.body;
    const chat = await prisma.chat.create({
      data: {
        userId: req.userId,
        title: title || "New Chat",
      },
    });

    return res.json({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create chat" });
  }
};

// Update chat title
exports.updateChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const chat = await prisma.chat.updateMany({
      where: {
        id: chatId,
        userId: req.userId,
      },
      data: {
        title,
      },
    });

    if (chat.count === 0) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const updatedChat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    return res.json({
      id: updatedChat.id,
      title: updatedChat.title,
      updatedAt: updatedChat.updatedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update chat" });
  }
};

// Delete a chat
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await prisma.chat.deleteMany({
      where: {
        id: chatId,
        userId: req.userId,
      },
    });

    if (chat.count === 0) {
      return res.status(404).json({ error: "Chat not found" });
    }

    return res.json({ message: "Chat deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete chat" });
  }
};
