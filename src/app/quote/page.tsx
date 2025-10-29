import { QuoteForm } from "@/components/QuoteForm";

export default function QuotePage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <QuoteForm />
      </div>
    </main>
  );
}
