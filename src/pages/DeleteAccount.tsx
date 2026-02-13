import { useState } from 'react'
import { Box, Button, Container, Typography } from '@mui/material'
import { useAuth } from '../auth.tsx'
import { callDeleteSelf } from '../firebase.ts'

export default function DeleteAccount() {
  const { logout } = useAuth()
  const [confirm, setConfirm] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleDelete = async () => {
    setMessage(null)
    try {
      await callDeleteSelf()
      setMessage('削除しました。ログアウトします。')
      await logout()
    } catch (e: any) {
      setMessage(e.message || String(e))
    }
  }

  return (
    <Container sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        個人情報の削除
      </Typography>
      <Typography gutterBottom>
        この操作は元に戻せません。アカウント情報、あなたが提出した提案やエントリーを削除します。
      </Typography>
      {!confirm ? (
        <Box sx={{ mt: 2 }}>
          <Button color="error" variant="outlined" onClick={() => setConfirm(true)}>
            削除の確認に進む
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Typography color="error" gutterBottom>
            本当に削除しますか？
          </Typography>
          <Button color="error" variant="contained" onClick={handleDelete}>
            本当に削除する
          </Button>
        </Box>
      )}
      {message && (
        <Typography sx={{ mt: 2 }} color="primary">
          {message}
        </Typography>
      )}
    </Container>
  )
}
