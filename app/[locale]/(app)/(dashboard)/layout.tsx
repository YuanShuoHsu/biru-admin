import LowStockAlerts from "./LowStockAlerts";
import { DashboardStack, HeaderStack } from "./styled";

interface DashboardLayoutProps extends LayoutProps<"/[locale]"> {
  breadcrumb: React.ReactNode;
  subheader: React.ReactNode;
  toolbar: React.ReactNode;
}

const DashboardLayout = ({
  breadcrumb,
  children,
  subheader,
  toolbar,
}: DashboardLayoutProps) => (
  // https://nextjs.org/docs/app/guides/interactive-apps#step-3-filter-with-pending-feedback
  <DashboardStack className="group">
    <HeaderStack direction="row">
      {breadcrumb}
      {toolbar}
    </HeaderStack>
    {subheader}
    {children}
    <LowStockAlerts />
  </DashboardStack>
);

export default DashboardLayout;
