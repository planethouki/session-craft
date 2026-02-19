import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Box,
  CircularProgress,
  Button,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../../firebase'
import { Link } from 'react-router'

interface UserData {
  uid: string
  displayName: string
  nickname: string
  photoURL: string
  state: string
  stateUpdatedAt: string
}

export default function UserList() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const getUsersApi = httpsCallable(functions, 'getUsersApi')
      const result = await getUsersApi()
      setUsers(result.data as UserData[])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('ユーザーリストの取得に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ p: 2 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/auth/home" underline="hover" color="inherit">
          ホーム
        </MuiLink>
        <Typography color="text.primary">ユーザーリスト</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        ユーザーリスト
      </Typography>

      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>LINEユーザー</TableCell>
                <TableCell>ニックネーム</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar src={user.photoURL} sx={{ mr: 2 }} />
                      <Typography variant="body1">{user.displayName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.nickname || '-'}</TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    ユーザーが見つかりません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 3 }}>
        <Button variant="outlined" component={Link} to="/auth/home">
          ホームに戻る
        </Button>
      </Box>
    </Container>
  )
}
