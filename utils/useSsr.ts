// https://github.com/mui/toolpad/blob/master/packages/toolpad-utils/src/hooks/useSsr.ts

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

const getSnapshot = () => false;

const getServerSnapshot = () => true;

export const useSsr = () =>
  useSyncExternalStore<boolean>(subscribe, getSnapshot, getServerSnapshot);
