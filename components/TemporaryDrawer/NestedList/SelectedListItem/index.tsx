// https://mui.com/material-ui/react-list/#SelectedListItem.tsx

import { useState } from "react";

import ListItemLink from "./ListItemLink";

import { usePathname } from "@/i18n/navigation";

import { Collapse, List } from "@mui/material";

import type { NavItem } from "@/types/navItem";

interface SelectedListItemProps {
  item: NavItem;
  level?: number;
}

const SelectedListItem = ({
  item: { children, icon, label, onClick, path, slot, to },
  level = 0,
}: SelectedListItemProps) => {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();

  if (slot) return slot({ level });

  const basePath = (path ?? to)?.split("?")[0];
  const isExpandable = Boolean(children?.length);
  const href = to && !isExpandable ? to : undefined;
  const selected = basePath
    ? pathname === basePath || pathname.startsWith(`${basePath}/`)
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
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

export default SelectedListItem;
