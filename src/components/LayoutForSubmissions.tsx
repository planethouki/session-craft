import { Outlet } from 'react-router';
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

const theme = createTheme()

export default function LayoutForSubmissions() {

  return <>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Outlet />
    </ThemeProvider>
  </>;
}
