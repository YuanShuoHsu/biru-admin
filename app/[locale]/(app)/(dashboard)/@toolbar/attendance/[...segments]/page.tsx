import OrganizationSelectToolbar from "@/components/OrganizationSelectToolbar";

interface ToolbarAttendanceSegmentsPageProps {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ organization?: string }>;
}

const ToolbarAttendanceSegmentsPage = async ({
  params,
  searchParams,
}: ToolbarAttendanceSegmentsPageProps) => {
  const { segments } = await params;

  return (
    <OrganizationSelectToolbar
      readOnly={segments.at(-1) === "audit-logs"}
      searchParams={searchParams}
    />
  );
};

export default ToolbarAttendanceSegmentsPage;
