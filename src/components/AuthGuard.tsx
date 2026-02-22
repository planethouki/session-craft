import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, functions } from '../firebase';
import { CircularProgress, Box } from '@mui/material';
import { Navigate, useLocation } from 'react-router';
import { httpsCallable } from 'firebase/functions';

const AuthContext = createContext<{ user: User | null; isAdmin: boolean; loading: boolean }>({
  user: null,
  isAdmin: false,
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const checkIsAdmin = httpsCallable<{uid: string}, {isAdmin: boolean}>(functions, 'checkIsAdminApi');
          const result = await checkIsAdmin();
          setIsAdmin(result.data.isAdmin);
        } catch (error) {
          console.error('Failed to check admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};
