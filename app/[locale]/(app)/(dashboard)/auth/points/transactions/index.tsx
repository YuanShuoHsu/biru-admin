"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";

import { PAGE_SIZE_OPTIONS } from "./constants";

import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";
import PaginationActions, {
  StyledTablePagination,
} from "@/components/PaginationActions";

import { usePathname, useRouter } from "@/i18n/navigation";

import { LocalOffer, ShoppingBag, Stars } from "@mui/icons-material";
import {
  Avatar,
  Card,
  CardHeader,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import type { MyPoints } from "@/types/points";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.vars.palette.primary.main,
}));

const StyledTransactionCardHeader = styled(CardHeader)({
  "& .MuiCardHeader-action": {
    margin: 0,
    alignSelf: "center",
  },
});

interface PointsProps {
  page: number;
  pageSize: number;
  points: MyPoints | null;
}

const Points = ({ page, pageSize, points }: PointsProps) => {
  const format = useFormatter();

  const pathname = usePathname();

  const router = useRouter();

  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");

  const rowsPerPageOptions = [
    ...new Set([...PAGE_SIZE_OPTIONS, pageSize]),
  ].sort((a, b) => a - b);

  const transactions = points?.transactions || [];

  const transactionsTotal = points?.transactionsTotal || 0;

  const organizationCount = new Set(
    transactions
      .map((transaction) => transaction.organizationName)
      .filter(Boolean),
  ).size;

  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) =>
    router.replace(
      `${pathname}?${new URLSearchParams({
        page: String(newPage + 1),
        pageSize: String(pageSize),
      })}`,
    );

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) =>
    router.replace(
      `${pathname}?${new URLSearchParams({
        page: "1",
        pageSize: event.target.value,
      })}`,
    );

  return (
    <FormCard>
      <StyledCardHeader
        title={
          <Typography color="primary" fontWeight="bold" variant="h6">
            {tAuth("points.label")}
          </Typography>
        }
      />
      <StyledCardContent>
        {!points && (
          <Typography color="text.secondary" variant="body2">
            {tAuth("points.empty")}
          </Typography>
        )}
        {points && (
          <List disablePadding>
            <ListItem
              disableGutters
              secondaryAction={
                <Typography color="primary" fontWeight="bold" variant="h5">
                  {tAuth("points.points", {
                    points: format.number(points.balance),
                  })}
                </Typography>
              }
            >
              <ListItemAvatar>
                <StyledAvatar>
                  <Stars fontSize="small" />
                </StyledAvatar>
              </ListItemAvatar>
              <ListItemText
                primary={tAuth("points.balance")}
                slotProps={{
                  primary: { fontWeight: "bold", variant: "subtitle2" },
                }}
              />
            </ListItem>
          </List>
        )}
        {points && transactions.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            {tAuth("points.transactions.empty")}
          </Typography>
        )}
        {transactions.map((transaction) => (
          <Card key={transaction.id} variant="outlined">
            <StyledTransactionCardHeader
              action={
                <Typography
                  color={
                    transaction.type === "earn" ? "primary" : "text.secondary"
                  }
                  fontWeight="bold"
                  variant="body2"
                >
                  {tAuth("points.points", {
                    points: format.number(transaction.points, {
                      signDisplay: "exceptZero",
                    }),
                  })}
                </Typography>
              }
              avatar={
                <StyledAvatar>
                  {transaction.type === "earn" ? (
                    <ShoppingBag fontSize="small" />
                  ) : (
                    <LocalOffer fontSize="small" />
                  )}
                </StyledAvatar>
              }
              slotProps={{
                subheader: { variant: "caption" },
                title: { variant: "subtitle2" },
              }}
              subheader={[
                organizationCount > 1 && transaction.organizationName,
                dayjs(transaction.createdAt)
                  .tz("Asia/Taipei")
                  .format("YYYY/MM/DD HH:mm:ss"),
                transaction.type === "earn"
                  ? (transaction.confirmationNumber ||
                      transaction.orderNumber) &&
                    `${tOrder("complete.transaction.orderNo")} ${transaction.confirmationNumber || transaction.orderNumber}`
                  : transaction.couponCode &&
                    `${tAuth("coupons.label")} ${transaction.couponCode}`,
                transaction.expiresAt &&
                  tAuth("points.validUntil", {
                    date: dayjs(transaction.expiresAt)
                      .tz("Asia/Taipei")
                      .format("YYYY/MM/DD"),
                  }),
              ]
                .filter(Boolean)
                .join(tCommon("middleDot"))}
              title={tAuth(`points.type.${transaction.type}`)}
            />
          </Card>
        ))}
        {transactionsTotal > 0 && (
          <StyledTablePagination
            ActionsComponent={PaginationActions}
            component="div"
            count={transactionsTotal}
            labelDisplayedRows={({ count, from, to }) =>
              tCommon("pagination.labelDisplayedRows", { count, from, to })
            }
            labelRowsPerPage={tCommon("pagination.labelRowsPerPage")}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            page={page - 1}
            rowsPerPage={pageSize}
            rowsPerPageOptions={rowsPerPageOptions}
          />
        )}
      </StyledCardContent>
    </FormCard>
  );
};

export default Points;
