"use client";

import { useState } from "react";
import { Lock, Bell, Check, type LucideIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useComingSoon } from "@/lib/comingSoon";
import { cn } from "@/lib/utils";

/** Modale « Bientôt disponible » avec capture d'email. */
function ComingSoonModal({
  open,
  onClose,
  featureName,
}: {
  open: boolean;
  onClose: () => void;
  featureName: string;
}) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Bientôt disponible">
      <ComingSoonBody featureName={featureName} onClose={onClose} />
    </Modal>
  );
}

function ComingSoonBody({
  featureName,
  onClose,
}: {
  featureName: string;
  onClose: () => void;
}) {
  const { record } = useComingSoon();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const valid = /\S+@\S+\.\S+/.test(email);

  function notify() {
    if (!valid) return;
    record(email.trim(), featureName);
    setDone(true);
  }

  return (
    <div className="text-center">
      <span className="bg-brand-50 text-brand mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl">
        <Lock size={26} />
      </span>
      <p className="text-ink text-base font-semibold">{featureName}</p>
      <p className="text-muted mt-2 text-sm leading-relaxed">
        Cette fonctionnalité arrivera dans notre prochain plan{" "}
        <span className="text-ink font-medium">Business</span>. Nous travaillons
        dessus.
      </p>

      {done ? (
        <div className="bg-brand-50 text-brand mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium">
          <Check size={16} />
          C&apos;est noté ! Vous serez prévenu au lancement.
        </div>
      ) : (
        <>
          <p className="text-ink mt-5 text-sm font-medium">
            Soyez prévenu à son lancement :
          </p>
          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && notify()}
              placeholder="votre@email.com"
              className="border-line bg-paper text-ink placeholder:text-muted/70 focus:border-brand focus:ring-brand/10 h-11 flex-1 rounded-xl border px-4 text-sm outline-none transition-all focus:ring-4"
            />
            <Button type="button" onClick={notify} disabled={!valid}>
              <Bell size={16} />
              Me prévenir
            </Button>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={onClose}
        className="text-muted hover:text-ink mt-5 text-sm font-medium transition-colors"
      >
        Fermer
      </button>
    </div>
  );
}

/** Lien de sidebar verrouillé : grisé + badge « Bientôt », ouvre la modale. */
export function ComingSoonNavItem({
  icon: Icon,
  label,
  featureName,
}: {
  icon: LucideIcon;
  label: string;
  featureName: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-opacity",
          "text-muted opacity-50 hover:opacity-80"
        )}
      >
        <Icon size={19} className="shrink-0" />
        <span className="truncate">{label}</span>
        <span className="bg-brand-50 text-brand ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide">
          Bientôt
        </span>
      </button>
      <ComingSoonModal
        open={open}
        onClose={() => setOpen(false)}
        featureName={featureName}
      />
    </>
  );
}

/** Carte de dashboard verrouillée : grisée + badge, ouvre la modale. */
export function ComingSoonCard({
  icon: Icon,
  label,
  desc,
  featureName,
}: {
  icon: LucideIcon;
  label: string;
  desc: string;
  featureName: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-line bg-paper hover:border-brand/30 relative flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all"
      >
        <span className="bg-mist text-muted inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Icon size={18} />
        </span>
        <div className="min-w-0 opacity-55">
          <p className="text-ink truncate text-sm font-medium">{label}</p>
          <p className="text-muted truncate text-xs">{desc}</p>
        </div>
        <span className="bg-brand-50 text-brand absolute right-3 top-3 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide">
          <Lock size={9} />
          Bientôt
        </span>
      </button>
      <ComingSoonModal
        open={open}
        onClose={() => setOpen(false)}
        featureName={featureName}
      />
    </>
  );
}
