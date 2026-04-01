import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  colour?: string;
  href?: string;
  subtext?: string;
}

export function StatCard({ label, value, icon: Icon, colour = "bg-gray-50 text-gray-700", href, subtext }: Props) {
  const inner = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${colour}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
