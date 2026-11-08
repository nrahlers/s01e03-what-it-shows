// The problems inside one merged ticket. causes.ts knows two causes, both a day/month flip.
// The desk's notes (desk-notes.json, `oneDayMove`) list reports whose date moved by one day.
// A flip cannot do that, so those reports are a problem of their own, whatever the tenant.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day-move' | 'unplaced';

export const PROBLEMS: Record<Problem, { title: string; what: string }> = {
  parser: {
    title: 'Shared parser reads day-first dates month first',
    what: 'A day-first tenant writes 07/04; the parser reads 4 July. Day and month swap.',
  },
  hint: {
    title: 'booking-v3 form hint says MM/DD/YYYY, the form reads day first',
    what: 'People type what the hint shows, month first; the form reads it the tenant’s way.',
  },
  'one-day-move': {
    title: 'Date moves by one day',
    what: 'Same day and month, one day early or late. A swap cannot do this.',
  },
  unplaced: {
    title: 'No tenant on file',
    what: 'No locale to judge by. Read these by hand.',
  },
};

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day-move';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  ids: string[];
  tenants: number;
  channels: Record<string, number>;
  intakeAgrees: number;
  firstSeen: string;
  lastSeen: string;
};

// One id, one report: the export pages overlap.
export function mergedInto(reports: Report[], ticket: number): Report[] {
  return uniqueById(reports).filter((r) => r.mergedInto === ticket);
}

export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const by = new Map<Problem, Report[]>();
  for (const r of reports) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  return [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        ids: rs.map((r) => r.id).sort(),
        tenants: new Set(rs.map((r) => r.tenant)).size,
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        intakeAgrees: rs.filter((r) => r.meta.intakeTag === problem).length,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.ids.length - a.ids.length);
}
