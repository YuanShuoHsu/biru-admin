// https://mui.com/material-ui/react-transfer-list/#SelectAllTransferList.tsx

"use client";

import { useTranslations } from "next-intl";
import { Fragment, useState } from "react";

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import {
  Button,
  Card,
  CardHeader,
  Checkbox,
  type ChipProps,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  type ListProps,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const ContainerGrid = styled(Grid)(({ theme }) => ({
  justifyContent: "center",
  alignItems: "center",

  [theme.breakpoints.up("md")]: {
    flexWrap: "nowrap",
  },
}));

const ColumnGrid = styled(Grid)({
  alignSelf: "stretch",
});

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "color",
})<{ color?: ChipProps["color"] }>(({ color, theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",

  ...(color &&
    color !== "default" && {
      borderTop: `3px solid ${theme.vars.palette[color].main}`,
    }),
}));

const StyledCardHeader = styled(CardHeader, {
  shouldForwardProp: (prop) => prop !== "color",
})<{ color?: ChipProps["color"] }>(({ color, theme }) =>
  color && color !== "default"
    ? {
        backgroundColor: `rgba(${theme.vars.palette[color].mainChannel} / 0.12)`,
      }
    : {},
);

const StyledList = styled(List, {
  shouldForwardProp: (prop) => prop !== "empty",
})<ListProps<"div"> & { empty: boolean }>(({ empty, theme }) =>
  empty ? { padding: theme.spacing(2) } : {},
);

const not = (a: readonly string[], b: readonly string[]) =>
  a.filter((value) => !b.includes(value));

const intersection = (a: readonly string[], b: readonly string[]) =>
  a.filter((value) => b.includes(value));

const union = (a: readonly string[], b: readonly string[]) => [
  ...a,
  ...not(b, a),
];

interface SelectAllTransferListColumn<T> {
  color?: ChipProps["color"];
  emptyLabel: string;
  items: T[];
  size?: React.ComponentProps<typeof Grid>["size"];
  title: string;
}

export interface SelectAllTransferListAction {
  disabled?: (ids: string[]) => boolean;
  onTransfer: (ids: string[]) => boolean | Promise<boolean>;
  title: string;
}

interface SelectAllTransferListProps<
  T extends {
    id: string;
    primary: React.ReactNode;
    secondary?: React.ReactNode;
  },
> {
  columns: SelectAllTransferListColumn<T>[];
  renderAction?: (item: T) => React.ReactNode;
  transferActions: [SelectAllTransferListAction, SelectAllTransferListAction][];
}

const SelectAllTransferList = <
  T extends {
    id: string;
    primary: React.ReactNode;
    secondary?: React.ReactNode;
  },
>({
  columns,
  renderAction,
  transferActions,
}: SelectAllTransferListProps<T>) => {
  const [checked, setChecked] = useState<string[]>([]);

  const tCommon = useTranslations("common");

  const handleToggle = (id: string) => {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const numberOfChecked = (ids: string[]) => intersection(checked, ids).length;

  const handleToggleAll = (ids: string[]) => {
    setChecked((prev) =>
      numberOfChecked(ids) === ids.length ? not(prev, ids) : union(prev, ids),
    );
  };

  const handleTransfer = async (
    action: SelectAllTransferListAction,
    ids: string[],
  ) => {
    if (!(await action.onTransfer(ids))) return;

    setChecked((prev) => not(prev, ids));
  };

  const customList = (column: SelectAllTransferListColumn<T>) => {
    const ids = column.items.map((item) => item.id);

    return (
      <StyledCard color={column.color} variant="outlined">
        <StyledCardHeader
          avatar={
            <Checkbox
              checked={numberOfChecked(ids) === ids.length && ids.length !== 0}
              disabled={ids.length === 0}
              indeterminate={
                numberOfChecked(ids) !== ids.length &&
                numberOfChecked(ids) !== 0
              }
              onClick={() => handleToggleAll(ids)}
              slotProps={{
                input: { "aria-label": `${column.title} - select all` },
              }}
            />
          }
          color={column.color}
          subheader={tCommon("selectedCount", {
            checked: numberOfChecked(ids),
            total: ids.length,
          })}
          title={column.title}
        />
        <Divider />
        <StyledList
          component="div"
          dense
          disablePadding
          empty={column.items.length === 0}
          role="list"
        >
          {column.items.length === 0 && (
            <Typography
              color="text.secondary"
              textAlign="center"
              variant="body2"
            >
              {column.emptyLabel}
            </Typography>
          )}
          {column.items.map((item, index) => {
            const labelId = `transfer-list-item-${item.id}-label`;

            return (
              <ListItem
                component="div"
                disablePadding
                divider={index < column.items.length - 1}
                key={item.id}
                role="listitem"
                secondaryAction={renderAction?.(item)}
              >
                <ListItemButton onClick={() => handleToggle(item.id)}>
                  <ListItemIcon>
                    <Checkbox
                      checked={checked.includes(item.id)}
                      disableRipple
                      slotProps={{ input: { "aria-labelledby": labelId } }}
                      tabIndex={-1}
                    />
                  </ListItemIcon>
                  <ListItemText
                    id={labelId}
                    primary={item.primary}
                    secondary={item.secondary}
                    slotProps={{
                      primary: { component: "div" },
                      secondary: { component: "div" },
                    }}
                    sx={{ minWidth: 0 }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </StyledList>
      </StyledCard>
    );
  };

  return (
    <ContainerGrid container spacing={2}>
      {columns.map((column, index) => (
        <Fragment key={column.title}>
          <ColumnGrid size={column.size}>{customList(column)}</ColumnGrid>
          {index < columns.length - 1 && (
            <Stack gap={2}>
              {[
                {
                  action: transferActions[index][0],
                  Icon: ChevronRight,
                  sourceItems: columns[index].items,
                },
                {
                  action: transferActions[index][1],
                  Icon: ChevronLeft,
                  sourceItems: columns[index + 1].items,
                },
              ].map(({ action, Icon, sourceItems }) => {
                const ids = intersection(
                  checked,
                  sourceItems.map((item) => item.id),
                );

                return (
                  <Tooltip key={action.title} title={action.title}>
                    <span>
                      <Button
                        aria-label={action.title}
                        disabled={ids.length === 0 || !!action.disabled?.(ids)}
                        onClick={() => handleTransfer(action, ids)}
                        size="small"
                        variant="outlined"
                      >
                        <Icon />
                      </Button>
                    </span>
                  </Tooltip>
                );
              })}
            </Stack>
          )}
        </Fragment>
      ))}
    </ContainerGrid>
  );
};

export default SelectAllTransferList;
