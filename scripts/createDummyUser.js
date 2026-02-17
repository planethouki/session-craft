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

const createDummyUsers = async () => {
  const usersRef = db.collection('users');

  for (let i = 1; i <= 20; i++) {
    const docId = `test${i}`;
    const now = admin.firestore.Timestamp.fromDate(new Date());

    const userData = {
      displayName: `test${i}`,
      entryDraft: {},
      photoURL: `https://picsum.photos/id/${i}/100/100`,
      profileUpdatedAt: now,
      state: 'IDLE',
      stateUpdatedAt: now,
      submissionDraft: {},
    };

    await usersRef.doc(docId).set(userData);
    console.log(`Created user: ${docId}`);
  }
};

createDummyUsers()
  .then(() => {
    console.log('Successfully created dummy users.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error creating dummy users:', error);
    process.exit(1);
  });
