require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
  geminiApiKey: process.env.GEMINI_API_KEY,
  qdrantApiKey: process.env.QDRANT_API_KEY,
};

