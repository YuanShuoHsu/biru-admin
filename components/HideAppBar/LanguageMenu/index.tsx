// https://github.com/vercel/next.js/tree/canary/examples/i18n-routing
// https://mui.com/material-ui/react-app-bar/#system-MenuAppBar.tsx
// https://mui.com/material-ui/react-app-bar/#system-ResponsiveAppBar.tsx

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { localeConfigs } from "@/constants/locale";

import { useHref } from "@/hooks/useHref";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import { Language } from "@mui/icons-material";
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledMenu = styled(Menu)(({ theme }) => ({
  marginTop: theme.spacing(6),

  [theme.breakpoints.up("sm")]: {
    marginTop: theme.spacing(7),
  },
}));

const languages = routing.locales.map((locale) => ({
  locale,
  label: localeConfigs[locale].label,
}));

const LanguageMenu = () => {
  const [anchorElLanguage, setAnchorElLanguage] = useState<null | HTMLElement>(
    null,
  );
  const open = Boolean(anchorElLanguage);

  const href = useHref();

  const currentLocale = useLocale();

  const tAppBar = useTranslations("appBar");

  const handleClick = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElLanguage(event.currentTarget);

  const handleClose = () => setAnchorElLanguage(null);

  return (
    <>
      <Tooltip title={tAppBar("languageSwitcher")}>
        <IconButton
          aria-controls={open ? "language-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-haspopup="true"
          aria-label="language"
          color="inherit"
          onClick={handleClick}
        >
          <Language />
        </IconButton>
      </Tooltip>
      <StyledMenu
        anchorEl={anchorElLanguage}
        anchorOrigin={{
          horizontal: "right",
          vertical: "top",
        }}
        id="menu-appbar"
        keepMounted
        onClick={handleClose}
        onClose={handleClose}
        open={open}
        transformOrigin={{
          horizontal: "right",
          vertical: "top",
        }}
      >
        {languages.map(({ label, locale }) => (
          <MenuItem
            component={Link}
            href={href}
            key={locale}
            locale={locale}
            onClick={handleClose}
            replace
            selected={locale === currentLocale}
          >
            {label}
          </MenuItem>
        ))}
      </StyledMenu>
    </>
  );
};

export default LanguageMenu;
