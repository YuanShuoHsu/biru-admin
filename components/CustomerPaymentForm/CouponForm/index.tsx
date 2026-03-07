"use client";

import { useState } from "react";

import DiscountIcon from "@mui/icons-material/Discount";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const FAKE_COUPONS: Record<string, { label: string }> = {
  COFFEE100: { label: "滿額折 $100（假資料）" },
  ESPRESSO20: { label: "義式 8 折（假資料）" },
};

const CouponForm = () => {
  const [code, setCode] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleApply = (event: React.FormEvent) => {
    if (event) event.preventDefault();

    const normalized = code.trim().toUpperCase();

    if (!normalized) {
      setSuccessMsg(null);
      setErrorMsg("請輸入折價券代碼");
      return;
    }

    if (FAKE_COUPONS[normalized]) {
      setErrorMsg(null);
      setSuccessMsg(`已套用：${normalized}｜${FAKE_COUPONS[normalized].label}`);
    } else {
      setSuccessMsg(null);
      setErrorMsg("折價券代碼無效或已過期");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleApply}
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <DiscountIcon fontSize="small" />
        <Typography variant="subtitle1">折價券</Typography>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          fullWidth
          size="small"
          placeholder="輸入折價券代碼"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button type="submit" variant="outlined">
          套用
        </Button>
      </Stack>
      {successMsg && (
        <Alert severity="success" sx={{ mt: 1 }}>
          {successMsg}
        </Alert>
      )}
      {errorMsg && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {errorMsg}
        </Alert>
      )}
    </Box>
  );
};

export default CouponForm;
