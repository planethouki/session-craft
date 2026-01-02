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

const roles = ['admin', 'partLeader', 'member'];

const createDummyUsers = async () => {
  const usersRef = db.collection('users');

  for (let i = 1; i <= 10; i++) {
    const docId = `dummy_user_${i}`;
    const now = new Date();

    const userData = {
      approved: true,
      displayName: `Dummy User ${i}`,
      photoURL: `https://picsum.photos/id/${i}/100/100`,
      roles: ['member'],
      createdAt: admin.firestore.Timestamp.fromDate(now),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    };

    if (userData.approved) {
      userData.approvedAt = admin.firestore.Timestamp.fromDate(now);
    }

    await usersRef.doc(docId).set(userData);
    console.log(`Created user: ${docId}`);
  }
};

createDummyUsers()
  .then(() => {
    console.log('Successfully created 10 dummy users.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error creating dummy users:', error);
    process.exit(1);
  });
