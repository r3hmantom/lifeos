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
        TimetableSlot: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            time: { type: "string", description: "HH:mm" },
            activity: { type: "string" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        TimetableTemplateResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/TimetableSlot" },
            },
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
