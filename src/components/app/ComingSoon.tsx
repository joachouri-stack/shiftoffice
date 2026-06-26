import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

/** Placeholder élégant pour les modules livrés dans une prochaine étape (V1+). */
export function ComingSoon({
  icon: Icon = Sparkles,
  title,
  text,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
      <div className="bg-brand-50 text-brand inline-flex h-14 w-14 items-center justify-center rounded-2xl">
        <Icon size={26} />
      </div>
      <Badge variant="neutral" className="mt-5">
        Bientôt disponible
      </Badge>
      <h2 className="text-ink mt-4 text-xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="text-muted mt-2 max-w-md text-[0.95rem] leading-relaxed">
        {text}
      </p>
    </Card>
  );
}
