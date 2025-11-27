// scripts/export-swagger.js
const fs = require("fs");
const path = require("path");

// This requires your existing swagger config
const swaggerSpecs = require("../src/config/swagger");

const outPath = path.join(__dirname, "..", "swagger.json");

fs.writeFileSync(outPath, JSON.stringify(swaggerSpecs, null, 2), "utf8");

console.log("Swagger JSON written to", outPath);
