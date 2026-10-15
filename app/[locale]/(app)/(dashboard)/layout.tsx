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
  <DashboardStack>
    <HeaderStack direction="row">
      {breadcrumb}
      {toolbar}
    </HeaderStack>
    {subheader}
    {children}
  </DashboardStack>
);

export default DashboardLayout;
