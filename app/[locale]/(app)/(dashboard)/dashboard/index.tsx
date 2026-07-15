"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import { useAuthStore } from "@/providers/auth-store-provider";

import {
  AdminPanelSettings,
  Business,
  NavigateNext,
  ReceiptLong,
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

import type { OrderResponse, OrderStatus } from "@/types/orders";

import { getOrderTotalAmount } from "@/utils/orders";

interface DashboardProps {
  organizationSlug: string;
  stats: {
    totalUsers: number | null;
    totalOrganizations: number;
    totalOrders: number;
  };
  recentOrders: OrderResponse[];
}

const statusColorMap: Record<
  OrderStatus,
  "default" | "error" | "info" | "success" | "warning"
> = {
  OrderCancelled: "default",
  OrderDelivered: "success",
  OrderPaymentDue: "warning",
  OrderPickupAvailable: "success",
  OrderProcessing: "info",
  OrderProblem: "error",
};

const Dashboard = ({
  organizationSlug,
  stats,
  recentOrders,
}: DashboardProps) => {
  const format = useFormatter();
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const tOrders = useTranslations("orders");
  const { session } = useAuthStore((state) => state);
  const router = useRouter();

  const firstName = session?.user?.firstName || session?.user?.name || "";

  const ordersHref = `/orders?${new URLSearchParams({
    ...(organizationSlug && { organization: organizationSlug }),
    page: "1",
    pageSize: "10",
  }).toString()}`;

  const statCards = [
    {
      label: t("stats.totalOrders"),
      value: stats.totalOrders,
      icon: <ReceiptLong />,
      href: ordersHref,
    },
    ...(stats.totalUsers !== null
      ? [
          {
            label: t("stats.totalUsers"),
            value: stats.totalUsers,
            icon: <AdminPanelSettings />,
            href: "/admins?page=1&pageSize=10",
          },
        ]
      : []),
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
              onClick={() => router.push(ordersHref)}
              variant="outlined"
              size="small"
            />
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tOrders("orderNumber")}</TableCell>
                  <TableCell>{tOrders("orderStatus")}</TableCell>
                  <TableCell align="right">{tOrders("total")}</TableCell>
                  <TableCell>{tOrders("createdAt")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tOrders(`status.${order.orderStatus}`)}
                        color={statusColorMap[order.orderStatus] || "default"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {order.items[0]?.priceCurrency || ""}{" "}
                      {getOrderTotalAmount(order).toLocaleString(locale)}
                    </TableCell>
                    <TableCell>
                      {format.dateTime(new Date(order.createdAt), "short")}
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
