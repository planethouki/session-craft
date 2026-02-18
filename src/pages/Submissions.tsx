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
} from '@mui/material'
import useSWR from 'swr'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

// APIからのレスポンスの型定義
type PartStatus = {
  part: string
  isRequired: boolean
  members: string[]
}

type SubmissionResponse = {
  sessionId: string
  userId: string
  title: string
  artist: string
  partsStatus: PartStatus[]
  userName: string
  description?: string
  audioUrl?: string
  scoreUrl?: string
}

type ApiResponse = {
  sessionId: string
  submissions: SubmissionResponse[]
}

const getSubmissionsApi = httpsCallable<void, ApiResponse>(functions, 'getSubmissionsApi')
const fetcher = async () => {
  const result = await getSubmissionsApi()
  return result.data
}

export default function Submissions() {
  const { data, error, isLoading } = useSWR<ApiResponse>('getSubmissionsApi', fetcher)

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
    <Container sx={{ p: 2, pb: 8 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        エントリー曲一覧
      </Typography>

      {submissions.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
          現在、登録されている曲はありません。
        </Typography>
      ) : (
        <Stack spacing={3}>
          {submissions.map((sub, index) => (
            <Card key={index} elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                    {sub.title}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    {sub.artist}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" display="block" color="text.secondary">
                    投稿者: {sub.userName}
                  </Typography>
                  {sub.description && (
                    <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                      {sub.description}
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ mb: 1.5 }} />

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  パート状況
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {sub.partsStatus.map((ps) => {
                    const isFilled = ps.members.length > 0
                    const showPart = ps.isRequired || isFilled

                    if (!showPart) return null

                    return (
                      <Box key={ps.part} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={ps.part}
                          size="small"
                          color={ps.isRequired ? (isFilled ? 'success' : 'warning') : 'default'}
                          variant={isFilled ? 'filled' : 'outlined'}
                          sx={{ minWidth: 50, fontWeight: 'bold' }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          {isFilled ? (
                            <Typography variant="body2">
                              {ps.members.join(', ')}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                              募集中
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  )
}
