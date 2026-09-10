// https://main--5fc05e08a4a65d0021ae0bf2.chromatic.com/?path=/docs/react-sortable--docs

import { createContext, useContext } from "react";

import { useSortable } from "@dnd-kit/react/sortable";

import { DragIndicator } from "@mui/icons-material";
import { styled } from "@mui/material";
import type { GridRowProps } from "@mui/x-data-grid";
import { GridRow } from "@mui/x-data-grid";

const StyledDragIndicator = styled(DragIndicator)({ cursor: "grab" });

const StyledGridRow = styled(GridRow, {
  shouldForwardProp: (prop) => prop !== "isDragging",
})<{ isDragging?: boolean }>(({ isDragging }) => ({
  opacity: isDragging ? 0.5 : 1,
}));

const DragHandleContext = createContext<((el: Element | null) => void) | null>(
  null,
);

export const DragHandle = () => {
  const handleRef = useContext(DragHandleContext);

  return (
    <StyledDragIndicator color="action" fontSize="small" ref={handleRef} />
  );
};

export const Sortable = ({ index, rowId, ...props }: GridRowProps) => {
  const { handleRef, isDragging, ref } = useSortable({
    id: rowId,
    index,
  });

  return (
    <DragHandleContext.Provider value={handleRef}>
      <StyledGridRow
        index={index}
        isDragging={isDragging}
        ref={ref}
        rowId={rowId}
        {...props}
      />
    </DragHandleContext.Provider>
  );
};
