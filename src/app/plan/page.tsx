import Link from "next/link";
import type { Metadata } from "next";
import { DIVISIONS } from "@/lib/divisions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Plan réaliste",
  description: "Feuille de route digitale SAGE alignée sur l’Article 2 et le capital social.",
};

const PHASES = [
  {
    phase: 1,
    title: "Fondation digitale (maintenant)",
    budget: "Faible — site + console locale",
    outcome:
      "Une seule plateforme corporate : vitrine Article 2, catalogue, capture de demandes, pipeline ops.",
    actions: [
      "Publier les 6 divisions et les offres prioritaires",
      "Centraliser les leads (devis) au lieu de chats dispersés",
      "Mesurer quelle division génère réellement des demandes",
    ],
  },
  {
    phase: 2,
    title: "Moteurs de cash",
    budget: "Réinvestir les marges opérationnelles",
    outcome:
      "Digitaliser d’abord commerce général + restauration/vivres (cycles quotidiens / hebdomadaires).",
    actions: [
      "Listes de prix et commandes récurrentes B2B",
      "Traiteur entreprises & paniers vivres sur abonnement",
      "Suivi stock simple des références rapides (pièces auto, vivres)",
    ],
  },
  {
    phase: 3,
    title: "Services à commission",
    budget: "Modéré — outils métier voyage",
    outcome:
      "Module agence de voyage : visas, cotations transport, suivi dossiers — marge sans gros stock.",
    actions: [
      "Formulaires dossier visa + checklist documents",
      "Cotations transport personnes / fret léger",
      "Commissions partenaires aériens / transitaires",
    ],
  },
  {
    phase: 4,
    title: "B2B réglementé",
    budget: "Élevé — conformité avant tech",
    outcome:
      "Pharma / équipements médicaux / pétrole : catalogue B2B après licences et procédures OHADA/sectorielles.",
    actions: [
      "Cartographie des autorisations nécessaires",
      "Onboarding clients agréés (cliniques, pharmacies, flottes)",
      "Cotations volume + conditions de paiement",
    ],
  },
  {
    phase: 5,
    title: "Capital intensif",
    budget: "Projets / levées / partenariats",
    outcome:
      "Agro-pastoral et immobilier/construction : lead gen + showcase chantiers tant que le capital reste limité.",
    actions: [
      "Précommandes saisonnières agricoles",
      "Devis matériaux et mobilier",
      "Montage de joint-ventures (Article 2 — participations)",
    ],
  },
];

export default function PlanPage() {
  const priorityNow = DIVISIONS.filter((d) => d.priority === 1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
        Business development
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight text-sage-deep sm:text-5xl">
        Le plan réaliste pour SAGE
      </h1>
      <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        L’Article 2 autorise six familles d’activités. Le capital social (5&nbsp;000&nbsp;USD) et
        le premier exercice (clos au 31/12/2026) imposent une séquence :{" "}
        <strong className="font-semibold text-foreground">
          une plateforme, des priorités, pas six apps
        </strong>
        .
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <Insight
          title="Contrainte"
          body="Capital limité, multi-secteur, siège Kinshasa. La tech doit réduire le chaos commercial, pas absorber la trésorerie."
        />
        <Insight
          title="Choix produit"
          body="Hub corporate + catalogue + CRM-lite des demandes. Le e-commerce full checkout vient après preuve de demande."
        />
        <Insight
          title="Priorité immédiate"
          body={priorityNow.map((d) => d.shortName).join(" · ")}
        />
      </div>

      <section className="mt-16">
        <h2 className="font-display text-3xl font-semibold text-sage-deep">Feuille de route</h2>
        <div className="mt-8 space-y-0">
          {PHASES.map((phase) => (
            <article
              key={phase.phase}
              className="grid gap-4 border-t border-primary/15 py-8 md:grid-cols-[100px_1fr]"
            >
              <div>
                <p className="font-display text-4xl font-semibold text-copper">{phase.phase}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  Phase
                </p>
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold text-sage-deep">
                  {phase.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-primary">{phase.budget}</p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/85">{phase.outcome}</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {phase.actions.map((action) => (
                    <li key={action}>— {action}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 overflow-hidden bg-sage-deep p-8 text-sand sm:p-10">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          Ce que cette plateforme livre déjà
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sand/80">
          Phase 1 opérationnelle : divisions Article 2, catalogue filtrable, formulaires de
          demande, console pour publier les offres et faire avancer le pipeline commercial.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/catalogue"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-copper text-accent-foreground hover:bg-copper/90",
            )}
          >
            Explorer le catalogue
          </Link>
          <Link
            href="/admin"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "border-sand/30 bg-transparent text-sand hover:bg-white/10 hover:text-white",
            )}
          >
            Ouvrir la console
          </Link>
        </div>
      </section>
    </div>
  );
}

function Insight({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-t-2 border-copper pt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper">{title}</p>
      <p className="mt-3 text-sm leading-relaxed text-foreground/85">{body}</p>
    </div>
  );
}
