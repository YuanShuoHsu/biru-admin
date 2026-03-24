// https://mui.com/material-ui/react-tabs/#BasicTabs.tsx

export const a11yProps = (index: number) => ({
  id: `simple-tab-${index}`,
  "aria-controls": `simple-tabpanel-${index}`,
});
