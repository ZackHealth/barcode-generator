

export function formatDDMMYYYY(createdAt: string) {
  const d = new Date(createdAt);

  // dacă createdAt e invalid, nu crăpăm UI-ul
  if (Number.isNaN(d.getTime())) return "??-??-????";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}
