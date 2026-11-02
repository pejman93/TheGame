import Link from "next/link";
import { GAMES } from "@/lib/games";

export default function Home() {
  return (
    <main className="home">
      <section className="hero">
        <div className="kicker">THE GAME</div>
        <h1>
          Prank them.
          <br />
          <span className="accent">Then make their day.</span>
        </h1>
        <p className="lead">
          Send your friend, partner or family a link that looks like a gift. It pulls them into a strange, escalating
          game with your photos, your inside jokes and your voice turning creepy… and ends with the happiest birthday
          surprise.
        </p>
        <a href="#games" className="btn btn-primary btn-lg">
          Pick a game
        </a>
      </section>

      <section className="steps">
        <div className="step">
          <span>1</span>
          <h3>Pick a game</h3>
          <p>Each one is a different trap with a different twist.</p>
        </div>
        <div className="step">
          <span>2</span>
          <h3>Make it personal</h3>
          <p>Add photos, inside jokes, a voice note and your birthday message.</p>
        </div>
        <div className="step">
          <span>3</span>
          <h3>Send the link</h3>
          <p>Say nothing. Let the game do the rest. 😈</p>
        </div>
      </section>

      <section id="games" className="games">
        <h2>Choose your trap</h2>
        <div className="game-grid">
          {GAMES.map((g) =>
            g.available ? (
              <Link key={g.id} href={`/create/${g.id}`} className="game-card">
                <div className="game-emoji" aria-hidden>
                  {g.emoji}
                </div>
                <h3>{g.title}</h3>
                <p>{g.trick}</p>
                <p className="reveal-line">
                  <strong>Reveal:</strong> {g.reveal}
                </p>
                <div className="game-foot">
                  <span className="pill">{g.bestFor}</span>
                  <span className="go">Create →</span>
                </div>
              </Link>
            ) : (
              <div key={g.id} className="game-card soon" aria-disabled>
                <div className="game-emoji" aria-hidden>
                  {g.emoji}
                </div>
                <h3>{g.title}</h3>
                <p>{g.trick}</p>
                <div className="game-foot">
                  <span className="pill">{g.bestFor}</span>
                  <span className="pill soon-pill">Coming soon</span>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      <footer className="footer">
        Every game takes 3–5 minutes, has a hidden “skip to the surprise” button, and always ends happy. 🎂
      </footer>
    </main>
  );
}
