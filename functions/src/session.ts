import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

const db = admin.firestore()

export const createProposal = onCall<{
  sessionId: string
  title: string
  artist: string
  instrumentation: string
  myInstrument: string
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
      myInstrument,
      sourceUrl,
      scoreUrl,
      notes,
    } = request.data

    if (!sessionId || !title || !artist || !instrumentation || !myInstrument || !sourceUrl || !scoreUrl) {
      throw new HttpsError('invalid-argument', 'Missing required fields')
    }

    // Check if session exists and is in 'collectingSongs' status
    const sessionSnap = await db.collection('sessions').doc(sessionId).get()
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found')
    }
    const session = sessionSnap.data()
    if (session?.status !== 'collectingSongs') {
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
      myInstrument,
      sourceUrl,
      scoreUrl,
      notes: notes || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await db.collection('sessions').doc(sessionId).collection('proposals').add(proposal)

    return { id: docRef.id }
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

    // Check if session status is 'collectingSongs'
    const sessionSnap = await db.collection('sessions').doc(sessionId).get()
    const session = sessionSnap.data()
    if (session?.status !== 'collectingSongs') {
      throw new HttpsError('failed-precondition', 'Session is not in collecting songs status')
    }

    await proposalRef.delete()

    return { ok: true }
  }
)
