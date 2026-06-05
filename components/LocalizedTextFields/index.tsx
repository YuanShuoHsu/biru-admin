"use client";

import { startTransition, useEffect, useState } from "react";

import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

import type { TextFieldProps } from "@mui/material";
import { Badge, Stack, Tab, Tabs, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    right: theme.spacing(-1.25),
    top: theme.spacing(0.5),
  },
}));

interface LocalizedTextFieldsProps {
  fields: (lang: Locale) => TextFieldProps[];
}

const LocalizedTextFields = ({ fields }: LocalizedTextFieldsProps) => {
  const [activeLocale, setActiveLocale] = useState<Locale>(
    routing.defaultLocale,
  );

  const isComplete = (lang: Locale) => {
    const requiredFields = fields(lang).filter(({ required }) => required);

    return (
      requiredFields.length > 0 &&
      requiredFields.every(({ value }) => String(value || "").trim())
    );
  };

  const isError = (lang: Locale) =>
    fields(lang).some(
      ({ error, value }) => error && !String(value || "").trim(),
    );

  const firstErrorLocale = routing.locales.find(isError);

  useEffect(() => {
    if (firstErrorLocale)
      startTransition(() => setActiveLocale(firstErrorLocale));
  }, [firstErrorLocale]);

  return (
    <Stack width="100%" gap={2}>
      <Tabs
        aria-label="language tabs"
        onChange={(_event, value: Locale) => setActiveLocale(value)}
        scrollButtons="auto"
        value={activeLocale}
        variant="scrollable"
      >
        {routing.locales.map((lang) => (
          <Tab
            key={lang}
            label={
              <StyledBadge
                color={isError(lang) ? "error" : "primary"}
                invisible={!isError(lang) && !isComplete(lang)}
                variant="dot"
              >
                {lang}
              </StyledBadge>
            }
            value={lang}
          />
        ))}
      </Tabs>
      {fields(activeLocale).map((props, index) => (
        <TextField key={index} {...props} />
      ))}
    </Stack>
  );
};

export default LocalizedTextFields;
