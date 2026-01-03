import {Link, useParams} from 'react-router'
import useSWR from "swr";
import {getSessionFetcher, getSessionKey} from "../swr/sessionApi";
import Draft from "../components/sessionDetail/Draft";
import {Box, Button, Container, Typography} from "@mui/material";
import CollectingSongs from "../components/sessionDetail/CollectingSongs";
import CollectingEntries from "../components/sessionDetail/CollectingEntries";
import Selecting from "../components/sessionDetail/Selecting";
import Published from "../components/sessionDetail/Published";

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

      {session.status === 'draft' && <Draft />}

      {session.status === 'collectingSongs' && <CollectingSongs session={session} />}

      {session.status === 'collectingEntries' && <CollectingEntries session={session} />}

      {session.status === 'selecting' && <Selecting session={session} />}

      {session.status === 'adjustingEntries' && <Published session={session} />}

      {session.status === 'published' && <Published session={session} />}
    </Container>
  )
}
