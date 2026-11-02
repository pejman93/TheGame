import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Player } from "@/components/player/Player";
import { getGame } from "@/lib/games";
import { ID_PATTERN } from "@/lib/ids";
import { readJson } from "@/lib/storage";
import type { SurpriseConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load(id: string) {
  if (!ID_PATTERN.test(id)) return null;
  return readJson<SurpriseConfig>(`surprises/${id}.json`);
}

// The link preview must not give the surprise away.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cfg = await load(id);
  const game = cfg ? getGame(cfg.game) : undefined;
  return {
    title: game?.shareTitle ?? "You have a package",
    description: game?.shareDescription,
    robots: { index: false, follow: false },
    openGraph: { title: game?.shareTitle, description: game?.shareDescription },
  };
}

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const cfg = await load(id);
  if (!cfg) notFound();
  return <Player cfg={cfg} preview={sp.preview === "1"} />;
}
