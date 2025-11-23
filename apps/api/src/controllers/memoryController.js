const memoryService = require('../services/memory');

async function createMemory(req, res) {
    try {
        const { module, type, text, importance, eventDate, content } = req.body;
        const userId = req.user.id; // Assumes auth middleware

        const memory = await memoryService.createMemory(userId, {
            module,
            type,
            rawText: text,
            importance,
            eventDate,
            content
        });

        res.status(201).json(memory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create memory' });
    }
}

async function getMemories(req, res) {
    try {
        const { module, limit } = req.query;
        const userId = req.user.id;

        const memories = await memoryService.getRecentMemories(userId, module, limit);
        res.json(memories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch memories' });
    }
}

async function searchMemories(req, res) {
    try {
        const { query, module } = req.body;
        const userId = req.user.id;

        const results = await memoryService.searchMemories(userId, query, module);
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to search memories' });
    }
}

module.exports = {
    createMemory,
    getMemories,
    searchMemories
};

