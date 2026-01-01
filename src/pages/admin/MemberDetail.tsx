import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../firebase.ts'
import { Box, Button, Checkbox, Container, FormControlLabel, Stack, Typography } from '@mui/material'

export default function MemberDetail() {
  const { uid } = useParams()
  const [user, setUser] = useState<any | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [approved, setApproved] = useState<boolean>(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!uid) return
    const run = async () => {
      const snap = await getDoc(doc(db, 'users', uid))
      const data = snap.data() as any
      setUser({ id: uid, ...data })
      setRoles((data?.roles as string[]) || [])
      setApproved(!!data?.approved)
    }
    run().catch(console.error)
  }, [uid])

  const toggleRole = (r: string) => {
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))
  }

  const save = async () => {
    if (!uid) return
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'users', uid),
        { roles: roles, approved, updatedAt: serverTimestamp() },
        { merge: true }
      )
    } finally {
      setSaving(false)
    }
  }

  if (!user) return <Container sx={{ p: 2 }}>読み込み中...</Container>

  return (
    <Container sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Button component={Link} to="/admin/members" variant="outlined" size="small">
          会員一覧
        </Button>
      </Box>
      <Typography variant="h5" gutterBottom>
        会員詳細
      </Typography>
      <Typography>ID: {uid}</Typography>
      <Typography>名前: {user.displayName || '-'}</Typography>
      <Box>
        <img src={user.photoURL || '/default-profile.svg'} alt="プロフィール画像" style={{ width: '100px', height: '100px', borderRadius: '50%' }} />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">承認</Typography>
        <FormControlLabel control={<Checkbox checked={approved} onChange={(e) => setApproved(e.target.checked)} />} label="承認済み" />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">ロール</Typography>
        <Stack>
          {['member', 'partLeader', 'admin'].map((r) => (
            <FormControlLabel key={r} control={<Checkbox checked={roles.includes(r)} onChange={() => toggleRole(r)} />} label={r} />)
          )}
        </Stack>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={save} disabled={saving}>
          保存
        </Button>
      </Box>
    </Container>
  )
}
