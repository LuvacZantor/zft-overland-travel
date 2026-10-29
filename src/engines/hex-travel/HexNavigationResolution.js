/** Pure Guide + optional Vanguard travel dice. No Foundry or world-state access. */
export function navigationDiceFormula({ guideSuccess, vanguardSuccess = null } = {}) {
  if (typeof guideSuccess !== "boolean" || (vanguardSuccess !== null && typeof vanguardSuccess !== "boolean"))
    throw new Error("Navigation results must be resolved before travel dice.");
  const delayCount = Number(!guideSuccess) + Number(vanguardSuccess === false);
  return `2d4${delayCount ? ` + ${delayCount}d4` : ""}`;
}

export function resolveNavigationHours({ baseDice, delayDice = [], paceMultiplier,
  guideSuccess, vanguardSuccess = null } = {}) {
  const expected = Number(!guideSuccess) + Number(vanguardSuccess === false);
  navigationDiceFormula({ guideSuccess, vanguardSuccess });
  const validDie = n => Number.isInteger(n) && n >= 1 && n <= 4;
  if (!Array.isArray(baseDice) || baseDice.length !== 2 || !baseDice.every(validDie) ||
      !Array.isArray(delayDice) || delayDice.length !== expected || !delayDice.every(validDie))
    throw new Error(`Unexpected Hex Travel dice terms. Expected 2d4 + ${expected} delay d4.`);
  if (![0.75, 1, 1.5].includes(paceMultiplier))
    throw new Error("Invalid Hex Travel pace multiplier.");
  const base = baseDice[0] + baseDice[1];
  const adjusted = Math.ceil(base * paceMultiplier);
  let index = 0;
  const guideDelay = guideSuccess ? 0 : delayDice[index++];
  const vanguardDelay = vanguardSuccess === false ? delayDice[index++] : 0;
  const delay = guideDelay + vanguardDelay;
  return { baseDice: [...baseDice], delayDice: [...delayDice], base, adjusted,
    guideDelay, vanguardDelay, delay, hours: adjusted + delay };
}
