import { CheckCircleOutlined, RadioButtonUnchecked } from "@mui/icons-material";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  type TypographyProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

type RuleStatus = "failed" | "idle" | "passed";

const StyledListItemIcon = styled(ListItemIcon, {
  shouldForwardProp: (prop) => prop !== "status",
})<{ status: RuleStatus }>(({ status, theme }) => ({
  minWidth: 28,
  color: theme.vars.palette.text.secondary,

  ...(status === "failed" && {
    color: theme.vars.palette.error.main,
  }),
  ...(status === "passed" && {
    color: theme.vars.palette.primary.main,
  }),
}));

const RULE_TEXT_COLORS: Record<RuleStatus, TypographyProps["color"]> = {
  failed: "error",
  idle: "textSecondary",
  passed: "primary",
};

interface PasswordRule {
  key: string;
  label: string;
  passed: boolean;
}

interface PasswordRuleListProps {
  hasValue: boolean;
  rules: PasswordRule[];
}

const PasswordRuleList = ({ hasValue, rules }: PasswordRuleListProps) => (
  <List dense disablePadding>
    {rules.map(({ key, label, passed }) => {
      const status: RuleStatus = hasValue
        ? passed
          ? "passed"
          : "failed"
        : "idle";

      return (
        <ListItem disablePadding key={key}>
          <StyledListItemIcon status={status}>
            {passed ? (
              <CheckCircleOutlined fontSize="small" />
            ) : (
              <RadioButtonUnchecked fontSize="small" />
            )}
          </StyledListItemIcon>
          <ListItemText
            primary={label}
            slotProps={{
              primary: { color: RULE_TEXT_COLORS[status], variant: "caption" },
            }}
          />
        </ListItem>
      );
    })}
  </List>
);

export default PasswordRuleList;
