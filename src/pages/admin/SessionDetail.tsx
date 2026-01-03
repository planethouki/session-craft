import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { adminUpdateSessionProposals } from '../../firebase.ts'
import type { Proposal } from '../../models/proposal.ts'
import { Box, Backdrop, Button, Checkbox, CircularProgress, Container, IconButton, Typography } from '@mui/material'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import useSWR, { useSWRConfig } from 'swr'
import { getSessionFetcher, getSessionKey } from '../../swr/adminSessionApi'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableProposalItem({
  p,
  isEditingSetlist,
  isSelected,
  alreadyInSetlist,
  isFirst,
  isLast,
  handleToggleProposal,
  handleMoveUp,
  handleMoveDown,
  getEntries,
}: {
  p: Proposal
  isEditingSetlist: boolean
  isSelected: boolean
  alreadyInSetlist?: boolean
  isFirst: boolean
  isLast: boolean
  handleToggleProposal: (id: string) => void
  handleMoveUp: (id: string) => void
  handleMoveDown: (id: string) => void
  getEntries: (p: Proposal) => { songId: string, part: string, userId: string }[]
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: p.docId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1, bgcolor: 'background.paper' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {isEditingSetlist && (
          <>
            <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab', mr: 1, touchAction: 'none' }}>
              <DragIndicatorIcon />
            </IconButton>
            <Box sx={{ display: 'flex', flexDirection: 'column', mr: 1 }}>
              <IconButton
                size="small"
                onClick={() => handleMoveUp(p.docId)}
                disabled={isFirst}
                sx={{ p: 0 }}
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleMoveDown(p.docId)}
                disabled={isLast}
                sx={{ p: 0 }}
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Box>
            <Checkbox
              checked={isSelected}
              onChange={() => handleToggleProposal(p.docId)}
              sx={{ ml: -1 }}
            />
          </>
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
          <Typography variant="body1" sx={{ mr: 1, fontWeight: 'bold' }} key={i}>
            {e.userId} / {e.part}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default function AdminSessionDetail() {
  const { id } = useParams()
  const { mutate } = useSWRConfig()
  const { data: session } = useSWR(getSessionKey(id), getSessionFetcher)
  const [submitting, setSubmitting] = useState(false)
  const [isEditingSetlist, setIsEditingSetlist] = useState(false)
  const [selectedProposalIds, setSelectedProposalIds] = useState<string[]>([])
  const [orderedProposals, setOrderedProposals] = useState<Proposal[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const sortedProposals = useMemo(() => {
    if (!session) return []
    return [...session.proposals].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order
      if (a.order !== undefined) return -1
      if (b.order !== undefined) return 1
      return 0
    })
  }, [session])

  useEffect(() => {
    if (session) {
      setSelectedProposalIds(session.selectedProposals || [])
      setOrderedProposals(sortedProposals)
    }
  }, [session, sortedProposals])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setOrderedProposals((items) => {
        const oldIndex = items.findIndex((i) => i.docId === active.id)
        const newIndex = items.findIndex((i) => i.docId === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleToggleProposal = (proposalId: string) => {
    setSelectedProposalIds(prev =>
      prev.includes(proposalId)
        ? prev.filter(id => id !== proposalId)
        : [...prev, proposalId]
    )
  }

  const handleMoveUp = (proposalId: string) => {
    setOrderedProposals((items) => {
      const index = items.findIndex((i) => i.docId === proposalId)
      if (index > 0) {
        return arrayMove(items, index, index - 1)
      }
      return items
    })
  }

  const handleMoveDown = (proposalId: string) => {
    setOrderedProposals((items) => {
      const index = items.findIndex((i) => i.docId === proposalId)
      if (index < items.length - 1) {
        return arrayMove(items, index, index + 1)
      }
      return items
    })
  }

  const handleSaveSetlist = async () => {
    if (!id) return
    setSubmitting(true)
    try {
      const proposalOrders = orderedProposals.map((p, index) => ({
        proposalId: p.docId,
        order: index + 1
      }))
      await adminUpdateSessionProposals({
        sessionId: id,
        selectedProposalIds,
        proposalOrders
      })
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

          {session.status === 'selecting' && (
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
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="h5">提出された曲</Typography>
            <Box>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedProposals.map(p => p.docId)}
                  strategy={verticalListSortingStrategy}
                >
                  {orderedProposals.map((p, index) => {
                    const isSelected = selectedProposalIds.includes(p.docId)
                    const alreadyInSetlist = session.selectedProposals?.includes(p.docId)

                    return (
                      <SortableProposalItem
                        key={p.docId}
                        p={p}
                        isEditingSetlist={isEditingSetlist}
                        isSelected={isSelected}
                        alreadyInSetlist={alreadyInSetlist}
                        isFirst={index === 0}
                        isLast={index === orderedProposals.length - 1}
                        handleToggleProposal={handleToggleProposal}
                        handleMoveUp={handleMoveUp}
                        handleMoveDown={handleMoveDown}
                        getEntries={getEntries}
                      />
                    )
                  })}
                </SortableContext>
              </DndContext>
            </Box>
          </Box>
        </>
      ) : (
        <Typography>読み込み中...</Typography>
      )}
    </Container>
  )
}
