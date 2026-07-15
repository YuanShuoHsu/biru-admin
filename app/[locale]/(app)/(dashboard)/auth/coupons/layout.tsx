import { Stack } from "@mui/material";

const AuthCouponsLayout = ({ children }: { children: React.ReactNode }) => (
  <Stack gap={2} marginBottom="auto">
    {children}
  </Stack>
);

export default AuthCouponsLayout;
