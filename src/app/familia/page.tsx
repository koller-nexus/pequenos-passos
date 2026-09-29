import type { Metadata } from "next";

import { ParentReportView } from "@/components/parent-report-view";

export const metadata: Metadata = {
  title: "Relatório para os pais | Pequenos Passos",
  description: "Acompanhamento local dos últimos sete dias.",
  robots: { index: false, follow: false },
};

export default function FamilyPage() {
  return (
    <main className="min-h-dvh">
      <ParentReportView />
    </main>
  );
}
