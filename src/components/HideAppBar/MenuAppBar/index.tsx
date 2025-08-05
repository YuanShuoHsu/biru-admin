// https://mui.com/material-ui/react-app-bar/#system-MenuAppBar.tsx
// https://mui.com/material-ui/react-app-bar/#system-ResponsiveAppBar.tsx

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";

import { useI18n } from "@/context/i18n";

import { Language } from "@mui/icons-material";
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";

const languages = [
  { label: "繁體中文", lang: "zh-TW" },
  { label: "English", lang: "en" },
  { label: "日本語", lang: "ja" },
  { label: "한국어", lang: "ko" },
  { label: "简体中文", lang: "zh-CN" },
];

const StyledMenu = styled(Menu)(({ theme }) => ({
  marginTop: 48,
  [theme.breakpoints.up("sm")]: {
    marginTop: 56,
  },
}));

const MenuAppBar = () => {
  const [anchorElLanguage, setAnchorElLanguage] = useState<null | HTMLElement>(
    null,
  );

  const pathname = usePathname();
  const { lang: currentLang } = useParams();

  const dict = useI18n();

  const switchPath = (lang: string) => {
    const rest = pathname.split("/").slice(2).join("/");

    return `/${lang}${rest ? `/${rest}` : ""}`;
  };

  const handleOpenLanguageMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElLanguage(event.currentTarget);

  const handleCloseLanguageMenu = () => setAnchorElLanguage(null);

  return (
    <>
      <Tooltip title={dict.appBar.languageSwitcher}>
        <IconButton
          aria-label="language"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          color="inherit"
          onClick={handleOpenLanguageMenu}
        >
          <Language />
        </IconButton>
      </Tooltip>
      <StyledMenu
        id="menu-appbar"
        anchorEl={anchorElLanguage}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(anchorElLanguage)}
        onClose={handleCloseLanguageMenu}
      >
        {languages.map(({ label, lang }) => (
          <MenuItem
            component={Link}
            href={switchPath(lang)}
            key={lang}
            onClick={handleCloseLanguageMenu}
            replace
            selected={lang === currentLang}
          >
            {label}
          </MenuItem>
        ))}
      </StyledMenu>
    </>
  );
};

export default MenuAppBar;
