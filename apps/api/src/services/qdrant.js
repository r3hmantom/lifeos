const client = require('../config/qdrant');

const COLLECTION_NAME = 'life_memories';
const VECTOR_SIZE = 768;

async function ensureCollection() {
    try {
        const result = await client.getCollections();
        const exists = result.collections.some(c => c.name === COLLECTION_NAME);
        if (!exists) {
            await client.createCollection(COLLECTION_NAME, {
                vectors: {
                    size: VECTOR_SIZE,
                    distance: 'Cosine',
                },
            });
            console.log(`Collection ${COLLECTION_NAME} created.`);
        }
    } catch (error) {
        console.error("Error ensuring collection:", error);
        // Don't crash, might be connection issue that resolves later
    }
}

async function upsertMemory(id, vector, payload) {
    try {
        await client.upsert(COLLECTION_NAME, {
            wait: true,
            points: [
                {
                    id,
                    vector,
                    payload,
                },
            ],
        });
    } catch (error) {
        console.error("Error upserting to Qdrant:", error);
        throw error;
    }
}

async function searchMemories(vector, limit = 5, module = null) {
    try {
        const filter = module ? {
            must: [
                {
                    key: 'module',
                    match: {
                        value: module
                    }
                }
            ]
        } : undefined;

        const result = await client.search(COLLECTION_NAME, {
            vector,
            limit,
            filter,
        });
        return result;
    } catch (error) {
        console.error("Error searching Qdrant:", error);
        throw error;
    }
}

module.exports = {
    ensureCollection,
    upsertMemory,
    searchMemories
};

