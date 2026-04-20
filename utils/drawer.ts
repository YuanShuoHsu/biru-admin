// https://mui.com/material-ui/react-drawer/#AnchorTemporaryDrawer.tsx

import { useDrawerStore } from "@/providers/drawer-store-provider";

import type { DrawerType } from "@/types/drawer";

export const useToggleDrawer = () => {
  const { setDrawer } = useDrawerStore((state) => state);

  return (type: DrawerType, open: boolean) =>
    (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }

      setDrawer(type, open);
    };
};
