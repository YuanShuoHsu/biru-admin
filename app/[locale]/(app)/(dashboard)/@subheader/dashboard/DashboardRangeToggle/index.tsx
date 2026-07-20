"use client";

import { useTranslations } from "next-intl";

import {
  DASHBOARD_RANGES,
  type DashboardRange,
} from "@/app/[locale]/(app)/(dashboard)/dashboard/definitions";

import { usePathname, useRouter } from "@/i18n/navigation";

import {
  ToggleButton,
  ToggleButtonGroup,
  styled,
  toggleButtonGroupClasses,
} from "@mui/material";

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    width: "auto",

    [`& .${toggleButtonGroupClasses.grouped}`]: {
      width: "auto",
    },
  },
}));

interface DashboardRangeToggleProps {
  organizationSlug: string;
  range: DashboardRange;
}

const DashboardRangeToggle = ({
  organizationSlug,
  range,
}: DashboardRangeToggleProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const tDashboard = useTranslations("dashboard");

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: DashboardRange | null,
  ) => {
    if (!value) return;

    const params = new URLSearchParams({
      ...(organizationSlug && { organization: organizationSlug }),
      range: value,
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <StyledToggleButtonGroup
      exclusive
      fullWidth
      onChange={handleChange}
      size="small"
      value={range}
    >
      {(Object.keys(DASHBOARD_RANGES) as DashboardRange[]).map((value) => (
        <ToggleButton key={value} value={value}>
          {tDashboard(`stats.period.${value}`)}
        </ToggleButton>
      ))}
    </StyledToggleButtonGroup>
  );
};

export default DashboardRangeToggle;
