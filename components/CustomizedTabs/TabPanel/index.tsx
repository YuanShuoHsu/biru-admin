import { Box } from "@mui/material";

interface TabPanelProps {
  children: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, index, value, ...other }: TabPanelProps) => (
  <Box
    aria-labelledby={`vertical-tab-${index}`}
    flex={1}
    hidden={value !== index}
    id={`vertical-tabpanel-${index}`}
    role="tabpanel"
    {...other}
  >
    {value === index && <>{children}</>}
  </Box>
);

export default TabPanel;
