/** Display formatting shared by pages. Safe for client and server. */

export function formatRuntime(minutes: number | null | undefined) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    date,
  );
}

export function formatMoney(usd: number | null | undefined) {
  if (!usd) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(usd);
}

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

export function languageName(code: string | null | undefined) {
  if (!code) return null;
  try {
    return languageNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Age in whole years at `on` (default: today). */
export function ageFrom(birthday: string, on?: string | null) {
  const b = new Date(`${birthday}T00:00:00Z`);
  const end = on ? new Date(`${on}T00:00:00Z`) : new Date();
  let age = end.getUTCFullYear() - b.getUTCFullYear();
  const beforeBirthday =
    end.getUTCMonth() < b.getUTCMonth() || (end.getUTCMonth() === b.getUTCMonth() && end.getUTCDate() < b.getUTCDate());
  if (beforeBirthday) age -= 1;
  return Number.isFinite(age) ? age : null;
}

/** "Sumit Prajapati" → "SP" (avatar fallback). */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
