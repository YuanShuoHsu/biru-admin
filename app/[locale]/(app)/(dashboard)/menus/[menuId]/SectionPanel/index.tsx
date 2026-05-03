"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";

import {
  Add,
  Delete,
  Edit,
  Folder,
  FolderOpen,
  FolderSpecial,
} from "@mui/icons-material";
import {
  Box,
  Collapse,
  DialogContentText,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminMenuSection } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

import CreateSectionDialog from "../CreateSectionDialog";
import UpdateSectionDialog from "../UpdateSectionDialog";

interface SectionNode extends AdminMenuSection {
  children: SectionNode[];
}

function buildTree(sections: AdminMenuSection[]): SectionNode[] {
  const map = new Map<string, SectionNode>();

  for (const section of sections) {
    map.set(section.id, { ...section, children: [] });
  }

  const roots: SectionNode[] = [];

  for (const node of map.values()) {
    if (node.parentSectionId && map.has(node.parentSectionId)) {
      map.get(node.parentSectionId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

interface SectionTreeItemProps {
  node: SectionNode;
  depth: number;
  selectedSectionId: string | null;
  onSelectSection: (id: string | null) => void;
  onCreateSubsection: (parentId: string) => void;
  onUpdateSection: (section: AdminMenuSection) => void;
  onDeleteSection: (section: AdminMenuSection) => void;
  addSubsectionLabel: string;
  editLabel: string;
  deleteLabel: string;
}

const SectionTreeItem = ({
  node,
  depth,
  selectedSectionId,
  onSelectSection,
  onCreateSubsection,
  onUpdateSection,
  onDeleteSection,
  addSubsectionLabel,
  editLabel,
  deleteLabel,
}: SectionTreeItemProps) => {
  const isSelected = selectedSectionId === node.id;

  return (
    <>
      <ListItemButton
        selected={isSelected}
        onClick={() => onSelectSection(node.id)}
        sx={{ pl: 2 + depth * 2 }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          {isSelected ? (
            <FolderOpen fontSize="small" />
          ) : (
            <Folder fontSize="small" />
          )}
        </ListItemIcon>
        <ListItemText
          primary={node.name}
          primaryTypographyProps={{ noWrap: true, variant: "body2" }}
          sx={{ mr: 1 }}
        />
        <Stack direction="row" gap={0.25} onClick={(e) => e.stopPropagation()}>
          <Tooltip title={addSubsectionLabel}>
            <IconButton
              size="small"
              onClick={() => onCreateSubsection(node.id)}
            >
              <Add fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title={editLabel}>
            <IconButton size="small" onClick={() => onUpdateSection(node)}>
              <Edit fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title={deleteLabel}>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDeleteSection(node)}
            >
              <Delete fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Stack>
      </ListItemButton>
      {node.children.length > 0 && (
        <Collapse in unmountOnExit>
          <List disablePadding dense>
            {node.children.map((child) => (
              <SectionTreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedSectionId={selectedSectionId}
                onSelectSection={onSelectSection}
                onCreateSubsection={onCreateSubsection}
                onUpdateSection={onUpdateSection}
                onDeleteSection={onDeleteSection}
                addSubsectionLabel={addSubsectionLabel}
                editLabel={editLabel}
                deleteLabel={deleteLabel}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

interface SectionPanelProps {
  menuId: string;
  sections: AdminMenuSection[];
  selectedSectionId: string | null;
  onSelectSection: (sectionId: string | null) => void;
  onMutate: () => unknown;
}

const SectionPanel = ({
  menuId,
  sections,
  selectedSectionId,
  onSelectSection,
  onMutate,
}: SectionPanelProps) => {
  const { setDialog } = useDialogStore((state) => state);
  const tMenus = useTranslations("menus");

  const tree = useMemo(() => buildTree(sections), [sections]);

  const hasUnassigned = sections.some((s) => s.parentSectionId === null);

  const handleCreateSection = useCallback(
    (parentSectionId?: string | null) => {
      setDialog({
        content: (
          <CreateSectionDialog
            menuId={menuId}
            parentSectionId={parentSectionId}
            onSuccess={onMutate}
          />
        ),
        formId: "create-section-form",
        open: true,
        title: parentSectionId
          ? tMenus("sections.actions.addSubsection.title")
          : tMenus("sections.actions.createSection.title"),
      });
    },
    [menuId, onMutate, setDialog, tMenus],
  );

  const handleUpdateSection = useCallback(
    (section: AdminMenuSection) => {
      setDialog({
        content: <UpdateSectionDialog section={section} onSuccess={onMutate} />,
        formId: "update-section-form",
        open: true,
        title: tMenus("sections.actions.updateSection.title"),
      });
    },
    [onMutate, setDialog, tMenus],
  );

  const handleDeleteSection = useCallback(
    ({ id, name }: AdminMenuSection) => {
      setDialog({
        content: (
          <DialogContentText>
            {tMenus.rich("sections.actions.deleteSection.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/menu-sections/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tMenus("sections.actions.deleteSection.success", { name }),
              { variant: "success" },
            );

            if (selectedSectionId === id) onSelectSection(null);
            onMutate();
          } catch {
            enqueueSnackbar(tMenus("sections.actions.deleteSection.title"), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tMenus("sections.actions.deleteSection.title"),
      });
    },
    [onMutate, onSelectSection, selectedSectionId, setDialog, tMenus],
  );

  return (
    <Box
      sx={{
        width: 260,
        flexShrink: 0,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}
      >
        <Typography variant="subtitle2">{tMenus("sections.label")}</Typography>
        <Tooltip title={tMenus("sections.actions.createSection.title")}>
          <IconButton size="small" onClick={() => handleCreateSection(null)}>
            <Add fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <List disablePadding dense sx={{ overflowY: "auto", flex: 1 }}>
        <ListItemButton
          selected={selectedSectionId === null}
          onClick={() => onSelectSection(null)}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <FolderOpen fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={tMenus("sections.allItems")} />
        </ListItemButton>

        {hasUnassigned && (
          <ListItemButton
            selected={selectedSectionId === "unassigned"}
            onClick={() => onSelectSection("unassigned")}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <FolderSpecial fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={tMenus("sections.unassigned")}
              primaryTypographyProps={{ color: "text.secondary" }}
            />
          </ListItemButton>
        )}

        {tree.map((node) => (
          <SectionTreeItem
            key={node.id}
            node={node}
            depth={0}
            selectedSectionId={selectedSectionId}
            onSelectSection={onSelectSection}
            onCreateSubsection={handleCreateSection}
            onUpdateSection={handleUpdateSection}
            onDeleteSection={handleDeleteSection}
            addSubsectionLabel={tMenus("sections.actions.addSubsection.title")}
            editLabel={tMenus("sections.actions.updateSection.title")}
            deleteLabel={tMenus("sections.actions.deleteSection.title")}
          />
        ))}
      </List>
    </Box>
  );
};

export default SectionPanel;
