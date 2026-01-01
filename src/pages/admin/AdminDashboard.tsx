import { useState } from 'react'
import { Box, Button, Container, List, ListItemButton, ListItemText, TextField, Typography } from '@mui/material'
import { Link } from 'react-router'
import { adminCreateSession } from '../../firebase.ts'

export default function AdminDashboard() {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const createSession = async () => {
    setMessage(null)
    setSaving(true)
    try {
      await adminCreateSession({ title, date })
      setTitle('')
      setDate('')
      setMessage('作成しました。セッション一覧から確認できます。')
    } catch (e: any) {
      setMessage(e.message || String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        管理メニュー
      </Typography>
      <List>
        <ListItemButton component={Link} to="/admin/members">
          <ListItemText primary="会員一覧" />
        </ListItemButton>
        <ListItemButton component={Link} to="/admin/sessions">
          <ListItemText primary="セッション一覧" />
        </ListItemButton>
      </List>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6">新規セッションを作成</Typography>
        <TextField label="タイトル" fullWidth sx={{ mt: 1 }} value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="日付" type="date" fullWidth sx={{ mt: 1 }} value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant="contained" sx={{ mt: 1 }} onClick={createSession} disabled={!title.trim() || !date || saving}>
          作成
        </Button>
        {message && (
          <Typography sx={{ mt: 1 }} color="primary">
            {message}
          </Typography>
        )}
      </Box>
    </Container>
  )
}
