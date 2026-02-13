import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase.ts'
import { Container, List, ListItemButton, ListItemText, Typography, Chip, Stack } from '@mui/material'
import { Link } from 'react-router'

export default function MemberList() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const run = async () => {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    }
    run().catch(console.error)
  }, [])

  return (
    <Container sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        会員一覧
      </Typography>
      <List>
        {items.map((u) => (
          <ListItemButton key={u.id} component={Link} to={`/admin/members/${u.id}`}>
            <ListItemText primary={u.displayName || u.id} secondary={u.email || u.id} />
            <Stack direction="row" spacing={1}>
              {!u.approved && <Chip label="未承認" color="warning" size="small" />}
              {(u.roles || []).map((r: string) => (
                <Chip key={r} label={r} size="small" />
              ))}
            </Stack>
          </ListItemButton>
        ))}
      </List>
    </Container>
  )
}
