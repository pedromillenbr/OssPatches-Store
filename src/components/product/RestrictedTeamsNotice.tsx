import { restrictedTeamsText } from '@/config/restrictedTeams';

/** Aviso na página do produto: equipes cujos patches não produzimos. */
export default function RestrictedTeamsNotice() {
  return (
    <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm">
      <p className="font-semibold text-brand-black">
        Patches de equipe com regra própria
      </p>
      <p className="mt-1 text-xs leading-relaxed text-brand-gray-600">
        Não produzimos patches da <strong>{restrictedTeamsText()}</strong>. Por
        respeito às regras dessas equipes, os patches oficiais são encomendados
        somente pela matriz ou pelo mestre responsável. Pedidos com essas artes são
        cancelados e o valor é devolvido integralmente.
      </p>
    </div>
  );
}
