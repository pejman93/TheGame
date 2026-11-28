import Link from "next/link";
import { Eyes } from "@/components/brand/Eyes";

export default function NotFound() {
  return (
    <main className="done">
      <Eyes size={180} />
      <h1 className="display small">Nothing here.</h1>
      <p className="lead">This link may be wrong, or the surprise has expired.</p>
      <Link href="/" className="btn btn-primary">
        Go to The Game
      </Link>
    </main>
  );
}
