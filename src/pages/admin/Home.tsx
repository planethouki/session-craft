import { Container, Typography, Button, Box } from '@mui/material'
import { Link } from 'react-router'

export default function Home() {
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
      </Box>
    </Container>
  )
}
