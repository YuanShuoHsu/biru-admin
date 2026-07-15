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

import { List, ListItem, ListItemText, Typography } from "@mui/material";

import type { MyPointsWallet } from "@/types/points";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface PointsProps {
  page: number;
  pageSize: number;
  wallets: MyPointsWallet[];
}

const Points = ({ page, pageSize, wallets }: PointsProps) => {
  const format = useFormatter();

  const pathname = usePathname();

  const router = useRouter();

  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const rowsPerPageOptions = [
    ...new Set([...PAGE_SIZE_OPTIONS, pageSize]),
  ].sort((a, b) => a - b);

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

  if (wallets.length === 0)
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
          <Typography color="text.secondary" variant="body2">
            {tAuth("points.empty")}
          </Typography>
        </StyledCardContent>
      </FormCard>
    );

  return (
    <>
      {wallets.map((wallet) => (
        <FormCard key={wallet.organizationSlug}>
          <StyledCardHeader
            action={
              <Typography color="primary" fontWeight="bold" variant="h5">
                {tAuth("points.points", {
                  points: format.number(wallet.balance),
                })}
              </Typography>
            }
            slotProps={{ subheader: { variant: "caption" } }}
            subheader={tAuth("points.balance")}
            title={
              <Typography color="primary" fontWeight="bold" variant="h6">
                {wallet.organizationName}
              </Typography>
            }
          />
          <StyledCardContent>
            <List dense disablePadding>
              {wallet.transactions.map((transaction) => (
                <ListItem
                  disableGutters
                  key={transaction.id}
                  secondaryAction={
                    <Typography
                      color={
                        transaction.type === "earn"
                          ? "primary"
                          : "text.secondary"
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
                >
                  <ListItemText
                    primary={tAuth(`points.type.${transaction.type}`)}
                    secondary={[
                      dayjs(transaction.createdAt)
                        .tz("Asia/Taipei")
                        .format("YYYY/MM/DD HH:mm:ss"),
                      transaction.expiresAt &&
                        tAuth("points.validUntil", {
                          date: dayjs(transaction.expiresAt)
                            .tz("Asia/Taipei")
                            .format("YYYY/MM/DD"),
                        }),
                    ]
                      .filter(Boolean)
                      .join(tCommon("middleDot"))}
                    slotProps={{ secondary: { variant: "caption" } }}
                  />
                </ListItem>
              ))}
            </List>
            {wallet.transactionsTotal > 0 && (
              <StyledTablePagination
                ActionsComponent={PaginationActions}
                component="div"
                count={wallet.transactionsTotal}
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
      ))}
    </>
  );
};

export default Points;
