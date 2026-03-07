import type { DrawerType } from "@/types/drawer";

export const handleDrawerToggle =
  (
    setDrawerOpen: (type: DrawerType, open: boolean) => void,
    type: DrawerType,
    open: boolean,
  ) =>
  (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === "keydown" &&
      ((event as React.KeyboardEvent).key === "Tab" ||
        (event as React.KeyboardEvent).key === "Shift")
    ) {
      return;
    }

    setDrawerOpen(type, open);
  };
