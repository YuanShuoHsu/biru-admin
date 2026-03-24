// https://mui.com/material-ui/react-tabs/#BasicTabs.tsx

import { Box } from "@mui/material";

interface TabPanelProps {
  children: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, index, value, ...other }: TabPanelProps) => (
  <Box
    aria-labelledby={`simple-tab-${index}`}
    display="flex"
    flexDirection="column"
    gap={2}
    hidden={value !== index}
    id={`simple-tabpanel-${index}`}
    role="tabpanel"
    {...other}
  >
    {value === index && <>{children}</>}
  </Box>
);

export default TabPanel;
