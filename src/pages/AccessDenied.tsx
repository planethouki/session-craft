import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { auth } from '../firebase.ts';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 3
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          アクセス権限がありません
        </Typography>
        <Typography variant="body1">
          このページを表示するには管理者権限が必要です。
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleLogout}
          sx={{ mt: 2 }}
        >
          ログアウト
        </Button>
      </Box>
    </Container>
  );
};

export default AccessDenied;
