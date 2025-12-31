import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase.ts'
import type { Entry, Session, SongProposal } from '../types.ts'
import { Box, Button, Container, List, ListItem, ListItemText, TextField, Typography } from '@mui/material'
import { useAuth } from '../auth.tsx'

export default function SessionDetail() {
  const { id } = useParams()
  const [session, setSession] = useState<Session | null>(null)
  const [proposals, setProposals] = useState<SongProposal[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const { firebaseUser: user } = useAuth()

  useEffect(() => {
    if (!id) return
    const run = async () => {
      const sDoc = await getDoc(doc(db, 'sessions', id))
      if (sDoc.exists()) setSession({ id: sDoc.id, ...(sDoc.data() as any) })

      const pSnap = await getDocs(query(collection(db, 'sessions', id, 'proposals'), orderBy('createdAt', 'asc')))
      setProposals(pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))

      const eSnap = await getDocs(query(collection(db, 'sessions', id, 'entries'), orderBy('createdAt', 'asc')))
      setEntries(eSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    }
    run().catch(console.error)
  }, [id])

  const myProposal = useMemo(() => proposals.find((p) => p.proposerUid === user?.uid), [proposals, user])

  const canPropose = session?.status === 'collectingSongs' && !myProposal

  const submitProposal = async () => {
    if (!id || !user) return
    await addDoc(collection(db, 'sessions', id, 'proposals'), {
      sessionId: id,
      proposerUid: user.uid,
      title: title.trim(),
      artist: artist.trim(),
      createdAt: serverTimestamp(),
    } satisfies Omit<SongProposal, 'id'>)
    setTitle('')
    setArtist('')
    // refresh
    const pSnap = await getDocs(query(collection(db, 'sessions', id, 'proposals'), orderBy('createdAt', 'asc')))
    setProposals(pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
  }

  return (
    <Container sx={{ p: 2 }}>
      {session ? (
        <>
          <Typography variant="h5" gutterBottom>
            {session.title}
          </Typography>
          <Typography color="text.secondary">{session.date} / 状態: {session.status}</Typography>

          {canPropose && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">やりたい曲を提出</Typography>
              <TextField label="曲名" fullWidth sx={{ mt: 1 }} value={title} onChange={(e) => setTitle(e.target.value)} />
              <TextField label="アーティスト" fullWidth sx={{ mt: 1 }} value={artist} onChange={(e) => setArtist(e.target.value)} />
              <Button variant="contained" sx={{ mt: 1 }} onClick={submitProposal} disabled={!title.trim() || !artist.trim()}>
                提出
              </Button>
            </Box>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">提出された曲</Typography>
            <List>
              {proposals.map((p) => (
                <ListItem key={p.id} disableGutters>
                  <ListItemText primary={`${p.title} / ${p.artist}`} secondary={`by ${p.proposerUid}`} />
                </ListItem>
              ))}
            </List>
          </Box>
        </>
      ) : (
        <Typography>読み込み中...</Typography>
      )}
    </Container>
  )
}
