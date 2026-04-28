import { Navbar } from "@/components/layout/Navbar";
import { SmartWizard } from "@/components/wizard-v2/SmartWizard";
import { CaseType } from "@/types";

interface Props {
  searchParams: { type?: string; id?: string };
}

export default function WizardPage({ searchParams }: Props) {
  const validTypes: CaseType[] = [
    "SPEEDING", "PARKING", "ADMIN_ERROR",
    "MOBILE_PHONE", "SEATBELT", "TRAFFIC_LIGHT", "OTHER",
  ];

  const type = validTypes.includes(searchParams.type as CaseType)
    ? (searchParams.type as CaseType)
    : undefined;

  return (
    <>
      <Navbar />
      <SmartWizard initialType={type} initialCaseId={searchParams.id} />
    </>
  );
}
