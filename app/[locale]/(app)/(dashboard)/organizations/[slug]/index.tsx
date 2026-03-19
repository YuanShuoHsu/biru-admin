"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";

import { Business, Delete, GroupAdd, PersonRemove } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { Controller, useForm } from "react-hook-form";

import { authClient } from "@/lib/auth-client";

interface Member {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "rejected" | "cancelled";
  expiresAt: string;
  createdAt: string;
}

interface FullOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: string;
  members: Member[];
  invitations: Invitation[];
}

interface InviteForm {
  email: string;
  role: "admin" | "member";
}

interface ConfirmRemoveDialog {
  open: boolean;
  member: Member | null;
}

interface ConfirmCancelDialog {
  open: boolean;
  invitation: Invitation | null;
}

const fetchOrganization = async (slug: string): Promise<FullOrganization> => {
  const result = await authClient.organization.getFullOrganization({
    query: { organizationSlug: slug },
  });
  if (result.error) throw result.error;
  return result.data as unknown as FullOrganization;
};

interface OrganizationDetailProps {
  slug: string;
}

const MemberRoleChip = ({ role }: { role: string }) => {
  const t = useTranslations("organizations.members.roles");
  const colorMap: Record<string, "error" | "warning" | "default"> = {
    owner: "error",
    admin: "warning",
    member: "default",
  };
  return (
    <Chip
      label={t(role as "owner" | "admin" | "member")}
      color={colorMap[role] ?? "default"}
      size="small"
      variant="outlined"
    />
  );
};

const InvitationStatusChip = ({ status }: { status: string }) => {
  const t = useTranslations("organizations.invitations.status");
  const colorMap: Record<string, "default" | "success" | "error" | "warning"> =
    {
      pending: "warning",
      accepted: "success",
      rejected: "error",
      cancelled: "default",
    };
  return (
    <Chip
      label={t(status as "pending" | "accepted" | "rejected" | "cancelled")}
      color={colorMap[status] ?? "default"}
      size="small"
      variant="outlined"
    />
  );
};

const OrganizationDetail = ({ slug }: OrganizationDetailProps) => {
  const tOrg = useTranslations("organizations");
  const tMembers = useTranslations("organizations.members");
  const tInvitations = useTranslations("organizations.invitations");
  const { enqueueSnackbar } = useSnackbar();

  const [tab, setTab] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<ConfirmRemoveDialog>({
    open: false,
    member: null,
  });
  const [confirmCancel, setConfirmCancel] = useState<ConfirmCancelDialog>({
    open: false,
    invitation: null,
  });

  const swrKey = ["organization-detail", slug];
  const { data: org, isLoading } = useSWR(swrKey, ([, s]) =>
    fetchOrganization(s),
  );

  const { control, handleSubmit, reset, formState } = useForm<InviteForm>({
    defaultValues: { email: "", role: "member" },
  });

  const handleInviteSubmit = async (values: InviteForm) => {
    await authClient.organization.inviteMember(
      {
        organizationId: org!.id,
        email: values.email,
        role: values.role,
      },
      {
        onError: () => {
          enqueueSnackbar(tMembers("invite.error"), { variant: "error" });
        },
        onSuccess: () => {
          enqueueSnackbar(tMembers("invite.success"), { variant: "success" });
          setInviteOpen(false);
          reset();
          mutate(swrKey);
        },
      },
    );
  };

  const handleRemoveMember = async (member: Member) => {
    await authClient.organization.removeMember(
      {
        organizationId: org!.id,
        memberIdOrEmail: member.userId,
      },
      {
        onError: () => {
          enqueueSnackbar(tMembers("remove.error"), { variant: "error" });
        },
        onSuccess: () => {
          enqueueSnackbar(tMembers("remove.success"), { variant: "success" });
          mutate(swrKey);
        },
      },
    );
    setConfirmRemove({ open: false, member: null });
  };

  const handleUpdateMemberRole = async (
    memberId: string,
    role: "admin" | "member",
  ) => {
    await authClient.organization.updateMemberRole(
      {
        organizationId: org!.id,
        memberId,
        role,
      },
      {
        onError: () => {
          enqueueSnackbar(tMembers("setRole.error"), { variant: "error" });
        },
        onSuccess: () => {
          enqueueSnackbar(tMembers("setRole.success"), { variant: "success" });
          mutate(swrKey);
        },
      },
    );
  };

  const handleCancelInvitation = async (invitation: Invitation) => {
    await authClient.organization.cancelInvitation(
      { invitationId: invitation.id },
      {
        onError: () => {
          enqueueSnackbar(tInvitations("cancel.error"), { variant: "error" });
        },
        onSuccess: () => {
          enqueueSnackbar(tInvitations("cancel.success"), {
            variant: "success",
          });
          mutate(swrKey);
        },
      },
    );
    setConfirmCancel({ open: false, invitation: null });
  };

  if (isLoading) {
    return (
      <Stack gap={2}>
        <Skeleton variant="rounded" height={100} />
        <Skeleton variant="rounded" height={300} />
      </Stack>
    );
  }

  if (!org) return null;

  const pendingInvitations = org.invitations.filter(
    (inv) => inv.status === "pending",
  );

  return (
    <Box>
      {/* Header card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" gap={2}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor="primary.main"
              color="primary.contrastText"
              borderRadius={2}
              width={56}
              height={56}
              flexShrink={0}
            >
              <Business />
            </Box>
            <Box flexGrow={1}>
              <Typography variant="h6" fontWeight={700}>
                {org.name}
              </Typography>
              <Stack direction="row" gap={1} alignItems="center" mt={0.5}>
                <Chip
                  label={org.slug}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.75rem" }}
                />
                <Typography variant="caption" color="text.secondary">
                  {dayjs(org.createdAt).format("YYYY/MM/DD")}
                </Typography>
              </Stack>
            </Box>
            <Grid container spacing={3} sx={{ maxWidth: 300 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  {tOrg("detail.info.memberCount")}
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {org.members.length}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  {tInvitations("label")}
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {pendingInvitations.length}
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={tMembers("label")} />
          <Tab
            label={
              <Stack direction="row" gap={0.5} alignItems="center">
                {tInvitations("label")}
                {pendingInvitations.length > 0 && (
                  <Chip
                    label={pendingInvitations.length}
                    size="small"
                    color="warning"
                    sx={{ height: 18, fontSize: "0.7rem" }}
                  />
                )}
              </Stack>
            }
          />
        </Tabs>
      </Box>

      {/* Members tab */}
      {tab === 0 && (
        <Box>
          <Stack direction="row" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              startIcon={<GroupAdd />}
              onClick={() => setInviteOpen(true)}
            >
              {tMembers("actions.invite")}
            </Button>
          </Stack>
          {org.members.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              {tMembers("empty")}
            </Typography>
          ) : (
            <Stack gap={1}>
              {org.members.map((member) => (
                <Card key={member.id} variant="outlined">
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Stack direction="row" alignItems="center" gap={2}>
                      <Avatar
                        src={member.user.image ?? undefined}
                        sx={{ width: 36, height: 36 }}
                      >
                        {member.user.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box flexGrow={1} overflow="hidden">
                        <Typography fontWeight={500} noWrap>
                          {member.user.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {member.user.email}
                        </Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" gap={1}>
                        {member.role === "owner" ? (
                          <MemberRoleChip role="owner" />
                        ) : (
                          <Select
                            size="small"
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateMemberRole(
                                member.id,
                                e.target.value as "admin" | "member",
                              )
                            }
                            variant="standard"
                            sx={{ fontSize: "0.8rem", minWidth: 90 }}
                          >
                            <MenuItem value="admin">
                              {tMembers("roles.admin")}
                            </MenuItem>
                            <MenuItem value="member">
                              {tMembers("roles.member")}
                            </MenuItem>
                          </Select>
                        )}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: { xs: "none", sm: "block" } }}
                        >
                          {dayjs(member.createdAt).format("YYYY/MM/DD")}
                        </Typography>
                        {member.role !== "owner" && (
                          <Tooltip title={tMembers("actions.remove")}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                setConfirmRemove({ open: true, member })
                              }
                            >
                              <PersonRemove fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* Invitations tab */}
      {tab === 1 && (
        <Box>
          {org.invitations.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              {tInvitations("empty")}
            </Typography>
          ) : (
            <Stack gap={1}>
              {org.invitations.map((invitation) => (
                <Card key={invitation.id} variant="outlined">
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Stack direction="row" alignItems="center" gap={2}>
                      <Box flexGrow={1} overflow="hidden">
                        <Typography fontWeight={500} noWrap>
                          {invitation.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tInvitations("columns.expiresAt")}:{" "}
                          {dayjs(invitation.expiresAt).format(
                            "YYYY/MM/DD HH:mm",
                          )}
                        </Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <MemberRoleChip role={invitation.role} />
                        <InvitationStatusChip status={invitation.status} />
                        {invitation.status === "pending" && (
                          <Tooltip title={tInvitations("actions.cancel")}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                setConfirmCancel({ open: true, invitation })
                              }
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* Invite member dialog */}
      <Dialog
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          reset();
        }}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleInviteSubmit)}>
          <DialogTitle>{tMembers("invite.title")}</DialogTitle>
          <DialogContent>
            <Stack gap={2} pt={1}>
              <Controller
                name="email"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={tMembers("invite.fields.email")}
                    type="email"
                    size="small"
                    fullWidth
                    required
                  />
                )}
              />
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormControl size="small" fullWidth>
                    <InputLabel>{tMembers("invite.fields.role")}</InputLabel>
                    <Select {...field} label={tMembers("invite.fields.role")}>
                      <MenuItem value="member">
                        {tMembers("roles.member")}
                      </MenuItem>
                      <MenuItem value="admin">
                        {tMembers("roles.admin")}
                      </MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              disabled={formState.isSubmitting}
              onClick={() => {
                setInviteOpen(false);
                reset();
              }}
            >
              取消
            </Button>
            <Button
              loading={formState.isSubmitting}
              loadingPosition="end"
              type="submit"
              variant="contained"
            >
              {tMembers("actions.invite")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Remove member confirm */}
      <Dialog
        open={confirmRemove.open}
        onClose={() => setConfirmRemove({ open: false, member: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>移除成員</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {tMembers("remove.confirm", {
              name: confirmRemove.member?.user.name ?? "",
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmRemove({ open: false, member: null })}
          >
            取消
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              confirmRemove.member && handleRemoveMember(confirmRemove.member)
            }
          >
            確認移除
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel invitation confirm */}
      <Dialog
        open={confirmCancel.open}
        onClose={() => setConfirmCancel({ open: false, invitation: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>取消邀請</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {tInvitations("cancel.confirm", {
              email: confirmCancel.invitation?.email ?? "",
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmCancel({ open: false, invitation: null })}
          >
            取消
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              confirmCancel.invitation &&
              handleCancelInvitation(confirmCancel.invitation)
            }
          >
            確認取消
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganizationDetail;
