// src/utils/validation.js

import { MODULE_VERSION } from "../constants/module-constants.js";

export function requireFields(entry, fields, label = "entry") {
  const missing = fields.filter((field) => {
    return entry?.[field] === undefined || entry?.[field] === null;
  });

  if (missing.length) {
    console.warn(
      `[ZFT][ZOT] ⚠️ v${MODULE_VERSION} | Invalid ${label}; missing fields: ${missing.join(", ")}`,
      entry
    );

    return false;
  }

  return true;
}