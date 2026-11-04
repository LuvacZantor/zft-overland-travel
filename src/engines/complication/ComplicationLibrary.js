/** Lazy world-compendium seed for Expedition Complication content.
 * Dev.123 seeds the eight Navigation primary Complications as backend content.
 * Journals remain storage/reference, not the normal GM-facing workflow.
 */
import { MODULE_ID, MODULE_VERSION, LOG_PREFIX } from "../../constants/module-constants.js";
import { NAVIGATION_COMPLICATIONS } from "./ExpeditionComplication.js";

const PACK_NAME = "zft-overland-travel-complications";
const PACK_COLLECTION = `world.${PACK_NAME}`;
const CONTENT_VERSION = "0.2.0";

function journalHtml(entry) {
  const rows = entry.details.map((detail, index) => {
    const standard = `${detail}. The problem is contained but prevents clean progress until the expedition addresses it.`;
    const major = `${detail}. The same problem is extensive, persistent, or badly positioned enough to threaten a substantial loss of planned travel time.`;
    return `<tr><td>${index + 1}</td><td>${detail}</td><td>${standard}</td><td>${major}</td></tr>`;
  }).join("");
  const allowed = entry.allowedConsequences.map(id => id.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, c => c.toUpperCase())).join(", ");
  return `<h2>Navigation — ${entry.primaryType.label}</h2>
<p><strong>Recovery objective:</strong> ${entry.recoveryObjective}</p>
<p><strong>Suggested response palette:</strong> ${entry.responsePalette}</p>
<p><strong>Support:</strong> Operational Readiness &nbsp; <strong>Threat eligibility:</strong> ${entry.threatEligibility}</p>
<p><strong>Allowed consequences:</strong> ${allowed}</p>
<h3>Outcome guidance</h3>
<ul>
<li><strong>Strong Success:</strong> ${entry.outcomes.strongSuccess}</li>
<li><strong>Success:</strong> ${entry.outcomes.success}</li>
<li><strong>Failure:</strong> ${entry.outcomes.failure}</li>
<li><strong>Major Failure:</strong> ${entry.outcomes.majorFailure}</li>
</ul>
<table><thead><tr><th>d8</th><th>Detail</th><th>Standard frame</th><th>Major frame</th></tr></thead><tbody>${rows}</tbody></table>`;
}

async function ensurePack() {
  let pack = game.packs.get(PACK_COLLECTION);
  if (pack) return pack;
  const CompendiumClass = globalThis.foundry?.documents?.collections?.CompendiumCollection ?? globalThis.CompendiumCollection;
  if (!CompendiumClass?.createCompendium) throw new Error(`${LOG_PREFIX} Compendium creation API is unavailable.`);
  pack = await CompendiumClass.createCompendium({
    label: "ZFT Overland Travel — Complications",
    name: PACK_NAME,
    type: "JournalEntry",
    package: "world"
  });
  console.log(`${LOG_PREFIX} 📚 v${MODULE_VERSION} | Created Complication library ${PACK_COLLECTION}`);
  return pack;
}

export class ComplicationLibrary {
  static async ensureNavigation() {
    if (!game.user?.isGM) return [];
    const pack = await ensurePack();
    const documents = await pack.getDocuments();
    const format = CONST.JOURNAL_ENTRY_PAGE_FORMATS?.HTML ?? 1;
    const result = [];
    for (const entry of NAVIGATION_COMPLICATIONS) {
      const contentId = `navigation.${entry.primaryType.id}`;
      const name = `Navigation — ${entry.primaryType.label}`;
      let journal = documents.find(doc => doc.getFlag(MODULE_ID, "complicationContentId") === contentId)
        ?? documents.find(doc => doc.name === name)
        ?? null;
      if (!journal) {
        journal = await JournalEntry.implementation.create({
          name,
          pages: [{ name: entry.primaryType.label, type: "text", sort: 100000, text: { content: journalHtml(entry), format } }],
          flags: { [MODULE_ID]: { complicationContentId: contentId, complicationContentVersion: CONTENT_VERSION } }
        }, { pack: pack.collection });
      }
      result.push(journal);
    }
    console.log(`${LOG_PREFIX} 📚 v${MODULE_VERSION} | Navigation Complication content ready (${result.length} Journals)`);
    return result;
  }

  static async ensurePrototype() {
    const journals = await this.ensureNavigation();
    return journals[0] ?? null;
  }

  static async openPrototype() {
    const journal = await this.ensurePrototype();
    journal?.sheet?.render(true);
    return journal;
  }
}
