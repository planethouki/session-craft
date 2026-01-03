import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = join(__dirname, 'firebase-adminsdk.json');

const getRandomInt = (from, to) => {
  return Math.floor(Math.random() * (to - from + 1)) + from;
};

try {
  const serviceAccount = JSON.parse(
    await readFile(serviceAccountPath, 'utf8')
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.log('Service account file not found or invalid, trying default initialization...');
  admin.initializeApp();
}

const db = admin.firestore();



const createSession = async () => {
  const sessionRef = await db.collection('sessions').add({
    title: `第${getRandomInt(24,89)}回セッション`,
    date: `2026-${getRandomInt(1,12)}-${getRandomInt(1,28)}`,
    status: 'draft',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  console.log(`Created session ${sessionRef.id}`);

  const proposalsRef = sessionRef.collection('proposals');
  const entriesRef = sessionRef.collection('entries');
  const parts = ['vo', 'gt', 'ba', 'dr', 'kb', 'oth'];

  const selectedProposals = [];

  for (let i = 1; i <= 10; i++) {
    const proposal = {
      sessionId: sessionRef.id,
      proposerUid: `dummy_user_${i}`,
      title: `Dummy Title ${i}`,
      artist: `Dummy Artist ${i}`,
      instrumentation: 'Vo, Gt, Ba, Dr',
      myPart: parts[i % parts.length],
      sourceUrl: 'https://example.com/source',
      scoreUrl: 'https://example.com/score',
      notes: `Dummy notes for proposal ${i}`,
      order: i,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const proposalRef = await proposalsRef.add(proposal);

    if (getRandomInt(0, 10) > 3) {
      selectedProposals.push(proposalRef.id);
    }

    console.log(`Created proposal ${proposalRef.id}`);

    const jn = getRandomInt(3, 7);
    for (let j = 0; j < jn; j++) {
      const entry = {
        sessionId: sessionRef.id,
        songId: proposalRef.id,
        memberUid: `dummy_user_${getRandomInt(1, 10)}`,
        part: parts[getRandomInt(0, parts.length - 1)],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await entriesRef.add(entry);
      console.log(`Created entry ${j + 1} for proposal ${proposalRef.id}`);
    }
  }

  await sessionRef.set({ selectedProposals }, { merge: true })
};

createSession()
  .then(() => {
    console.log('Successfully created session.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error creating session:', error);
    process.exit(1);
  });
