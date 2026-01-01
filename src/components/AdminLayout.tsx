import { Outlet } from 'react-router';
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

const theme = createTheme()

export default function AdminLayout() {
  return <>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div>AdminLayout</div>
      <Outlet />
    </ThemeProvider>
  </>;
}
