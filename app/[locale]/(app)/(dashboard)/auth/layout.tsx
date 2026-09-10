import type { Metadata } from "next";

import AuthContainer from "./AuthContainer";

interface MemberAuthLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  robots: { follow: true, index: false },
};

const MemberAuthLayout = ({ children }: MemberAuthLayoutProps) => (
  <AuthContainer>{children}</AuthContainer>
);

export default MemberAuthLayout;
