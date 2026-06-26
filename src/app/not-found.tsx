import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="bg-glow relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="bg-grid absolute inset-0 -z-10 opacity-50" />
      <Logo size="lg" />
      <p className="text-brand mt-10 text-6xl font-semibold tracking-tight">
        404
      </p>
      <h1 className="text-ink mt-3 text-2xl font-semibold tracking-tight">
        Cette page n&apos;existe pas
      </h1>
      <p className="text-muted mt-2 max-w-sm">
        Le lien est peut-être cassé, ou la page a été déplacée.
      </p>
      <Button href="/" size="lg" className="mt-8">
        Retour à l&apos;accueil
      </Button>
    </div>
  );
}
