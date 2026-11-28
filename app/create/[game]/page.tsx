import { redirect } from "next/navigation";

// Old links like /create/the-haunting keep working.
export default async function LegacyCreate({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  redirect(`/create?game=${encodeURIComponent(game)}`);
}
