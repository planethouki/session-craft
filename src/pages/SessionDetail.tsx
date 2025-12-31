import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore'
import { db, callCreateProposal } from '../firebase.ts'
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
  const [instrumentation, setInstrumentation] = useState('')
  const [myInstrument, setMyInstrument] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [scoreUrl, setScoreUrl] = useState('')
  const [notes, setNotes] = useState('')
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
    try {
      await callCreateProposal({
        sessionId: id,
        title: title.trim(),
        artist: artist.trim(),
        instrumentation: instrumentation.trim(),
        myInstrument: myInstrument.trim(),
        sourceUrl: sourceUrl.trim(),
        scoreUrl: scoreUrl.trim(),
        notes: notes.trim(),
      })
      setTitle('')
      setArtist('')
      setInstrumentation('')
      setMyInstrument('')
      setSourceUrl('')
      setScoreUrl('')
      setNotes('')
      // refresh
      const pSnap = await getDocs(query(collection(db, 'sessions', id, 'proposals'), orderBy('createdAt', 'asc')))
      setProposals(pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    } catch (e: any) {
      console.error(e)
      alert('エラーが発生しました: ' + e.message)
    }
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
              <TextField label="楽器編成" fullWidth sx={{ mt: 1 }} value={instrumentation} onChange={(e) => setInstrumentation(e.target.value)} />
              <TextField label="自分の楽器" fullWidth sx={{ mt: 1 }} value={myInstrument} onChange={(e) => setMyInstrument(e.target.value)} />
              <TextField label="音源URL" fullWidth sx={{ mt: 1 }} value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
              <TextField label="スコアURL" fullWidth sx={{ mt: 1 }} value={scoreUrl} onChange={(e) => setScoreUrl(e.target.value)} />
              <TextField label="その他備考" fullWidth sx={{ mt: 1 }} value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={3} />
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={submitProposal}
                disabled={!title.trim() || !artist.trim() || !instrumentation.trim() || !myInstrument.trim() || !sourceUrl.trim() || !scoreUrl.trim()}
              >
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
