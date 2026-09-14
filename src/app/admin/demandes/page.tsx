import type { Metadata } from "next";
import { InquiriesManager } from "@/components/admin/inquiries-manager";
import { listInquiries } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demandes",
};

export default async function AdminInquiriesPage() {
  const inquiries = await listInquiries();
  return <InquiriesManager initialItems={inquiries} />;
}
