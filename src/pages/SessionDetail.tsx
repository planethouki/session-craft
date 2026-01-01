import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db, callCreateProposal, callDeleteProposal, callUpdateProposal, callCreateEntries, callGetEntries } from '../firebase.ts'
import type { Entry } from '../models/entry'
import type { Proposal } from '../models/proposal.ts'
import type { InstrumentalPart } from '../models/instrumentalPart'
import { Box, Backdrop, Button, Checkbox, CircularProgress, Container, FormControl, InputLabel, List, ListItem, ListItemText, MenuItem, Select, TextField, Typography } from '@mui/material'
import { useAuth } from '../auth.tsx'
import useSWR from 'swr'
import { getSessionFetcher, getSessionKey } from '../swr/sessionApi'

export default function SessionDetail() {
  const { id } = useParams()
  const { data: session } = useSWR(getSessionKey(id), getSessionFetcher)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [instrumentation, setInstrumentation] = useState('')
  const [myInstrument, setMyInstrument] = useState<InstrumentalPart>('vo')
  const [sourceUrl, setSourceUrl] = useState('')
  const [scoreUrl, setScoreUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<{ songId: string, part: Entry['part'] }[]>([])
  const [isEditingEntries, setIsEditingEntries] = useState(false)
  const { firebaseUser: user } = useAuth()

  useEffect(() => {
    if (!id || !user) return
    const fetchMyEntries = async () => {
      try {
        const res = await callGetEntries({ sessionId: id })
        setSelectedEntries(res.data.entries)
      } catch (e) {
        console.error('Failed to fetch entries', e)
      }
    }
    if (session?.status === 'collectingEntries') {
      fetchMyEntries()
    }
  }, [id, user, session?.status])

  useEffect(() => {
    if (!id) return
    const run = async () => {
      const pSnap = await getDocs(query(collection(db, 'sessions', id, 'proposals'), orderBy('createdAt', 'asc')))
      const fetchedProposals = pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Proposal[]
      setProposals(fetchedProposals)

      const eSnap = await getDocs(query(collection(db, 'sessions', id, 'entries'), orderBy('createdAt', 'asc')))
      const fetchedEntries = eSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Entry[]
      setEntries(fetchedEntries)

      // Initialize selectedEntries with existing entries for this user
      if (user && session?.status !== 'collectingEntries') {
        const myEntries = fetchedEntries
          .filter(e => e.memberUid === user.uid)
          .map(e => ({ songId: e.songId, part: e.part }))

        // If it's empty and we have proposals, check if user has a proposal and add it automatically if session status is collectingEntries
        if (myEntries.length === 0 && session?.status === 'collectingEntries') {
          const myProp = fetchedProposals.find(p => p.proposerUid === user.uid)
          if (myProp && myProp.id) {
            // Need to map myInstrument to part?
            // Proposal.myInstrument is a string, Entry.part is 'vo' | 'gt' | 'ba' | 'dr' | 'kb' | 'oth'
            // For now, default to 'oth' or try to guess.
            myEntries.push({ songId: myProp.id, part: 'oth' })
          }
        }
        setSelectedEntries(myEntries)
      }
    }
    run().catch(console.error)
  }, [id, user, session?.status])

  const myProposal = useMemo(() => proposals.find((p) => p.proposerUid === user?.uid), [proposals, user])

  const canPropose = session?.status === 'collectingSongs' && (!myProposal || !!editingProposalId)

  const submitProposal = async () => {
    if (!id || !user) return
    setSubmitting(true)
    try {
      if (editingProposalId) {
        // Edit mode: update existing
        await callUpdateProposal({
          sessionId: id,
          proposalId: editingProposalId,
          title: title.trim(),
          artist: artist.trim(),
          instrumentation: instrumentation.trim(),
          myInstrument: myInstrument.trim(),
          sourceUrl: sourceUrl.trim(),
          scoreUrl: scoreUrl.trim(),
          notes: notes.trim(),
        })
      } else {
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
      }

      setTitle('')
      setArtist('')
      setInstrumentation('')
      setMyInstrument('vo')
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

  const startEdit = (p: Proposal) => {
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
    setMyInstrument('vo')
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

  const toggleEntry = (songId: string) => {
    setSelectedEntries((prev) => {
      const exists = prev.find((e) => e.songId === songId)
      if (exists) {
        return prev.filter((e) => e.songId !== songId)
      } else {
        return [...prev, { songId, part: 'oth' }]
      }
    })
  }

  const updateEntryPart = (songId: string, part: Entry['part']) => {
    setSelectedEntries((prev) =>
      prev.map((e) => (e.songId === songId ? { ...e, part } : e))
    )
  }

  const submitEntries = async () => {
    if (!id || !user) return
    setSubmitting(true)
    try {
      await callCreateEntries({
        sessionId: id,
        entries: selectedEntries,
      })
      alert('エントリーを保存しました')
      setIsEditingEntries(false)
      // refresh entries
      const eSnap = await getDocs(query(collection(db, 'sessions', id, 'entries'), orderBy('createdAt', 'asc')))
      setEntries(eSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    } catch (e: any) {
      console.error(e)
      alert('エラーが発生しました: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Button component={Link} to="/" variant="outlined" size="small">
          ホームに戻る
        </Button>
      </Box>
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
              <Typography variant="h6">{editingProposalId ? '提出した曲を修正' : 'やりたい曲を提出'}</Typography>
              <TextField label="曲名" fullWidth sx={{ mt: 1 }} value={title} onChange={(e) => setTitle(e.target.value)} />
              <TextField label="アーティスト" fullWidth sx={{ mt: 1 }} value={artist} onChange={(e) => setArtist(e.target.value)} />
              <TextField label="楽器編成" fullWidth sx={{ mt: 1 }} value={instrumentation} onChange={(e) => setInstrumentation(e.target.value)} />
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>自分の担当パート</InputLabel>
                <Select
                  value={myInstrument}
                  label="自分の担当パート"
                  onChange={(e) => setMyInstrument(e.target.value as InstrumentalPart)}
                >
                  <MenuItem value="vo">Vo</MenuItem>
                  <MenuItem value="gt">Gt</MenuItem>
                  <MenuItem value="ba">Ba</MenuItem>
                  <MenuItem value="dr">Dr</MenuItem>
                  <MenuItem value="kb">Kb</MenuItem>
                  <MenuItem value="oth">他</MenuItem>
                </Select>
              </FormControl>
              <TextField label="音源URL" fullWidth sx={{ mt: 1 }} value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
              <TextField label="スコアURL" fullWidth sx={{ mt: 1 }} value={scoreUrl} onChange={(e) => setScoreUrl(e.target.value)} />
              <TextField label="その他備考" fullWidth sx={{ mt: 1 }} value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={3} />
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={submitProposal}
                  disabled={submitting || !title.trim() || !artist.trim() || !instrumentation.trim() || !sourceUrl.trim() || !scoreUrl.trim()}
                >
                  {submitting ? '送信中...' : (editingProposalId ? '修正を提出' : '提出')}
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
              {proposals.map((p) => {
                const entry = selectedEntries.find((e) => e.songId === p.id)
                return (
                  <ListItem
                    key={p.id}
                    disableGutters
                    secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {session.status === 'collectingEntries' && p.id && (
                          <>
                            {isEditingEntries ? (
                              <>
                                <FormControl size="small" sx={{ minWidth: 80, mr: 1 }}>
                                  <InputLabel>パート</InputLabel>
                                  <Select
                                    value={entry?.part || 'oth'}
                                    label="パート"
                                    onChange={(e) => updateEntryPart(p.id!, e.target.value as Entry['part'])}
                                    disabled={!entry}
                                  >
                                    <MenuItem value="vo">Vo</MenuItem>
                                    <MenuItem value="gt">Gt</MenuItem>
                                    <MenuItem value="ba">Ba</MenuItem>
                                    <MenuItem value="dr">Dr</MenuItem>
                                    <MenuItem value="kb">Kb</MenuItem>
                                    <MenuItem value="oth">他</MenuItem>
                                  </Select>
                                </FormControl>
                                <Checkbox
                                  checked={!!entry}
                                  onChange={() => p.id && toggleEntry(p.id)}
                                />
                              </>
                            ) : (
                              entry && (
                                <Typography variant="body2" sx={{ mr: 1, fontWeight: 'bold' }}>
                                  {entry.part.toUpperCase()} でエントリー中
                                </Typography>
                              )
                            )}
                          </>
                        )}
                        {p.proposerUid === user?.uid && session.status === 'collectingSongs' && (
                          <Box>
                            <Button onClick={() => startEdit(p)}>
                              修正
                            </Button>
                            <Button color="error" onClick={() => p.id && deleteProposal(p.id)}>
                              削除
                            </Button>
                          </Box>
                        )}
                      </Box>
                    }
                  >
                    <ListItemText primary={`${p.title} / ${p.artist}`} secondary={`by ${p.proposerUid}`} />
                  </ListItem>
                )
              })}
            </List>
          </Box>

          {session.status === 'collectingEntries' && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
              {!isEditingEntries ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setIsEditingEntries(true)}
                >
                  {selectedEntries.length > 0 ? 'エントリーを編集する' : 'エントリーを開始する'}
                </Button>
              ) : (
                <>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={submitEntries}
                    disabled={submitting}
                  >
                    {entries.some(e => e.memberUid === user?.uid) ? '修正して提出' : '提出'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setIsEditingEntries(false)}
                    disabled={submitting}
                  >
                    キャンセル
                  </Button>
                </>
              )}
            </Box>
          )}
        </>
      ) : (
        <Typography>読み込み中...</Typography>
      )}
    </Container>
  )
}
