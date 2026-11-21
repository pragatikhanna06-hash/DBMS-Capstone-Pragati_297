import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Database, Play, Search, Star } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { DbConnectionInfo, SqlCatalogItem } from '../types/dbms';

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'INNER', 'LEFT', 'RIGHT', 'JOIN', 'ON', 'GROUP', 'BY',
  'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'DISTINCT', 'AS', 'AND', 'OR', 'NOT',
  'EXISTS', 'IN', 'UNION', 'ALL', 'WITH', 'RECURSIVE', 'OVER', 'PARTITION', 'RANK',
  'DENSE_RANK', 'ROW_NUMBER', 'LAG', 'LEAD', 'SUM', 'COUNT', 'AVG', 'ROUND', 'CASE',
  'WHEN', 'THEN', 'ELSE', 'END', 'CREATE', 'DATABASE', 'TABLE', 'ALTER', 'DROP',
  'INDEX', 'VIEW', 'REPLACE', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'BEGIN', 'END',
  'DECLARE', 'START', 'TRANSACTION', 'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'FOR',
  'UPDATE', 'INSERT', 'INTO', 'VALUES', 'DELETE', 'SET', 'GRANT', 'REVOKE', 'USER',
  'IDENTIFIED', 'FLUSH', 'PRIVILEGES', 'CONSTRAINT', 'PRIMARY', 'KEY', 'FOREIGN',
  'REFERENCES', 'UNIQUE', 'CHECK', 'DEFAULT', 'ENGINE', 'AUTO_INCREMENT', 'SIGNAL',
  'SQLSTATE', 'BEFORE', 'AFTER', 'EACH', 'ROW', 'CALL', 'RETURNS', 'RETURN', 'IF',
  'ELSEIF', 'NULL', 'IS', 'NOW', 'DATE_ADD', 'DATE_SUB', 'INTERVAL', 'HOUR', 'LPAD',
  'CONCAT', 'NULLIF', 'COALESCE', 'CEIL', 'GREATEST', 'TIMESTAMPDIFF',
]);

function HighlightedSql({ code }: { code: string }) {
  const tokens = code.split(/(\s+|[(),.;=<>]+|'[^']*')/g);
  return (
    <pre className="overflow-x-auto rounded-lg bg-[#060A12] p-4 font-mono text-xs leading-relaxed text-slate-200">
      {tokens.map((tok, i) => {
        if (!tok) return null;
        if (tok.startsWith("'") && tok.endsWith("'")) {
          return <span key={i} className="text-emerald-300">{tok}</span>;
        }
        if (tok.startsWith('--')) {
          return <span key={i} className="text-slate-500">{tok}</span>;
        }
        if (SQL_KEYWORDS.has(tok.toUpperCase())) {
          return <span key={i} className="font-semibold text-cyan-300">{tok}</span>;
        }
        if (/^\d+(\.\d+)?$/.test(tok)) {
          return <span key={i} className="text-purple-300">{tok}</span>;
        }
        return <span key={i}>{tok}</span>;
      })}
    </pre>
  );
}

export function SqlQueryExplorer({ dbInfo }: { dbInfo: DbConnectionInfo }) {
  const [catalog, setCatalog] = useState<SqlCatalogItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('JOIN-01');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [mandatoryOnly, setMandatoryOnly] = useState(false);
  const [customSql, setCustomSql] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [execResult, setExecResult] = useState<{
    executionMode?: string;
    elapsedMs?: number;
    columns?: string[];
    rows?: Array<Record<string, unknown>>;
    note?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    apiRequest<{ catalog: SqlCatalogItem[] }>('/api/sql/catalog').then((res) => {
      setCatalog(res.catalog);
      const first = res.catalog.find((q) => q.id === 'JOIN-01') || res.catalog[0];
      if (first) {
        setSelectedId(first.id);
        setCustomSql(first.sql);
      }
    });
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const q of catalog) set.add(q.category);
    return Array.from(set);
  }, [catalog]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((item) => {
      if (mandatoryOnly && !item.mandatory) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.concept.toLowerCase().includes(q) ||
        item.sql.toLowerCase().includes(q) ||
        item.relatedTables.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [catalog, search, categoryFilter, mandatoryOnly]);

  const activeQuery = catalog.find((q) => q.id === selectedId) || filtered[0];

  function selectQuery(q: SqlCatalogItem) {
    setSelectedId(q.id);
    setCustomSql(q.sql);
    setEditMode(false);
    setExecResult(null);
  }

  async function handleCopy() {
    if (!activeQuery) return;
    await navigator.clipboard.writeText(editMode ? customSql : activeQuery.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function handleRun() {
    if (!activeQuery) return;
    setRunning(true);
    setExecResult(null);
    try {
      const res = await apiRequest<any>('/api/sql/execute', {
        method: 'POST',
        body: JSON.stringify({
          queryId: activeQuery.id,
          customSql: editMode ? customSql : undefined,
        }),
      });
      setExecResult(res);
    } catch (err) {
      setExecResult({ error: err instanceof Error ? err.message : 'Execution failed' });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">SQL Query Explorer (MySQL 8.0+ IDE)</h1>
          <p className="text-xs text-slate-400">
            Complete DDL, DML, Joins, Subqueries, Set Ops, CTEs, Window Functions, Views, Procedures, Triggers & RBAC
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${
            dbInfo.mysqlConnected
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/35 bg-amber-500/10 text-amber-300'
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          {dbInfo.mysqlConnected ? 'Live MySQL 8.0+ Execution Ready' : 'MySQL Disconnected · Sample Preview Mode'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT PANEL */}
        <div className="glass-panel flex flex-col rounded-xl p-4 lg:col-span-4">
          <div className="space-y-2.5 border-b border-slate-800 pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SQL queries, tables, keywords..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900/90 py-2 pl-8 pr-3 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
              >
                <option value="ALL">All 13 Categories ({catalog.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setMandatoryOnly((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap ${
                  mandatoryOnly
                    ? 'border-purple-400 bg-purple-500/20 text-purple-200'
                    : 'border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Star className="h-3 w-3" /> Mandatory (8)
              </button>
            </div>
          </div>

          <div className="mt-3 max-h-[640px] space-y-1.5 overflow-y-auto pr-1">
            {filtered.map((q) => {
              const active = activeQuery?.id === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => selectQuery(q)}
                  className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
                    active
                      ? 'border-cyan-400/60 bg-cyan-500/15'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-cyan-300">{q.id}</span>
                    <span className="truncate text-[10px] text-slate-400">
                      {q.mandatory ? 'Mandatory Query · ' : ''}
                      {q.category.split('. ')[1]}
                    </span>
                  </div>
                  <div className="mt-1 text-xs font-medium text-white">{q.title}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="glass-panel flex flex-col gap-4 rounded-xl p-5 lg:col-span-8">
          {activeQuery ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono font-semibold text-cyan-300">{activeQuery.id}</span>
                    <span>·</span>
                    <span>{activeQuery.category}</span>
                    {activeQuery.mandatory && (
                      <>
                        <span>·</span>
                        <span className="font-semibold text-purple-300">Mandatory Project Query</span>
                      </>
                    )}
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-white">{activeQuery.title}</h2>
                  <div className="mt-1 text-xs text-slate-400">
                    Concept: <span className="text-cyan-200">{activeQuery.concept}</span> · Tables:{' '}
                    <span className="font-mono text-purple-300">{activeQuery.relatedTables.join(', ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMode((v) => !v)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-400 hover:text-white"
                  >
                    {editMode ? 'Syntax View' : 'Edit SQL'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-400"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy SQL'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={running}
                    className="btn-neon inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {running ? 'Running...' : 'Run Query'}
                  </button>
                </div>
              </div>

              {/* Code Editor / Highlighted Block */}
              {editMode ? (
                <textarea
                  rows={10}
                  value={customSql}
                  onChange={(e) => setCustomSql(e.target.value)}
                  className="w-full rounded-lg border border-cyan-500/35 bg-[#060A12] p-4 font-mono text-xs text-cyan-100 focus:outline-none"
                />
              ) : (
                <HighlightedSql code={activeQuery.sql} />
              )}

              {/* Explanation & Expected Output */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="font-semibold text-cyan-300">Query Explanation</div>
                  <p className="mt-1 leading-relaxed text-slate-300">{activeQuery.explanation}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="font-semibold text-purple-300">Expected Output</div>
                  <p className="mt-1 leading-relaxed text-slate-300">{activeQuery.expectedOutput}</p>
                </div>
              </div>

              {/* Execution Output Table */}
              <div className="rounded-xl border border-cyan-500/20 bg-[#070B12] p-4">
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">Query Execution Result</span>
                  {execResult?.note && (
                    <span
                      className={`text-[11px] font-medium ${
                        execResult.executionMode === 'mysql-live' ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {execResult.note}
                    </span>
                  )}
                </div>

                {!execResult ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    Click <span className="font-semibold text-cyan-300">Run Query</span> to execute against MySQL 8.0+ (or inspect the computed Sample Preview when disconnected).
                  </p>
                ) : execResult.error ? (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                    {execResult.error}
                  </div>
                ) : execResult.rows && execResult.rows.length > 0 ? (
                  <div className="max-h-72 overflow-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="border-b border-slate-800 text-cyan-300">
                        <tr>
                          {(execResult.columns || Object.keys(execResult.rows[0])).map((col) => (
                            <th key={col} className="px-3 py-2 font-semibold whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {execResult.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-cyan-500/5">
                            {(execResult.columns || Object.keys(row)).map((col) => (
                              <td key={col} className="px-3 py-2 text-slate-200 whitespace-nowrap tabular-nums">
                                {row[col] === null ? <span className="text-slate-500">NULL</span> : String(row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-4 text-center text-xs text-slate-400">Query returned 0 rows.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400">Select a query from the catalog.</p>
          )}
        </div>
      </div>
    </div>
  );
}
