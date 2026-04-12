"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import { useAuthStore } from "@/providers/auth-store-provider";

import {
  Business,
  Group,
  NavigateNext,
  ShoppingCart,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import type { Order } from "@/types/orders";

interface DashboardProps {
  stats: {
    totalUsers: number;
    totalOrganizations: number;
    totalOrders: number;
  };
  recentOrders: Order[];
}

const statusColorMap: Record<string, "warning" | "success" | "error"> = {
  pending: "warning",
  completed: "success",
  canceled: "error",
};

const Dashboard = ({ stats, recentOrders }: DashboardProps) => {
  const t = useTranslations("dashboard");
  const tOrder = useTranslations("order");
  const { session } = useAuthStore((state) => state);
  const router = useRouter();

  const firstName = session?.user?.firstName || session?.user?.name || "";

  const statCards = [
    {
      label: t("stats.totalOrders"),
      value: stats.totalOrders,
      icon: <ShoppingCart />,
      href: "/order",
    },
    {
      label: t("stats.totalUsers"),
      value: stats.totalUsers,
      icon: <Group />,
      href: "/admins?page=1&pageSize=10",
    },
    {
      label: t("stats.totalOrganizations"),
      value: stats.totalOrganizations,
      icon: <Business />,
      href: "/organizations",
    },
  ];

  return (
    <Stack gap={3}>
      <Typography variant="h5" fontWeight="bold">
        {t("welcome", { name: firstName })}
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
        {statCards.map(({ label, value, icon, href }) => (
          <Card key={label} sx={{ flex: 1 }}>
            <CardActionArea onClick={() => router.push(href)}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack gap={1}>
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {value.toLocaleString()}
                    </Typography>
                  </Stack>
                  <Box sx={{ color: "primary.main", fontSize: 40 }}>{icon}</Box>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>

      <Card>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" fontWeight="bold">
              {t("stats.recentOrders")}
            </Typography>
            <Chip
              label={t("quickActions.viewOrders")}
              icon={<NavigateNext />}
              onClick={() => router.push("/order")}
              variant="outlined"
              size="small"
            />
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tOrder("label")} ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                        {order.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={statusColorMap[order.status] || "default"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${order.totalPrice.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default Dashboard;
