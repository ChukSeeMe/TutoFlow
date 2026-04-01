import Link from "next/link";

interface Props {
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ message, actionLabel, actionHref, onAction }: Props) {
  return (
    <div className="py-12 text-center">
      <p className="text-gray-400 text-sm">{message}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-3 inline-block text-brand-600 text-sm hover:underline">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-3 inline-block text-brand-600 text-sm hover:underline">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
