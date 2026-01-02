import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = join(__dirname, 'firebase-adminsdk.json');

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

const sessionId = '67jxoWQ2Ygty7G8INAmy';

const createProposals = async () => {
  const collectionRef = db.collection('sessions').doc(sessionId).collection('proposals');
  const parts = ['vo', 'gt', 'ba', 'dr', 'kb', 'oth'];

  for (let i = 2; i < 11; i++) {
    const proposal = {
      sessionId: sessionId,
      proposerUid: `dummy_user_${i}`,
      title: `Dummy Title ${i}`,
      artist: `Dummy Artist ${i}`,
      instrumentation: 'Vo, Gt, Ba, Dr',
      myPart: parts[i % parts.length],
      sourceUrl: 'https://example.com/source',
      scoreUrl: 'https://example.com/score',
      notes: `Dummy notes for proposal ${i}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await collectionRef.add(proposal);
    console.log(`Created proposal ${i}`);
  }
};

createProposals()
  .then(() => {
    console.log('Successfully created 10 dummy proposals.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error creating dummy proposals:', error);
    process.exit(1);
  });
