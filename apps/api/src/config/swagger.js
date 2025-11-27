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
        url: "http://localhost:8080/api",
        description: "Development server",
      },
    ],
    components: {},
    security: [],
  },
  apis: ["./src/routes/*.js"], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
