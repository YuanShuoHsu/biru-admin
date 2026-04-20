// https://mui.com/material-ui/react-list/#SelectedListItem.tsx

import { useState } from "react";

import ListItemLink from "./ListItemLink";

import { usePathname } from "@/i18n/navigation";

import { Collapse, List } from "@mui/material";

import type { MenuItem } from "@/types/menuItem";

interface SelectedListItemProps {
  item: MenuItem;
  level?: number;
  parentPath?: string;
}

const SelectedListItem = ({
  item: { children, disabled, icon, label, onClick, slot, to },
  level = 0,
  parentPath = "/",
}: SelectedListItemProps) => {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();

  if (slot) return slot({ level });

  const [toPath, toQuery] = to?.split("?") || [];
  const queryString = toQuery ? `?${toQuery}` : "";
  const parentPrefix = parentPath === "/" ? "" : parentPath;
  const basePath = toPath ? `${parentPrefix}${toPath}` : parentPath;
  const isExpandable = Boolean(children?.length);
  const href = to && !isExpandable ? `${basePath}${queryString}` : undefined;
  const selected = toPath
    ? basePath === "/"
      ? pathname === basePath
      : pathname === basePath || pathname.startsWith(`${basePath}/`)
    : false;

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isExpandable) {
      event.stopPropagation();
      setOpen((prev) => !prev);
      return;
    }

    onClick?.();
  };

  return (
    <>
      <ListItemLink
        disabled={disabled}
        href={href}
        icon={icon}
        isExpandable={isExpandable}
        label={label}
        level={level}
        onClick={handleClick}
        open={open}
        selected={selected}
      />
      {isExpandable && (
        <Collapse component="li" in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {children!.map((child, index) => (
              <SelectedListItem
                item={child}
                key={child.to || `${level + 1}-${index}`}
                level={level + 1}
                parentPath={basePath}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

export default SelectedListItem;
