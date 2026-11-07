// https://github.com/mui/material-ui/blob/master/docs/data/material/getting-started/templates/dashboard/components/SessionsChart.tsx
const AreaGradient = ({
  color,
  horizontal,
  id,
}: {
  color: string;
  horizontal?: boolean;
  id: string;
}) => (
  <defs>
    <linearGradient
      id={id}
      x1={horizontal ? "100%" : "50%"}
      y1={horizontal ? "50%" : "0%"}
      x2={horizontal ? "0%" : "50%"}
      y2={horizontal ? "50%" : "100%"}
    >
      <stop offset="0%" stopColor={color} stopOpacity={0.5} />
      <stop offset="100%" stopColor={color} stopOpacity={0} />
    </linearGradient>
  </defs>
);

export default AreaGradient;
