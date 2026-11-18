import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

type TableName = 'properties' | 'profiles' | 'posts' | 'comments' | 'property_claims';

interface TableMeta {
  name: TableName;
  label: string;
  pk: string;
  orderBy: string;
  description: string;
  columns: { key: string; type: 'uuid' | 'text' | 'number' | 'boolean' | 'json' | 'timestamp'; editable?: boolean }[];
}

const TABLES: TableMeta[] = [
  {
    name: 'properties',
    label: 'properties',
    pk: 'id',
    orderBy: 'created_at',
    description: 'Accommodations, homestays, resorts, pricing, and verification status',
    columns: [
      { key: 'id', type: 'uuid', editable: false },
      { key: 'name', type: 'text', editable: true },
      { key: 'type', type: 'text', editable: true },
      { key: 'status', type: 'text', editable: true },
      { key: 'price_per_night', type: 'number', editable: true },
      { key: 'price_type', type: 'text', editable: true },
      { key: 'is_verified', type: 'boolean', editable: true },
      { key: 'district', type: 'text', editable: true },
      { key: 'province', type: 'text', editable: true },
      { key: 'location', type: 'text', editable: true },
      { key: 'rating', type: 'number', editable: true },
      { key: 'reviews', type: 'number', editable: true },
      { key: 'views', type: 'number', editable: true },
      { key: 'owner_id', type: 'uuid', editable: true },
      { key: 'image_url', type: 'text', editable: true },
      { key: 'images', type: 'json', editable: true },
      { key: 'features', type: 'json', editable: true },
      { key: 'amenities', type: 'json', editable: true },
      { key: 'contact', type: 'json', editable: true },
      { key: 'host_info', type: 'json', editable: true },
      { key: 'description', type: 'text', editable: true },
      { key: 'created_at', type: 'timestamp', editable: false },
    ],
  },
  {
    name: 'profiles',
    label: 'profiles',
    pk: 'id',
    orderBy: 'created_at',
    description: 'User accounts, roles (user / host / admin), and verification flags',
    columns: [
      { key: 'id', type: 'uuid', editable: false },
      { key: 'name', type: 'text', editable: true },
      { key: 'email', type: 'text', editable: true },
      { key: 'role', type: 'text', editable: true },
      { key: 'is_verified', type: 'boolean', editable: true },
      { key: 'avatar', type: 'text', editable: true },
      { key: 'cover_photo', type: 'text', editable: true },
      { key: 'created_at', type: 'timestamp', editable: false },
    ],
  },
  {
    name: 'posts',
    label: 'posts',
    pk: 'id',
    orderBy: 'created_at',
    description: 'Community Journal posts, traveler reviews, and Picture of the Week entries',
    columns: [
      { key: 'id', type: 'uuid', editable: false },
      { key: 'author_name', type: 'text', editable: true },
      { key: 'location_tag', type: 'text', editable: true },
      { key: 'content', type: 'text', editable: true },
      { key: 'image_url', type: 'text', editable: true },
      { key: 'join_potw', type: 'boolean', editable: true },
      { key: 'rating', type: 'number', editable: true },
      { key: 'price_rating', type: 'number', editable: true },
      { key: 'likes', type: 'json', editable: true },
      { key: 'user_id', type: 'uuid', editable: true },
      { key: 'property_id', type: 'uuid', editable: true },
      { key: 'created_at', type: 'timestamp', editable: false },
    ],
  },
  {
    name: 'comments',
    label: 'comments',
    pk: 'id',
    orderBy: 'created_at',
    description: 'Comments left on Community Journal posts',
    columns: [
      { key: 'id', type: 'uuid', editable: false },
      { key: 'post_id', type: 'uuid', editable: false },
      { key: 'author_name', type: 'text', editable: true },
      { key: 'text', type: 'text', editable: true },
      { key: 'user_id', type: 'uuid', editable: false },
      { key: 'created_at', type: 'timestamp', editable: false },
    ],
  },
  {
    name: 'property_claims',
    label: 'property_claims',
    pk: 'id',
    orderBy: 'created_at',
    description: 'Host ownership claims and verification proof records',
    columns: [
      { key: 'id', type: 'uuid', editable: false },
      { key: 'property_id', type: 'uuid', editable: true },
      { key: 'user_id', type: 'uuid', editable: true },
      { key: 'full_name', type: 'text', editable: true },
      { key: 'phone', type: 'text', editable: true },
      { key: 'email', type: 'text', editable: true },
      { key: 'status', type: 'text', editable: true },
      { key: 'proof_notes', type: 'text', editable: true },
      { key: 'admin_notes', type: 'text', editable: true },
      { key: 'created_at', type: 'timestamp', editable: false },
    ],
  },
];

export const AdminDatabase: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTable = (searchParams.get('table') as TableName) || 'properties';

  const [activeTable, setActiveTable] = useState<TableName>(
    TABLES.some(t => t.name === initialTable) ? initialTable : 'properties'
  );
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [sortCol, setSortCol] = useState<string>('created_at');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [rowLimit, setRowLimit] = useState<number>(50);

  // Selection & Inspector Drawer
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inspectingRow, setInspectingRow] = useState<any | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, any>>({});
  const [isNewRowMode, setIsNewRowMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentMeta = useMemo(
    () => TABLES.find(t => t.name === activeTable) || TABLES[0],
    [activeTable]
  );

  const showNotice = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCounts = async () => {
    const counts: Record<string, number> = {};
    await Promise.all(
      TABLES.map(async (tbl) => {
        try {
          const { count } = await supabase
            .from(tbl.name)
            .select('*', { count: 'exact', head: true });
          counts[tbl.name] = count ?? 0;
        } catch {
          counts[tbl.name] = 0;
        }
      })
    );
    setTableCounts(counts);
  };

  const fetchTableData = async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      let query = supabase.from(activeTable).select('*');
      if (sortCol) {
        query = query.order(sortCol, { ascending: sortAsc });
      }
      query = query.limit(rowLimit);

      const { data, error } = await query;
      if (error) throw error;
      setRows(data || []);
    } catch (err: any) {
      console.error(`Error loading ${activeTable}:`, err);
      showNotice('error', err.message || `Failed to load ${activeTable}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    setSearchParams({ table: activeTable });
    setFilterColumn('');
    setFilterValue('');
    setSearchQuery('');
    setInspectingRow(null);
    setIsNewRowMode(false);
    fetchTableData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTable, sortCol, sortAsc, rowLimit]);

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (filterColumn && filterValue.trim()) {
        const cellVal = row[filterColumn];
        const str = typeof cellVal === 'object' ? JSON.stringify(cellVal) : String(cellVal ?? '');
        if (!str.toLowerCase().includes(filterValue.trim().toLowerCase())) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return Object.values(row).some(val => {
          const s = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
          return s.toLowerCase().includes(q);
        });
      }
      return true;
    });
  }, [rows, filterColumn, filterValue, searchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredRows.map(r => String(r[currentMeta.pk]))));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleRowSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openRowInspector = (row: any) => {
    setIsNewRowMode(false);
    setInspectingRow(row);
    const draft: Record<string, any> = {};
    currentMeta.columns.forEach(col => {
      const val = row[col.key];
      if (col.type === 'json') {
        draft[col.key] = val !== undefined && val !== null ? JSON.stringify(val, null, 2) : '';
      } else {
        draft[col.key] = val ?? '';
      }
    });
    setEditDraft(draft);
  };

  const openInsertRow = () => {
    setIsNewRowMode(true);
    setInspectingRow({});
    const draft: Record<string, any> = {};
    currentMeta.columns.forEach(col => {
      if (!col.editable) return;
      if (col.type === 'boolean') draft[col.key] = false;
      else if (col.type === 'number') draft[col.key] = 0;
      else if (col.type === 'json') draft[col.key] = '[]';
      else draft[col.key] = '';
    });
    setEditDraft(draft);
  };

  const handleSaveRow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      for (const col of currentMeta.columns) {
        if (!col.editable) continue;
        const raw = editDraft[col.key];
        if (col.type === 'boolean') {
          payload[col.key] = Boolean(raw);
        } else if (col.type === 'number') {
          payload[col.key] = raw === '' || raw === null ? null : Number(raw);
        } else if (col.type === 'json') {
          if (typeof raw === 'string' && raw.trim()) {
            try {
              payload[col.key] = JSON.parse(raw);
            } catch {
              throw new Error(`Invalid JSON in column "${col.key}"`);
            }
          } else {
            payload[col.key] = null;
          }
        } else if (col.type === 'uuid') {
          payload[col.key] = typeof raw === 'string' && raw.trim() ? raw.trim() : null;
        } else {
          payload[col.key] = raw === '' ? null : raw;
        }
      }

      if (isNewRowMode) {
        const { error } = await supabase.from(activeTable).insert(payload);
        if (error) throw error;
        showNotice('success', `Inserted new row into ${activeTable}`);
      } else {
        const pkVal = inspectingRow[currentMeta.pk];
        const { error } = await supabase
          .from(activeTable)
          .update(payload)
          .eq(currentMeta.pk, pkVal);
        if (error) throw error;
        showNotice('success', `Updated row in ${activeTable}`);
      }

      setInspectingRow(null);
      setIsNewRowMode(false);
      fetchTableData();
      fetchCounts();
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected row(s) from "${activeTable}"? This cannot be undone.`)) {
      return;
    }

    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase
        .from(activeTable)
        .delete()
        .in(currentMeta.pk, ids);
      if (error) throw error;
      showNotice('success', `Deleted ${ids.length} row(s) from ${activeTable}`);
      setInspectingRow(null);
      fetchTableData();
      fetchCounts();
    } catch (err: any) {
      showNotice('error', err.message || 'Bulk delete failed');
    }
  };

  const handleQuickToggleBoolean = async (row: any, colKey: string) => {
    const pkVal = row[currentMeta.pk];
    const nextVal = !row[colKey];
    try {
      const { error } = await supabase
        .from(activeTable)
        .update({ [colKey]: nextVal })
        .eq(currentMeta.pk, pkVal);
      if (error) throw error;
      setRows(prev => prev.map(r => (r[currentMeta.pk] === pkVal ? { ...r, [colKey]: nextVal } : r)));
      showNotice('success', `Updated ${colKey} to ${String(nextVal)}`);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to toggle value');
    }
  };

  const exportTableData = (format: 'json' | 'csv') => {
    if (filteredRows.length === 0) return;
    let content = '';
    let mime = 'application/json';
    let ext = 'json';

    if (format === 'json') {
      content = JSON.stringify(filteredRows, null, 2);
    } else {
      mime = 'text/csv';
      ext = 'csv';
      const headers = currentMeta.columns.map(c => c.key);
      const csvRows = [
        headers.join(','),
        ...filteredRows.map(row =>
          headers
            .map(h => {
              const v = row[h];
              const str = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '');
              return `"${str.replace(/"/g, '""')}"`;
            })
            .join(',')
        ),
      ];
      content = csvRows.join('\n');
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pakjai_${activeTable}_${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderCellValue = (row: any, col: TableMeta['columns'][0]) => {
    const val = row[col.key];
    if (val === null || val === undefined || val === '') {
      return <span className="db-null">NULL</span>;
    }
    if (col.type === 'boolean') {
      return (
        <button
          type="button"
          className={`db-bool-chip ${val ? 'true' : 'false'}`}
          onClick={(e) => {
            e.stopPropagation();
            handleQuickToggleBoolean(row, col.key);
          }}
          title="Click to toggle boolean"
        >
          {val ? 'true' : 'false'}
        </button>
      );
    }
    if (col.type === 'json') {
      const preview = Array.isArray(val) ? `Array(${val.length})` : JSON.stringify(val);
      return <code className="db-json-cell">{preview}</code>;
    }
    if (col.type === 'uuid') {
      return <code className="db-uuid-cell">{String(val).slice(0, 8)}…</code>;
    }
    if (col.type === 'timestamp') {
      return <span className="db-ts-cell">{new Date(val).toLocaleString()}</span>;
    }
    if (col.key === 'image_url' || col.key === 'avatar' || col.key === 'cover_photo') {
      return (
        <div className="db-img-cell">
          <img src={String(val)} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          <span>{String(val)}</span>
        </div>
      );
    }
    return <span className="db-text-cell">{String(val)}</span>;
  };

  return (
    <div className="db-studio-page">
      {toast && (
        <div className={`db-toast ${toast.type}`}>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="admin-topbar">
        <div className="db-topbar-left">
          <h1>Supabase Database Studio</h1>
          <span className="db-live-indicator">Connected · public.{activeTable}</span>
        </div>

        <div className="admin-topbar-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => exportTableData('csv')}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => exportTableData('json')}
          >
            Export JSON
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={openInsertRow}
          >
            + Insert Row
          </button>
        </div>
      </div>

      <div className="db-studio-workspace">
        {/* Left Table Explorer Rail */}
        <aside className="db-tables-rail">
          <div className="db-rail-header">
            <span>PUBLIC TABLES ({TABLES.length})</span>
            <button type="button" onClick={() => { fetchCounts(); fetchTableData(); }} title="Refresh schema">
              ↻
            </button>
          </div>

          <div className="db-tables-list">
            {TABLES.map((tbl) => (
              <button
                key={tbl.name}
                type="button"
                className={`db-table-btn ${activeTable === tbl.name ? 'active' : ''}`}
                onClick={() => setActiveTable(tbl.name)}
              >
                <div className="db-table-btn-left">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  <span>{tbl.label}</span>
                </div>
                <span className="db-table-count">{tableCounts[tbl.name] ?? '–'}</span>
              </button>
            ))}
          </div>

          <div className="db-schema-card">
            <h4>Table Schema</h4>
            <p>{currentMeta.description}</p>
            <ul className="db-schema-cols">
              {currentMeta.columns.map(c => (
                <li key={c.key}>
                  <code>{c.key}</code>
                  <span>{c.type}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Data Grid Canvas */}
        <div className="db-grid-area">
          {/* Toolbar */}
          <div className="db-query-toolbar">
            <div className="db-search-box">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search all columns in ${activeTable}...`}
              />
            </div>

            <div className="db-filter-group">
              <select
                value={filterColumn}
                onChange={(e) => setFilterColumn(e.target.value)}
              >
                <option value="">Filter column...</option>
                {currentMeta.columns.map(c => (
                  <option key={c.key} value={c.key}>{c.key}</option>
                ))}
              </select>
              {filterColumn && (
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder="contains value..."
                  className="db-filter-val-input"
                />
              )}
            </div>

            <div className="db-toolbar-right">
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  className="db-bulk-delete-btn"
                  onClick={handleBulkDelete}
                >
                  Delete Selected ({selectedIds.size})
                </button>
              )}

              <select
                value={rowLimit}
                onChange={(e) => setRowLimit(Number(e.target.value))}
                className="db-limit-select"
              >
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
                <option value={250}>250 rows</option>
              </select>

              <button
                type="button"
                className="db-refresh-btn"
                onClick={fetchTableData}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Spreadsheet Grid */}
          <div className="db-spreadsheet-wrap">
            {loading ? (
              <div className="db-loading-state">Querying public.{activeTable}...</div>
            ) : filteredRows.length === 0 ? (
              <div className="db-empty-state">
                <p>No records found in <code>public.{activeTable}</code> matching your filter.</p>
                <button type="button" className="admin-btn admin-btn-primary" onClick={openInsertRow}>
                  + Insert First Row
                </button>
              </div>
            ) : (
              <table className="db-spreadsheet">
                <thead>
                  <tr>
                    <th className="db-checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === filteredRows.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    {currentMeta.columns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => {
                          if (sortCol === col.key) setSortAsc(!sortAsc);
                          else {
                            setSortCol(col.key);
                            setSortAsc(true);
                          }
                        }}
                      >
                        <div className="db-th-inner">
                          <span>{col.key}</span>
                          <small>{col.type}</small>
                          {sortCol === col.key && (
                            <span className="db-sort-indicator">{sortAsc ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const rowId = String(row[currentMeta.pk]);
                    const isSelected = selectedIds.has(rowId);
                    const isInspecting = inspectingRow && String(inspectingRow[currentMeta.pk]) === rowId;

                    return (
                      <tr
                        key={rowId}
                        className={`${isSelected ? 'selected' : ''} ${isInspecting ? 'inspecting' : ''}`}
                        onClick={() => openRowInspector(row)}
                      >
                        <td className="db-checkbox-col" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRowSelect(rowId)}
                          />
                        </td>
                        {currentMeta.columns.map((col) => (
                          <td key={col.key}>
                            {renderCellValue(row, col)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="db-grid-footer">
            <span>Showing {filteredRows.length} of {tableCounts[activeTable] ?? filteredRows.length} total rows in <code>public.{activeTable}</code></span>
            <span>Click any row to inspect & edit columns</span>
          </div>
        </div>

        {/* Right Row Inspector / Editor Drawer */}
        {inspectingRow && (
          <aside className="db-inspector-drawer">
            <div className="db-inspector-header">
              <div>
                <h3>{isNewRowMode ? `Insert into ${activeTable}` : `Edit Row in ${activeTable}`}</h3>
                {!isNewRowMode && (
                  <code className="db-inspector-pk">
                    {currentMeta.pk}: {String(inspectingRow[currentMeta.pk])}
                  </code>
                )}
              </div>
              <button
                type="button"
                className="db-inspector-close"
                onClick={() => { setInspectingRow(null); setIsNewRowMode(false); }}
              >
                &times;
              </button>
            </div>

            <form className="db-inspector-form" onSubmit={handleSaveRow}>
              {currentMeta.columns.map((col) => {
                const disabled = !col.editable;
                const val = editDraft[col.key];

                return (
                  <div key={col.key} className="db-field-row">
                    <div className="db-field-label">
                      <label>{col.key}</label>
                      <span>{col.type}{disabled ? ' · read-only' : ''}</span>
                    </div>

                    {col.type === 'boolean' ? (
                      <label className="db-toggle-switch">
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          disabled={disabled}
                          onChange={(e) => setEditDraft(prev => ({ ...prev, [col.key]: e.target.checked }))}
                        />
                        <span>{val ? 'true' : 'false'}</span>
                      </label>
                    ) : col.type === 'json' || col.key === 'description' || col.key === 'content' || col.key === 'proof_notes' ? (
                      <textarea
                        rows={col.type === 'json' ? 4 : 3}
                        value={val ?? ''}
                        disabled={disabled}
                        onChange={(e) => setEditDraft(prev => ({ ...prev, [col.key]: e.target.value }))}
                        className={col.type === 'json' ? 'db-code-textarea' : ''}
                      />
                    ) : (
                      <input
                        type={col.type === 'number' ? 'number' : 'text'}
                        step={col.type === 'number' ? 'any' : undefined}
                        value={val ?? ''}
                        disabled={disabled}
                        onChange={(e) => setEditDraft(prev => ({ ...prev, [col.key]: e.target.value }))}
                      />
                    )}
                  </div>
                );
              })}

              <div className="db-inspector-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => { setInspectingRow(null); setIsNewRowMode(false); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : isNewRowMode ? 'Insert Row' : 'Save Changes'}
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
};

export default AdminDatabase;
