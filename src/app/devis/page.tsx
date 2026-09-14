import { Suspense } from "react";
import type { Metadata } from "next";
import { InquiryForm } from "@/components/site/inquiry-form";

export const metadata: Metadata = {
  title: "Demande de devis",
  description: "Capturer une demande commerciale SAGE par division.",
};

export default function DevisPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
        Pipeline commercial
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-sage-deep">
        Demande de devis / service
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Remplacez les échanges WhatsApp dispersés par une entrée unique : chaque demande est
        taguée par division Article 2 et visible dans la console ops.
      </p>
      <div className="mt-10">
        <Suspense fallback={<div className="h-64 animate-pulse bg-secondary/60" />}>
          <InquiryForm />
        </Suspense>
      </div>
    </div>
  );
}
