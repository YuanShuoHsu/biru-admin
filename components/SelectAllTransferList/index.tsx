// https://mui.com/material-ui/react-transfer-list/#SelectAllTransferList.tsx

"use client";

import { useTranslations } from "next-intl";
import { Fragment, useState } from "react";

import { ChevronLeft, ChevronRight, ExpandMore } from "@mui/icons-material";
import {
  Button,
  Card,
  CardHeader,
  Checkbox,
  type ChipProps,
  Collapse,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  type ListProps,
  ListSubheader,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, darken, lighten, styled } from "@mui/material/styles";

const ContainerGrid = styled(Grid)({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
});

const ColumnGrid = styled(Grid)({
  alignSelf: "stretch",
});

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "color" && prop !== "expanded",
})<{ color?: ChipProps["color"]; expanded: boolean | null }>(
  ({ color, expanded, theme }) => ({
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",

    ...(expanded !== null && {
      [theme.breakpoints.up("md")]: {
        maxHeight: expanded
          ? "100%"
          : `calc(${theme.spacing(4)} + 2 * ${theme.typography.body2.lineHeight} * ${theme.typography.body2.fontSize} + 4px)`,
        transition: theme.transitions.create([
          "background-color",
          "border-color",
          "box-shadow",
          "max-height",
        ]),
      },
    }),

    ...(color && {
      borderTop: `3px solid ${color === "default" ? theme.vars.palette.grey[500] : theme.vars.palette[color].main}`,
    }),
  }),
);

const StyledCardHeader = styled(CardHeader, {
  shouldForwardProp: (prop) => prop !== "color",
})<{ color?: ChipProps["color"] }>(({ color, onClick, theme }) => ({
  "& .MuiCardHeader-action": {
    alignSelf: "center",
    margin: 0,
  },

  ...(onClick && { cursor: "pointer" }),

  ...(color && {
    transition: theme.transitions.create("background-color"),
    backgroundColor:
      color === "default"
        ? theme.vars.palette.action.selected
        : `rgba(${theme.vars.palette[color].mainChannel} / 0.12)`,
  }),
}));

const ActionGrid = styled(Grid)({
  alignSelf: "stretch",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
});

const ActionStack = styled(Stack)(({ theme }) => ({
  justifyContent: "center",
  alignItems: "center",
  gap: theme.spacing(2),

  [theme.breakpoints.up("md")]: {
    position: "sticky",
    top: "50%",
    bottom: "50%",
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  svg: { transform: "rotate(90deg)" },

  [theme.breakpoints.up("md")]: {
    svg: { transform: "none" },
  },
}));

const StyledList = styled(List, {
  shouldForwardProp: (prop) => prop !== "empty",
})<ListProps<"div"> & { empty: boolean }>(({ empty, theme }) =>
  empty ? { padding: theme.spacing(2) } : {},
);

const StyledListSubheader = styled(ListSubheader<"div">, {
  shouldForwardProp: (prop) => prop !== "groupColor",
})<{ groupColor?: string }>(({ groupColor, theme }) => ({
  padding: theme.spacing(0.5, 1.25),
  lineHeight: "inherit",
  color: theme.palette.primary.main,
  backgroundColor: lighten(theme.palette.primary.light, 0.85),

  ...theme.applyStyles("dark", {
    backgroundColor: darken(theme.palette.primary.main, 0.8),
  }),

  ...(groupColor && {
    borderLeft: `4px solid ${groupColor}`,
    color: theme.vars.palette.text.primary,
    backgroundColor: alpha(groupColor, 0.16),

    ...theme.applyStyles("dark", {
      backgroundColor: alpha(groupColor, 0.24),
    }),
  }),
}));

const StyledListItemText = styled(ListItemText)({
  minWidth: 0,
});

const ExpandIcon = styled(ExpandMore, {
  shouldForwardProp: (prop) => prop !== "expanded",
})<{ expanded: boolean }>(({ expanded, theme }) => ({
  transform: expanded ? "rotate(180deg)" : "none",
  transition: theme.transitions.create(["color", "transform"]),
}));

const not = (a: readonly string[], b: readonly string[]) =>
  a.filter((value) => !b.includes(value));

const intersection = (a: readonly string[], b: readonly string[]) =>
  a.filter((value) => b.includes(value));

const union = (a: readonly string[], b: readonly string[]) => [
  ...a,
  ...not(b, a),
];

interface SelectAllTransferListGroup {
  color?: string;
  label: string;
}

interface SelectAllTransferListColumn<T> {
  color?: ChipProps["color"];
  defaultExpanded?: boolean;
  emptyLabel: string;
  items: T[];
  size?: React.ComponentProps<typeof Grid>["size"];
  subheader?: string;
  title: string;
}

export interface SelectAllTransferListAction {
  disabled?: (ids: string[]) => boolean;
  onTransfer: (ids: string[]) => boolean | Promise<boolean>;
  title: string;
}

interface SelectAllTransferListProps<
  T extends {
    group?: SelectAllTransferListGroup;
    id: string;
    primary: React.ReactNode;
    secondary?: React.ReactNode;
  },
> {
  columns: SelectAllTransferListColumn<T>[];
  renderAction?: (item: T) => React.ReactNode;
  transferActions: (
    | [SelectAllTransferListAction, SelectAllTransferListAction]
    | null
  )[];
}

const SelectAllTransferList = <
  T extends {
    group?: SelectAllTransferListGroup;
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      columns.map(({ defaultExpanded, title }) => [
        title,
        defaultExpanded !== false,
      ]),
    ),
  );

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

  const renderList = (
    items: T[],
    color: ChipProps["color"],
    selectable: boolean,
    emptyLabel: string,
  ) => (
    <StyledList
      component="div"
      dense
      disablePadding
      empty={items.length === 0}
      role="list"
    >
      {items.length === 0 && (
        <Typography align="center" color="textSecondary" variant="body2">
          {emptyLabel}
        </Typography>
      )}
      {items.map((item, index) => {
        const labelId = `transfer-list-item-${item.id}-label`;
        const itemText = (
          <StyledListItemText
            id={labelId}
            primary={item.primary}
            secondary={item.secondary}
            slotProps={{
              primary: { component: "div" },
              secondary: { component: "div" },
            }}
          />
        );

        return (
          <Fragment key={item.id}>
            {item.group &&
              item.group.label !== items[index - 1]?.group?.label && (
                <StyledListSubheader
                  component="div"
                  disableSticky
                  groupColor={item.group.color}
                >
                  {item.group.label}
                </StyledListSubheader>
              )}
            <ListItem
              component="div"
              disablePadding={selectable}
              divider={
                index < items.length - 1 &&
                items[index + 1].group?.label === item.group?.label
              }
              role="listitem"
              secondaryAction={renderAction?.(item)}
            >
              {selectable ? (
                <ListItemButton onClick={() => handleToggle(item.id)}>
                  <ListItemIcon>
                    <Checkbox
                      checked={checked.includes(item.id)}
                      color={color}
                      disableRipple
                      slotProps={{ input: { "aria-labelledby": labelId } }}
                      tabIndex={-1}
                    />
                  </ListItemIcon>
                  {itemText}
                </ListItemButton>
              ) : (
                itemText
              )}
            </ListItem>
          </Fragment>
        );
      })}
    </StyledList>
  );

  const customList = (index: number) => {
    const { color, defaultExpanded, emptyLabel, items, subheader, title } =
      columns[index];
    const ids = items.map((item) => item.id);
    const selectable = !!transferActions[index - 1] || !!transferActions[index];

    return (
      <StyledCard
        color={color}
        expanded={defaultExpanded === undefined ? null : expanded[title]}
        variant="outlined"
      >
        <StyledCardHeader
          action={
            defaultExpanded !== undefined && (
              <ExpandIcon expanded={expanded[title]} />
            )
          }
          avatar={
            selectable && (
              <Checkbox
                checked={
                  numberOfChecked(ids) === ids.length && ids.length !== 0
                }
                color={color}
                disabled={ids.length === 0}
                indeterminate={
                  numberOfChecked(ids) !== ids.length &&
                  numberOfChecked(ids) !== 0
                }
                onClick={() => handleToggleAll(ids)}
                slotProps={{
                  input: { "aria-label": `${title} - select all` },
                }}
              />
            )
          }
          color={color}
          onClick={
            defaultExpanded !== undefined
              ? () =>
                  setExpanded((prev) => ({ ...prev, [title]: !prev[title] }))
              : undefined
          }
          slotProps={{
            subheader: { variant: "body2" },
            title: { variant: "body2" },
          }}
          subheader={
            subheader ||
            tCommon("selectedCount", {
              checked: numberOfChecked(ids),
              total: ids.length,
            })
          }
          title={title}
        />
        <Collapse in={expanded[title]} unmountOnExit>
          <Divider />
          {renderList(items, color, selectable, emptyLabel)}
        </Collapse>
      </StyledCard>
    );
  };

  return (
    <ContainerGrid
      columns={{ xs: 12, md: 12 + transferActions.filter(Boolean).length }}
      container
      spacing={2}
    >
      {columns.map((column, index) => {
        const transferAction = transferActions[index];

        return (
          <Fragment key={column.title}>
            <ColumnGrid size={column.size}>{customList(index)}</ColumnGrid>
            {transferAction && (
              <ActionGrid size={{ xs: 12, md: 1 }}>
                <ActionStack direction={{ xs: "row-reverse", md: "column" }}>
                  {[
                    {
                      action: transferAction[0],
                      Icon: ChevronRight,
                      sourceItems: column.items,
                    },
                    {
                      action: transferAction[1],
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
                          <ActionButton
                            aria-label={action.title}
                            disabled={
                              ids.length === 0 || !!action.disabled?.(ids)
                            }
                            onClick={() => handleTransfer(action, ids)}
                            size="small"
                            variant="outlined"
                          >
                            <Icon />
                          </ActionButton>
                        </span>
                      </Tooltip>
                    );
                  })}
                </ActionStack>
              </ActionGrid>
            )}
          </Fragment>
        );
      })}
    </ContainerGrid>
  );
};

export default SelectAllTransferList;
