import { useState } from 'react'
import { Container, Typography, Button, Stack, Alert, Paper, Box } from '@mui/material'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../../firebase'
import { Link } from 'react-router'

export default function SessionSettings() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const updateSessionState = async (state: string) => {
    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const updateSessionStateApi = httpsCallable(functions, 'updateSessionStateApi')
      await updateSessionStateApi({ state })
      setMessage({ type: 'success', text: `セッション状態を ${state} に更新しました。` })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: '更新に失敗しました。' })
    } finally {
      setLoading(false)
    }
  }

  const states = ['DRAFT', 'SUBMISSION', 'ENTRY', 'SELECTING']

  return (
    <Container maxWidth="md" sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        セッション設定
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          セッション状態の変更
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          現在のセッションのステータスを変更します。
        </Typography>

        {message.text && (
          <Alert severity={message.type as any} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {states.map((state) => (
            <Button
              key={state}
              variant="contained"
              onClick={() => updateSessionState(state)}
              disabled={loading}
              sx={{ flexGrow: 1, py: 1.5, fontWeight: 'bold' }}
            >
              {state}
            </Button>
          ))}
        </Stack>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Button variant="outlined" component={Link} to="/auth/home">
          ホームに戻る
        </Button>
      </Box>
    </Container>
  )
}
