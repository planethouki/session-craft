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

export function pickRandomN(arr, n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError("n must be a non-negative integer");
  }
  if (n > arr.length) {
    throw new RangeError("n must be <= arr.length");
  }

  // Fisher–Yates の部分シャッフル（先頭 n 個だけ確定させる）
  const a = arr.slice();
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

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



const createSubmission = async () => {
  const sessionId = '2026-02'

  const usersRef = db.collection('users');
  const submissionsRef = db.collection('submissions');
  const entriesRef = db.collection('entries');
  const parts = ['Vo', 'Cho', 'Gt', 'Gt2', 'Ba', 'Dr', 'Key', 'Other'];

  const usersQuery = await usersRef.get()
  const users = usersQuery.docs
    .map(doc => {
      return {
        uid: doc.id,
        ...doc.data()
      }
    })
    .filter(user => user.uid.startsWith('test'))

  for (let i = 1; i <= users.length; i++) {
    const user = users[i - 1];
    const submission = {
      sessionId,
      userId: user.uid,
      title: `Dummy Title ${i}`,
      artist: `Dummy Artist ${i}`,
      parts: pickRandomN(parts, getRandomInt(4, 6)),
      myParts: pickRandomN(parts, getRandomInt(1, 2)),
      audioUrl: 'https://example.com/source',
      scoreUrl: 'https://example.com/score',
      referenceUrl1: 'https://example.com/reference1',
      referenceUrl2: 'https://example.com/reference2',
      referenceUrl3: 'https://example.com/reference3',
      referenceUrl4: 'https://example.com/reference4',
      referenceUrl5: 'https://example.com/reference5',
      description: `Dummy description for submission ${i}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await submissionsRef
      .doc(`${sessionId}-${user.uid}`)
      .set(submission);

    await entriesRef.doc(`${sessionId}-${user.uid}-${user.uid}`).set({
      sessionId: sessionId,
      submissionUserId: user.uid,
      parts: pickRandomN(parts, getRandomInt(1, 2)),
      userId: user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    for (const u of users) {
      await entriesRef.doc(`${sessionId}-${user.uid}-${u.uid}`).delete()
    }

    const jn = getRandomInt(3, 7);
    for (let j = 0; j < jn; j++) {
      const entryUser = pickRandomN(users, 1)[0];
      const entry = {
        sessionId: sessionId,
        submissionUserId: user.uid,
        parts: pickRandomN(parts, getRandomInt(1, 2)),
        userId: entryUser.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await entriesRef.doc(`${sessionId}-${user.uid}-${entryUser.uid}`).set(entry);
    }
  }

};

createSubmission()
  .then(() => {
    console.log('Successfully created submission.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error creating submission:', error);
    process.exit(1);
  });
