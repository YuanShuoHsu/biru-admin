"use client";

import { useTranslations } from "next-intl";

import { PAYROLL_BLOCKER_TARGETS } from "@/constants/attendance";

import { useRoutes } from "@/hooks/useRoutes";

import { Link } from "@/i18n/navigation";

import { Button, List, ListItem, ListItemText } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { PayrollBlocker, PayrollViolation } from "@/types/attendance";

const StyledListItem = styled(ListItem)(({ theme }) => ({
  gap: theme.spacing(2),
}));

const StyledButton = styled(Button)({
  flexShrink: 0,
}) as typeof Button;

interface BlockerListProps {
  codes: (PayrollBlocker | PayrollViolation)[];
  employeeName: string;
  onEditTerms?: () => void;
}

const BlockerList = ({
  codes,
  employeeName,
  onEditTerms,
}: BlockerListProps) => {
  const { closeDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const navItem = useRoutes();

  return (
    <List disablePadding>
      {codes.map((code) => {
        const target = PAYROLL_BLOCKER_TARGETS[code];
        const page = target && target !== "terms" ? target : null;
        const item = page && navItem(page.path);

        const query = new URLSearchParams({
          ...page?.query,
          ...(page?.byEmployee && { quickFilterValue: employeeName }),
        }).toString();

        return (
          <StyledListItem disableGutters key={code}>
            <ListItemText primary={tAttendance(`errors.${code}`)} />
            {target === "terms" && onEditTerms && (
              <StyledButton onClick={onEditTerms} size="small">
                {tAttendance("payrollTerms")}
              </StyledButton>
            )}
            {item?.to && (
              <StyledButton
                component={Link}
                href={
                  query
                    ? `${item.to}${item.to.includes("?") ? "&" : "?"}${query}`
                    : item.to
                }
                onClick={closeDialog}
                size="small"
              >
                {item.label}
              </StyledButton>
            )}
          </StyledListItem>
        );
      })}
    </List>
  );
};

export default BlockerList;
