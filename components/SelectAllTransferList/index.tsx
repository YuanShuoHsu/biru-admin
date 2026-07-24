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
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const ContainerGrid = styled(Grid)(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  justifyContent: "center",
  alignItems: "center",

  [theme.breakpoints.up("md")]: {
    flexWrap: "nowrap",
  },
}));

const ColumnGrid = styled(Grid)({
  alignSelf: "stretch",
});

const not = (a: readonly string[], b: readonly string[]) =>
  a.filter((value) => !b.includes(value));

const intersection = (a: readonly string[], b: readonly string[]) =>
  a.filter((value) => b.includes(value));

const union = (a: readonly string[], b: readonly string[]) => [
  ...a,
  ...not(b, a),
];

interface SelectAllTransferListColumn<T> {
  emptyLabel: string;
  items: T[];
  size?: React.ComponentProps<typeof Grid>["size"];
  title: string;
}

interface SelectAllTransferListAction {
  ariaLabel: string;
  onClick: (ids: string[]) => void | Promise<void>;
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
    await action.onClick(ids);

    setChecked((prev) => not(prev, ids));
  };

  const customList = (column: SelectAllTransferListColumn<T>) => {
    const ids = column.items.map((item) => item.id);

    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        variant="outlined"
      >
        <CardHeader
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
          subheader={tCommon("selectedCount", {
            checked: numberOfChecked(ids),
            total: ids.length,
          })}
          title={column.title}
        />
        <Divider />
        <List
          component="div"
          dense
          role="list"
          sx={{
            overflow: "auto",
            ...(column.items.length === 0 && { padding: 2 }),
          }}
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
          {column.items.map((item) => {
            const labelId = `transfer-list-item-${item.id}-label`;

            return (
              <ListItemButton
                key={item.id}
                onClick={() => handleToggle(item.id)}
                role="listitem"
              >
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
                />
                {renderAction?.(item)}
              </ListItemButton>
            );
          })}
        </List>
      </Card>
    );
  };

  return (
    <ContainerGrid container spacing={2}>
      {columns.map((column, index) => (
        <Fragment key={column.title}>
          <ColumnGrid size={column.size}>
            {customList(column)}
          </ColumnGrid>
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
                  <Tooltip key={action.ariaLabel} title={action.ariaLabel}>
                    <span>
                      <Button
                        aria-label={action.ariaLabel}
                        disabled={ids.length === 0}
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
