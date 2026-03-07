import { Outlet } from 'react-router';
import { createTheme, CssBaseline, ThemeProvider, type PaletteMode } from "@mui/material";
import { createContext, useMemo, useState, useContext } from 'react';

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

export function useColorMode() {
  return useContext(ColorModeContext);
}

export default function LayoutForSubmissions() {
  const [mode, setMode] = useState<PaletteMode>('light');
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#FF8A65', // 親しみやすいコーラルオレンジ
            light: '#FFB9A1',
            dark: '#C75B39',
            contrastText: '#fff',
          },
          secondary: {
            main: '#4DB6AC', // 穏やかなティール（青緑）
            light: '#82E9DE',
            dark: '#00867D',
            contrastText: '#fff',
          },
          ...(mode === 'light'
            ? {
                background: {
                  default: '#F5EFE8', // 背景を少しだけ濃くして、Card（白）とのコントラストを出す
                  paper: '#ffffff',
                },
                text: {
                  primary: '#443333', // 真っ黒ではなく少し温かみのあるグレー
                  secondary: '#776666',
                },
              }
            : {
                background: {
                  default: '#121212',
                  paper: '#1e1e1e',
                },
                text: {
                  primary: '#e0e0e0',
                  secondary: '#b0b0b0',
                },
              }),
        },
        typography: {
          fontFamily: [
            '"Helvetica Neue"',
            'Arial',
            '"Hiragino Kaku Gothic ProN"',
            '"Hiragino Sans"',
            'Meiryo',
            'sans-serif',
          ].join(','),
          h5: {
            fontWeight: 800,
            letterSpacing: '0.05em',
          },
          h6: {
            fontWeight: 800,
          },
          button: {
            fontWeight: 700,
          },
        },
        shape: {
          borderRadius: 16, // 全体的に丸みを強くする
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 20,
                boxShadow: mode === 'light'
                  ? '0 8px 24px rgba(68, 51, 51, 0.06), 0 2px 6px rgba(68, 51, 51, 0.04)'
                  : '0 8px 24px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2)', // ダークモード用の影
                border: mode === 'light'
                  ? '1px solid rgba(68, 51, 51, 0.05)'
                  : '1px solid rgba(255, 255, 255, 0.05)', // ダークモード用のボーダー
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 100, // 完全に丸いボタン
                textTransform: 'none',
                padding: '8px 24px',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(255, 138, 101, 0.2)',
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 600,
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Outlet />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
