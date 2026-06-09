import Emoji from '@/components/ui/Emoji';

export default function UrgencyBadge() {
  return (
    <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-2 rounded text-sm">
      <Emoji char="⚡" size={16} />
      <span className="text-orange-600 font-semibold">Alta demanda</span>
      <span className="text-orange-500 text-xs">Postagem em até 7 dias úteis</span>
    </div>
  );
}
