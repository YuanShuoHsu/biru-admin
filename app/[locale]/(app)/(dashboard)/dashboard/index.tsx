"use client";

import {
  AttachMoney,
  CheckCircle,
  HourglassEmpty,
  ShoppingBag,
} from "@mui/icons-material";
import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  // borderRadius: theme.shape.borderRadius * 2,
}));

const IconWrapper = styled(Box)<{ color: string }>(({ color, theme }) => ({
  width: 48,
  height: 48,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: `${color}20`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color,
}));

const stats = [
  {
    label: "總訂單",
    value: "128",
    icon: ShoppingBag,
    color: "#1976d2",
  },
  {
    label: "待處理",
    value: "12",
    icon: HourglassEmpty,
    color: "#ed6c02",
  },
  {
    label: "已完成",
    value: "116",
    icon: CheckCircle,
    color: "#2e7d32",
  },
  {
    label: "總營收",
    value: "NT$ 48,320",
    icon: AttachMoney,
    color: "#9c27b0",
  },
];

const Dashboard = () => (
  <Box p={3}>
    <Typography variant="h5" fontWeight="bold" mb={3}>
      訂單總覽
    </Typography>
    <Grid container spacing={3}>
      {stats.map(({ color, icon: Icon, label, value }) => (
        <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
          <StyledCard variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {label}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {value}
                  </Typography>
                </Box>
                <IconWrapper color={color}>
                  <Icon fontSize="small" />
                </IconWrapper>
              </Stack>
            </CardContent>
          </StyledCard>
        </Grid>
      ))}
    </Grid>
  </Box>
);

export default Dashboard;
