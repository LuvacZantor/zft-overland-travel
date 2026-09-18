// src/engines/encounter/SeverityEngine.js

export class SeverityEngine {

  static #severityTable = [
    { min: 1,  max: 7,  severity: "minor" },
    { min: 8,  max: 14, severity: "standard" },
    { min: 15, max: 18, severity: "dangerous" },
    { min: 19, max: 20, severity: "deadly" }
  ];

  static #regionModifiers = {
    safe: -2,
    frontier: 0,
    wild: 2,
    hostile: 4,
    cataclysmic: 6
  };

  static roll({ regionDanger = "frontier" } = {}) {

    console.log("[ZFT][ZOT] 🎲 v0.1.6 | Rolling encounter severity");

    const baseRoll = new Roll("1d20").roll({ async: false });

    const roll = baseRoll.total;

    const modifier =
      this.#regionModifiers[regionDanger.toLowerCase()] ?? 0;

    const final =
      Math.clamp(roll + modifier, 1, 20);

    const severity =
      this.#getSeverity(final);

    const result = {
      roll,
      modifier,
      final,
      severity,
      regionDanger
    };

    console.log(
      "[ZFT][ZOT] ✅ v0.1.6 | Severity result",
      result
    );

    return result;
  }

  static #getSeverity(value) {

    const match = this.#severityTable.find((entry) => {
      return value >= entry.min && value <= entry.max;
    });

    return match?.severity ?? "standard";
  }
}