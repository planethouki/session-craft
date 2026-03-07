import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Link,
  IconButton,
  useTheme,
} from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic'
import DescriptionIcon from '@mui/icons-material/Description'
import PersonIcon from '@mui/icons-material/Person'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import useSWR from 'swr'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { useColorMode } from '../components/LayoutForSubmissions'

// APIからのレスポンスの型定義
type SubmissionResponse = {
  sessionId: string
  userId: string
  title: string
  artist: string
  userName: string
  no: number
  parts: string[]
  myParts: string[]
  description?: string
  audioUrl?: string
  scoreUrl?: string
  referenceUrl1?: string
  referenceUrl2?: string
  referenceUrl3?: string
  referenceUrl4?: string
  referenceUrl5?: string
}

type ApiResponse = {
  sessionTitle?: string
  sessionDescription?: string
  submissions: SubmissionResponse[]
}

const getSubmissionsApi = httpsCallable<void, ApiResponse>(functions, 'getSubmissionsApi')
const fetcher = async () => {
  const result = await getSubmissionsApi()
  return result.data
}

export default function Submissions() {
  const { data, error, isLoading } = useSWR<ApiResponse>('getSubmissionsApi', fetcher)
  const theme = useTheme()
  const colorMode = useColorMode()

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container sx={{ p: 2 }}>
        <Alert severity="error">データの取得に失敗しました。</Alert>
      </Container>
    )
  }

  const submissions = data?.submissions || []

  return (
    <Container maxWidth="sm" sx={{ py: 3, px: 2, pb: 10 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 800, color: 'primary.main', flexGrow: 1 }}>
            {data?.sessionTitle || 'エントリー曲一覧'}
          </Typography>
          <IconButton onClick={colorMode.toggleColorMode} color="inherit" size="small" sx={{ ml: 1, mt: -0.5 }}>
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
        {data?.sessionDescription && (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.6 }}>
            {data.sessionDescription}
          </Typography>
        )}
      </Box>

      {submissions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <LibraryMusicIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            現在、登録されている曲はありません。
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2.5}>
          {submissions.map((sub, index) => (
            <Card key={index} elevation={0}>
              <CardContent sx={{ p: '24px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.dark', bgcolor: 'primary.light', px: 1.5, py: 0.5, borderRadius: 1.5, opacity: 1 }}>
                    No.{sub.no}
                  </Typography>
                </Box>

                <Typography variant="h6" component="div" sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1.3 }}>
                  {sub.title}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 500, mb: 2 }}>
                  {sub.artist}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2.5 }}>
                  <PersonIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">
                    投稿: {sub.userName}
                  </Typography>
                </Box>

                <Stack spacing={2.5}>
                  {(sub.parts?.length > 0 || sub.myParts?.length > 0) && (
                    <Box>
                      {sub.parts?.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', mb: 0.8 }}>
                            募集パート
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                            {sub.parts.map((part) => (
                              <Chip key={part} label={part} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {sub.myParts?.length > 0 && (
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', mb: 0.8 }}>
                            担当パート
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                            {sub.myParts.map((part) => (
                              <Chip key={part} label={part} size="small" color="primary" sx={{ fontWeight: 'bold' }} />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}

                  <Divider />

                  <Stack spacing={1}>
                    {[
                      { label: '音源', url: sub.audioUrl },
                      { label: 'コード譜', url: sub.scoreUrl },
                      { label: '参考1', url: sub.referenceUrl1 },
                      { label: '参考2', url: sub.referenceUrl2 },
                      { label: '参考3', url: sub.referenceUrl3 },
                      { label: '参考4', url: sub.referenceUrl4 },
                      { label: '参考5', url: sub.referenceUrl5 },
                    ].filter(item => item.url).map((link, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                          {link.label}
                        </Typography>
                        <Link
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 'medium',
                            color: 'primary.main',
                            wordBreak: 'break-all',
                            maxWidth: '70%',
                            textAlign: 'right',
                            justifyContent: 'flex-end'
                          }}
                        >
                          {link.url}
                          <OpenInNewIcon sx={{ fontSize: 14, ml: 0.5, flexShrink: 0 }} />
                        </Link>
                      </Box>
                    ))}
                  </Stack>

                  {sub.description && (
                    <Box sx={{ bgcolor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.05)', px: 1.5, py: 1, borderRadius: 1.5 }}>
                      <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.5 }}>
                        <DescriptionIcon sx={{ fontSize: 12, verticalAlign: 'text-top', mr: 0.5, color: 'text.disabled' }} />
                        {sub.description}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  )
}
