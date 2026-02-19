import { useState, useEffect, type MouseEvent } from 'react'
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
  Link as MuiLink,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  HourglassEmpty as HourglassEmptyIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon
} from '@mui/icons-material'
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
  memberState?: 'PENDING' | 'BANNED' | 'MEMBER'
}

export default function UserList() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)

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

  const handleMenuOpen = (event: MouseEvent<HTMLElement>, user: UserData) => {
    setAnchorEl(event.currentTarget)
    setSelectedUser(user)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedUser(null)
  }

  const handleUpdateMemberState = async (memberState: 'PENDING' | 'BANNED' | 'MEMBER' | null) => {
    if (!selectedUser) return

    try {
      const updateUserMemberStateApi = httpsCallable(functions, 'updateUserMemberStateApi')
      await updateUserMemberStateApi({
        uid: selectedUser.uid,
        memberState
      })
      await fetchUsers()
    } catch (err) {
      console.error('Error updating member state:', err)
      alert('ステータスの更新に失敗しました。')
    } finally {
      handleMenuClose()
    }
  }

  const renderMemberState = (state?: string) => {
    switch (state) {
      case 'PENDING':
        return <Chip label="保留中" color="warning" size="small" variant="outlined" />
      case 'BANNED':
        return <Chip label="停止中" color="error" size="small" variant="outlined" />
      case 'MEMBER':
        return <Chip label="メンバー" color="success" size="small" variant="outlined" />
      default:
        return null
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
                <TableCell>状態</TableCell>
                <TableCell align="right"></TableCell>
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
                  <TableCell>{renderMemberState(user.memberState)}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={(e) => handleMenuOpen(e, user)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    ユーザーが見つかりません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleUpdateMemberState('MEMBER')}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>メンバーにする</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateMemberState('PENDING')}>
          <ListItemIcon>
            <HourglassEmptyIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>保留にする</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateMemberState('BANNED')}>
          <ListItemIcon>
            <BlockIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>停止にする</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateMemberState(null)}>
          <ListItemIcon>
            <RemoveCircleOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>ステータス解除</ListItemText>
        </MenuItem>
      </Menu>

      <Box sx={{ mt: 3 }}>
        <Button variant="outlined" component={Link} to="/auth/home">
          ホームに戻る
        </Button>
      </Box>
    </Container>
  )
}
