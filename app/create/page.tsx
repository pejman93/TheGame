import { Wizard } from "@/components/creator/Wizard";
import { getGame } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ game?: string }> }) {
  const { game } = await searchParams;
  const preset = game ? getGame(game) : undefined;
  return (
    <Wizard
      initialGame={preset?.available ? preset.id : undefined}
      transformEnabled={Boolean(process.env.OPENROUTER_API_KEY)}
    />
  );
}
