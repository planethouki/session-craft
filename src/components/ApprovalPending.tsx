import { useState } from 'react'
import { Box, Button, Container, TextField, Typography } from '@mui/material'
import { useAuth } from '../auth.tsx'
import { callApproveWithCode } from '../firebase.ts'

export default function ApprovalPending() {
  const { logout } = useAuth()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const submit = async () => {
    setMessage(null)
    try {
      const res = await callApproveWithCode({ code })
      const ok = (res.data as any).ok as boolean
      if (ok) setMessage('承認されました。画面を更新してください。')
      else setMessage('コードが違います。')
    } catch (e: any) {
      setMessage(e.message || String(e))
    }
  }

  return (
    <Container sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        承認待ち
      </Typography>
      <Typography gutterBottom>管理者またはパートリーダーの承認をお待ちください。</Typography>
      <Typography gutterBottom>もしくは、6桁のコードで自動承認できます。</Typography>
      <Box sx={{ mt: 1 }}>
        <TextField label="6桁コード" value={code} onChange={(e) => setCode(e.target.value)} inputProps={{ maxLength: 6 }} />
        <Button variant="contained" sx={{ ml: 1 }} onClick={submit} disabled={code.length < 6}>
          承認申請
        </Button>
      </Box>
      {message && (
        <Typography sx={{ mt: 1 }} color="primary">
          {message}
        </Typography>
      )}
      <Box sx={{ mt: 3 }}>
        <Button color="inherit" onClick={logout}>
          ログアウト
        </Button>
      </Box>
    </Container>
  )
}
