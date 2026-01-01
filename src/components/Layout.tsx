import { Outlet } from 'react-router';
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

const theme = createTheme()

export default function Layout() {

  return <>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div>Layout</div>
      <Outlet />
    </ThemeProvider>
  </>;
}
