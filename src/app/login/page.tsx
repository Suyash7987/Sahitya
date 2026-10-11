import { AcharyaQuotes } from "@/components/AcharyaQuotes";
import { LoginForm } from "@/components/LoginForm";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  return (
    <div className="paper-grid min-h-dvh lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-forest px-8 py-12 text-card md:px-12 md:py-16 lg:flex lg:flex-col lg:justify-between">
        <Logo className="h-auto w-full max-w-md" priority />
        <AcharyaQuotes />
        <p className="text-xs uppercase tracking-[0.22em] text-gold/80">Bookstore & library counter</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center rounded-2xl bg-forest p-3 lg:hidden">
            <Logo className="h-12 w-auto max-w-[10rem]" priority />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl">Sign in</h2>
          <p className="mt-2 text-sm text-muted">
            Use the admin portal for stock, or the front desk portal for customer billing.
          </p>
          <div className="mt-6 rounded-2xl border border-line bg-card p-4 shadow-[0_20px_60px_rgba(28,22,18,0.06)] sm:mt-8 sm:rounded-3xl sm:p-6">
            <LoginForm />
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-muted">
            <p>
              Admin: <span className="font-medium text-ink">admin / admin123</span>
            </p>
            <p className="mt-1">
              Front desk: <span className="font-medium text-ink">desk / desk123</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
