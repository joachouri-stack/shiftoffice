import { calculerFichePaie } from "@/lib/paie/calcul";
import { buildFichePaiePDF } from "./fiche-paie";
import { buildContratPDF } from "./contrat";
import { buildCertificatPDF } from "./certificat";
import { buildSoldeToutComptePDF } from "./solde-tout-compte";
import { buildRupturePDF } from "./rupture";
import { buildBailCommercialPDF } from "./bail-commercial";
import { buildStatutsPDF, type Associe, type StatutsData } from "./statuts";
import { buildQuittancePDF } from "./quittance";
import { buildAttestationPDF } from "./attestation";

export type BuildResult = { pdf: Uint8Array; filename: string };

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

const S = (v: unknown) => String(v ?? "");

/**
 * Construit le PDF d'un document (payant ou gratuit) à partir de son type et
 * des données du formulaire. Source unique réutilisée par les routes de
 * génération et d'envoi par email. Retourne null pour un type inconnu.
 */
export async function buildDocument(
  type: string,
  d: Record<string, unknown>
): Promise<BuildResult | null> {
  switch (type) {
    case "fiche-paie": {
      const result = calculerFichePaie({
        salaireBrut: num(d.salaireBrut),
        heuresMois: num(d.heuresMois),
        tauxHoraire: num(d.tauxHoraire),
        heuresSup: num(d.heuresSup),
        heuresSup50: num(d.heuresSup50),
        primes: num(d.primes),
        tauxPAS: num(d.tauxPAS),
      });
      const pdf = await buildFichePaiePDF({
        entrepriseNom: S(d.entrepriseNom),
        entrepriseAdresse: S(d.entrepriseAdresse),
        siret: S(d.siret),
        codeApe: S(d.codeApe),
        conventionCollective: S(d.conventionCollective),
        salarieNom: S(d.salarieNom),
        poste: S(d.poste),
        classification: S(d.classification),
        dateEntree: S(d.dateEntree),
        typeContrat: S(d.typeContrat),
        numeroSecu: S(d.numeroSecu),
        periode: S(d.periode),
        datePaiement: S(d.datePaiement),
        congesAcquis: num(d.congesAcquis),
        congesPris: num(d.congesPris),
        cumulBrut: num(d.cumulBrut),
        cumulNetImposable: num(d.cumulNetImposable),
        result,
      });
      return { pdf, filename: "fiche-de-paie.pdf" };
    }

    case "contrat-travail": {
      const pdf = await buildContratPDF({
        entrepriseNom: S(d.entrepriseNom),
        entrepriseAdresse: S(d.entrepriseAdresse),
        siret: S(d.siret),
        representantNom: S(d.representantNom),
        representantQualite: S(d.representantQualite),
        salarieNom: S(d.salarieNom),
        salarieAdresse: S(d.salarieAdresse),
        salarieDateNaissance: S(d.salarieDateNaissance),
        salarieLieuNaissance: S(d.salarieLieuNaissance),
        salarieNationalite: S(d.salarieNationalite),
        typeContrat: d.typeContrat === "cdd" ? "cdd" : "cdi",
        dateDebut: S(d.dateDebut),
        dateFin: S(d.dateFin),
        motifCdd: S(d.motifCdd),
        poste: S(d.poste),
        salaireBrut: num(d.salaireBrut),
        heuresSemaine: num(d.heuresSemaine) || 35,
        lieuTravail: S(d.lieuTravail),
        periodeEssai: S(d.periodeEssai),
        conventionCollective: S(d.conventionCollective),
        ville: S(d.ville),
        date: S(d.date),
      });
      return { pdf, filename: "contrat-de-travail.pdf" };
    }

    case "certificat-travail": {
      const pdf = await buildCertificatPDF({
        entrepriseNom: S(d.entrepriseNom),
        entrepriseAdresse: S(d.entrepriseAdresse),
        siret: S(d.siret),
        representantNom: S(d.representantNom),
        representantQualite: S(d.representantQualite),
        salarieNom: S(d.salarieNom),
        poste: S(d.poste),
        dateDebut: S(d.dateDebut),
        dateFin: S(d.dateFin),
        ville: S(d.ville),
        date: S(d.date),
      });
      return { pdf, filename: "certificat-de-travail.pdf" };
    }

    case "solde-tout-compte": {
      const pdf = await buildSoldeToutComptePDF({
        entrepriseNom: S(d.entrepriseNom),
        entrepriseAdresse: S(d.entrepriseAdresse),
        siret: S(d.siret),
        representantNom: S(d.representantNom),
        representantQualite: S(d.representantQualite),
        salarieNom: S(d.salarieNom),
        salarieAdresse: S(d.salarieAdresse),
        poste: S(d.poste),
        dateEntree: S(d.dateEntree),
        dateSortie: S(d.dateSortie),
        motifRupture: S(d.motifRupture),
        salaireDu: num(d.salaireDu),
        indemniteConges: num(d.indemniteConges),
        indemnitePreavis: num(d.indemnitePreavis),
        indemniteRupture: num(d.indemniteRupture),
        autresSommes: num(d.autresSommes),
        ville: S(d.ville),
        date: S(d.date),
      });
      return { pdf, filename: "solde-de-tout-compte.pdf" };
    }

    case "rupture-conventionnelle": {
      const pdf = await buildRupturePDF({
        entrepriseNom: S(d.entrepriseNom),
        entrepriseAdresse: S(d.entrepriseAdresse),
        siret: S(d.siret),
        representantNom: S(d.representantNom),
        representantQualite: S(d.representantQualite),
        salarieNom: S(d.salarieNom),
        salarieAdresse: S(d.salarieAdresse),
        poste: S(d.poste),
        dateEmbauche: S(d.dateEmbauche),
        salaireBrut: num(d.salaireBrut),
        indemniteRupture: num(d.indemniteRupture),
        dateEntretien: S(d.dateEntretien),
        dateRupture: S(d.dateRupture),
        ville: S(d.ville),
        date: S(d.date),
      });
      return { pdf, filename: "rupture-conventionnelle.pdf" };
    }

    case "bail-commercial": {
      const pdf = await buildBailCommercialPDF({
        bailleurNom: S(d.bailleurNom),
        bailleurAdresse: S(d.bailleurAdresse),
        bailleurQualite: S(d.bailleurQualite),
        preneurNom: S(d.preneurNom),
        preneurAdresse: S(d.preneurAdresse),
        preneurRcs: S(d.preneurRcs),
        adresseLocal: S(d.adresseLocal),
        descriptionLocal: S(d.descriptionLocal),
        surface: S(d.surface),
        destination: S(d.destination),
        loyerAnnuel: num(d.loyerAnnuel),
        depotGarantie: num(d.depotGarantie),
        charges: S(d.charges),
        indiceRevision: S(d.indiceRevision),
        dateDebut: S(d.dateDebut),
        duree: S(d.duree),
        ville: S(d.ville),
        date: S(d.date),
      });
      return { pdf, filename: "bail-commercial.pdf" };
    }

    case "statuts-societe": {
      const formes = ["SARL", "SAS", "EURL", "SASU"] as const;
      const forme = formes.includes(d.forme as (typeof formes)[number])
        ? (d.forme as StatutsData["forme"])
        : "SARL";
      const associes: Associe[] = Array.isArray(d.associes)
        ? (d.associes as Array<Record<string, unknown>>).map((a) => ({
            nom: S(a.nom),
            adresse: S(a.adresse),
            apport: num(a.apport),
          }))
        : [];
      const pdf = await buildStatutsPDF({
        forme,
        denomination: S(d.denomination),
        objet: S(d.objet),
        siege: S(d.siege),
        duree: S(d.duree),
        capital: num(d.capital),
        valeurTitre: num(d.valeurTitre),
        associes,
        dirigeantNom: S(d.dirigeantNom),
        dirigeantAdresse: S(d.dirigeantAdresse),
        ville: S(d.ville),
        date: S(d.date),
      });
      return { pdf, filename: "statuts-societe.pdf" };
    }

    case "quittance-loyer": {
      const pdf = await buildQuittancePDF({
        bailleurNom: S(d.bailleurNom),
        bailleurAdresse: S(d.bailleurAdresse),
        locataire: S(d.locataire),
        adresseBien: S(d.adresseBien),
        periode: S(d.periode),
        loyer: num(d.loyer),
        charges: num(d.charges),
        ville: S(d.ville),
        datePaiement: S(d.datePaiement),
      });
      return { pdf, filename: "quittance-loyer.pdf" };
    }

    case "attestation-employeur": {
      const pdf = await buildAttestationPDF({
        entrepriseNom: S(d.entrepriseNom),
        entrepriseAdresse: S(d.entrepriseAdresse),
        siret: S(d.siret),
        representantNom: S(d.representantNom),
        representantQualite: S(d.representantQualite),
        salarieNom: S(d.salarieNom),
        poste: S(d.poste),
        typeContrat:
          d.typeContrat === "determinee" ? "determinee" : "indeterminee",
        dateEmbauche: S(d.dateEmbauche),
        ville: S(d.ville),
        date: S(d.date),
      });
      return { pdf, filename: "attestation-employeur.pdf" };
    }

    default:
      return null;
  }
}
