export interface MenuItem {
  children?: MenuItem[];
  disabled?: boolean;
  icon?: React.ElementType;
  label?: string;
  onClick?: () => void;
  slot?: (props: { level?: number }) => React.ReactNode;
  to?: string;
}
