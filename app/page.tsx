import Link from "next/link";
import { Eyes } from "@/components/brand/Eyes";
import { Logo } from "@/components/brand/Logo";
import { GAMES } from "@/lib/games";

export default function Home() {
  const games = GAMES.filter((g) => g.available);
  return (
    <div className="site">
      <header className="site-head">
        <Logo />
        <Link href="/create" className="btn btn-quiet small">
          Create a surprise
        </Link>
      </header>

      <main>
        <section className="hero">
          <Eyes size={240} className="hero-eyes" />
          <h1 className="display">
            A birthday gift
            <br />
            <em>with a twist.</em>
          </h1>
          <p className="lead">
            Send a link that looks like a gift. It pulls them into a strange little game made from your photos, your
            inside jokes and your voice, and ends in the happiest surprise.
          </p>
          <Link href="/create" className="btn btn-primary btn-lg">
            Create a surprise
          </Link>
          <p className="fine-print">Free · Takes 3 minutes · Always ends happy</p>
        </section>

        <section className="section" id="games">
          <div className="section-head">
            <span className="eyebrow">Choose the prank</span>
            <h2 className="title">Three ways to play</h2>
          </div>
          <div className="game-list">
            {games.map((g, i) => (
              <Link key={g.id} href={`/create?game=${g.id}`} className="game-tile">
                <span className="game-num">0{i + 1}</span>
                <span className="game-emoji" aria-hidden>
                  {g.emoji}
                </span>
                <h3>{g.title}</h3>
                <p>{g.pitch}</p>
                <p className="game-ends">Ends with: {g.reveal}</p>
                <span className="game-go">
                  {g.bestFor} <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2 className="title">Simple for you. Unforgettable for them.</h2>
          </div>
          <ol className="how">
            <li>
              <span>1</span>
              <h3>Make it personal</h3>
              <p>A name, a photo, your voice and a few inside jokes. One question at a time.</p>
            </li>
            <li>
              <span>2</span>
              <h3>Send the link</h3>
              <p>It looks like an ordinary gift. Say nothing.</p>
            </li>
            <li>
              <span>3</span>
              <h3>Let the game play</h3>
              <p>Things get strange. Then confetti, your message and their song.</p>
            </li>
          </ol>
        </section>
      </main>

      <footer className="site-foot">
        <Logo />
        <p>Every game has a hidden skip button and always ends happy. More games coming soon.</p>
      </footer>
    </div>
  );
}
