const express = require("express");
const cors = require("cors");
const config = require("./src/config");
const routes = require("./src/routes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./src/config/swagger");

const app = express();

app.use(cors());
app.use(express.json());

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// API Routes
app.use("/api/v1", routes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

async function startServer() {
  try {
    // Ensure Qdrant collection exists
    app.listen(config.port, "0.0.0.0", () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
