import { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router'
import { adminUpdateSelectedProposals } from '../../firebase.ts'
import type { Proposal } from '../../models/proposal.ts'
import { Box, Backdrop, Button, Checkbox, CircularProgress, Container, Typography } from '@mui/material'
import useSWR, { useSWRConfig } from 'swr'
import { getSessionFetcher, getSessionKey } from '../../swr/adminSessionApi'

export default function AdminSessionDetail() {
  const { id } = useParams()
  const { mutate } = useSWRConfig()
  const { data: session } = useSWR(getSessionKey(id), getSessionFetcher)
  const [submitting, setSubmitting] = useState(false)
  const [isEditingSetlist, setIsEditingSetlist] = useState(false)
  const [selectedProposalIds, setSelectedProposalIds] = useState<string[]>([])

  useEffect(() => {
    if (session?.selectedProposals) {
      setSelectedProposalIds(session.selectedProposals)
    }
  }, [session])

  const handleToggleProposal = (proposalId: string) => {
    setSelectedProposalIds(prev =>
      prev.includes(proposalId)
        ? prev.filter(id => id !== proposalId)
        : [...prev, proposalId]
    )
  }

  const handleSaveSetlist = async () => {
    if (!id) return
    setSubmitting(true)
    try {
      await adminUpdateSelectedProposals({ sessionId: id, proposalIds: selectedProposalIds })
      await mutate(getSessionKey(id))
      setIsEditingSetlist(false)
    } catch (e) {
      console.error(e)
      alert('保存に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const getEntries = useCallback((proposal: Proposal) => {
    if (!session) return []

    const songEntries = session.entries
      .filter(e => e.songId === proposal.docId)
      .map(e => ({ songId: e.songId, part: e.part, userId: e.memberUid }))
    const proposerEntry = {
      songId: proposal.docId,
      part: proposal.myPart,
      userId: proposal.proposerUid,
    }
    return [
      proposerEntry,
      ...songEntries,
    ]
  }, [session])

  if (!session) return null

  return (
    <Container sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Button component={Link} to="/admin/sessions" variant="outlined" size="small">
          戻る
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

          <Box sx={{ mt: 2 }}>
            {!isEditingSetlist ? (
              <Button variant="contained" onClick={() => setIsEditingSetlist(true)}>
                セットリストを決める
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" color="primary" onClick={handleSaveSetlist}>
                  決定
                </Button>
                <Button variant="outlined" onClick={() => {
                  setIsEditingSetlist(false)
                  setSelectedProposalIds(session.selectedProposals || [])
                }}>
                  キャンセル
                </Button>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h5">提出された曲</Typography>
            <Box>
              {session.proposals.map((p) => {
                const isSelected = selectedProposalIds.includes(p.docId)
                const alreadyInSetlist = session.selectedProposals?.includes(p.docId)

                return (
                  <Box
                    key={p.docId}
                    sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {isEditingSetlist && (
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleProposal(p.docId)}
                          sx={{ ml: -1 }}
                        />
                      )}
                      <Typography variant="h6">
                        {`${p.title} / ${p.artist}`}
                      </Typography>
                      {!isEditingSetlist && alreadyInSetlist && (
                        <Typography
                          variant="caption"
                          sx={{ ml: 2, px: 1, py: 0.5, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1 }}
                        >
                          セットリストに入っています
                        </Typography>
                      )}
                    </Box>
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
                      {getEntries(p).map((e, i) =>
                        <Typography  variant="body1" sx={{ mr: 1, fontWeight: 'bold' }} key={i}>
                          {e.userId} / {e.part}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Box>
        </>
      ) : (
        <Typography>読み込み中...</Typography>
      )}
    </Container>
  )
}
