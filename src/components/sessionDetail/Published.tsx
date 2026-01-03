import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { useAuth } from '../../auth.tsx'
import useSWR from 'swr'
import { getProposalsFetcher, getProposalsKey } from '../../swr/proposalApi.ts'
import { getEntriesFetcher, getEntriesKey } from '../../swr/entryApi.ts'
import type {Session} from "../../models/session.ts";

export default function Published({ session }: { session: Session }) {
  const { data: proposals = [] } = useSWR(getProposalsKey(session.id), getProposalsFetcher)
  const { data: entries = [] } = useSWR(getEntriesKey(session.id), getEntriesFetcher)
  const { firebaseUser: user } = useAuth()

  const consideredProposals = useMemo(() => {
    return proposals
      .filter(p => session.selectedProposals?.includes(p.docId))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [proposals, session])

  return (
    <>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h5">
          決定した曲
        </Typography>
        <Box>
          {consideredProposals.map((p) => {
            const songEntries = entries.filter((e) => e.songId === p.docId)
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
                  <Typography variant="body2" sx={{ mr: 1, fontWeight: 'bold' }}>
                    {songEntries.map(e => `${e.part.toUpperCase()} で ${e.memberUid} がエントリー中`)}
                    {p.proposerUid === user?.uid && `${p.myPart.toUpperCase()} でエントリー中（提出曲）`}
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>
    </>
  )
}
