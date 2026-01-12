import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { checkUserApproved } from "./validations/user";
import { validateInstrument } from "./validations/instrument";
import { SessionStatus } from './types'

const db = admin.firestore()

export const createProposal = onCall<{
  sessionId: string
  title: string
  artist: string
  instrumentation: string
  myPart: string
  sourceUrl: string
  scoreUrl: string
  notes?: string
}, Promise<{ id: string }>>(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'User is not authenticated')
    }

    const {
      sessionId,
      title,
      artist,
      instrumentation,
      myPart,
      sourceUrl,
      scoreUrl,
      notes,
    } = request.data

    if (!sessionId || !title || !artist || !instrumentation || !myPart || !sourceUrl || !scoreUrl) {
      throw new HttpsError('invalid-argument', 'Missing required fields')
    }

    validateInstrument(myPart)
    await checkUserApproved(uid)

    // Check if session exists and is in SessionStatus.COLLECTING_SONGS status
    const sessionSnap = await db.collection('sessions').doc(sessionId).get()
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found')
    }
    const session = sessionSnap.data()
    if (session?.status !== SessionStatus.COLLECTING_SONGS) {
      throw new HttpsError('failed-precondition', 'Session is not collecting songs')
    }

    // Check if user already submitted a proposal for this session
    const existingSnap = await db.collection('sessions').doc(sessionId).collection('proposals')
      .where('proposerUid', '==', uid).limit(1).get()
    if (!existingSnap.empty) {
      throw new HttpsError('already-exists', 'User already submitted a proposal for this session')
    }

    const proposal = {
      sessionId,
      proposerUid: uid,
      title,
      artist,
      instrumentation,
      myPart,
      sourceUrl,
      scoreUrl,
      notes: notes || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const batch = db.batch()
    const proposalRef = db.collection('sessions').doc(sessionId).collection('proposals').doc()
    batch.set(proposalRef, proposal)

    const entry = {
      sessionId,
      songId: proposalRef.id,
      memberUid: uid,
      part: myPart,
      isSelfProposal: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const entryRef = db.collection('sessions').doc(sessionId).collection('entries').doc()
    batch.set(entryRef, entry)

    await batch.commit()

    return { id: proposalRef.id }
  }
)

export const deleteProposal = onCall<{
  sessionId: string
  proposalId: string
}, Promise<{ ok: boolean }>>(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'User is not authenticated')
    }

    const { sessionId, proposalId } = request.data

    if (!sessionId || !proposalId) {
      throw new HttpsError('invalid-argument', 'Missing required fields')
    }

    const proposalRef = db.collection('sessions').doc(sessionId).collection('proposals').doc(proposalId)
    const proposalSnap = await proposalRef.get()

    if (!proposalSnap.exists) {
      throw new HttpsError('not-found', 'Proposal not found')
    }

    const proposal = proposalSnap.data()
    if (proposal?.proposerUid !== uid) {
      throw new HttpsError('permission-denied', 'You can only delete your own proposal')
    }

    // Check if session status is SessionStatus.COLLECTING_SONGS
    const sessionSnap = await db.collection('sessions').doc(sessionId).get()
    const session = sessionSnap.data()
    if (session?.status !== SessionStatus.COLLECTING_SONGS) {
      throw new HttpsError('failed-precondition', 'Session is not in collecting songs status')
    }

    const batch = db.batch()
    batch.delete(proposalRef)

    const entriesRef = db.collection('sessions').doc(sessionId).collection('entries')
    const entrySnap = await entriesRef.where('songId', '==', proposalId).get()
    entrySnap.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    await batch.commit()

    return { ok: true }
  }
)

export const updateProposal = onCall<{
  sessionId: string
  proposalId: string
  title: string
  artist: string
  instrumentation: string
  myPart: string
  sourceUrl: string
  scoreUrl: string
  notes?: string
}, Promise<{ ok: boolean }>>(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'User is not authenticated')
    }

    const {
      sessionId,
      proposalId,
      title,
      artist,
      instrumentation,
      myPart,
      sourceUrl,
      scoreUrl,
      notes,
    } = request.data

    if (!sessionId || !proposalId || !title || !artist || !instrumentation || !myPart || !sourceUrl || !scoreUrl) {
      throw new HttpsError('invalid-argument', 'Missing required fields')
    }

    validateInstrument(myPart)
    await checkUserApproved(uid)

    const sessionSnap = await db.collection('sessions').doc(sessionId).get()
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found')
    }
    const session = sessionSnap.data()
    if (session?.status !== SessionStatus.COLLECTING_SONGS) {
      throw new HttpsError('failed-precondition', 'Session is not collecting songs')
    }

    const proposalRef = db.collection('sessions').doc(sessionId).collection('proposals').doc(proposalId)
    const proposalSnap = await proposalRef.get()

    if (!proposalSnap.exists) {
      throw new HttpsError('not-found', 'Proposal not found')
    }

    const proposal = proposalSnap.data()
    if (proposal?.proposerUid !== uid) {
      throw new HttpsError('permission-denied', 'You can only update your own proposal')
    }

    const batch = db.batch()
    batch.update(proposalRef, {
      title,
      artist,
      instrumentation,
      myPart,
      sourceUrl,
      scoreUrl,
      notes: notes || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    const entriesRef = db.collection('sessions').doc(sessionId).collection('entries')
    const entrySnap = await entriesRef
      .where('songId', '==', proposalId)
      .get()

    const filteredDocs = entrySnap.docs.filter(doc => {
      const data = doc.data()
      return data.memberUid === uid && data.isSelfProposal === true
    })

    // 既存のエントリーを削除
    filteredDocs.forEach(doc => {
      batch.delete(doc.ref)
    })

    // 新しくエントリーを作成
    const newEntryRef = entriesRef.doc()
    const newEntry = {
      sessionId,
      songId: proposalId,
      memberUid: uid,
      part: myPart,
      isSelfProposal: true,
      createdAt: proposal?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    batch.set(newEntryRef, newEntry)

    await batch.commit()

    return { ok: true }
  }
)

export const getProposals = onCall<{
  sessionId: string
}, Promise<{
  proposals: (any)[]
}>>(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'User is not authenticated')
    }

    const { sessionId } = request.data
    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'Missing sessionId')
    }

    const proposalsRef = db.collection('sessions').doc(sessionId).collection('proposals')
    const snapshot = await proposalsRef.orderBy('createdAt', 'asc').get()

    const proposals = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        docId: doc.id,
        ...data,
        createdAt: data.createdAt.toMillis(),
        updatedAt: data.updatedAt.toMillis(),
      }
    })

    return { proposals }
  }
)
