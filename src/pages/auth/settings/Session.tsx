import { useState, useEffect } from 'react'
import { Container, Typography, Button, Stack, Alert, Paper, Box, CircularProgress } from '@mui/material'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../../firebase'
import { Link } from 'react-router'

export default function SessionSettings() {
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchCurrentSession()
  }, [])

  const fetchCurrentSession = async () => {
    try {
      const getCurrentSessionApi = httpsCallable(functions, 'getCurrentSessionApi')
      const result = await getCurrentSessionApi()
      const data = result.data as any
      setCurrentStatus(data.state)
    } catch (err) {
      console.error('Error fetching session:', err)
    } finally {
      setInitialLoading(false)
    }
  }

  const updateSessionState = async (state: string) => {
    const label = STATE_LABELS[state as keyof typeof STATE_LABELS] || state
    if (!window.confirm(`セッション状態を ${label} に変更してもよろしいですか？`)) {
      return
    }
    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const updateSessionStateApi = httpsCallable(functions, 'updateSessionStateApi')
      await updateSessionStateApi({ state })
      setCurrentStatus(state)
      setMessage({ type: 'success', text: `セッション状態を ${STATE_LABELS[state as keyof typeof STATE_LABELS] || state} に更新しました。` })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: '更新に失敗しました。' })
    } finally {
      setLoading(false)
    }
  }

  const STATE_LABELS = {
    'DRAFT': '下書き',
    'SUBMISSION': '選曲提出',
    'ENTRY': 'エントリー',
    'SELECTING': '調整中'
  }

  const states = ['DRAFT', 'SUBMISSION', 'ENTRY', 'SELECTING']

  if (initialLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        セッション設定
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          セッション状態の変更
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          現在のセッションのステータスを変更します。
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 'bold' }}>
          現在の状態: {currentStatus ? (STATE_LABELS[currentStatus as keyof typeof STATE_LABELS] || currentStatus) : '不明'}
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
              variant={currentStatus === state ? "contained" : "outlined"}
              onClick={() => updateSessionState(state)}
              disabled={loading}
              sx={{ flexGrow: 1, py: 1.5, fontWeight: 'bold' }}
            >
              {STATE_LABELS[state as keyof typeof STATE_LABELS] || state}
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
