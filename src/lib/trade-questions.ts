/**
 * Questions guidées par métier pour l'assistant devis.
 * Module PUR (pas de "use client") — importable serveur (prompt) et client (chips).
 * L'IA suit cet ordre, pose UNE question à la fois et propose les chips.
 */

export type TradeQuestion = {
  key: string;
  categorie: string;
  question: string;
  hint: string;
  chips: string[];
};

export type TradeKey =
  | "carreleur"
  | "plombier"
  | "electricien"
  | "peintre"
  | "generique";

const CLIENT_QUESTION: TradeQuestion = {
  key: "client_info",
  categorie: "Client",
  question: "Nom du client et ville du chantier ?",
  hint: "Ex : M. Dupont — Avignon",
  chips: [],
};

export const QUESTIONS_METIER: Record<TradeKey, TradeQuestion[]> = {
  carreleur: [
    {
      key: "surface_sol",
      categorie: "Surface",
      question: "Quelle est la surface au sol à carreler ?",
      hint: "Ex : 12 m² pour une salle de bain standard",
      chips: ["Moins de 10 m²", "10 à 15 m²", "15 à 25 m²", "Plus de 25 m²"],
    },
    {
      key: "surface_mur",
      categorie: "Murs",
      question: "Y a-t-il des murs ou une douche à carreler ?",
      hint: "Précisez la surface murale si possible",
      chips: [
        "Non, sol uniquement",
        "Zone douche ~6 m²",
        "Toute la salle de bain",
        "Autre surface",
      ],
    },
    {
      key: "depose",
      categorie: "Support",
      question: "Faut-il déposer l'ancien carrelage existant ?",
      hint: "Dépose + ragréage peut représenter 20% du devis",
      chips: [
        "Non, support neuf",
        "Oui, dépose simple",
        "Oui + ragréage",
        "Oui + imperméabilisation",
      ],
    },
    {
      key: "fourniture",
      categorie: "Fourniture",
      question: "Le carrelage est-il fourni par vous ?",
      hint: "La gamme influe directement sur le prix matériaux",
      chips: [
        "Par moi — entrée de gamme",
        "Par moi — milieu",
        "Par moi — haut de gamme",
        "Par le client",
      ],
    },
    CLIENT_QUESTION,
  ],
  plombier: [
    {
      key: "type_travaux",
      categorie: "Type",
      question: "Rénovation ou installation neuve ?",
      hint: "La rénovation implique une dépose de l'existant",
      chips: [
        "Rénovation complète",
        "Rénovation partielle",
        "Installation neuve",
        "Dépannage",
      ],
    },
    {
      key: "equipements",
      categorie: "Équipements",
      question: "Quels équipements sont à installer ?",
      hint: "Plusieurs choix possibles",
      chips: [
        "WC suspendu",
        "WC classique",
        "Douche italienne",
        "Baignoire",
        "Meuble vasque",
        "Lavabo",
      ],
    },
    {
      key: "fourniture",
      categorie: "Fourniture",
      question: "Les équipements sont-ils fournis par vous ?",
      hint: "Si client, vérifiez la compatibilité des références",
      chips: ["Fournis par moi", "Fournis par le client", "Mix"],
    },
    {
      key: "reseau",
      categorie: "Réseau",
      question: "Déplacement d'arrivées/évacuations nécessaire ?",
      hint: "Déplacer 1 point = environ 200€ supplémentaires",
      chips: [
        "Non, branchement existant",
        "Oui 1-2 points",
        "Oui 3+ points",
        "Création complète réseau",
      ],
    },
    { ...CLIENT_QUESTION, hint: "Ex : Mme Martin — Nîmes" },
  ],
  electricien: [
    {
      key: "surface",
      categorie: "Surface",
      question: "Surface du logement ou local (m²) ?",
      hint: "Détermine le nombre de circuits réglementaire",
      chips: ["Moins de 50 m²", "50 à 80 m²", "80 à 120 m²", "Plus de 120 m²"],
    },
    {
      key: "type_travaux",
      categorie: "Type",
      question: "Mise aux normes, rénovation ou installation neuve ?",
      hint: "La norme NF C 15-100 est exigée lors d'une vente",
      chips: [
        "Mise aux normes NF C 15-100",
        "Rénovation partielle",
        "Installation complète",
        "Ajout de circuits",
      ],
    },
    {
      key: "circuits",
      categorie: "Circuits",
      question: "Combien de circuits à créer ou remettre en conformité ?",
      hint: "Un T3 standard comporte 8 à 12 circuits",
      chips: [
        "Moins de 5",
        "5 à 8 circuits",
        "8 à 12 circuits",
        "Plus de 12 circuits",
      ],
    },
    {
      key: "options",
      categorie: "Options",
      question: "Besoins spécifiques à prévoir ?",
      hint: "Plusieurs choix possibles",
      chips: [
        "Prises RJ45",
        "VMC double flux",
        "Éclairage extérieur",
        "Alarme/domotique",
        "Borne recharge",
        "Aucun",
      ],
    },
    { ...CLIENT_QUESTION, hint: "Ex : M. Brun — Montpellier" },
  ],
  peintre: [
    {
      key: "surface",
      categorie: "Surface",
      question: "Surface totale à peindre et nombre de pièces ?",
      hint: "Ex : 120 m² murs + 55 m² plafonds pour un T3",
      chips: ["Moins de 60 m²", "60 à 100 m²", "100 à 150 m²", "Plus de 150 m²"],
    },
    {
      key: "support",
      categorie: "Support",
      question: "État des supports — préparation nécessaire ?",
      hint: "La préparation représente 30 à 40% du devis",
      chips: [
        "Supports neufs",
        "Légers rebouchages",
        "Dépose papier peint",
        "Enduit lissage complet",
        "Dépose + enduit",
      ],
    },
    {
      key: "fourniture",
      categorie: "Fourniture",
      question: "Peinture fournie par vous ou par le client ?",
      hint: "Peintures pro (Tollens, V33) : plus durables",
      chips: [
        "Par moi — entrée de gamme",
        "Par moi — gamme pro",
        "Par le client",
      ],
    },
    {
      key: "boiseries",
      categorie: "Finitions",
      question: "Boiseries, portes ou plinthes à peindre ?",
      hint: "Comptez ~40 min par porte avec ponçage + impression",
      chips: [
        "Non, murs/plafonds seulement",
        "Plinthes uniquement",
        "Portes + plinthes",
        "Portes + fenêtres + plinthes",
      ],
    },
    { ...CLIENT_QUESTION, hint: "Ex : M. et Mme Petit — Arles" },
  ],
  // Métiers sans grille dédiée (maçon, menuisier, autre…)
  generique: [
    {
      key: "type_travaux",
      categorie: "Type",
      question: "Quel type de travaux souhaitez-vous chiffrer ?",
      hint: "Décrivez l'ouvrage principal",
      chips: ["Rénovation", "Installation neuve", "Réparation", "Sur mesure"],
    },
    {
      key: "ampleur",
      categorie: "Ampleur",
      question: "Quelle est l'ampleur du chantier (surface, quantité) ?",
      hint: "Ex : 20 m², 3 ouvertures, 5 ml…",
      chips: ["Petit chantier", "Chantier moyen", "Gros chantier"],
    },
    {
      key: "fourniture",
      categorie: "Fourniture",
      question: "Les matériaux sont-ils fournis par vous ?",
      hint: "Influe directement sur le prix",
      chips: ["Par moi", "Par le client", "Mix"],
    },
    CLIENT_QUESTION,
  ],
};

/** Déduit la grille de questions à partir du libellé métier du profil. */
export function detectTradeKey(trade: string | undefined): TradeKey {
  const t = (trade ?? "").toLowerCase();
  if (t.includes("carrel")) return "carreleur";
  if (t.includes("plomb")) return "plombier";
  if (t.includes("électric") || t.includes("electric")) return "electricien";
  if (t.includes("peint")) return "peintre";
  return "generique";
}
