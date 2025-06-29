import { useParams, usePathname } from "next/navigation";
import { Fragment, useState } from "react";

import { I18nDict, useI18n } from "@/context/i18n";

import {
  ExpandLess,
  ExpandMore,
  Home,
  ShoppingCart,
} from "@mui/icons-material";
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  Toolbar,
} from "@mui/material";

import { DrawerType } from "@/types/drawer";

const DrawerBox = styled(Box)({
  width: 250,
});

interface NavItem {
  children?: NavItem[];
  href: string;
  icon: React.ComponentType;
  text: string;
}

const getNavItems = (dict: I18nDict): NavItem[] => [
  { href: "", icon: Home, text: dict.nav.home },
  { href: "/order", icon: ShoppingCart, text: dict.nav.order },
];

interface NavTemporaryDrawerProps {
  onDrawerToggle: (
    type: DrawerType,
    open: boolean,
  ) => (event: React.MouseEvent | React.KeyboardEvent) => void;
  open: boolean;
}

const NavTemporaryDrawer = ({
  onDrawerToggle,
  open,
}: NavTemporaryDrawerProps) => {
  const pathname = usePathname();
  const { lang } = useParams();

  const dict = useI18n();
  const navItems = getNavItems(dict);

  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const handleIconButtonToggle = (href: string) =>
    setOpenMap((prev) => ({ ...prev, [href]: !prev[href] }));

  const renderItems = (items: NavItem[], depth = 0) =>
    items.map(({ children, href, icon: Icon, text }) => {
      const hasChildren = children?.length;

      const fullPath = `/${lang}${href}`;
      const isHome = href === "";
      const selected = isHome
        ? pathname === fullPath
        : pathname === fullPath || pathname.startsWith(`${fullPath}/`);

      const paddingLeft = 2 + depth * 2;

      return (
        <Fragment key={href}>
          <ListItem
            disablePadding
            secondaryAction={
              hasChildren && (
                <IconButton
                  edge="end"
                  onClick={() => handleIconButtonToggle(href)}
                  size="small"
                >
                  {openMap[href] ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )
            }
          >
            <ListItemButton
              component={Link}
              href={fullPath}
              selected={selected}
              sx={{ pl: paddingLeft }}
            >
              <ListItemIcon>
                <Icon />
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
          {hasChildren && (
            <Collapse in={openMap[href]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderItems(children!, depth + 1)}
              </List>
            </Collapse>
          )}
        </Fragment>
      );
    });

  const drawerList = (
    <DrawerBox
      onClick={onDrawerToggle("nav", false)}
      // onKeyDown={onDrawerToggle("nav", false)}
      role="presentation"
    >
      <Toolbar />
      <Divider />
      <List>{renderItems(navItems)}</List>
    </DrawerBox>
  );

  return (
    <Drawer
      ModalProps={{ keepMounted: true }}
      onClose={onDrawerToggle("nav", false)}
      open={open}
    >
      {drawerList}
    </Drawer>
  );
};

export default NavTemporaryDrawer;
