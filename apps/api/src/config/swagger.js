const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LifeOS Backend",
      version: "1.0.0",
      description: "API documentation for the LifeOS",
    },
    servers: [
      {
        url: "http://localhost:8080/api/v1",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string" },
            name: { type: "string" },
            avatarUrl: { type: "string" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            token: { type: "string" },
          },
        },
        Memory: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            date: { type: "string", format: "date-time" },
            isActive: { type: "boolean" },
          },
        },
        Goal: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            focus: { type: "string" },
            deadline: { type: "string", format: "date-time" },
            priority: { type: "string", enum: ["High", "Medium", "Low"] },
            isActive: { type: "boolean" },
          },
        },
        ScheduleItem: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string" },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            type: { type: "string" },
            relatedId: { type: "string" },
            isCompleted: { type: "boolean" },
          },
        },
        ScheduleGenerationRequest: {
          type: "object",
          properties: {
            timezone: { type: "string" },
            date: { type: "string", format: "date" },
            preferences: {
              type: "object",
              properties: {
                startOfDay: { type: "string" },
                endOfDay: { type: "string" },
              },
            },
            goalIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
            },
            memoryIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
            },
            customPrompt: { type: "string" },
          },
        },
        ChatMessage: {
          type: "object",
          required: ["role", "content"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Message ID (only present when retrieved from database)",
            },
            role: {
              type: "string",
              enum: ["user", "assistant", "system"],
            },
            content: { type: "string" },
            metadata: {
              type: "object",
              description: "Additional metadata (e.g., parsed response with intent)",
              nullable: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Message creation timestamp (only present when retrieved from database)",
            },
          },
        },
        ChatRequest: {
          type: "object",
          required: ["messages"],
          properties: {
            messages: {
              type: "array",
              items: { $ref: "#/components/schemas/ChatMessage" },
            },
            chatId: {
              type: "string",
              format: "uuid",
              description: "Optional chat ID to continue an existing conversation",
            },
            context: {
              type: "object",
              properties: {
                date: { type: "string", format: "date" },
                timezone: { type: "string" },
                selectedGoalIds: {
                  type: "array",
                  items: { type: "string", format: "uuid" },
                },
                selectedMemoryIds: {
                  type: "array",
                  items: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        ChatResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            intent: {
              type: "string",
              enum: [
                "chat",
                "schedule_generated",
                "schedule_modified",
                "goal_proposed",
                "memory_proposed",
                "clarification_needed",
              ],
            },
            data: { type: "object" },
            chatId: {
              type: "string",
              format: "uuid",
              description: "Chat ID for the conversation (new or existing)",
            },
          },
        },
        Chat: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            messageCount: {
              type: "integer",
              description: "Number of messages in the chat",
            },
          },
        },
        BatchScheduleRequest: {
          type: "object",
          required: ["date", "items"],
          properties: {
            date: { type: "string", format: "date" },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/ScheduleItem" },
            },
            metadata: {
              type: "object",
              description: "Audit trail data like prompt used, goals selected",
            },
          },
        },
        InsightMetrics: {
          type: "object",
          properties: {
            productivityScore: { type: "number" },
            categoryDistribution: {
              type: "object",
              additionalProperties: { type: "number" },
            },
            completedTasks: { type: "number" },
            totalTasks: { type: "number" },
          },
        },
        UserSettings: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            theme: { type: "string", enum: ["light", "dark", "system"] },
            notificationsEnabled: { type: "boolean" },
            timezone: { type: "string" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
