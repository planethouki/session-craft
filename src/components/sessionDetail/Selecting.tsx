import { Box, Typography } from '@mui/material'
import { useAuth } from '../../auth.tsx'
import useSWR from 'swr'
import { getProposalsFetcher, getProposalsKey } from '../../swr/proposalApi.ts'
import { getMyEntriesFetcher, getMyEntriesKey } from '../../swr/entryApi.ts'
import type {Session} from "../../models/session.ts";

export default function Selecting({ session }: { session: Session }) {
  const { data: proposals = [] } = useSWR(getProposalsKey(session.id), getProposalsFetcher)
  const { data: entries = [] } = useSWR(getMyEntriesKey(session.id), getMyEntriesFetcher)
  const { firebaseUser: user } = useAuth()

  return (
    <>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h5">
          提出された曲
        </Typography>
        <Box>
          {proposals.map((p) => {
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
                  <Typography variant="body2" sx={{ mr: 1, fontWeight: 'bold' }}>
                    {savedEntry && `${savedEntry?.part.toUpperCase()} でエントリー中`}
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
