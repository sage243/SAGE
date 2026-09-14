import type { Metadata } from "next";
import { InquiriesManager } from "@/components/admin/inquiries-manager";

export const metadata: Metadata = {
  title: "Demandes",
};

export default function AdminInquiriesPage() {
  return <InquiriesManager />;
}
