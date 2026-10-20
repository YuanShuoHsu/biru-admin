"use client";

import { Suspense } from "react";

import { useOrganizations } from "@/hooks/organizations";
import { useInvoiceAutoPrinter } from "@/hooks/useInvoiceAutoPrint";
import { useSession } from "@/hooks/useSession";

import type { Organization } from "@/types/organizations";

const OrganizationInvoicePrinter = ({
  organization,
}: {
  organization: Organization;
}) => {
  useInvoiceAutoPrinter(organization);

  return null;
};

const OrganizationInvoicePrinters = () => {
  const { data: organizations = [] } = useOrganizations();

  return organizations.map((organization) => (
    <OrganizationInvoicePrinter
      key={organization.id}
      organization={organization}
    />
  ));
};

const SessionInvoicePrinters = () =>
  useSession() ? <OrganizationInvoicePrinters /> : null;

const InvoiceAutoPrinter = () => (
  <Suspense>
    <SessionInvoicePrinters />
  </Suspense>
);

export default InvoiceAutoPrinter;
