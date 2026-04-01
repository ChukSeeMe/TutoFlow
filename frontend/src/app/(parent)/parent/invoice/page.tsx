"use client";

import { useQuery } from "@tanstack/react-query";
import { parentsApi } from "@/lib/api";
import { Receipt, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SessionLine {
  session_id: number;
  date: string;
  hours: number;
  amount: number;
}

interface ChildInvoice {
  student_id: number;
  student_name: string;
  sessions: SessionLine[];
  total_sessions: number;
  total_hours: number;
  total_amount: number;
  hourly_rate: number;
}

interface InvoiceSummary {
  children: ChildInvoice[];
  total_sessions: number;
  total_hours: number;
  total_amount: number;
  currency: string;
  hourly_rate: number;
}

function formatGBP(amount: number) {
  return `£${amount.toFixed(2)}`;
}

function ChildInvoiceTable({ child }: { child: ChildInvoice }) {
  return (
    <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] overflow-hidden mb-4">
      {/* Child header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-bold">
            {child.student_name[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-zinc-100 text-sm">{child.student_name}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-500">
              {child.total_sessions} session{child.total_sessions !== 1 ? "s" : ""} · {child.total_hours}h total
            </p>
          </div>
        </div>
        <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">{formatGBP(child.total_amount)}</p>
      </div>

      {/* Session rows */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400 dark:text-zinc-600 uppercase tracking-wide bg-gray-50 dark:bg-white/[0.02]">
            <th className="px-5 py-2 text-left font-medium">Date</th>
            <th className="px-5 py-2 text-right font-medium">Duration</th>
            <th className="px-5 py-2 text-right font-medium">Rate</th>
            <th className="px-5 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
          {child.sessions.map((s) => (
            <tr key={s.session_id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
              <td className="px-5 py-3 text-gray-700 dark:text-zinc-300">{formatDate(s.date)}</td>
              <td className="px-5 py-3 text-right text-gray-600 dark:text-zinc-400">
                {s.hours >= 1 ? `${s.hours}h` : `${Math.round(s.hours * 60)}min`}
              </td>
              <td className="px-5 py-3 text-right text-gray-500 dark:text-zinc-500">
                {formatGBP(child.hourly_rate)}/hr
              </td>
              <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-zinc-100">
                {formatGBP(s.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 dark:bg-white/[0.03] font-semibold">
            <td className="px-5 py-3 text-gray-900 dark:text-zinc-100 text-sm" colSpan={3}>Subtotal</td>
            <td className="px-5 py-3 text-right text-gray-900 dark:text-zinc-100">{formatGBP(child.total_amount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function handlePrint() {
  window.print();
}

export default function ParentInvoice() {
  const { data: invoice, isLoading } = useQuery<InvoiceSummary>({
    queryKey: ["parent-invoice"],
    queryFn: () => parentsApi.myInvoice().then((r) => r.data),
  });

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Invoice</h1>
          <p className="text-gray-500 dark:text-zinc-500 text-sm mt-1">
            Session billing summary — {today}
          </p>
        </div>
        {invoice && invoice.total_sessions > 0 && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
          >
            <Download className="h-4 w-4" />
            Print
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-48 bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!invoice || invoice.total_sessions === 0) && (
        <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] py-12 text-center">
          <Receipt className="h-8 w-8 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-zinc-500 text-sm">No sessions to invoice yet.</p>
        </div>
      )}

      {invoice && invoice.total_sessions > 0 && (
        <>
          {invoice.children.map((child) => (
            <ChildInvoiceTable key={child.student_id} child={child} />
          ))}

          {/* Grand total */}
          {invoice.children.length > 1 && (
            <div className="bg-brand-50 dark:bg-brand-500/10 rounded-xl border border-brand-200 dark:border-brand-500/20 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-brand-900 dark:text-brand-200">Total due</p>
                <p className="text-xs text-brand-700 dark:text-brand-400">
                  {invoice.total_sessions} sessions · {invoice.total_hours}h
                </p>
              </div>
              <p className="text-2xl font-bold text-brand-700 dark:text-brand-300">
                {formatGBP(invoice.total_amount)}
              </p>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-200 dark:border-white/[0.06] p-4">
            <p className="text-xs text-gray-500 dark:text-zinc-500">
              <span className="font-medium text-gray-700 dark:text-zinc-300">Note: </span>
              This is a summary of attended sessions at the standard rate of {formatGBP(invoice.hourly_rate)}/hr.
              Speak to your tutor about payment arrangements and any discounts that may apply.
              Sessions where the student was absent are not included.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
