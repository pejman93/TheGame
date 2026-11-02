import Link from "next/link";

export default function NotFound() {
  return (
    <main className="home">
      <section className="hero">
        <div className="kicker">404</div>
        <h1>This package went missing.</h1>
        <p className="lead">The link may be wrong, or the surprise has expired.</p>
        <Link href="/" className="btn btn-primary">
          Go to The Game
        </Link>
      </section>
    </main>
  );
}
