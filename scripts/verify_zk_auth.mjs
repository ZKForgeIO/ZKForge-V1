// import { ZKAuthService } from '../project/src/lib/zkAuth.ts'; // Removed to avoid TS issues 
// Actually, importing TS file in node directly won't work without ts-node.
// Let's just copy the ZKAuthService logic we need into this script or import from the source if we can run it.
// Since we are having trouble with ts-node, let's just mock the client side logic in this script using the same library.

import { createField, buildAuthTrace, generateAuthProof, fieldElementToBytes } from '@zkforge/zkstark';
import { default as authRouter } from '../routes/auth.js';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import bs58 from 'bs58';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

// Helper to match ZKAuthService logic
function generateStarkAuthProof(secretKey, steps, queries) {
    // Parse secret key (simplified for test)
    let sk64;
    if (secretKey.startsWith('0x')) {
        const hex = secretKey.slice(2);
        sk64 = new Uint8Array(Buffer.from(hex, 'hex'));
    } else {
        throw new Error('Test expects 0x hex secret');
    }

    const secretHex = '0x' + Buffer.from(sk64).toString('hex');
    const secretFe = createField(BigInt(secretHex));
    const params = { steps, queries };

    const witness = { secret: secretFe };
    console.log('Witness:', witness);
    console.log('SecretFe:', secretFe);
    const trace = buildAuthTrace(witness, params);
    const finalHash = trace[steps - 1];
    const statement = { steps, finalHash };
    const proof = generateAuthProof(statement, witness, params);

    return {
        root: '0x' + Buffer.from(proof.root).toString('hex'),
        indices: proof.indices,
        openings: proof.openings.map(o => ({
            index: o.index,
            current: '0x' + Buffer.from(fieldElementToBytes(o.current)).toString('hex'),
            next: '0x' + Buffer.from(fieldElementToBytes(o.next)).toString('hex'),
            proofCurrent: {
                leaf: '0x' + Buffer.from(o.proofCurrent.leaf).toString('hex'),
                proof: o.proofCurrent.proof.map(p => ({
                    hash: '0x' + Buffer.from(p.hash).toString('hex'),
                    position: p.position
                })),
                root: '0x' + Buffer.from(o.proofCurrent.root).toString('hex')
            },
            proofNext: {
                leaf: '0x' + Buffer.from(o.proofNext.leaf).toString('hex'),
                proof: o.proofNext.proof.map(p => ({
                    hash: '0x' + Buffer.from(p.hash).toString('hex'),
                    position: p.position
                })),
                root: '0x' + Buffer.from(o.proofNext.root).toString('hex')
            }
        }))
    };
}

async function runTest() {
    let mongod;
    try {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);

        console.log('--- Setup: Creating User ---');
        const username = 'zk_test_user';

        // 1. Signup
        const signupRes = await request(app)
            .post('/auth/signup')
            .send({ username });

        if (!signupRes.body.success) {
            throw new Error(`Signup failed: ${signupRes.body.error}`);
        }
        console.log('✅ Signup successful');
        const { zkSecretKey } = signupRes.body;
        console.log('Received Secret Key:', zkSecretKey);

        // 2. Pre-Signin (Get Params)
        console.log('\n--- Step 1: Pre-Signin ---');
        const preRes = await request(app)
            .post('/auth/pre-signin')
            .send({ username });

        if (!preRes.body.success) {
            throw new Error(`Pre-signin failed: ${preRes.body.error}`);
        }
        console.log('✅ Pre-signin successful');
        const { zkAuthSteps, zkAuthQueries } = preRes.body;
        console.log(`Params: steps=${zkAuthSteps}, queries=${zkAuthQueries}`);

        // 3. Generate Proof (Client Side Simulation)
        console.log('\n--- Step 2: Generate Proof (Client Side) ---');
        const proof = generateStarkAuthProof(zkSecretKey, zkAuthSteps, zkAuthQueries);
        console.log('✅ Proof generated');

        // 4. Signin with Proof
        console.log('\n--- Step 3: Signin with Proof ---');
        const signinRes = await request(app)
            .post('/auth/signin')
            .send({ username, proof });

        if (!signinRes.body.success) {
            throw new Error(`Signin failed: ${signinRes.body.error}`);
        }
        console.log('✅ Signin successful');
        console.log('Session Token:', signinRes.body.sessionToken);

        // 5. Test Invalid Proof
        console.log('\n--- Step 4: Test Invalid Proof ---');
        const invalidProof = { ...proof, root: '0xdeadbeef' }; // Tamper with proof
        const failRes = await request(app)
            .post('/auth/signin')
            .send({ username, proof: invalidProof });

        if (failRes.body.success) {
            throw new Error('Signin should have failed with invalid proof');
        }
        console.log('✅ Signin failed as expected with invalid proof');

    } catch (e) {
        console.error('❌ Test Failed:', e);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        if (mongod) await mongod.stop();
    }
}

runTest();
