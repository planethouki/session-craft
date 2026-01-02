import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { callCreateProposal, callDeleteProposal, callUpdateProposal, callCreateEntries } from '../../firebase.ts'
import type { Entry } from '../../models/entry'
import type { Proposal } from '../../models/proposal.ts'
import { Box, Backdrop, Button, Checkbox, CircularProgress, Container, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import useSWR, { useSWRConfig } from 'swr'
import { getSessionFetcher, getSessionKey } from '../../swr/sessionApi'
import { getProposalsFetcher, getProposalsKey } from '../../swr/proposalApi'
import { getMyEntriesFetcher, getMyEntriesKey } from '../../swr/entryApi'

export default function AdminSessionDetail() {
  const { id } = useParams()
  const { mutate } = useSWRConfig()
  const { data: session } = useSWR(getSessionKey(id), getSessionFetcher)
  const { data: proposals = [] } = useSWR(getProposalsKey(id), getProposalsFetcher)
  const { data: entries = [] } = useSWR(getMyEntriesKey(id), getMyEntriesFetcher)
  const [submitting, setSubmitting] = useState(false)

  const getEntries = (proposal: Proposal) => {
    const songEntries = entries
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
  }

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

          <Box sx={{ mt: 3 }}>
            <Typography variant="h5">提出された曲</Typography>
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
