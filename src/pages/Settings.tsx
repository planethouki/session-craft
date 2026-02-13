import { Box, Button, Container, Typography } from '@mui/material'
import { useAuth } from '../auth.tsx'
import { Link } from 'react-router'

export default function Settings() {
  const { firebaseUser, firestoreUser, logout } = useAuth()

  return (
    <Container sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        設定
      </Typography>
      <Box>
        {firebaseUser && (<>
          <Typography>ユーザーID: {firebaseUser.uid}</Typography>
        </>)}
        {firestoreUser && (<>
          <Typography>表示名: {firestoreUser.displayName}</Typography>
          <Typography>承認: {firestoreUser.approved ? '済み' : '未承認'}</Typography>
          <Typography>ロール: {firestoreUser.roles?.join(', ') || '-'}</Typography>
          <Box>
            <img src={firestoreUser.photoURL || '/default-profile.svg'} alt="プロフィール画像" style={{ width: '100px', height: '100px', borderRadius: '50%' }} />
          </Box>
        </>)}
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button component={Link} to="/delete" color="error">
          個人情報の削除（退会）
        </Button>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button onClick={logout}>ログアウト</Button>
      </Box>
    </Container>
  )
}
