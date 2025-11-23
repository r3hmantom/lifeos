const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../config');

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

// Models
const EMBEDDING_MODEL_NAME = "text-embedding-004";
const CHAT_MODEL_NAME = "gemini-2.5-flash";

const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL_NAME });
const chatModel = genAI.getGenerativeModel({ model: CHAT_MODEL_NAME });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (error.message.includes('429') || error.status === 429) {
                console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await sleep(delay);
                delay *= 2; // Exponential backoff
            } else {
                throw error;
            }
        }
    }
    throw new Error('Max retries exceeded for operation');
}

async function generateEmbedding(text) {
    return retryOperation(async () => {
        const result = await embeddingModel.embedContent(text);
        const embedding = result.embedding;
        return embedding.values;
    });
}

async function generateText(prompt, context = "") {
    return retryOperation(async () => {
        const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
        const result = await chatModel.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    });
}

async function generateJSON(prompt, context = "") {
    return retryOperation(async () => {
         const fullPrompt = context ? `${context}\n\n${prompt}\n\nResponse must be valid JSON.` : `${prompt}\n\nResponse must be valid JSON.`;
         // Using a model configuration that enforces JSON could be better, but flash is good at following instructions.
         // We can also use response_mime_type: "application/json" if the SDK supports it for this model.
         const jsonModel = genAI.getGenerativeModel({ 
            model: CHAT_MODEL_NAME,
            generationConfig: { responseMimeType: "application/json" } 
         });
         
         const result = await jsonModel.generateContent(fullPrompt);
         const response = await result.response;
         const text = response.text();
         console.log("Gemini JSON Response:", text); // Debug log
         try {
             return JSON.parse(text);
         } catch (e) {
             console.error("Failed to parse JSON from Gemini:", text);
             throw new Error("Invalid JSON response from Gemini");
         }
    });
}

module.exports = {
    generateEmbedding,
    generateText,
    generateJSON
};

