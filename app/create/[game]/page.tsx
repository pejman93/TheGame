import { notFound } from "next/navigation";
import { Creator } from "@/components/creator/Creator";
import { getGame } from "@/lib/games";

export default async function CreatePage({ params }: { params: Promise<{ game: string }> }) {
  const { game: id } = await params;
  const game = getGame(id);
  if (!game || !game.available) notFound();
  return (
    <main className="create">
      <Creator game={game} />
    </main>
  );
}
