import React, { useState, useEffect } from 'react'
import { Container, Typography, TextField, Button, Box, Alert, Paper, Divider } from '@mui/material'
import { signInWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth'
import { auth, functions } from '../../firebase.ts'
import { useNavigate, Navigate } from 'react-router'
import { useAuth } from '../../components/AuthGuard.tsx'
import liff from '@line/liff'
import { httpsCallable } from 'firebase/functions'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID })
      } catch (err) {
        console.error('LIFF initialization failed', err)
      }
    }
    initLiff()
  }, [])

  if (user) {
    return <Navigate to="/admin/home" replace />
  }

  const handleLiffLogin = async (idToken: string) => {
    setLoading(true)
    setError('')
    try {
      const liffAuth = httpsCallable<{ idToken: string }, { customToken: string }>(functions, 'liffAuth')
      const result = await liffAuth({ idToken })
      await signInWithCustomToken(auth, result.data.customToken)
      navigate('/admin/home')
    } catch (err: any) {
      console.error(err)
      setError('LINEログインに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleLineLoginClick = () => {
    if (!liff.isLoggedIn()) {
      liff.login()
    } else {
      const idToken = liff.getIDToken()
      if (idToken) {
        handleLiffLogin(idToken)
      }
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin/home')
    } catch (err: any) {
      console.error(err)
      setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          ログイン
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="メールアドレス"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="パスワード"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
            disabled={loading}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </Button>

          <Divider sx={{ my: 2 }}>または</Divider>

          <Button
            fullWidth
            variant="contained"
            onClick={handleLineLoginClick}
            disabled={loading}
            sx={{
              py: 1.5,
              fontWeight: 'bold',
              backgroundColor: '#06C755',
              '&:hover': {
                backgroundColor: '#05b34c',
              },
            }}
          >
            LINEでログイン
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
