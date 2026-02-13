import { Outlet } from 'react-router';
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

const theme = createTheme()

export default function PartLeaderLayout() {
  return <>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div>PartLeaderLayout</div>
      <Outlet />
    </ThemeProvider>
  </>;
}
