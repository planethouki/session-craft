import {Link, useParams} from 'react-router'
import useSWR from "swr";
import {getSessionFetcher, getSessionKey} from "../../swr/sessionApi";
import {Box, Button, Container, Typography} from "@mui/material";
import { SessionStatus } from "../../models/session";
import PartLeaderAdjustingEntries from "../../components/sessionDetail/PartLeaderAdjustingEntries";

export default function SessionDetail() {
  const { id } = useParams()
  const { data: session } = useSWR(getSessionKey(id), getSessionFetcher)

  if (!session) return <div>Loading...</div>

  return (
    <Container sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Button component={Link} to="/part_leader" variant="outlined" size="small">
          ホームに戻る
        </Button>
      </Box>
      <Typography variant="h4" gutterBottom>
        {session.title}
      </Typography>
      <Typography color="text.secondary">{session.date} / 状態: {session.status}</Typography>

      {session.status === SessionStatus.ADJUSTING_ENTRIES && <PartLeaderAdjustingEntries session={session} />}
    </Container>
  )
}
