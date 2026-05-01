export default function UrgencyBadge() {
  return (
    <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-2 rounded text-sm">
      <span className="text-orange-600 font-semibold">⚡ Alta demanda</span>
      <span className="text-orange-500 text-xs">Postagem em até 5 dias úteis</span>
    </div>
  );
}
