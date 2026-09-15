const { QdrantClient } = require('@qdrant/js-client-rest');
const config = require('./index');

const client = new QdrantClient({ url: config.qdrantUrl, apiKey: config.qdrantApiKey  });

module.exports = client;

