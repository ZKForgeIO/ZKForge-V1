import 'dotenv/config';
import mongoose from 'mongoose';
import Profile from '../models/Profile.js';
import { newId } from '../lib/ids.js';

async function main() {
  const username = process.argv[2];
  const zkPublicKey = process.argv[3];
  const solanaAddress = process.argv[4];

  if (!username || !zkPublicKey || !solanaAddress) {
    console.error('Usage: node scripts/upsertProfile.js <username> <zkPublicKey(base58)> <solanaAddress>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { dbName: 'zkchat' });

  const existing = await Profile.findOne({ $or: [{ username }, { zk_public_key: zkPublicKey }] });
  if (existing) {
    existing.username = username;
    existing.zk_public_key = zkPublicKey;
    existing.solana_address = solanaAddress;
    existing.is_online = true;
    existing.last_seen = new Date();
    existing.message_counter = existing.message_counter || 0;
    await existing.save();
    console.log('Updated existing profile:', existing._id.toString());
  } else {
    const id = newId();
    await Profile.create({
      _id: id,
      username,
      zk_public_key: zkPublicKey,
      solana_address: solanaAddress,
      is_online: true,
      last_seen: new Date(),
      message_counter: 0
    });
    console.log('Created new profile:', id);
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
