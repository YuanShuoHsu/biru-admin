import ChangePassword from "./ChangePassword";
import Danger from "./Danger";
import LinkedAccounts from "./LinkedAccounts";
import Passkeys from "./Passkeys";
import Sessions from "./Sessions";

const Security = () => (
  <>
    <ChangePassword />
    <LinkedAccounts />
    <Passkeys />
    <Sessions />
    <Danger />
  </>
);

export default Security;
