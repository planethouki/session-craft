import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase.ts'
import type { Session } from '../../models/session.ts'
import { Container, List, ListItemButton, ListItemText, Typography } from '@mui/material'
import { Link } from 'react-router'

export default function AdminSessionList() {
  const [items, setItems] = useState<Session[]>([])

  useEffect(() => {
    const run = async () => {
      const q = query(collection(db, 'sessions'), orderBy('date', 'desc'))
      const snap = await getDocs(q)
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    }
    run().catch(console.error)
  }, [])

  return (
    <Container sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        セッション一覧
      </Typography>
      <List>
        {items.map((s) => (
          <ListItemButton key={s.id} component={Link} to={`/admin/sessions/${s.id}`}>
            <ListItemText primary={s.title} secondary={`${s.date} / 状態: ${s.status}`} />
          </ListItemButton>
        ))}
      </List>
    </Container>
  )
}
