import { TERRAIN, REGION_DANGER, TRAVEL_ROLES } from "../data/rules.js";
import { ExpeditionState } from "../state/ExpeditionState.js";
import { TravelEngine } from "../engines/travel/TravelEngine.js";
import { EncounterEngine } from "../engines/encounter/EncounterEngine.js";
import { QuietTravelEngine } from "../engines/quiet-travel/QuietTravelEngine.js";
import { ThreatEngine } from "../engines/threat/ThreatEngine.js";
import { RulesCompendium } from "../docs/RulesCompendium.js";

function optionsFrom(record, selected = null) {
  return Object.values(record)
    .map((entry) => `<option value="${entry.id}" ${entry.id === selected ? "selected" : ""}>${entry.name}</option>`)
    .join("");
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

async function postChat(title, body) {
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: `<section class="zft-zot-card"><h3>${escapeHtml(title)}</h3>${body}</section>`
  });
}

export class TravelPanel {
  static async open() {
    if (!game.user?.isGM) {
      ui.notifications.warn("Zantor's Overland Travel control panel is GM-only.");
      return;
    }

    const state = ExpeditionState.get();
    const hex = state.currentHex;

    const content = `
      <div class="zft-zot-panel">
        <div class="zft-zot-state-grid">
          <div><span>Momentum</span><strong>${escapeHtml(state.momentum)}</strong></div>
          <div><span>Threat</span><strong>${escapeHtml(state.threat?.stage ?? "none")}</strong></div>
          <div><span>Current Hex</span><strong>${hex ? `${escapeHtml(hex.terrainId)} / ${escapeHtml(hex.regionDanger)}` : "None"}</strong></div>
          <div><span>Role DC</span><strong>${hex?.roleDC ?? "—"}</strong></div>
        </div>
        <p class="hint">Start a hex, record the players' role-check totals, then resolve travel. Encounter generation also works independently.</p>
      </div>
    `;

    const action = await foundry.applications.api.DialogV2.wait({
      window: { title: "Zantor's Overland Travel" },
      content,
      rejectClose: false,
      buttons: [
        { action: "start", label: "Start Hex", icon: "fa-solid fa-route" },
        { action: "resolve", label: "Resolve Hex", icon: "fa-solid fa-dice-d20", disabled: !hex },
        { action: "quiet", label: "Quiet Travel", icon: "fa-solid fa-campground" },
        { action: "encounter", label: "Encounter", icon: "fa-solid fa-dragon" },
        { action: "threat", label: "Threat", icon: "fa-solid fa-triangle-exclamation" },
        { action: "rules", label: "Rules", icon: "fa-solid fa-book-open" },
        { action: "reset", label: "Reset", icon: "fa-solid fa-rotate-left" },
        { action: "close", label: "Close", default: true }
      ]
    });

    if (!action || action === "close") return;
    if (action === "start") await this.#startHex();
    if (action === "resolve") await this.#resolveHex();
    if (action === "quiet") await this.#quietTravel();
    if (action === "encounter") await this.#generateEncounter();
    if (action === "threat") await this.#manageThreat();

    if (action === "rules") {
      await RulesCompendium.open();
      return;
    }

    if (action === "reset") {
      const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: { title: "Reset Expedition?" },
        content: "<p>Reset Momentum, Threat, prepared role, current hex, and travel history?</p>",
        rejectClose: false
      });
      if (confirmed) await ExpeditionState.reset();
    }

    return this.open();
  }

  static async #startHex() {
    const fd = await foundry.applications.api.DialogV2.input({
      window: { title: "Begin Travel Hex" },
      content: `
        <div class="zft-zot-form">
          <label>Terrain<select name="terrainId">${optionsFrom(TERRAIN, "forest")}</select></label>
          <label>Region Danger<select name="regionDanger">${optionsFrom(REGION_DANGER, "frontier")}</select></label>
          <label>Event Roll <input name="eventRoll" type="number" min="1" max="20" placeholder="Blank = roll 1d20"></label>
        </div>
      `,
      ok: { label: "Begin Hex", icon: "fa-solid fa-route" }
    });
    if (!fd) return;

    const result = await TravelEngine.beginHex({
      terrainId: fd.terrainId,
      regionDanger: fd.regionDanger,
      eventRoll: fd.eventRoll ? Number(fd.eventRoll) : null
    });

    await postChat(
      "Overland Travel: Hex Started",
      `<p><strong>Terrain:</strong> ${escapeHtml(result.currentHex.terrainId)}</p>
       <p><strong>Region Danger:</strong> ${escapeHtml(result.currentHex.regionDanger)}</p>
       <p><strong>Role DC:</strong> ${result.currentHex.roleDC}</p>
       <p><strong>Initial Event:</strong> ${escapeHtml(result.currentHex.baseEvent)} (${result.currentHex.eventRoll})</p>
       ${result.preparedRoleAdvantage ? `<p><strong>Prepared:</strong> ${escapeHtml(result.preparedRoleAdvantage)} has advantage this hex.</p>` : ""}`
    );
  }

  static async #resolveHex() {
    const state = ExpeditionState.get();
    if (!state.currentHex) return;

    const fd = await foundry.applications.api.DialogV2.input({
      window: { title: "Resolve Travel Checks" },
      content: `
        <div class="zft-zot-form">
          <p>Enter the final role-check totals after players roll. Use comma-separated values, optionally prefixed by role.</p>
          <label>Roll Totals<input name="rolls" type="text" placeholder="guide=18, scout=14, 11, 22" autofocus></label>
          <p class="hint">Strong Success = DC+5 (2 successes); Success = meets DC; Failure = misses by 1–4; Major Failure = misses by 5+ (2 failures).</p>
        </div>
      `,
      ok: { label: "Resolve Hex", icon: "fa-solid fa-check" }
    });
    if (!fd?.rolls) return;

    const rolls = String(fd.rolls)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        if (!part.includes("=")) return Number(part);
        const [role, total] = part.split("=").map((value) => value.trim());
        return { role, total: Number(total) };
      });

    if (rolls.some((entry) => typeof entry === "number" ? !Number.isFinite(entry) : !Number.isFinite(entry.total))) {
      ui.notifications.error("Every travel roll must contain a numeric total.");
      return;
    }

    const result = await TravelEngine.resolveHex({ rolls });
    const hex = result.hex;

    await postChat(
      "Overland Travel: Hex Resolved",
      `<p><strong>Travel Quality:</strong> ${escapeHtml(hex.travelQuality)}</p>
       <p><strong>Tally:</strong> ${hex.successes} successes / ${hex.failures} failures</p>
       <p><strong>Momentum:</strong> ${escapeHtml(hex.momentumBefore)} → ${escapeHtml(hex.momentumAfter)}</p>
       <p><strong>Event:</strong> ${escapeHtml(hex.baseEvent)} → <strong>${escapeHtml(hex.resolvedEvent)}</strong></p>`
    );
  }

  static async #quietTravel() {
    const state = ExpeditionState.get();
    const choice = await foundry.applications.api.DialogV2.wait({
      window: { title: "Quiet Travel" },
      content: "<p>Choose how the party uses Quiet Travel.</p>",
      rejectClose: false,
      buttons: [
        { action: "recover", label: "Recover" },
        { action: "prepare", label: "Prepare" },
        { action: "regroup", label: "Regroup" },
        { action: "cancel", label: "Cancel", default: true }
      ]
    });

    if (!choice || choice === "cancel") return;

    if (choice === "recover") {
      const fd = await foundry.applications.api.DialogV2.input({
        window: { title: "Recover" },
        content: `
          <div class="zft-zot-form">
            <label>Region Danger<select name="regionDanger">${optionsFrom(REGION_DANGER, state.currentHex?.regionDanger ?? "frontier")}</select></label>
            <label>d100 Roll <input name="roll" type="number" min="1" max="100" placeholder="Blank = roll d100"></label>
          </div>
        `,
        ok: { label: "Resolve Recovery" }
      });
      if (!fd) return;

      const result = QuietTravelEngine.recover({
        regionDanger: fd.regionDanger,
        roll: fd.roll ? Number(fd.roll) : null
      });

      await postChat(
        "Quiet Travel: Recover",
        `<p><strong>Long Rest Chance:</strong> ${result.chance}% (${result.baseChance}% ${result.modifier >= 0 ? "+" : ""}${result.modifier}%)</p>
         <p><strong>Roll:</strong> ${result.roll}</p>
         <p><strong>Result:</strong> ${result.success ? "Long Rest succeeds" : "No Long Rest benefits"}</p>
         <p>The party avoids exhaustion from travel.</p>`
      );
      return;
    }

    if (choice === "prepare") {
      const fd = await foundry.applications.api.DialogV2.input({
        window: { title: "Prepare" },
        content: `<div class="zft-zot-form"><label>Role<select name="roleId">${optionsFrom(TRAVEL_ROLES)}</select></label></div>`,
        ok: { label: "Prepare Role" }
      });
      if (!fd) return;
      const result = await QuietTravelEngine.prepare(fd.roleId);
      await postChat("Quiet Travel: Prepare", `<p><strong>${escapeHtml(result.roleId)}</strong> gains advantage in the next hex.</p>`);
      return;
    }

    if (choice === "regroup") {
      const result = await QuietTravelEngine.regroup();
      await postChat("Quiet Travel: Regroup", `<p>Momentum: <strong>${escapeHtml(result.from)}</strong> → <strong>${escapeHtml(result.to)}</strong></p>`);
    }
  }

  static async #generateEncounter() {
    const state = ExpeditionState.get();
    const fd = await foundry.applications.api.DialogV2.input({
      window: { title: "Generate Encounter" },
      content: `
        <div class="zft-zot-form">
          <label>Environment<select name="environment">${optionsFrom(TERRAIN, state.currentHex?.terrainId ?? "forest")}</select></label>
          <label>Region Danger<select name="regionDanger">${optionsFrom(REGION_DANGER, state.currentHex?.regionDanger ?? "frontier")}</select></label>
          <label>Average Party Level <input name="partyLevel" type="number" min="1" step="0.1" placeholder="Optional"></label>
        </div>
      `,
      ok: { label: "Generate", icon: "fa-solid fa-dragon" }
    });
    if (!fd) return;

    const encounter = EncounterEngine.generate({
      environment: fd.environment,
      regionDanger: fd.regionDanger,
      partyLevel: fd.partyLevel ? Number(fd.partyLevel) : null
    });

    await postChat(
      "Generated Encounter",
      `<p><strong>Severity:</strong> ${escapeHtml(encounter.severity.name)}</p>
       <p><strong>Template:</strong> ${escapeHtml(encounter.template.name)}</p>
       <p><strong>Creature Category:</strong> ${escapeHtml(encounter.creatureCategory.name)}</p>
       <p><strong>Behavior:</strong> ${escapeHtml(encounter.behavior.name)}</p>
       <p><strong>Situation:</strong> ${escapeHtml(encounter.situationState.name)}</p>
       <hr>
       <p><strong>First Sign:</strong> ${escapeHtml(encounter.presentation.firstSign)}</p>
       <p><strong>Severity Scaling:</strong> ${escapeHtml(encounter.presentation.severityScaling)}</p>
       <p><strong>Creature Strength:</strong> ${escapeHtml(encounter.severity.creatureStrength)}</p>
       <p><strong>Enemy Structure:</strong> ${escapeHtml(encounter.severity.enemyStructure)}</p>
       <p><strong>Player Decisions:</strong> ${escapeHtml(encounter.presentation.playerDecisions.join(", "))}</p>`
    );
  }

  static async #manageThreat() {
    const state = ExpeditionState.get();
    const action = await foundry.applications.api.DialogV2.wait({
      window: { title: `Threat: ${state.threat?.stage ?? "none"}` },
      content: "<p>Only one Threat may be active at a time. Immediate Threat triggers an Encounter.</p>",
      rejectClose: false,
      buttons: [
        { action: "create", label: "Create" },
        { action: "advance", label: "Advance" },
        { action: "reduce", label: "Reduce" },
        { action: "clear", label: "Clear" },
        { action: "cancel", label: "Cancel", default: true }
      ]
    });

    if (!action || action === "cancel") return;

    let result;
    if (action === "create") result = await ThreatEngine.create("Manual Threat");
    if (action === "advance") result = await ThreatEngine.advance();
    if (action === "reduce") result = await ThreatEngine.reduce();
    if (action === "clear") result = await ThreatEngine.clear();

    if (result) {
      await postChat(
        "Threat Updated",
        `<p><strong>Threat:</strong> ${escapeHtml(result.threat.stage)}</p>
         ${result.encounterTriggered ? "<p><strong>Immediate Threat: begin an Encounter.</strong></p>" : ""}`
      );
    }
  }
}
