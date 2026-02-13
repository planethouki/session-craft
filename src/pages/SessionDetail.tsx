import {Link, useParams} from 'react-router'
import useSWR from "swr";
import {getSessionFetcher, getSessionKey} from "../swr/sessionApi";
import Draft from "../components/sessionDetail/Draft";
import {Box, Button, Container, Typography} from "@mui/material";
import CollectingSongs from "../components/sessionDetail/CollectingSongs";
import CollectingEntries from "../components/sessionDetail/CollectingEntries";
import Selecting from "../components/sessionDetail/Selecting";
import Published from "../components/sessionDetail/Published";
import { SessionStatus } from "../models/session";

export default function SessionDetail() {
  const { id } = useParams()
  const { data: session } = useSWR(getSessionKey(id), getSessionFetcher)

  if (!session) return <div>Loading...</div>

  return (
    <Container sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Button component={Link} to="/" variant="outlined" size="small">
          ホームに戻る
        </Button>
      </Box>
      <Typography variant="h4" gutterBottom>
        {session.title}
      </Typography>
      <Typography color="text.secondary">{session.date} / 状態: {session.status}</Typography>

      {session.status === SessionStatus.DRAFT && <Draft />}

      {session.status === SessionStatus.COLLECTING_SONGS && <CollectingSongs session={session} />}

      {session.status === SessionStatus.COLLECTING_ENTRIES && <CollectingEntries session={session} />}

      {session.status === SessionStatus.SELECTING && <Selecting session={session} />}

      {session.status === SessionStatus.ADJUSTING_ENTRIES && <Published session={session} />}

      {session.status === SessionStatus.PUBLISHED && <Published session={session} />}
    </Container>
  )
}
