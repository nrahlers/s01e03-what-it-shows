<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { groupByProblem, mergedInto, PROBLEMS, type Problem } from '#lib/kb/problems';

  // `issues`: problem → issue URL, where each problem is tracked.
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, string>> } = $props();

  const rows = $derived(uniqueRows());
  function uniqueRows() {
    const exported = (reports as Report[]).length;
    const merged = mergedInto(reports as Report[], ticket);
    return { exported, merged, groups: groupByProblem(merged, tenantOf, notes.oneDayMove) };
  }
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{rows.merged.length}</strong> reports merged into #{ticket} ({rows.exported} rows in the export, one per id) ·
  <strong>{rows.groups.length}</strong> {rows.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>intake agreed</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each rows.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code><br /><span class="what">{PROBLEMS[g.problem].what}</span></td>
        <td><strong>{g.ids.length}</strong></td>
        <td>{g.tenants}</td>
        <td class="small">{channels(g.channels)}</td>
        <td>{g.problem === 'one-day-move' ? '—' : `${g.intakeAgrees} of ${g.ids.length}`}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if issues[g.problem]}<a href={issues[g.problem]}>{PROBLEMS[g.problem].title}</a>{:else}<span class="none">no ticket</span>{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each rows.groups.filter((g) => g.ids.length <= 10) as g (g.problem)}
  <p class="small"><code>{g.problem}</code>: {g.ids.join(', ')}</p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .what, .small { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
