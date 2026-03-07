import { CheckCircleOutline, RadioButtonUnchecked } from "@mui/icons-material";
import { List, ListItem, ListItemIcon, ListItemText } from "@mui/material";

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
      const color = hasValue
        ? passed
          ? "primary.main"
          : "error.main"
        : "text.secondary";

      return (
        <ListItem disablePadding key={key}>
          <ListItemIcon sx={{ color, minWidth: 28 }}>
            {passed ? (
              <CheckCircleOutline fontSize="small" />
            ) : (
              <RadioButtonUnchecked fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={label}
            slotProps={{ primary: { color, variant: "caption" } }}
          />
        </ListItem>
      );
    })}
  </List>
);

export default PasswordRuleList;
