import { useMemo, useState } from 'react'
import { callCreateProposal, callDeleteProposal, callUpdateProposal } from '../../firebase.ts'
import type { Proposal } from '../../models/proposal.ts'
import type { InstrumentalPart } from '../../models/instrumentalPart.ts'
import { Box, Backdrop, Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import { useAuth } from '../../auth.tsx'
import useSWR, { useSWRConfig } from 'swr'
import { getProposalsFetcher, getProposalsKey } from '../../swr/proposalApi.ts'
import type {Session} from "../../models/session.ts";

export default function CollectingSongs({ session }: { session: Session }) {
  const { mutate } = useSWRConfig()
  const { data: proposals = [] } = useSWR(getProposalsKey(session.id), getProposalsFetcher)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [instrumentation, setInstrumentation] = useState('')
  const [myPart, setMyPart] = useState<InstrumentalPart>('vo')
  const [sourceUrl, setSourceUrl] = useState('')
  const [scoreUrl, setScoreUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { firebaseUser: user } = useAuth()

  const myProposal = useMemo(() => proposals.find((p) => p.proposerUid === user?.uid), [proposals, user])

  const canPropose = !myProposal || !!editingProposalId

  const submitProposal = async () => {
    if (!user) return
    setSubmitting(true)
    try {
      if (editingProposalId) {
        // Edit mode: update existing
        await callUpdateProposal({
          sessionId: session.id,
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
          sessionId: session.id,
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
      mutate(getProposalsKey(session.id))
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
    if (!window.confirm('この提案を削除してもよろしいですか？')) return
    try {
      await callDeleteProposal({ sessionId: session.id, proposalId })
      // refresh
      mutate(getProposalsKey(session.id))
    } catch (e: any) {
      console.error(e)
      alert('エラーが発生しました: ' + e.message)
    }
  }

  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={submitting}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

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
        <Typography variant="h5">
          提出された曲
        </Typography>
        <Box>
          {proposals.map((p) => {
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
    </>
  )
}
