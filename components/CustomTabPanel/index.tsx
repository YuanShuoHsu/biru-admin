// https://mui.com/material-ui/react-tabs/#BasicTabs.tsx

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

interface CustomTabPanelProps {
  children: React.ReactNode;
  index: number;
  value: number;
}

const CustomTabPanel = ({
  children,
  index,
  value,
  ...other
}: CustomTabPanelProps) => (
  <StyledBox
    aria-labelledby={`simple-tab-${index}`}
    hidden={value !== index}
    id={`simple-tabpanel-${index}`}
    role="tabpanel"
    {...other}
  >
    {value === index && <>{children}</>}
  </StyledBox>
);

export default CustomTabPanel;
