"use client";

import { startTransition, useOptimistic } from "react";

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
  backgroundColor: theme.vars.palette.background.paper,
  transition: theme.transitions.create("background-color"),

  [`& .${toggleButtonGroupClasses.grouped}`]: {
    transition: theme.transitions.create([
      "background-color",
      "border-color",
      "color",
    ]),
  },

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

  // https://nextjs.org/docs/app/guides/interactive-apps#step-3-filter-with-pending-feedback
  const [optimisticRange, setOptimisticRange] = useOptimistic(range);
  const [isPending, setIsPending] = useOptimistic(false);

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

    startTransition(() => {
      setOptimisticRange(value);
      setIsPending(true);
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <StyledToggleButtonGroup
      data-pending={isPending ? "" : undefined}
      exclusive
      fullWidth
      onChange={handleChange}
      size="small"
      value={optimisticRange}
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
