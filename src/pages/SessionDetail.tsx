import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { callCreateProposal, callDeleteProposal, callUpdateProposal, callCreateEntries } from '../firebase.ts'
import type { Entry } from '../models/entry'
import type { Proposal } from '../models/proposal.ts'
import type { InstrumentalPart } from '../models/instrumentalPart'
import { Box, Backdrop, Button, Checkbox, CircularProgress, Container, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import { useAuth } from '../auth.tsx'
import useSWR, { useSWRConfig } from 'swr'
import { getSessionFetcher, getSessionKey } from '../swr/sessionApi'
import { getProposalsFetcher, getProposalsKey } from '../swr/proposalApi'
import { getMyEntriesFetcher, getMyEntriesKey } from '../swr/entryApi'

export default function SessionDetail() {
  const { id } = useParams()
  const { mutate } = useSWRConfig()
  const { data: session } = useSWR(getSessionKey(id), getSessionFetcher)
  const { data: proposals = [] } = useSWR(getProposalsKey(id), getProposalsFetcher)
  const { data: entries = [] } = useSWR(getMyEntriesKey(id), getMyEntriesFetcher)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [instrumentation, setInstrumentation] = useState('')
  const [myPart, setMyPart] = useState<InstrumentalPart>('vo')
  const [sourceUrl, setSourceUrl] = useState('')
  const [scoreUrl, setScoreUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<{ songId: string, part: InstrumentalPart, selected: boolean }[]>([])
  const [isEditingEntries, setIsEditingEntries] = useState(false)
  const { firebaseUser: user } = useAuth()

  useEffect(() => {
    if (!id || !session) return

    // Initialize selectedEntries with existing entries for this user
    if (session.status === 'collectingEntries') {
      const myEntries = entries
        .map(e => ({ songId: e.songId, part: e.part, selected: true }))

      setSelectedEntries(myEntries)
    }
  }, [id, session, entries])

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
          myPart: myPart,
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
          myPart: myPart,
          sourceUrl: sourceUrl.trim(),
          scoreUrl: scoreUrl.trim(),
          notes: notes.trim(),
        })
      }

      setTitle('')
      setArtist('')
      setInstrumentation('')
      setMyPart('vo')
      setSourceUrl('')
      setScoreUrl('')
      setNotes('')
      setEditingProposalId(null)
      // refresh
      mutate(getProposalsKey(id))
    } catch (e: any) {
      console.error(e)
      alert('エラーが発生しました: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (p: Proposal) => {
    if (!p.docId) return
    setEditingProposalId(p.docId)
    setTitle(p.title)
    setArtist(p.artist)
    setInstrumentation(p.instrumentation)
    setMyPart(p.myPart)
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
    setMyPart('vo')
    setSourceUrl('')
    setScoreUrl('')
    setNotes('')
  }

  const deleteProposal = async (proposalId: string) => {
    if (!id || !window.confirm('この提案を削除してもよろしいですか？')) return
    try {
      await callDeleteProposal({ sessionId: id, proposalId })
      // refresh
      mutate(getProposalsKey(id))
    } catch (e: any) {
      console.error(e)
      alert('エラーが発生しました: ' + e.message)
    }
  }

  const toggleEntry = (songId: string) => {
    // 自分の提出した曲はエントリー解除できない
    const myProposal = proposals.find(p => p.docId === songId)
    if (myProposal?.proposerUid === user?.uid) return

    setSelectedEntries((prev) => {
      const exists = prev.find((e) => e.songId === songId)
      if (exists) {
        return prev.map((e) => (e.songId === songId ? {...e, selected: !e.selected} : e))
      } else {
        return [...prev, { songId, part: 'oth', selected: false }]
      }
    })
  }

  const updateEntryPart = (songId: string, part: InstrumentalPart) => {
    // 自分の提出した曲はパート変更できない
    const proposal = proposals.find(p => p.docId === songId)
    if (proposal?.proposerUid === user?.uid) {
      console.warn('自分の提出した曲はパート変更できない')
      return
    }

    setSelectedEntries((prev) => {
      const exists = prev.find((e) => e.songId === songId)
      if (exists) {
        return prev.map((e) => (e.songId === songId ? {...e, part} : e))
      } else {
        return [...prev, {songId, part, selected: false}]
      }
    })
  }

  const submitEntries = async () => {
    if (!id || !user) return
    setSubmitting(true)
    try {
      await callCreateEntries({
        sessionId: id,
        entries: selectedEntries.filter(e => e.selected),
      })
      alert('エントリーを保存しました')
      setIsEditingEntries(false)
      // refresh entries
      mutate(getMyEntriesKey(id))
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
          <Typography variant="h4" gutterBottom>
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
                  value={myPart}
                  label="自分の担当パート"
                  onChange={(e) => setMyPart(e.target.value as InstrumentalPart)}
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
            <Typography variant="h5">提出された曲</Typography>
            <Box>
              {proposals.map((p) => {
                const selectedEntry = selectedEntries.find((e) => e.songId === p.docId)
                const savedEntry = entries.find((e) => e.songId === p.docId)
                return (
                  <Box
                    key={p.docId}
                    sx={{ mb: 3 }}
                  >
                    <Typography variant="h6">
                      {`${p.title} / ${p.artist}`}
                    </Typography>
                    <Box>
                      {`パート / ${p.instrumentation}`}
                    </Box>
                    <Box>
                      {`YouTubeなど / ${p.sourceUrl}`}
                    </Box>
                    <Box>
                      {`スコア / ${p.scoreUrl}`}
                    </Box>
                    <Box>
                      {`その他 / ${p.notes}`}
                    </Box>
                    <Box>
                      {`by ${p.proposerUid}`}
                    </Box>
                    <Box>
                      {session.status === 'collectingEntries' && p.docId && (
                        <>
                          {(isEditingEntries && p.proposerUid !== user?.uid) ? (
                            <>
                              <FormControl size="small" sx={{ minWidth: 80, mr: 1 }}>
                                <InputLabel>パート</InputLabel>
                                <Select
                                  value={selectedEntry?.part || p.myPart || 'oth'}
                                  label="パート"
                                  onChange={(e) => updateEntryPart(p.docId, e.target.value as Entry['part'])}
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
                                checked={selectedEntry?.selected}
                                onChange={() => p.docId && toggleEntry(p.docId)}
                                disabled={p.proposerUid === user?.uid}
                              />
                            </>
                          ) : (
                            (savedEntry || p.proposerUid === user?.uid) && (
                              <Typography variant="body2" sx={{ mr: 1, fontWeight: 'bold' }}>
                                {(savedEntry?.part || p.myPart).toUpperCase()} でエントリー中{p.proposerUid === user?.uid ? '（提出曲）' : ''}
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
                          <Button color="error" onClick={() => p.docId && deleteProposal(p.docId)}>
                            削除
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )
              })}
            </Box>
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
