import type { SvgIconProps } from "@mui/material";

export interface NavItem {
  children?: NavItem[];
  disabled?: boolean;
  icon?: React.ComponentType<SvgIconProps>;
  label?: string;
  onClick?: () => void;
  slot?: (props: { level: number }) => React.ReactNode;
  to?: string;
}
