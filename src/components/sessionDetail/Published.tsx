import { useMemo, useState, type SyntheticEvent } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab
} from '@mui/material'
import useSWR from 'swr'
import { getProposalsFetcher, getProposalsKey } from '../../swr/proposalApi'
import { getEntriesFetcher, getEntriesKey } from '../../swr/entryApi'
import type { Session } from "../../models/session";
import { type InstrumentalPart, PARTS } from "../../models/instrumentalPart";

const TABS: (InstrumentalPart | 'detail')[] = ['detail', ...PARTS]

export default function Published({ session }: { session: Session }) {
  const { data: proposals = [] } = useSWR(getProposalsKey(session.id), getProposalsFetcher)
  const { data: entries = [] } = useSWR(getEntriesKey(session.id), getEntriesFetcher)
  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = (_: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const consideredProposals = useMemo(() => {
    return proposals
      .filter(p => session.selectedProposals?.includes(p.docId))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [proposals, session])

  return (
    <>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          決定した曲
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab key="detail" label="詳細" />
            {PARTS.map((part) => (
              <Tab key={part} label={part.toUpperCase()}/>
            ))}
          </Tabs>
        </Box>
        <TableContainer component={Paper}>
          <Table aria-label="published songs table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '30%' }}>曲 / アーティスト</TableCell>
                <TableCell>表示中: {TABS[activeTab] === 'detail' ? '詳細' : TABS[activeTab].toUpperCase()}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {consideredProposals.map((p) => {
                const songEntries = entries.filter((e) => e.songId === p.docId)

                return (
                  <TableRow key={p.docId}>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {p.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {p.artist}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {activeTab === 0 && (
                          <Box>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" display="block" color="text.secondary">YouTubeなど</Typography>
                              {p.sourceUrl ? (
                                <Typography variant="body2" component="a" href={p.sourceUrl} target="_blank" rel="noopener noreferrer">
                                  {p.sourceUrl}
                                </Typography>
                              ) : '-'}
                            </Box>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" display="block" color="text.secondary">スコア</Typography>
                              {p.scoreUrl ? (
                                <Typography variant="body2" component="a" href={p.scoreUrl} target="_blank" rel="noopener noreferrer">
                                  {p.scoreUrl}
                                </Typography>
                              ) : '-'}
                            </Box>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" display="block" color="text.secondary">その他</Typography>
                              <Typography variant="body2">{p.notes || '-'}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" display="block" color="text.secondary">提案者</Typography>
                              <Typography variant="body2">{p.proposerUid}</Typography>
                            </Box>
                          </Box>
                        )}
                        {activeTab > 0 && (
                          <Box>
                            {(() => {
                              const part = TABS[activeTab] as InstrumentalPart
                              const partEntries = songEntries.filter(e => e.part === part)
                              // 提案者がそのパートの場合も表示（提出曲のmyPart）
                              const isProposerPart = p.myPart === part

                              if (partEntries.length === 0 && !isProposerPart) {
                                return <Typography variant="body2" color="text.secondary">エントリーなし</Typography>
                              }

                              return (
                                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                  {partEntries.map(e => (
                                    <Typography component="li" key={e.docId} variant="body2">
                                      {e.memberUid}
                                    </Typography>
                                  ))}
                                  {isProposerPart && (
                                    <Typography component="li" variant="body2">
                                      {p.proposerUid} (提案者)
                                    </Typography>
                                  )}
                                </Box>
                              )
                            })()}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  )
}
