import App from "./App";

const AppLayout = ({ children }: LayoutProps<"/[locale]">) => (
  <App>{children}</App>
);

export default AppLayout;
