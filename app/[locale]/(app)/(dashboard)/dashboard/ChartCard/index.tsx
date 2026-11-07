"use client";

import { useRouter } from "@/i18n/navigation";

import { Skeleton, Typography } from "@mui/material";

import {
  StyledCard,
  StyledCardActionArea,
  StyledCardContent,
} from "@/app/[locale]/(app)/(dashboard)/dashboard/styled";

interface ChartCardProps {
  chartHeight?: number;
  children?: React.ReactNode;
  href?: string;
  loading?: boolean;
  period?: string;
  title: string;
  value?: React.ReactNode;
}

const ChartCard = ({
  chartHeight,
  children,
  href,
  loading = false,
  period,
  title,
  value,
}: ChartCardProps) => {
  const router = useRouter();

  const content = (
    <StyledCardContent>
      <Typography component="h3" variant="subtitle2">
        {title}
      </Typography>
      {loading
        ? value !== undefined && (
            <Typography component="p" variant="h4">
              <Skeleton width={120} />
            </Typography>
          )
        : value}
      <Typography color="textSecondary" variant="caption">
        {period ?? <Skeleton width={60} />}
      </Typography>
      {loading
        ? chartHeight !== undefined && (
            <Skeleton height={chartHeight} variant="rounded" />
          )
        : children}
    </StyledCardContent>
  );

  return (
    <StyledCard variant="outlined">
      {href ? (
        <StyledCardActionArea onClick={() => router.push(href)}>
          {content}
        </StyledCardActionArea>
      ) : (
        content
      )}
    </StyledCard>
  );
};

export default ChartCard;
