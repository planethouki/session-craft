import { useEffect, useState } from 'react'
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase.ts'
import type { Session } from '../types.ts'
import { Button, Container, Typography } from '@mui/material'
import { Link } from 'react-router'

export default function Home() {
  const [latest, setLatest] = useState<Session | null>(null)

  useEffect(() => {
    const run = async () => {
      const q = query(collection(db, 'sessions'), orderBy('date', 'desc'), limit(1))
      const snap = await getDocs(q)
      const doc0 = snap.docs[0]
      if (doc0) setLatest({ id: doc0.id, ...(doc0.data() as any) })
    }
    run().catch(console.error)
  }, [])

  return (
    <Container sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        ホーム
      </Typography>
      {latest ? (
        <div>
          <Typography variant="h6">{latest.title}</Typography>
          <Typography color="text.secondary">{latest.date}</Typography>
          <Typography sx={{ mt: 1 }}>状態: {latest.status}</Typography>
          <Button component={Link} to={`/sessions/${latest.id}`} variant="contained" sx={{ mt: 2 }}>
            詳細を見る
          </Button>
        </div>
      ) : (
        <Typography>セッションがまだありません。</Typography>
      )}
    </Container>
  )
}
