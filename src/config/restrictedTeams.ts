/**
 * Equipes cujos patches não produzimos: elas controlam o uso da própria marca
 * e os patches oficiais são encomendados só pela matriz ou pelo mestre.
 * Para incluir ou tirar uma equipe, mude só esta lista — o aviso do site acompanha.
 */
export const RESTRICTED_TEAMS = [
  'Gracie Barra',
  'Gracie Humaitá',
  'Carlson Gracie',
  'GFTeam',
] as const;

/** "A, B, C e D" */
export function restrictedTeamsText(): string {
  const list = [...RESTRICTED_TEAMS];
  const last = list.pop();
  return list.length ? `${list.join(', ')} e ${last}` : (last ?? '');
}
