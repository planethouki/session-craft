import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore'
import { db, callCreateProposal, callDeleteProposal } from '../firebase.ts'
import type { Entry, Session, SongProposal } from '../types.ts'
import { Box, Backdrop, Button, CircularProgress, Container, List, ListItem, ListItemText, TextField, Typography } from '@mui/material'
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
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
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

  const canPropose = session?.status === 'collectingSongs' && (!myProposal || !!editingProposalId)

  const submitProposal = async () => {
    if (!id || !user) return
    setSubmitting(true)
    try {
      if (editingProposalId) {
        // Edit mode: delete existing then create new
        await callDeleteProposal({
          sessionId: id,
          proposalId: editingProposalId,
        })
      }

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
      setEditingProposalId(null)
      // refresh
      const pSnap = await getDocs(query(collection(db, 'sessions', id, 'proposals'), orderBy('createdAt', 'asc')))
      setProposals(pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    } catch (e: any) {
      console.error(e)
      alert('エラーが発生しました: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (p: SongProposal) => {
    if (!p.id) return
    setEditingProposalId(p.id)
    setTitle(p.title)
    setArtist(p.artist)
    setInstrumentation(p.instrumentation)
    setMyInstrument(p.myInstrument)
    setSourceUrl(p.sourceUrl)
    setScoreUrl(p.scoreUrl)
    setNotes(p.notes || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingProposalId(null)
    setTitle('')
    setArtist('')
    setInstrumentation('')
    setMyInstrument('')
    setSourceUrl('')
    setScoreUrl('')
    setNotes('')
  }

  const deleteProposal = async (proposalId: string) => {
    if (!id || !window.confirm('この提案を削除してもよろしいですか？')) return
    try {
      await callDeleteProposal({ sessionId: id, proposalId })
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
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={submitting}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {session ? (
        <>
          <Typography variant="h5" gutterBottom>
            {session.title}
          </Typography>
          <Typography color="text.secondary">{session.date} / 状態: {session.status}</Typography>

          {canPropose && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">{editingProposalId ? '変更して再提出' : 'やりたい曲を提出'}</Typography>
              <TextField label="曲名" fullWidth sx={{ mt: 1 }} value={title} onChange={(e) => setTitle(e.target.value)} />
              <TextField label="アーティスト" fullWidth sx={{ mt: 1 }} value={artist} onChange={(e) => setArtist(e.target.value)} />
              <TextField label="楽器編成" fullWidth sx={{ mt: 1 }} value={instrumentation} onChange={(e) => setInstrumentation(e.target.value)} />
              <TextField label="自分の楽器" fullWidth sx={{ mt: 1 }} value={myInstrument} onChange={(e) => setMyInstrument(e.target.value)} />
              <TextField label="音源URL" fullWidth sx={{ mt: 1 }} value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
              <TextField label="スコアURL" fullWidth sx={{ mt: 1 }} value={scoreUrl} onChange={(e) => setScoreUrl(e.target.value)} />
              <TextField label="その他備考" fullWidth sx={{ mt: 1 }} value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={3} />
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={submitProposal}
                  disabled={submitting || !title.trim() || !artist.trim() || !instrumentation.trim() || !myInstrument.trim() || !sourceUrl.trim() || !scoreUrl.trim()}
                >
                  {submitting ? '送信中...' : (editingProposalId ? '再提出' : '提出')}
                </Button>
                {editingProposalId && (
                  <Button variant="outlined" onClick={cancelEdit}>
                    キャンセル
                  </Button>
                )}
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">提出された曲</Typography>
            <List>
              {proposals.map((p) => (
                <ListItem
                  key={p.id}
                  disableGutters
                  secondaryAction={
                    p.proposerUid === user?.uid && session.status === 'collectingSongs' && (
                      <Box>
                        <Button onClick={() => startEdit(p)}>
                          変更して再提出
                        </Button>
                        <Button color="error" onClick={() => p.id && deleteProposal(p.id)}>
                          削除
                        </Button>
                      </Box>
                    )
                  }
                >
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
