import OrganizationSelectToolbar from "@/components/OrganizationSelectToolbar";

interface OrganizationSelectReadOnlyToolbarProps {
  searchParams: Promise<{ organization?: string }>;
}

const OrganizationSelectReadOnlyToolbar = ({
  searchParams,
}: OrganizationSelectReadOnlyToolbarProps) => (
  <OrganizationSelectToolbar readOnly searchParams={searchParams} />
);

export default OrganizationSelectReadOnlyToolbar;
