"use client";

import { useRouter } from "@/i18n/navigation";

import { CheckCircleOutline, ErrorOutline } from "@mui/icons-material";
import { Box, Button, Paper, Typography } from "@mui/material";

const OrderModeStoreSlugComplete = () => {
  const router = useRouter();

  // TODO: wire real status when available
  const isSuccess = true;

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="80vh"
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 4,
          textAlign: "center",
          maxWidth: 400,
        }}
      >
        {isSuccess ? (
          <>
            <CheckCircleOutline
              sx={{ fontSize: 64, color: "success.main", mb: 2 }}
            />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              付款成功！
            </Typography>
          </>
        ) : (
          <>
            <ErrorOutline sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              付款失敗
            </Typography>
            <Typography variant="body1" gutterBottom>
              若有疑問，請洽工作人員協助。
            </Typography>
          </>
        )}
        <Button
          variant="contained"
          sx={{ mt: 4 }}
          onClick={() => router.push("/")}
        >
          回首頁
        </Button>
      </Paper>
    </Box>
  );
};

export default OrderModeStoreSlugComplete;
