// https://github.com/vercel/next.js/tree/canary/examples/i18n-routing
// https://mui.com/material-ui/react-app-bar/#system-MenuAppBar.tsx
// https://mui.com/material-ui/react-app-bar/#system-ResponsiveAppBar.tsx
// https://better-auth.com/docs/concepts/users-accounts#update-user
// https://next-intl.dev/docs/routing/navigation#userouter
// https://react.dev/reference/react/useTransition#react-doesnt-treat-my-state-update-after-await-as-a-transition

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useState, useTransition } from "react";

import { LocaleEnum } from "@/enums/Locale";

import { useHref } from "@/hooks/useHref";
import { useSession } from "@/hooks/useSession";

import { useRouter } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { Language } from "@mui/icons-material";
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledMenu = styled(Menu)(({ theme }) => ({
  marginTop: theme.spacing(6),

  [theme.breakpoints.up("sm")]: {
    marginTop: theme.spacing(7),
  },
}));

const localeLabels: Record<Locale, string> = {
  [LocaleEnum.ZhTW]: "繁體中文",
  [LocaleEnum.En]: "English",
  [LocaleEnum.Ja]: "日本語",
  [LocaleEnum.Ko]: "한국어",
  [LocaleEnum.ZhCN]: "简体中文",
};

const languages = routing.locales.map((locale) => ({
  locale,
  label: localeLabels[locale],
}));

const LanguageMenu = () => {
  const [anchorElLanguage, setAnchorElLanguage] = useState<null | HTMLElement>(
    null,
  );
  const open = Boolean(anchorElLanguage);

  const href = useHref();

  const currentLocale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const session = useSession();

  const { enqueueSnackbar } = useSnackbar();

  const tAppBar = useTranslations("appBar");

  const handleClick = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElLanguage(event.currentTarget);

  const handleClose = () => setAnchorElLanguage(null);

  // 等寫入完成再換頁，新頁面在伺服器端取得的 session 才會是新語系
  const handleSelect = (locale: Locale) =>
    startTransition(async () => {
      if (
        session &&
        !session.session.impersonatedBy &&
        session.user.lang !== locale
      )
        await authClient.updateUser({
          lang: locale,
          fetchOptions: {
            onError: ({ error: { message } }) => {
              enqueueSnackbar(message, {
                variant: "error",
              });
            },
          },
        });

      startTransition(() => router.replace(href, { locale }));
    });

  return (
    <>
      <Tooltip title={tAppBar("languageSwitcher")}>
        <IconButton
          aria-controls={open ? "language-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-haspopup="true"
          aria-label="language"
          color="inherit"
          loading={isPending}
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
        id="language-menu"
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
            key={locale}
            onClick={() => handleSelect(locale)}
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
