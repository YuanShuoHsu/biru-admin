// https://mui.com/material-ui/react-dialog/#system-AlertDialogSlide.tsx

import React from "react";

import Slide from "@mui/material/Slide";
import type { TransitionProps } from "@mui/material/transitions";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
): React.JSX.Element {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default Transition;
