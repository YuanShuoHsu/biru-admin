import { Stack } from "@mui/material";

const AuthOrdersLayout = ({ children }: { children: React.ReactNode }) => (
  <Stack gap={2} marginBottom="auto">
    {children}
  </Stack>
);

export default AuthOrdersLayout;
