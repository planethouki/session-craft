import { Container, Typography, Button, Box } from '@mui/material'
import { Link } from 'react-router'

export default function Home() {
  return (
    <Container sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        管理画面 ホーム
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" component={Link} to="/auth/settings/session">
          セッション設定へ
        </Button>
      </Box>
    </Container>
  )
}
