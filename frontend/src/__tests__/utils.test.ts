import { describe, it, expect } from "vitest";
import { masteryLabel, masteryColour, getInitials, attendancePercent } from "@/lib/utils";
import type { MasteryStatus } from "@/types";

describe("masteryLabel", () => {
  it("returns human-readable label for known statuses", () => {
    expect(masteryLabel("not_started")).toBe("Not Started");
    expect(masteryLabel("secure")).toBe("Secure");
    expect(masteryLabel("needs_reteach")).toBe("Needs Reteach");
    expect(masteryLabel("exceeded")).toBe("Exceeded");
  });

  it("returns fallback for unknown status", () => {
    // Cast to bypass TS — testing runtime fallback
    const unknown = "unknown_status" as MasteryStatus;
    expect(masteryLabel(unknown)).toBe("unknown_status");
  });
});

describe("masteryColour", () => {
  it("returns a CSS class string for each status", () => {
    const statuses = [
      "not_started", "taught", "practising", "developing",
      "secure", "needs_reteach", "exceeded",
    ];
    for (const s of statuses) {
      const colour = masteryColour(s);
      expect(typeof colour).toBe("string");
      expect(colour.length).toBeGreaterThan(0);
    }
  });
});

describe("getInitials", () => {
  it("returns two-letter initials for full name", () => {
    expect(getInitials("Jamie Patel")).toBe("JP");
    expect(getInitials("Chloe Robinson")).toBe("CR");
  });

  it("handles single name", () => {
    expect(getInitials("Alex")).toBe("A");
  });

  it("handles empty string", () => {
    expect(getInitials("")).toBe("");
  });
});

describe("attendancePercent", () => {
  it("converts decimal to percentage string", () => {
    expect(attendancePercent(0.85)).toBe("85%");
    expect(attendancePercent(1.0)).toBe("100%");
    expect(attendancePercent(0)).toBe("0%");
  });
});
