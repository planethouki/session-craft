import { Container, Typography, Button, Box } from '@mui/material'
import { Link, useNavigate } from 'react-router'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'

export default function Home() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    if (!window.confirm('ログアウトしますか？')) return
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <Container sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        管理画面 ホーム
      </Typography>
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" component={Link} to="/admin/settings/session">
          セッション設定へ
        </Button>
        <Button variant="contained" component={Link} to="/admin/users">
          ユーザーリストへ
        </Button>
        <Button variant="outlined" color="error" onClick={handleLogout}>
          ログアウト
        </Button>
      </Box>
    </Container>
  )
}
