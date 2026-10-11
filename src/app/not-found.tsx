import Link from "next/link";

export default function NotFound() {
  return (
    <div className="paper-grid flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-gold">Missing page</p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl">This shelf is empty</h1>
        <p className="mt-3 text-sm text-muted">The page you asked for is not in Sahitya.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-card"
        >
          Back to the counter
        </Link>
      </div>
    </div>
  );
}
