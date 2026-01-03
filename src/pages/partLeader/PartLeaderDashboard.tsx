import { useEffect, useState } from 'react'
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase.ts'
import type { Session } from '../../models/session'
import { Button, Container, Typography } from '@mui/material'
import { Link } from 'react-router'

export default function PartLeaderDashboard() {
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    const run = async () => {
      const q = query(collection(db, 'sessions'), orderBy('date', 'desc'), limit(10))
      const snap = await getDocs(q)
      setSessions(snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })))
    }
    run().catch(console.error)
  }, [])

  return (
    <Container sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        ホーム
      </Typography>
      {sessions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {sessions.map((session) => (
            <div key={session.id}>
              <Typography variant="h6">{session.title}</Typography>
              <Typography color="text.secondary">{session.date}</Typography>
              <Typography sx={{ mt: 1 }}>状態: {session.status}</Typography>
              <Button component={Link} to={`/part_leader/sessions/${session.id}`} variant="contained" sx={{ mt: 2 }}>
                詳細を見る
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <Typography>セッションがまだありません。</Typography>
      )}
    </Container>
  )
}
