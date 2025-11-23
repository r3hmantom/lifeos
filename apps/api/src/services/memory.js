const prisma = require('../config/db');
const gemini = require('./gemini');
const qdrant = require('./qdrant');
const { v4: uuidv4 } = require('uuid');

async function createMemory(userId, data) {
    const { module, type, content, rawText, importance, eventDate } = data;

    // 1. Generate Embedding
    const embedding = await gemini.generateEmbedding(rawText);

    // 2. Prepare ID
    const memoryId = uuidv4();

    // 3. Save to Prisma
    const memory = await prisma.memory.create({
        data: {
            id: memoryId,
            userId,
            module,
            type,
            content: content || {},
            rawText,
            vectorId: memoryId,
            importance: importance || 1,
            eventDate: eventDate ? new Date(eventDate) : null,
        }
    });

    // 4. Save to Qdrant
    // Payload can include helpful metadata for filtering
    await qdrant.upsertMemory(memoryId, embedding, {
        module,
        type,
        timestamp: memory.createdAt.toISOString(),
        userId // Include userId in payload if we want to filter by it in Qdrant too (recommended for security)
    });

    return memory;
}

async function getRecentMemories(userId, module, limit = 10) {
    return await prisma.memory.findMany({
        where: {
            userId,
            module: module || undefined
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: Number(limit)
    });
}

async function getUpcomingMemories(userId, module, limit = 10) {
    return await prisma.memory.findMany({
        where: {
            userId,
            module: module || undefined,
            type: { in: ['TASK', 'EVENT'] },
            eventDate: { gte: new Date() }
        },
        orderBy: {
            eventDate: 'asc'
        },
        take: Number(limit)
    });
}

async function searchMemories(userId, query, module) {
    // 1. Generate query embedding
    const embedding = await gemini.generateEmbedding(query);

    // 2. Search Qdrant
    // We should probably filter by userId in Qdrant too if possible, but for now we filter in Postgres.
    // If we had a multi-tenant Qdrant setup, we'd filter by user_id payload.
    // Let's assume for now we just search by module and filter by ownership in Postgres.
    const searchResults = await qdrant.searchMemories(embedding, 20, module);

    const memoryIds = searchResults.map(r => r.id);

    if (memoryIds.length === 0) {
        return [];
    }

    // 3. Fetch from Postgres
    const memories = await prisma.memory.findMany({
        where: {
            id: { in: memoryIds },
            userId
        }
    });

    // 4. Re-order based on vector similarity
    const orderedMemories = memoryIds
        .map(id => memories.find(m => m.id === id))
        .filter(Boolean);

    return orderedMemories;
}

module.exports = {
    createMemory,
    getRecentMemories,
    getUpcomingMemories,
    searchMemories
};

