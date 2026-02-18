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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          {data?.sessionTitle || 'エントリー曲一覧'}
        </Typography>
        {data?.sessionDescription && (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
            {data.sessionDescription}
          </Typography>
        )}
      </Box>

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
                    No.{sub.no} {sub.title}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    {sub.artist}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" display="block" color="text.secondary">
                    投稿者: {sub.userName}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 1.5 }} />

                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    パート
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {sub.parts?.map((part) => (
                      <Chip key={part} label={part} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    自分のパート
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {sub.myParts?.map((part) => (
                      <Chip key={part} label={part} size="small" />
                    ))}
                  </Box>
                </Box>

                <Divider sx={{ mb: 1.5 }} />

                <Stack spacing={1}>
                  {sub.audioUrl && (
                    <Typography variant="body2">
                      <strong>音源URL:</strong> <a href={sub.audioUrl} target="_blank" rel="noopener noreferrer">{sub.audioUrl}</a>
                    </Typography>
                  )}
                  {sub.scoreUrl && (
                    <Typography variant="body2">
                      <strong>コード譜URL:</strong> <a href={sub.scoreUrl} target="_blank" rel="noopener noreferrer">{sub.scoreUrl}</a>
                    </Typography>
                  )}
                  {sub.referenceUrl1 && (
                    <Typography variant="body2">
                      <strong>参考URL1:</strong> <a href={sub.referenceUrl1} target="_blank" rel="noopener noreferrer">{sub.referenceUrl1}</a>
                    </Typography>
                  )}
                  {sub.referenceUrl2 && (
                    <Typography variant="body2">
                      <strong>参考URL2:</strong> <a href={sub.referenceUrl2} target="_blank" rel="noopener noreferrer">{sub.referenceUrl2}</a>
                    </Typography>
                  )}
                  {sub.referenceUrl3 && (
                    <Typography variant="body2">
                      <strong>参考URL3:</strong> <a href={sub.referenceUrl3} target="_blank" rel="noopener noreferrer">{sub.referenceUrl3}</a>
                    </Typography>
                  )}
                  {sub.referenceUrl4 && (
                    <Typography variant="body2">
                      <strong>参考URL4:</strong> <a href={sub.referenceUrl4} target="_blank" rel="noopener noreferrer">{sub.referenceUrl4}</a>
                    </Typography>
                  )}
                  {sub.referenceUrl5 && (
                    <Typography variant="body2">
                      <strong>参考URL5:</strong> <a href={sub.referenceUrl5} target="_blank" rel="noopener noreferrer">{sub.referenceUrl5}</a>
                    </Typography>
                  )}
                  {sub.description && (
                    <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                      {sub.description}
                    </Typography>
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
