import { GridFilterInputValue } from "@mui/x-data-grid";

const DateFilterInputValue = (
  props: React.ComponentProps<typeof GridFilterInputValue>,
) => <GridFilterInputValue {...props} type="date" />;

export default DateFilterInputValue;
