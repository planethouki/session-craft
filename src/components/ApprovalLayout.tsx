import { Outlet } from 'react-router';
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

const theme = createTheme()

export default function ApprovalLayout() {

  return <>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div>ApprovalLayout</div>
      <Outlet />
    </ThemeProvider>
  </>;
}
