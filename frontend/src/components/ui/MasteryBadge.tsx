import { masteryLabel, masteryColour } from "@/lib/utils";
import type { MasteryStatus } from "@/types";

interface Props {
  status: MasteryStatus;
  size?: "sm" | "md";
}

export function MasteryBadge({ status, size = "md" }: Props) {
  const sizeClass = size === "sm" ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${masteryColour(status)}`}>
      {masteryLabel(status)}
    </span>
  );
}
