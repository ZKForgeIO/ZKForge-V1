import { strict as assert } from 'assert';
process.env.JWT_SECRET = 'test_secret_at_least_32_characters_long_for_security';
process.env.LOUNGE_ROOM_KEY_B58 = '11111111111111111111111111111111111111111111'; // Dummy 32-byte key (base58 of 32 zeros is '1' repeated?) No, '1' is zero in base58. 32 bytes of zero is '11111111111111111111111111111111' (32 chars) ? No.
// Let's use a valid-looking key.
// 32 bytes in base58 is usually ~43-44 chars.
// I'll use a known valid key or just generate one if I could.
// Or just use a placeholder that passes bs58.decode.
// '1' * 44 is valid base58.
process.env.LOUNGE_ROOM_KEY_B58 = '11111111111111111111111111111111111111111111';
import mongoose from 'mongoose';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import ed2curve from 'ed2curve';
import express from 'express';
import http from 'http';

// Mock Mongoose
mongoose.connect = async () => { console.log('[MockDB] Connected'); };
const mockStore = {}; // collection -> [docs]

class MockModel {
    constructor(doc) { Object.assign(this, doc); }
    static init() { return Promise.resolve(); }
    static async findOne(query) {
        const name = this.modelName;
        const docs = mockStore[name] || [];
        // Simple match
        const found = docs.find(d => Object.entries(query).every(([k, v]) => d[k] === v));
        return found ? { ...found, lean: () => found } : null;
    }
    static async find(query) {
        const name = this.modelName;
        const docs = mockStore[name] || [];
        const found = docs.filter(d => Object.entries(query).every(([k, v]) => d[k] === v));
        found.sort = () => found; // Mock sort
        found.lean = () => found;
        return found;
    }
    static async create(doc) {
        const name = this.modelName;
        if (!mockStore[name]) mockStore[name] = [];
        const newDoc = { ...doc, _id: 'mock_id_' + Date.now() };
        mockStore[name].push(newDoc);
        return newDoc;
    }
    static async findByIdAndUpdate(id, update) {
        return {};
    }
    static async findById(id) {
        return { lean: () => ({ _id: id, username: 'mockuser' }) };
    }
}

const originalModel = mongoose.model.bind(mongoose);
mongoose.model = (name, schema) => {
    const Mock = class extends MockModel { };
    Mock.modelName = name;
    return Mock;
};
// Handle existing models if any (unlikely in this script order but good practice)
mongoose.models = {};

import chatRoutes from '../routes/chat.js';
import loungeRoutes from '../routes/lounge.js';

// Setup
let app;
let server;
let port;
let baseUrl;

async function setup() {
    // Mock DB setup (already mocked above)

    app = express();
    app.use(express.json());

    // Mock auth middleware
    app.use((req, res, next) => {
        req.userId = 'user1'; // Default user
        next();
    });

    server = http.createServer(app);

    // Mock io object as used in server.mjs
    const io = {
        to: (userId) => ({
            emit: (type, payload) => {
                // console.log(`[MockWS] Emit to ${userId}: ${type}`, payload);
            }
        }),
        broadcast: (type, payload) => {
            // console.log(`[MockWS] Broadcast: ${type}`, payload);
        },
        _rawBroadcast: (type, payload) => {
            // console.log(`[MockWS] Raw Broadcast: ${type}`, payload);
        }
    };

    // Routes
    app.use('/chat', chatRoutes(io));
    app.use('/lounge', loungeRoutes(io));

    await new Promise(resolve => {
        server.listen(0, () => {
            port = server.address().port;
            baseUrl = `http://localhost:${port}`;
            console.log(`Test server running on port ${port}`);
            resolve();
        });
    });
}

async function teardown() {
    await mongoose.disconnect();
    server.close();
}

async function testApiStandardization() {
    console.log('Testing API Standardization...');

    // Test Chat Routes
    const res1 = await fetch(`${baseUrl}/chat/conversations`);
    const json1 = await res1.json();
    assert.equal(json1.success, true, 'Chat API should return success: true');

    // Test Lounge Routes
    // Mock LOUNGE_KEYS_JSON for lounge test
    process.env.LOUNGE_KEYS_JSON = JSON.stringify([
        { version: 2, key: bs58.encode(nacl.randomBytes(32)) },
        { version: 1, key: bs58.encode(nacl.randomBytes(32)) }
    ]);

    const res2 = await fetch(`${baseUrl}/lounge/key`);
    const json2 = await res2.json();
    assert.equal(json2.success, true, 'Lounge API should return success: true');
    assert.ok(json2.keys, 'Lounge API should return keys array');
    assert.equal(json2.keys.length, 2, 'Should return 2 lounge keys');
}

async function testConversationKeyRotation() {
    console.log('Testing Conversation Key Rotation...');

    const conversationId = 'conv1';

    // Pre-populate mock data if needed
    // The routes will use the mocked models which use mockStore.
    // We need to ensure userInConversation returns true.
    // It uses ConversationParticipant.find({ conversation_id, user_id })

    // We can access the mock store directly or use the mocked models if we had access to them.
    // Since we hijacked mongoose.model, we can just use mongoose.model('ConversationParticipant')

    const ConversationParticipant = mongoose.model('ConversationParticipant');
    await ConversationParticipant.create({ conversation_id: conversationId, user_id: 'user1' });

    // 2. Fetch Initial Key
    const res1 = await fetch(`${baseUrl}/chat/conv-key?conversationId=${conversationId}`);
    const json1 = await res1.json();
    assert.equal(json1.success, true);
    assert.equal(json1.keys.length, 1, 'Should have 1 key initially');
    assert.equal(json1.keys[0].version, 1, 'Initial version should be 1');

    // 3. Rotate Key
    const res2 = await fetch(`${baseUrl}/chat/rotate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
    });
    const json2 = await res2.json();
    assert.equal(json2.success, true);
    assert.equal(json2.version, 2, 'New version should be 2');

    // 4. Fetch Keys Again
    const res3 = await fetch(`${baseUrl}/chat/conv-key?conversationId=${conversationId}`);
    const json3 = await res3.json();
    assert.equal(json3.success, true);
    assert.equal(json3.keys.length, 2, 'Should have 2 keys now');
    const versions = json3.keys.map(k => k.version).sort();
    assert.deepEqual(versions, [1, 2], 'Should have versions 1 and 2');
}

async function run() {
    try {
        await setup();
        await testApiStandardization();
        await testConversationKeyRotation();
        console.log('All tests passed!');
    } catch (e) {
        console.error('Test failed:', e);
        process.exit(1);
    } finally {
        await teardown();
    }
}

run();
