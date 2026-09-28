import { MODULE_ID, MODULE_VERSION, LOG_PREFIX } from "../constants/module-constants.js";

const PACK_NAME = "zft-overland-travel-rules";
const PACK_COLLECTION = `world.${PACK_NAME}`;
const JOURNAL_NAME = "Zantor's Overland Travel Rules";
const RULES_VERSION = "1.0.0";

const RULE_SOURCES = Object.freeze([
  {
    name: "Overland Travel Procedure",
    path: "src/docs/overland-travel-procedure.html",
    sort: 100000
  },
  {
    name: "Travel Events",
    path: "src/docs/travel-event-rules.html",
    sort: 200000
  },
  {
    name: "Encounter Engine",
    path: "src/docs/encounter-engine.html",
    sort: 300000
  }
]);

export class RulesCompendium {
  static async ensure({ force = false } = {}) {
    if (!game.user?.isGM) return null;

    let pack = game.packs.get(PACK_COLLECTION);

    if (!pack) {
      const CompendiumClass =
        globalThis.foundry?.documents?.collections?.CompendiumCollection
        ?? globalThis.CompendiumCollection;

      if (!CompendiumClass?.createCompendium) {
        throw new Error(`${LOG_PREFIX} Compendium creation API is unavailable.`);
      }

      pack = await CompendiumClass.createCompendium({
        label: JOURNAL_NAME,
        name: PACK_NAME,
        type: "JournalEntry",
        package: "world"
      });

      console.log(`${LOG_PREFIX} 📚 v${MODULE_VERSION} | Created rules compendium ${PACK_COLLECTION}`);
    }

    const wasLocked = Boolean(pack.locked);

    try {
      if (wasLocked) await pack.configure({ locked: false });

      const documents = await pack.getDocuments();
      let journal = documents.find((document) => document.getFlag(MODULE_ID, "rulesLibrary"))
        ?? documents.find((document) => document.name === JOURNAL_NAME)
        ?? null;

      const currentRulesVersion = journal?.getFlag(MODULE_ID, "rulesVersion") ?? null;

      if (journal && !force && currentRulesVersion === RULES_VERSION) {
        return journal;
      }

      const pages = await this.#loadPages();

      if (!journal) {
        journal = await JournalEntry.implementation.create({
          name: JOURNAL_NAME,
          pages,
          flags: {
            [MODULE_ID]: {
              rulesLibrary: true,
              rulesVersion: RULES_VERSION
            }
          }
        }, {
          pack: pack.collection
        });

        console.log(`${LOG_PREFIX} 📚 v${MODULE_VERSION} | Installed rules Journal`);
      } else {
        const pageIds = journal.pages.map((page) => page.id);

        if (pageIds.length) {
          await journal.deleteEmbeddedDocuments("JournalEntryPage", pageIds);
        }

        await journal.createEmbeddedDocuments("JournalEntryPage", pages);

        await journal.update({
          name: JOURNAL_NAME,
          [`flags.${MODULE_ID}.rulesLibrary`]: true,
          [`flags.${MODULE_ID}.rulesVersion`]: RULES_VERSION
        });

        console.log(`${LOG_PREFIX} 📚 v${MODULE_VERSION} | Updated rules Journal to rules v${RULES_VERSION}`);
      }

      return journal;
    } finally {
      if (wasLocked && !pack.locked) {
        await pack.configure({ locked: true });
      }
    }
  }

  static async refresh() {
    return this.ensure({ force: true });
  }

  static async open() {
    const journal = await this.ensure();

    if (!journal) {
      ui.notifications.warn("The rules compendium can only be prepared by a GM.");
      return null;
    }

    journal.sheet?.render(true);
    return journal;
  }

  static async #loadPages() {
    const format = CONST.JOURNAL_ENTRY_PAGE_FORMATS?.HTML ?? 1;

    return Promise.all(RULE_SOURCES.map(async (source) => {
      const path = `modules/${MODULE_ID}/${source.path}`;
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(`${LOG_PREFIX} Failed to load rules source: ${path} (${response.status})`);
      }

      const content = await response.text();

      return {
        name: source.name,
        type: "text",
        sort: source.sort,
        text: {
          content,
          format
        },
        flags: {
          [MODULE_ID]: {
            sourcePath: source.path,
            rulesVersion: RULES_VERSION
          }
        }
      };
    }));
  }
}
