import { useEffect, useState } from 'react'
import { callCreateEntries } from '../../firebase.ts'
import type { Entry } from '../../models/entry.ts'
import type { InstrumentalPart } from '../../models/instrumentalPart.ts'
import { Box, Backdrop, Button, Checkbox, CircularProgress, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material'
import { useAuth } from '../../auth.tsx'
import useSWR, { useSWRConfig } from 'swr'
import { getProposalsFetcher, getProposalsKey } from '../../swr/proposalApi.ts'
import { getMyEntriesFetcher, getMyEntriesKey } from '../../swr/entryApi.ts'
import type {Session} from "../../models/session.ts";

export default function CollectingEntries({ session }: { session: Session }) {
  const { mutate } = useSWRConfig()
  const { data: proposals = [] } = useSWR(getProposalsKey(session.id), getProposalsFetcher)
  const { data: entries = [] } = useSWR(getMyEntriesKey(session.id), getMyEntriesFetcher)
  const [submitting, setSubmitting] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<{ songId: string, part: InstrumentalPart, selected: boolean }[]>([])
  const [isEditingEntries, setIsEditingEntries] = useState(false)
  const { firebaseUser: user } = useAuth()

  useEffect(() => {
    const myEntries = entries
      .map(e => ({ songId: e.songId, part: e.part, selected: true }))

    setSelectedEntries(myEntries)
  }, [session, entries])

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
    if (!user) return
    setSubmitting(true)
    try {
      await callCreateEntries({
        sessionId: session.id,
        entries: selectedEntries.filter(e => e.selected),
      })
      alert('エントリーを保存しました')
      setIsEditingEntries(false)
      // refresh entries
      mutate(getMyEntriesKey(session.id))
    } catch (e: any) {
      console.error(e)
      alert('エラーが発生しました: ' + e.message)
    } finally {
      setSubmitting(false)
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

      <Box sx={{ mt: 3 }}>
        <Typography variant="h5">
          提出された曲
        </Typography>
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
                    <Typography variant="body2" sx={{ mr: 1, fontWeight: 'bold' }}>
                      {savedEntry && `${savedEntry?.part.toUpperCase()} でエントリー中`}
                      {p.proposerUid === user?.uid && `${p.myPart.toUpperCase()} でエントリー中（提出曲）`}
                    </Typography>
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
  )
}
