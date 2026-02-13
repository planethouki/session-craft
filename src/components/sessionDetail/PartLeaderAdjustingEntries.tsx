import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { useAuth } from '../../auth.tsx'
import useSWR from 'swr'
import { getProposalsFetcher, getProposalsKey } from '../../swr/proposalApi.ts'
import { getEntriesFetcher, getEntriesKey } from '../../swr/entryApi.ts'
import type {Session} from "../../models/session.ts";

export default function PartLeaderAdjustingEntries({ session }: { session: Session }) {
  const { data: proposals = [] } = useSWR(getProposalsKey(session.id), getProposalsFetcher)
  const { data: entries = [] } = useSWR(getEntriesKey(session.id), getEntriesFetcher)
  const { firebaseUser, firestoreUser } = useAuth()

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
            const leaderPartsEntries = songEntries.filter((e) => firestoreUser?.leaderParts.includes(e.part))
            const otherEntries = songEntries.filter((e) => !firestoreUser?.leaderParts.includes(e.part))
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
                  <Typography component="ul" variant="body2" sx={{ mr: 1, fontWeight: 'bold' }}>
                    {leaderPartsEntries.map(e => <li>{e.part.toUpperCase()} で {e.memberUid} がエントリー中</li>)}
                    {otherEntries.map(e => <li>{e.part.toUpperCase()} で {e.memberUid} がエントリー中</li>)}
                    {p.proposerUid === firebaseUser?.uid && <li>{p.myPart.toUpperCase()} でエントリー中（提出曲）</li>}
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
