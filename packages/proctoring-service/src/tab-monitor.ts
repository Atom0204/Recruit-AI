import type { ProctoringEvent } from "@recruitai/shared";

export const createTabSwitchEvent = (): ProctoringEvent => {
  return {
    timestamp: new Date().toISOString(),
    type: "TAB_SWITCH",
    severity: "medium",
    details: "Page visibility changed while interview was active."
  };
};
