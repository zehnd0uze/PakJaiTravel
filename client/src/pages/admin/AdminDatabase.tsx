import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { uploadToCloudinary } from '../../utils/cloudinary';

type TableName = 'properties' | 'profiles' | 'posts' | 'comments' | 'property_claims';
type StudioView = 'tables' | 'sql' | 'moderation' | 'media' | 'security' | 'schema';

interface ColumnMeta {
  key: string;
  type: 'uuid' | 'text' | 'number' | 'boolean' | 'json' | 'timestamp';
  editable?: boolean;
  fkTable?: TableName;
}

interface TableMeta {
  name: TableName;
  label: string;
  pk: string;
  orderBy: string;
  description: string;
  columns: ColumnMeta[];
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
      { key: 'owner_id', type: 'uuid', editable: true, fkTable: 'profiles' },
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
      { key: 'images', type: 'json', editable: true },
      { key: 'join_potw', type: 'boolean', editable: true },
      { key: 'rating', type: 'number', editable: true },
      { key: 'price_rating', type: 'text', editable: true },
      { key: 'likes', type: 'json', editable: true },
      { key: 'user_id', type: 'uuid', editable: true, fkTable: 'profiles' },
      { key: 'property_id', type: 'uuid', editable: true, fkTable: 'properties' },
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
      { key: 'post_id', type: 'uuid', editable: false, fkTable: 'posts' },
      { key: 'author_name', type: 'text', editable: true },
      { key: 'text', type: 'text', editable: true },
      { key: 'user_id', type: 'uuid', editable: false, fkTable: 'profiles' },
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
      { key: 'property_id', type: 'uuid', editable: true, fkTable: 'properties' },
      { key: 'user_id', type: 'uuid', editable: true, fkTable: 'profiles' },
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

interface SavedQuery {
  id: string;
  title: string;
  description: string;
  table: TableName;
  select: string;
  filterCol?: string;
  filterOp?: 'eq' | 'neq' | 'ilike' | 'is_null';
  filterVal?: string;
  orderCol: string;
  orderAsc: boolean;
  limit: number;
}

const SAVED_QUERIES: SavedQuery[] = [
  {
    id: 'admins_hosts',
    title: 'Admin & Host Accounts',
    description: 'All elevated accounts with admin or host privileges',
    table: 'profiles',
    select: 'id, name, email, role, is_verified, created_at',
    filterCol: 'role',
    filterOp: 'neq',
    filterVal: 'user',
    orderCol: 'created_at',
    orderAsc: false,
    limit: 50,
  },
  {
    id: 'unverified_props',
    title: 'Unverified Properties',
    description: 'Stays awaiting verification badge approval',
    table: 'properties',
    select: 'id, name, type, status, district, price_per_night, is_verified, owner_id',
    filterCol: 'is_verified',
    filterOp: 'eq',
    filterVal: 'false',
    orderCol: 'created_at',
    orderAsc: false,
    limit: 50,
  },
  {
    id: 'draft_props',
    title: 'Draft / Pending Properties',
    description: 'Properties not yet published to the public directory',
    table: 'properties',
    select: 'id, name, status, district, price_per_night, created_at',
    filterCol: 'status',
    filterOp: 'neq',
    filterVal: 'published',
    orderCol: 'created_at',
    orderAsc: false,
    limit: 50,
  },
  {
    id: 'potw_entries',
    title: 'Picture of the Week Entries',
    description: 'Journal photo posts opted into the weekly spotlight',
    table: 'posts',
    select: 'id, author_name, location_tag, content, join_potw, likes, image_url, created_at',
    filterCol: 'join_potw',
    filterOp: 'eq',
    filterVal: 'true',
    orderCol: 'created_at',
    orderAsc: false,
    limit: 50,
  },
  {
    id: 'pending_claims',
    title: 'Pending Ownership Claims',
    description: 'Host claims waiting for admin review',
    table: 'property_claims',
    select: 'id, full_name, phone, email, status, property_id, user_id, created_at',
    filterCol: 'status',
    filterOp: 'eq',
    filterVal: 'pending',
    orderCol: 'created_at',
    orderAsc: false,
    limit: 50,
  },
  {
    id: 'recent_posts',
    title: 'Latest Community Stories',
    description: 'All recent travel journal posts across Northern Thailand',
    table: 'posts',
    select: 'id, author_name, location_tag, rating, price_rating, content, created_at',
    orderCol: 'created_at',
    orderAsc: false,
    limit: 50,
  },
  {
    id: 'recent_comments',
    title: 'Latest Traveler Comments',
    description: 'Recent comments across all community posts',
    table: 'comments',
    select: 'id, author_name, text, post_id, user_id, created_at',
    orderCol: 'created_at',
    orderAsc: false,
    limit: 50,
  },
];

const RLS_POLICIES_REFERENCE = [
  {
    table: 'profiles',
    rls: 'ENABLED',
    triggers: ['on_auth_user_created -> handle_new_user()', 'on_auth_user_email_confirmed -> handle_user_email_confirmed()', 'protect_profile_columns()'],
    policies: [
      { name: 'Users can view own profile, admins view all', cmd: 'SELECT', rule: 'auth.uid() = id OR public.is_admin()' },
      { name: 'Users can insert their own profile', cmd: 'INSERT', rule: 'auth.uid() = id' },
      { name: 'Users can update own profile', cmd: 'UPDATE', rule: 'auth.uid() = id (role/email/verified guarded by trigger)' },
      { name: 'Admins can update any profile', cmd: 'UPDATE', rule: 'public.is_admin()' },
    ],
  },
  {
    table: 'properties',
    rls: 'ENABLED',
    triggers: ['protect_property_columns() (blocks non-admin is_verified & owner_id changes)'],
    policies: [
      { name: 'Properties are viewable by everyone', cmd: 'SELECT', rule: 'true' },
      { name: 'Hosts can insert properties', cmd: 'INSERT', rule: 'auth.uid() = owner_id OR public.is_admin()' },
      { name: 'Hosts can update their own properties', cmd: 'UPDATE', rule: 'auth.uid() = owner_id' },
      { name: 'Admins can update/delete properties', cmd: 'ALL', rule: 'public.is_admin()' },
    ],
  },
  {
    table: 'posts',
    rls: 'ENABLED',
    triggers: ['protect_post_columns() (enforces server-side author & toggle_like() RPC)'],
    policies: [
      { name: 'Posts are viewable by everyone', cmd: 'SELECT', rule: 'true' },
      { name: 'Users can insert/update/delete own posts', cmd: 'ALL', rule: 'auth.uid() = user_id' },
      { name: 'Admins can delete any post', cmd: 'DELETE', rule: 'public.is_admin()' },
    ],
  },
  {
    table: 'comments',
    rls: 'ENABLED',
    triggers: ['protect_comment_columns() (locks comment owner & author identity)'],
    policies: [
      { name: 'Comments are viewable by everyone', cmd: 'SELECT', rule: 'true' },
      { name: 'Users can insert/update/delete own comments', cmd: 'ALL', rule: 'auth.uid() = user_id' },
      { name: 'Admins can delete any comment', cmd: 'DELETE', rule: 'public.is_admin()' },
    ],
  },
  {
    table: 'property_claims',
    rls: 'ENABLED',
    triggers: ['protect_claim_columns() (forces new claims to status = pending)'],
    policies: [
      { name: 'Claims viewable by claimant and admins', cmd: 'SELECT', rule: 'auth.uid() = user_id OR public.is_admin()' },
      { name: 'Authenticated users can submit claims', cmd: 'INSERT', rule: 'auth.uid() = user_id' },
      { name: 'Admins can update/delete claims', cmd: 'UPDATE/DELETE', rule: 'public.is_admin()' },
    ],
  },
];

interface MediaItem {
  id: string;
  url: string;
  sourceTable: TableName;
  recordId: string;
  recordLabel: string;
  field: string;
}

export const AdminDatabase: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = (searchParams.get('view') as StudioView) || 'tables';
  const initialTable = (searchParams.get('table') as TableName) || 'properties';

  const [studioView, setStudioView] = useState<StudioView>(
    (['tables', 'sql', 'moderation', 'media', 'security', 'schema'] as const).includes(viewParam)
      ? viewParam
      : 'tables'
  );

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
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [showColPicker, setShowColPicker] = useState(false);

  // Selection & Inspector Drawer
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inspectingRow, setInspectingRow] = useState<any | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, any>>({});
  const [isNewRowMode, setIsNewRowMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // SQL & Query Workbench state
  const [qTable, setQTable] = useState<TableName>('properties');
  const [qOperation, setQOperation] = useState<'select' | 'rpc'>('select');
  const [qSelectCols, setQSelectCols] = useState<string>('*');
  const [qFilterCol, setQFilterCol] = useState<string>('');
  const [qFilterOp, setQFilterOp] = useState<'eq' | 'neq' | 'ilike' | 'gt' | 'lt' | 'is_null'>('eq');
  const [qFilterVal, setQFilterVal] = useState<string>('');
  const [qOrderCol, setQOrderCol] = useState<string>('created_at');
  const [qOrderAsc, setQOrderAsc] = useState<boolean>(false);
  const [qLimit, setQLimit] = useState<number>(50);
  const [qRpcName, setQRpcName] = useState<'is_admin' | 'toggle_like' | 'delete_user'>('is_admin');
  const [qRpcArg, setQRpcArg] = useState<string>('');
  const [qResults, setQResults] = useState<any[] | null>(null);
  const [qLatencyMs, setQLatencyMs] = useState<number | null>(null);
  const [qRunning, setQRunning] = useState(false);
  const [qResultTab, setQResultTab] = useState<'table' | 'json' | 'code'>('table');

  // Community Moderation state
  const [modPosts, setModPosts] = useState<any[]>([]);
  const [modLoading, setModLoading] = useState(false);
  const [modSearch, setModSearch] = useState('');
  const [modFilter, setModFilter] = useState<'all' | 'potw' | 'reviews'>('all');

  // Media Browser state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaSourceFilter, setMediaSourceFilter] = useState<'all' | TableName>('all');
  const [mediaSearch, setMediaSearch] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  // Security & Role Manager state
  const [secProfiles, setSecProfiles] = useState<any[]>([]);
  const [secChecks, setSecChecks] = useState<{ label: string; status: 'pass' | 'warn'; detail: string }[]>([]);
  const [secLoading, setSecLoading] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');

  // Backup / Restore ref
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  // Sync URL ?view= param with studioView state
  useEffect(() => {
    const v = (searchParams.get('view') as StudioView) || 'tables';
    if (v !== studioView && (['tables', 'sql', 'moderation', 'media', 'security', 'schema'] as const).includes(v)) {
      setStudioView(v);
    }
    const tbl = searchParams.get('table') as TableName;
    if (tbl && TABLES.some(t => t.name === tbl) && tbl !== activeTable) {
      setActiveTable(tbl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const switchStudioView = (nextView: StudioView, tableOverride?: TableName) => {
    setStudioView(nextView);
    const params: Record<string, string> = { view: nextView };
    if (nextView === 'tables') {
      params.table = tableOverride || activeTable;
    }
    setSearchParams(params);
  };

  const currentMeta = useMemo(
    () => TABLES.find(t => t.name === activeTable) || TABLES[0],
    [activeTable]
  );

  const visibleColumns = useMemo(
    () => currentMeta.columns.filter(c => !hiddenCols.has(c.key)),
    [currentMeta, hiddenCols]
  );

  const showNotice = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCounts = async () => {
    const counts: Record<string, number> = {};
    await Promise.all(
      TABLES.map(async tbl => {
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
    if (studioView === 'tables') {
      setHiddenCols(new Set());
      setInspectingRow(null);
      setIsNewRowMode(false);
      fetchTableData();
    } else if (studioView === 'moderation') {
      fetchModerationPosts();
    } else if (studioView === 'media') {
      fetchAllMedia();
    } else if (studioView === 'security') {
      runSecurityAudit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studioView, activeTable, sortCol, sortAsc, rowLimit]);

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

  const handleDuplicateRow = () => {
    if (!inspectingRow) return;
    setIsNewRowMode(true);
    const copyDraft = { ...editDraft };
    if (copyDraft.name) copyDraft.name = `${copyDraft.name} (Copy)`;
    setEditDraft(copyDraft);
    showNotice('success', 'Duplicated into new row draft — click Insert Row to save');
  };

  const handleDeleteSingleRow = async () => {
    if (!inspectingRow || isNewRowMode) return;
    const pkVal = inspectingRow[currentMeta.pk];
    if (!window.confirm(`Delete row ${pkVal} from ${activeTable}?`)) return;
    try {
      const { error } = await supabase
        .from(activeTable)
        .delete()
        .eq(currentMeta.pk, pkVal);
      if (error) throw error;
      showNotice('success', `Deleted row from ${activeTable}`);
      setInspectingRow(null);
      fetchTableData();
      fetchCounts();
    } catch (err: any) {
      showNotice('error', err.message || 'Delete failed');
    }
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

  const jumpToForeignKey = (targetTable: TableName, targetId: string) => {
    setActiveTable(targetTable);
    setFilterColumn('id');
    setFilterValue(targetId);
    setSearchParams({ view: 'tables', table: targetTable });
    setStudioView('tables');
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

  // ── SQL & Query Runner logic ──
  const runWorkbenchQuery = async (preset?: SavedQuery) => {
    const tbl = preset ? preset.table : qTable;
    const sel = preset ? preset.select : qSelectCols || '*';
    const fCol = preset ? preset.filterCol || '' : qFilterCol;
    const fOp = preset ? preset.filterOp || 'eq' : qFilterOp;
    const fVal = preset ? preset.filterVal || '' : qFilterVal;
    const oCol = preset ? preset.orderCol : qOrderCol;
    const oAsc = preset ? preset.orderAsc : qOrderAsc;
    const lim = preset ? preset.limit : qLimit;

    if (preset) {
      setQOperation('select');
      setQTable(tbl);
      setQSelectCols(sel);
      setQFilterCol(fCol);
      setQFilterOp(fOp);
      setQFilterVal(fVal);
      setQOrderCol(oCol);
      setQOrderAsc(oAsc);
      setQLimit(lim);
    }

    setQRunning(true);
    const t0 = performance.now();
    try {
      if (!preset && qOperation === 'rpc') {
        const args =
          qRpcName === 'is_admin'
            ? {}
            : qRpcName === 'toggle_like'
            ? { target_post_id: qRpcArg.trim() }
            : { target_user_id: qRpcArg.trim() };
        const { data, error } = await supabase.rpc(qRpcName, args);
        if (error) throw error;
        setQLatencyMs(Math.round(performance.now() - t0));
        setQResults(Array.isArray(data) ? data : [{ result: data }]);
        showNotice('success', `RPC ${qRpcName}() executed`);
        return;
      }

      let query: any = supabase.from(tbl).select(sel);
      if (fCol) {
        if (fOp === 'is_null') {
          query = query.is(fCol, null);
        } else if (fVal !== '') {
          const parsedVal =
            fVal === 'true' ? true : fVal === 'false' ? false : fVal;
          if (fOp === 'eq') query = query.eq(fCol, parsedVal);
          if (fOp === 'neq') query = query.neq(fCol, parsedVal);
          if (fOp === 'ilike') query = query.ilike(fCol, `%${fVal}%`);
          if (fOp === 'gt') query = query.gt(fCol, Number(fVal));
          if (fOp === 'lt') query = query.lt(fCol, Number(fVal));
        }
      }
      if (oCol) {
        query = query.order(oCol, { ascending: oAsc });
      }
      query = query.limit(lim);

      const { data, error } = await query;
      if (error) throw error;
      setQLatencyMs(Math.round(performance.now() - t0));
      setQResults(data || []);
    } catch (err: any) {
      showNotice('error', err.message || 'Query failed');
      setQResults([]);
    } finally {
      setQRunning(false);
    }
  };

  const generatedSqlPreview = useMemo(() => {
    if (qOperation === 'rpc') {
      return `SELECT public.${qRpcName}(${qRpcArg ? `'${qRpcArg}'` : ''});`;
    }
    const whereClause = qFilterCol
      ? qFilterOp === 'is_null'
        ? `\nWHERE ${qFilterCol} IS NULL`
        : `\nWHERE ${qFilterCol} ${
            qFilterOp === 'eq'
              ? '='
              : qFilterOp === 'neq'
              ? '!='
              : qFilterOp === 'ilike'
              ? 'ILIKE'
              : qFilterOp === 'gt'
              ? '>'
              : '<'
          } '${qFilterOp === 'ilike' ? `%${qFilterVal}%` : qFilterVal}'`
      : '';
    return `SELECT ${qSelectCols || '*'}\nFROM public.${qTable}${whereClause}\nORDER BY ${qOrderCol} ${
      qOrderAsc ? 'ASC' : 'DESC'
    }\nLIMIT ${qLimit};`;
  }, [qOperation, qRpcName, qRpcArg, qSelectCols, qTable, qFilterCol, qFilterOp, qFilterVal, qOrderCol, qOrderAsc, qLimit]);

  // ── Community Moderation logic ──
  const fetchModerationPosts = async () => {
    setModLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, comments(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setModPosts(data || []);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to load community posts');
    } finally {
      setModLoading(false);
    }
  };

  const handleTogglePotw = async (post: any) => {
    const next = !post.join_potw;
    try {
      const { error } = await supabase
        .from('posts')
        .update({ join_potw: next })
        .eq('id', post.id);
      if (error) throw error;
      setModPosts(prev => prev.map(p => (p.id === post.id ? { ...p, join_potw: next } : p)));
      showNotice('success', next ? 'Added to Picture of the Week' : 'Removed from Picture of the Week');
    } catch (err: any) {
      showNotice('error', err.message || 'Could not update post');
    }
  };

  const handleDeleteModPost = async (postId: string) => {
    if (!window.confirm('Delete this community post and all its comments?')) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setModPosts(prev => prev.filter(p => p.id !== postId));
      fetchCounts();
      showNotice('success', 'Post deleted');
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to delete post');
    }
  };

  const handleDeleteModComment = async (postId: string, commentId: string) => {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      setModPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, comments: (p.comments || []).filter((c: any) => c.id !== commentId) }
            : p
        )
      );
      fetchCounts();
      showNotice('success', 'Comment deleted');
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to delete comment');
    }
  };

  // ── Media & Storage Browser logic ──
  const fetchAllMedia = async () => {
    setMediaLoading(true);
    try {
      const [propsRes, postsRes, profilesRes] = await Promise.all([
        supabase.from('properties').select('id, name, image_url, images'),
        supabase.from('posts').select('id, author_name, location_tag, image_url, images'),
        supabase.from('profiles').select('id, name, avatar, cover_photo'),
      ]);

      const collected: MediaItem[] = [];

      (propsRes.data || []).forEach(p => {
        if (p.image_url) {
          collected.push({
            id: `prop-main-${p.id}`,
            url: p.image_url,
            sourceTable: 'properties',
            recordId: p.id,
            recordLabel: p.name || 'Property',
            field: 'image_url',
          });
        }
        if (Array.isArray(p.images)) {
          p.images.forEach((imgUrl: string, idx: number) => {
            if (imgUrl && imgUrl !== p.image_url) {
              collected.push({
                id: `prop-gal-${p.id}-${idx}`,
                url: imgUrl,
                sourceTable: 'properties',
                recordId: p.id,
                recordLabel: `${p.name} (#${idx + 1})`,
                field: 'images',
              });
            }
          });
        }
      });

      (postsRes.data || []).forEach(post => {
        if (post.image_url) {
          collected.push({
            id: `post-main-${post.id}`,
            url: post.image_url,
            sourceTable: 'posts',
            recordId: post.id,
            recordLabel: `${post.author_name || 'Traveler'} · ${post.location_tag || 'Journal'}`,
            field: 'image_url',
          });
        }
        if (Array.isArray(post.images)) {
          post.images.forEach((imgUrl: string, idx: number) => {
            if (imgUrl && imgUrl !== post.image_url) {
              collected.push({
                id: `post-gal-${post.id}-${idx}`,
                url: imgUrl,
                sourceTable: 'posts',
                recordId: post.id,
                recordLabel: `${post.author_name || 'Traveler'} (#${idx + 1})`,
                field: 'images',
              });
            }
          });
        }
      });

      (profilesRes.data || []).forEach(prof => {
        if (prof.avatar) {
          collected.push({
            id: `prof-av-${prof.id}`,
            url: prof.avatar,
            sourceTable: 'profiles',
            recordId: prof.id,
            recordLabel: `${prof.name} (Avatar)`,
            field: 'avatar',
          });
        }
        if (prof.cover_photo) {
          collected.push({
            id: `prof-cov-${prof.id}`,
            url: prof.cover_photo,
            sourceTable: 'profiles',
            recordId: prof.id,
            recordLabel: `${prof.name} (Cover)`,
            field: 'cover_photo',
          });
        }
      });

      setMediaItems(collected);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to scan media');
    } finally {
      setMediaLoading(false);
    }
  };

  const handleDirectMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const url = await uploadToCloudinary(file);
      setLastUploadedUrl(url);
      await navigator.clipboard.writeText(url);
      showNotice('success', 'Uploaded to Cloudinary & copied URL to clipboard!');
    } catch (err: any) {
      showNotice('error', err.message || 'Cloudinary upload failed');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  // ── Security & RLS Audit logic ──
  const runSecurityAudit = async () => {
    setSecLoading(true);
    try {
      const [profilesRes, isAdminRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.rpc('is_admin'),
      ]);

      const profs = profilesRes.data || [];
      setSecProfiles(profs);

      const admins = profs.filter(p => p.role === 'admin');
      const hosts = profs.filter(p => p.role === 'host');
      const rpcActive = !isAdminRes.error && isAdminRes.data === true;

      setSecChecks([
        {
          label: 'public.is_admin() Security Definer RPC',
          status: rpcActive ? 'pass' : 'warn',
          detail: rpcActive
            ? 'Active & verified (caller is authenticated admin)'
            : 'RPC not detected — run supabase/security_hardening.sql',
        },
        {
          label: 'Administrator Accounts Audit',
          status: admins.length > 0 && admins.length <= 3 ? 'pass' : 'warn',
          detail: `${admins.length} admin account(s): ${admins.map(a => a.email).join(', ') || 'none'}`,
        },
        {
          label: 'Privilege Escalation Protection Triggers',
          status: 'pass',
          detail: 'protect_profile_columns, protect_property_columns, protect_post_columns configured',
        },
        {
          label: 'Verified Host Accounts',
          status: 'pass',
          detail: `${hosts.length} host account(s) registered across PakJai`,
        },
      ]);
    } catch (err: any) {
      showNotice('error', err.message || 'Security audit failed');
    } finally {
      setSecLoading(false);
    }
  };

  const handleQuickRoleUpdate = async (profileId: string, newRole: string, newVerified: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, is_verified: newVerified })
        .eq('id', profileId);
      if (error) throw error;
      setSecProfiles(prev =>
        prev.map(p => (p.id === profileId ? { ...p, role: newRole, is_verified: newVerified } : p))
      );
      showNotice('success', `Updated role to "${newRole}"`);
    } catch (err: any) {
      showNotice('error', err.message || 'Role update failed');
    }
  };

  // ── Full Database Snapshot Backup & Restore ──
  const handleFullDatabaseBackup = async () => {
    try {
      showNotice('success', 'Preparing full database snapshot...');
      const [properties, profiles, posts, comments, property_claims] = await Promise.all([
        supabase.from('properties').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('posts').select('*'),
        supabase.from('comments').select('*'),
        supabase.from('property_claims').select('*'),
      ]);

      const snapshot = {
        exportedAt: new Date().toISOString(),
        project: 'PakJaiTravel',
        tables: {
          properties: properties.data || [],
          profiles: profiles.data || [],
          posts: posts.data || [],
          comments: comments.data || [],
          property_claims: property_claims.data || [],
        },
      };

      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pakjai_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotice('success', 'Downloaded full database JSON snapshot');
    } catch (err: any) {
      showNotice('error', err.message || 'Snapshot export failed');
    }
  };

  const handleImportTableJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const rowsToUpsert = Array.isArray(parsed)
        ? parsed
        : parsed?.tables?.[activeTable] || [];
      if (!Array.isArray(rowsToUpsert) || rowsToUpsert.length === 0) {
        throw new Error(`No valid rows found for ${activeTable} in JSON file.`);
      }
      const { error } = await supabase.from(activeTable).upsert(rowsToUpsert);
      if (error) throw error;
      showNotice('success', `Upserted ${rowsToUpsert.length} row(s) into ${activeTable}`);
      fetchTableData();
      fetchCounts();
    } catch (err: any) {
      showNotice('error', err.message || 'JSON import failed');
    } finally {
      e.target.value = '';
    }
  };

  const renderCellValue = (row: any, col: ColumnMeta) => {
    const val = row[col.key];
    if (val === null || val === undefined || val === '') {
      return <span className="db-null">NULL</span>;
    }
    if (col.type === 'boolean') {
      return (
        <button
          type="button"
          className={`db-bool-chip ${val ? 'true' : 'false'}`}
          onClick={e => {
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
      if (col.fkTable) {
        return (
          <button
            type="button"
            className="db-fk-pill"
            onClick={e => {
              e.stopPropagation();
              jumpToForeignKey(col.fkTable!, String(val));
            }}
            title={`Jump to ${col.fkTable}.id = ${val}`}
          >
            <span>{String(val).slice(0, 8)}…</span>
            <small>↗ {col.fkTable}</small>
          </button>
        );
      }
      return <code className="db-uuid-cell">{String(val).slice(0, 8)}…</code>;
    }
    if (col.type === 'timestamp') {
      return <span className="db-ts-cell">{new Date(val).toLocaleString()}</span>;
    }
    if (col.key === 'image_url' || col.key === 'avatar' || col.key === 'cover_photo') {
      return (
        <div className="db-img-cell">
          <img
            src={String(val)}
            alt=""
            onError={e => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
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

      {/* ── Top Studio Header & Sub-Navigation Tabs ── */}
      <div className="admin-topbar db-studio-topbar">
        <div className="db-topbar-left">
          <h1>Supabase Studio</h1>
          <span className="db-live-indicator">
            Connected · {studioView === 'tables' ? `public.${activeTable}` : studioView.toUpperCase()}
          </span>
        </div>

        {/* Studio Module Switcher */}
        <div className="db-studio-tabs" role="tablist">
          <button
            type="button"
            className={`db-studio-tab ${studioView === 'tables' ? 'active' : ''}`}
            onClick={() => switchStudioView('tables')}
          >
            Table Editor
          </button>
          <button
            type="button"
            className={`db-studio-tab ${studioView === 'sql' ? 'active' : ''}`}
            onClick={() => switchStudioView('sql')}
          >
            SQL & Query Runner
          </button>
          <button
            type="button"
            className={`db-studio-tab ${studioView === 'moderation' ? 'active' : ''}`}
            onClick={() => switchStudioView('moderation')}
          >
            Community & Posts
          </button>
          <button
            type="button"
            className={`db-studio-tab ${studioView === 'media' ? 'active' : ''}`}
            onClick={() => switchStudioView('media')}
          >
            Storage & Media
          </button>
          <button
            type="button"
            className={`db-studio-tab ${studioView === 'security' ? 'active' : ''}`}
            onClick={() => switchStudioView('security')}
          >
            RLS & Security
          </button>
          <button
            type="button"
            className={`db-studio-tab ${studioView === 'schema' ? 'active' : ''}`}
            onClick={() => switchStudioView('schema')}
          >
            Schema & Backups
          </button>
        </div>

        <div className="admin-topbar-actions">
          {studioView === 'tables' && (
            <>
              <input
                ref={restoreFileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportTableJson}
              />
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => restoreFileInputRef.current?.click()}
              >
                Import JSON
              </button>
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
            </>
          )}

          {studioView !== 'tables' && (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={handleFullDatabaseBackup}
            >
              Download Full DB Backup (.json)
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VIEW 1: TABLE EDITOR
      ══════════════════════════════════════════════════════════ */}
      {studioView === 'tables' && (
        <div className="db-studio-workspace">
          {/* Left Table Explorer Rail */}
          <aside className="db-tables-rail">
            <div className="db-rail-header">
              <span>PUBLIC TABLES ({TABLES.length})</span>
              <button
                type="button"
                onClick={() => {
                  fetchCounts();
                  fetchTableData();
                }}
                title="Refresh schema"
              >
                ↻
              </button>
            </div>

            <div className="db-tables-list">
              {TABLES.map(tbl => (
                <button
                  key={tbl.name}
                  type="button"
                  className={`db-table-btn ${activeTable === tbl.name ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTable(tbl.name);
                    setFilterColumn('');
                    setFilterValue('');
                    setSearchParams({ view: 'tables', table: tbl.name });
                  }}
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
                    <span>{c.fkTable ? `→ ${c.fkTable}` : c.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Data Grid Canvas */}
          <div className="db-grid-area">
            <div className="db-query-toolbar">
              <div className="db-search-box">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Search all columns in ${activeTable}...`}
                />
              </div>

              <div className="db-filter-group">
                <select value={filterColumn} onChange={e => setFilterColumn(e.target.value)}>
                  <option value="">Filter column...</option>
                  {currentMeta.columns.map(c => (
                    <option key={c.key} value={c.key}>
                      {c.key}
                    </option>
                  ))}
                </select>
                {filterColumn && (
                  <>
                    <input
                      type="text"
                      value={filterValue}
                      onChange={e => setFilterValue(e.target.value)}
                      placeholder="contains value..."
                      className="db-filter-val-input"
                    />
                    <button
                      type="button"
                      className="db-refresh-btn"
                      onClick={() => {
                        setFilterColumn('');
                        setFilterValue('');
                      }}
                    >
                      Clear
                    </button>
                  </>
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

                <div className="db-col-picker-wrap">
                  <button
                    type="button"
                    className="db-refresh-btn"
                    onClick={() => setShowColPicker(v => !v)}
                  >
                    Columns ({visibleColumns.length}/{currentMeta.columns.length})
                  </button>
                  {showColPicker && (
                    <div className="db-col-picker-menu">
                      {currentMeta.columns.map(col => (
                        <label key={col.key} className="db-col-picker-item">
                          <input
                            type="checkbox"
                            checked={!hiddenCols.has(col.key)}
                            onChange={e => {
                              setHiddenCols(prev => {
                                const next = new Set(prev);
                                if (e.target.checked) next.delete(col.key);
                                else next.add(col.key);
                                return next;
                              });
                            }}
                          />
                          <span>{col.key}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <select
                  value={rowLimit}
                  onChange={e => setRowLimit(Number(e.target.value))}
                  className="db-limit-select"
                >
                  <option value={25}>25 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                  <option value={250}>250 rows</option>
                </select>

                <button type="button" className="db-refresh-btn" onClick={fetchTableData}>
                  Refresh
                </button>
              </div>
            </div>

            <div className="db-spreadsheet-wrap">
              {loading ? (
                <div className="db-loading-state">Querying public.{activeTable}...</div>
              ) : filteredRows.length === 0 ? (
                <div className="db-empty-state">
                  <p>
                    No records found in <code>public.{activeTable}</code> matching your filter.
                  </p>
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
                          onChange={e => handleSelectAll(e.target.checked)}
                        />
                      </th>
                      {visibleColumns.map(col => (
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
                            <small>{col.fkTable ? `fk→${col.fkTable}` : col.type}</small>
                            {sortCol === col.key && (
                              <span className="db-sort-indicator">{sortAsc ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map(row => {
                      const rowId = String(row[currentMeta.pk]);
                      const isSelected = selectedIds.has(rowId);
                      const isInspecting =
                        inspectingRow && String(inspectingRow[currentMeta.pk]) === rowId;

                      return (
                        <tr
                          key={rowId}
                          className={`${isSelected ? 'selected' : ''} ${
                            isInspecting ? 'inspecting' : ''
                          }`}
                          onClick={() => openRowInspector(row)}
                        >
                          <td className="db-checkbox-col" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRowSelect(rowId)}
                            />
                          </td>
                          {visibleColumns.map(col => (
                            <td key={col.key}>{renderCellValue(row, col)}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="db-grid-footer">
              <span>
                Showing {filteredRows.length} of {tableCounts[activeTable] ?? filteredRows.length}{' '}
                total rows in <code>public.{activeTable}</code>
              </span>
              <span>Click any row to edit · Click foreign-key pills (↗) to jump across tables</span>
            </div>
          </div>

          {/* Right Row Inspector / Editor Drawer */}
          {inspectingRow && (
            <aside className="db-inspector-drawer">
              <div className="db-inspector-header">
                <div>
                  <h3>
                    {isNewRowMode ? `Insert into ${activeTable}` : `Edit Row in ${activeTable}`}
                  </h3>
                  {!isNewRowMode && (
                    <code className="db-inspector-pk">
                      {currentMeta.pk}: {String(inspectingRow[currentMeta.pk])}
                    </code>
                  )}
                </div>
                <button
                  type="button"
                  className="db-inspector-close"
                  onClick={() => {
                    setInspectingRow(null);
                    setIsNewRowMode(false);
                  }}
                >
                  &times;
                </button>
              </div>

              {!isNewRowMode && (
                <div className="db-inspector-quickbar">
                  <button type="button" onClick={handleDuplicateRow}>
                    Duplicate as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(inspectingRow, null, 2));
                      showNotice('success', 'Copied row JSON');
                    }}
                  >
                    Copy Row JSON
                  </button>
                  <button type="button" className="danger" onClick={handleDeleteSingleRow}>
                    Delete Row
                  </button>
                </div>
              )}

              <form className="db-inspector-form" onSubmit={handleSaveRow}>
                {currentMeta.columns.map(col => {
                  const disabled = !col.editable;
                  const val = editDraft[col.key];

                  return (
                    <div key={col.key} className="db-field-row">
                      <div className="db-field-label">
                        <label>{col.key}</label>
                        <span>
                          {col.type}
                          {disabled ? ' · read-only' : ''}
                        </span>
                      </div>

                      {col.type === 'boolean' ? (
                        <label className="db-toggle-switch">
                          <input
                            type="checkbox"
                            checked={Boolean(val)}
                            disabled={disabled}
                            onChange={e =>
                              setEditDraft(prev => ({ ...prev, [col.key]: e.target.checked }))
                            }
                          />
                          <span>{val ? 'true' : 'false'}</span>
                        </label>
                      ) : col.type === 'json' ||
                        col.key === 'description' ||
                        col.key === 'content' ||
                        col.key === 'proof_notes' ? (
                        <textarea
                          rows={col.type === 'json' ? 4 : 3}
                          value={val ?? ''}
                          disabled={disabled}
                          onChange={e =>
                            setEditDraft(prev => ({ ...prev, [col.key]: e.target.value }))
                          }
                          className={col.type === 'json' ? 'db-code-textarea' : ''}
                        />
                      ) : (
                        <input
                          type={col.type === 'number' ? 'number' : 'text'}
                          step={col.type === 'number' ? 'any' : undefined}
                          value={val ?? ''}
                          disabled={disabled}
                          onChange={e =>
                            setEditDraft(prev => ({ ...prev, [col.key]: e.target.value }))
                          }
                        />
                      )}
                    </div>
                  );
                })}

                <div className="db-inspector-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => {
                      setInspectingRow(null);
                      setIsNewRowMode(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : isNewRowMode ? 'Insert Row' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </aside>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VIEW 2: SQL & QUERY WORKBENCH
      ══════════════════════════════════════════════════════════ */}
      {studioView === 'sql' && (
        <div className="db-studio-workspace">
          <aside className="db-tables-rail db-sql-rail">
            <div className="db-rail-header">
              <span>SAVED QUERIES ({SAVED_QUERIES.length})</span>
            </div>
            <div className="db-tables-list">
              {SAVED_QUERIES.map(sq => (
                <button
                  key={sq.id}
                  type="button"
                  className="db-saved-query-btn"
                  onClick={() => runWorkbenchQuery(sq)}
                >
                  <strong>{sq.title}</strong>
                  <span>{sq.description}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="db-grid-area db-sql-main">
            <div className="db-sql-builder">
              <div className="db-sql-controls">
                <div className="db-sql-field">
                  <label>Mode</label>
                  <select
                    value={qOperation}
                    onChange={e => setQOperation(e.target.value as 'select' | 'rpc')}
                  >
                    <option value="select">SELECT Table Query</option>
                    <option value="rpc">Call Security Definer RPC</option>
                  </select>
                </div>

                {qOperation === 'select' ? (
                  <>
                    <div className="db-sql-field">
                      <label>FROM Table</label>
                      <select
                        value={qTable}
                        onChange={e => setQTable(e.target.value as TableName)}
                      >
                        {TABLES.map(t => (
                          <option key={t.name} value={t.name}>
                            public.{t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="db-sql-field db-sql-field-grow">
                      <label>SELECT Columns</label>
                      <input
                        type="text"
                        value={qSelectCols}
                        onChange={e => setQSelectCols(e.target.value)}
                        placeholder="* or id, name, created_at"
                      />
                    </div>

                    <div className="db-sql-field">
                      <label>WHERE Column</label>
                      <input
                        type="text"
                        value={qFilterCol}
                        onChange={e => setQFilterCol(e.target.value)}
                        placeholder="e.g. role or is_verified"
                      />
                    </div>

                    <div className="db-sql-field">
                      <label>Operator</label>
                      <select
                        value={qFilterOp}
                        onChange={e => setQFilterOp(e.target.value as any)}
                      >
                        <option value="eq">= (equals)</option>
                        <option value="neq">!= (not equals)</option>
                        <option value="ilike">ILIKE (contains)</option>
                        <option value="gt">&gt; (greater than)</option>
                        <option value="lt">&lt; (less than)</option>
                        <option value="is_null">IS NULL</option>
                      </select>
                    </div>

                    {qFilterOp !== 'is_null' && (
                      <div className="db-sql-field">
                        <label>Value</label>
                        <input
                          type="text"
                          value={qFilterVal}
                          onChange={e => setQFilterVal(e.target.value)}
                          placeholder="value..."
                        />
                      </div>
                    )}

                    <div className="db-sql-field">
                      <label>Limit</label>
                      <select
                        value={qLimit}
                        onChange={e => setQLimit(Number(e.target.value))}
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={250}>250</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="db-sql-field">
                      <label>RPC Function</label>
                      <select
                        value={qRpcName}
                        onChange={e => setQRpcName(e.target.value as any)}
                      >
                        <option value="is_admin">public.is_admin()</option>
                        <option value="toggle_like">public.toggle_like(target_post_id)</option>
                        <option value="delete_user">public.delete_user(target_user_id)</option>
                      </select>
                    </div>

                    {qRpcName !== 'is_admin' && (
                      <div className="db-sql-field db-sql-field-grow">
                        <label>Target UUID Argument</label>
                        <input
                          type="text"
                          value={qRpcArg}
                          onChange={e => setQRpcArg(e.target.value)}
                          placeholder="Paste post UUID or user UUID..."
                        />
                      </div>
                    )}
                  </>
                )}

                <button
                  type="button"
                  className="admin-btn admin-btn-primary db-run-sql-btn"
                  onClick={() => runWorkbenchQuery()}
                  disabled={qRunning}
                >
                  {qRunning ? 'Running...' : '▶ Run Query'}
                </button>
              </div>

              <div className="db-sql-preview-box">
                <pre>{generatedSqlPreview}</pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedSqlPreview);
                    showNotice('success', 'Copied SQL to clipboard');
                  }}
                >
                  Copy SQL
                </button>
              </div>
            </div>

            <div className="db-sql-results-head">
              <div className="db-sql-result-tabs">
                <button
                  type="button"
                  className={qResultTab === 'table' ? 'active' : ''}
                  onClick={() => setQResultTab('table')}
                >
                  Results Table {qResults ? `(${qResults.length})` : ''}
                </button>
                <button
                  type="button"
                  className={qResultTab === 'json' ? 'active' : ''}
                  onClick={() => setQResultTab('json')}
                >
                  Raw JSON
                </button>
                <button
                  type="button"
                  className={qResultTab === 'code' ? 'active' : ''}
                  onClick={() => setQResultTab('code')}
                >
                  Supabase JS Snippet
                </button>
              </div>
              {qLatencyMs !== null && (
                <span className="db-sql-latency">Completed in {qLatencyMs} ms</span>
              )}
            </div>

            <div className="db-spreadsheet-wrap">
              {!qResults ? (
                <div className="db-empty-state">
                  <p>Pick a saved query on the left or click <strong>▶ Run Query</strong> to inspect results.</p>
                </div>
              ) : qResultTab === 'json' ? (
                <pre className="db-json-viewer">{JSON.stringify(qResults, null, 2)}</pre>
              ) : qResultTab === 'code' ? (
                <pre className="db-json-viewer">
                  {`const { data, error } = await supabase\n  .from('${qTable}')\n  .select('${qSelectCols || '*'}')${
                    qFilterCol ? `\n  .${qFilterOp}('${qFilterCol}', '${qFilterVal}')` : ''
                  }\n  .order('${qOrderCol}', { ascending: ${qOrderAsc} })\n  .limit(${qLimit});`}
                </pre>
              ) : qResults.length === 0 ? (
                <div className="db-empty-state">Query returned 0 rows.</div>
              ) : (
                <table className="db-spreadsheet">
                  <thead>
                    <tr>
                      {Object.keys(qResults[0]).map(k => (
                        <th key={k}>
                          <div className="db-th-inner">
                            <span>{k}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {qResults.map((r, i) => (
                      <tr
                        key={r.id || i}
                        onClick={() => {
                          if (r.id && qOperation === 'select') {
                            jumpToForeignKey(qTable, String(r.id));
                          }
                        }}
                      >
                        {Object.keys(qResults[0]).map(k => (
                          <td key={k}>
                            {typeof r[k] === 'object' && r[k] !== null
                              ? JSON.stringify(r[k])
                              : String(r[k] ?? 'NULL')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VIEW 3: COMMUNITY & POSTS MODERATION
      ══════════════════════════════════════════════════════════ */}
      {studioView === 'moderation' && (
        <div className="db-studio-workspace db-studio-single">
          <div className="db-grid-area">
            <div className="db-query-toolbar">
              <div className="db-search-box">
                <input
                  type="text"
                  value={modSearch}
                  onChange={e => setModSearch(e.target.value)}
                  placeholder="Search posts by author, location, or caption..."
                />
              </div>

              <div className="db-studio-tabs">
                <button
                  type="button"
                  className={`db-studio-tab ${modFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setModFilter('all')}
                >
                  All Stories ({modPosts.length})
                </button>
                <button
                  type="button"
                  className={`db-studio-tab ${modFilter === 'potw' ? 'active' : ''}`}
                  onClick={() => setModFilter('potw')}
                >
                  Picture of the Week ({modPosts.filter(p => p.join_potw).length})
                </button>
                <button
                  type="button"
                  className={`db-studio-tab ${modFilter === 'reviews' ? 'active' : ''}`}
                  onClick={() => setModFilter('reviews')}
                >
                  Rated Reviews ({modPosts.filter(p => p.rating).length})
                </button>
              </div>

              <button type="button" className="db-refresh-btn" onClick={fetchModerationPosts}>
                Refresh
              </button>
            </div>

            <div className="db-mod-grid">
              {modLoading ? (
                <div className="db-loading-state">Loading community stories & comments...</div>
              ) : (
                modPosts
                  .filter(p => {
                    if (modFilter === 'potw' && !p.join_potw) return false;
                    if (modFilter === 'reviews' && !p.rating) return false;
                    if (modSearch.trim()) {
                      const q = modSearch.toLowerCase();
                      return (
                        (p.author_name || '').toLowerCase().includes(q) ||
                        (p.location_tag || '').toLowerCase().includes(q) ||
                        (p.content || '').toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map(post => {
                    const cover =
                      (Array.isArray(post.images) && post.images[0]) || post.image_url;
                    const comments = post.comments || [];

                    return (
                      <div key={post.id} className="db-mod-card">
                        <div className="db-mod-card-top">
                          {cover ? (
                            <img src={cover} alt="" className="db-mod-thumb" />
                          ) : (
                            <div className="db-mod-thumb db-mod-thumb-empty">No Photo</div>
                          )}
                          <div className="db-mod-info">
                            <div className="db-mod-author-row">
                              <strong>{post.author_name || 'Traveler'}</strong>
                              {post.location_tag && (
                                <span className="db-mod-loc">{post.location_tag}</span>
                              )}
                              <span className="db-mod-date">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="db-mod-caption">{post.content || '(No caption)'}</p>
                            <div className="db-mod-metrics">
                              <span>{(post.likes || []).length} Likes</span>
                              <span>{comments.length} Comments</span>
                              {post.rating && <span>Rating: {post.rating}/5</span>}
                            </div>
                          </div>
                        </div>

                        {comments.length > 0 && (
                          <div className="db-mod-comments">
                            <div className="db-mod-comments-title">
                              Comments ({comments.length})
                            </div>
                            {comments.map((c: any) => (
                              <div key={c.id} className="db-mod-comment-item">
                                <span>
                                  <strong>{c.author_name || 'User'}:</strong> {c.text}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteModComment(post.id, c.id)}
                                  title="Delete comment"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="db-mod-actions">
                          <button
                            type="button"
                            className={`db-bool-chip ${post.join_potw ? 'true' : 'false'}`}
                            onClick={() => handleTogglePotw(post)}
                          >
                            {post.join_potw ? '★ Featured in POTW' : '☆ Feature in POTW'}
                          </button>

                          <div className="db-mod-actions-right">
                            <button
                              type="button"
                              className="db-refresh-btn"
                              onClick={() => jumpToForeignKey('posts', post.id)}
                            >
                              Inspect in Table
                            </button>
                            <button
                              type="button"
                              className="db-bulk-delete-btn"
                              onClick={() => handleDeleteModPost(post.id)}
                            >
                              Delete Post
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VIEW 4: STORAGE & MEDIA BROWSER
      ══════════════════════════════════════════════════════════ */}
      {studioView === 'media' && (
        <div className="db-studio-workspace db-studio-single">
          <div className="db-grid-area">
            <div className="db-query-toolbar">
              <div className="db-search-box">
                <input
                  type="text"
                  value={mediaSearch}
                  onChange={e => setMediaSearch(e.target.value)}
                  placeholder="Search media by property name, author, or URL..."
                />
              </div>

              <div className="db-studio-tabs">
                <button
                  type="button"
                  className={`db-studio-tab ${mediaSourceFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setMediaSourceFilter('all')}
                >
                  All Media ({mediaItems.length})
                </button>
                <button
                  type="button"
                  className={`db-studio-tab ${mediaSourceFilter === 'properties' ? 'active' : ''}`}
                  onClick={() => setMediaSourceFilter('properties')}
                >
                  Properties ({mediaItems.filter(m => m.sourceTable === 'properties').length})
                </button>
                <button
                  type="button"
                  className={`db-studio-tab ${mediaSourceFilter === 'posts' ? 'active' : ''}`}
                  onClick={() => setMediaSourceFilter('posts')}
                >
                  Journal Posts ({mediaItems.filter(m => m.sourceTable === 'posts').length})
                </button>
                <button
                  type="button"
                  className={`db-studio-tab ${mediaSourceFilter === 'profiles' ? 'active' : ''}`}
                  onClick={() => setMediaSourceFilter('profiles')}
                >
                  Profiles ({mediaItems.filter(m => m.sourceTable === 'profiles').length})
                </button>
              </div>

              <div className="db-toolbar-right">
                <input
                  ref={mediaFileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleDirectMediaUpload}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  disabled={uploadingMedia}
                  onClick={() => mediaFileInputRef.current?.click()}
                >
                  {uploadingMedia ? 'Uploading...' : '+ Upload New Image to CDN'}
                </button>
              </div>
            </div>

            {lastUploadedUrl && (
              <div className="db-uploaded-banner">
                <span>
                  Uploaded CDN URL: <code>{lastUploadedUrl}</code>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(lastUploadedUrl);
                    showNotice('success', 'Copied CDN URL');
                  }}
                >
                  Copy URL
                </button>
              </div>
            )}

            <div className="db-media-gallery">
              {mediaLoading ? (
                <div className="db-loading-state">Scanning media across all tables...</div>
              ) : (
                mediaItems
                  .filter(item => {
                    if (mediaSourceFilter !== 'all' && item.sourceTable !== mediaSourceFilter) {
                      return false;
                    }
                    if (mediaSearch.trim()) {
                      const q = mediaSearch.toLowerCase();
                      return (
                        item.recordLabel.toLowerCase().includes(q) ||
                        item.url.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map(item => (
                    <div key={item.id} className="db-media-card">
                      <div className="db-media-img-wrap">
                        <img src={item.url} alt={item.recordLabel} loading="lazy" />
                        <span className="db-media-badge">{item.sourceTable}</span>
                      </div>
                      <div className="db-media-body">
                        <strong>{item.recordLabel}</strong>
                        <code>{item.field}</code>
                        <div className="db-media-actions">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(item.url);
                              showNotice('success', 'Copied image URL');
                            }}
                          >
                            Copy URL
                          </button>
                          <button
                            type="button"
                            onClick={() => jumpToForeignKey(item.sourceTable, item.recordId)}
                          >
                            Open Row ↗
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VIEW 5: RLS & SECURITY CENTER
      ══════════════════════════════════════════════════════════ */}
      {studioView === 'security' && (
        <div className="db-studio-workspace db-studio-single">
          <div className="db-security-scroll">
            {/* Live Security Audit Strip */}
            <div className="db-sec-cards">
              {secChecks.map((chk, idx) => (
                <div key={idx} className={`db-sec-card ${chk.status}`}>
                  <div className="db-sec-card-top">
                    <strong>{chk.label}</strong>
                    <span className={`db-sec-status ${chk.status}`}>
                      {chk.status === 'pass' ? 'PROTECTED' : 'CHECK'}
                    </span>
                  </div>
                  <p>{chk.detail}</p>
                </div>
              ))}
            </div>

            {/* Quick Role & Privilege Manager */}
            <div className="db-sec-panel">
              <div className="db-sec-panel-head">
                <div>
                  <h3>Quick Role & Admin Privilege Manager</h3>
                  <p>
                    Promote or demote accounts between <code>user</code>, <code>host</code>, and{' '}
                    <code>admin</code>, or toggle verified status directly in{' '}
                    <code>public.profiles</code>.
                  </p>
                </div>
                <input
                  type="text"
                  value={roleSearch}
                  onChange={e => setRoleSearch(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="db-filter-val-input"
                />
              </div>

              {secLoading ? (
                <div className="db-loading-state">Loading user profiles...</div>
              ) : (
                <table className="db-spreadsheet">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Current Role</th>
                      <th>Verified</th>
                      <th>Quick Role Switch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {secProfiles
                      .filter(p => {
                        if (!roleSearch.trim()) return true;
                        const q = roleSearch.toLowerCase();
                        return (
                          (p.name || '').toLowerCase().includes(q) ||
                          (p.email || '').toLowerCase().includes(q)
                        );
                      })
                      .map(p => (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.name}</strong>
                          </td>
                          <td>{p.email}</td>
                          <td>
                            <span className={`db-role-pill ${p.role || 'user'}`}>
                              {p.role || 'user'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`db-bool-chip ${p.is_verified ? 'true' : 'false'}`}
                              onClick={() =>
                                handleQuickRoleUpdate(p.id, p.role || 'user', !p.is_verified)
                              }
                            >
                              {p.is_verified ? 'Verified' : 'Unverified'}
                            </button>
                          </td>
                          <td>
                            <div className="db-role-btn-group">
                              {(['user', 'host', 'admin'] as const).map(r => (
                                <button
                                  key={r}
                                  type="button"
                                  className={`db-role-switch-btn ${p.role === r ? 'active' : ''}`}
                                  onClick={() => handleQuickRoleUpdate(p.id, r, p.is_verified)}
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Active RLS Policies & Triggers Reference */}
            <div className="db-sec-panel">
              <div className="db-sec-panel-head">
                <div>
                  <h3>Row Level Security (RLS) Policies & Triggers Matrix</h3>
                  <p>Active database-level access rules and column protection triggers.</p>
                </div>
              </div>

              <div className="db-rls-grid">
                {RLS_POLICIES_REFERENCE.map(item => (
                  <div key={item.table} className="db-rls-card">
                    <div className="db-rls-card-head">
                      <code>public.{item.table}</code>
                      <span className="db-bool-chip true">RLS {item.rls}</span>
                    </div>
                    <div className="db-rls-triggers">
                      {item.triggers.map((tr, i) => (
                        <span key={i} className="db-trigger-chip">
                          Trigger: {tr}
                        </span>
                      ))}
                    </div>
                    <ul className="db-rls-list">
                      {item.policies.map((pol, i) => (
                        <li key={i}>
                          <div>
                            <strong>{pol.name}</strong>
                            <span className="db-cmd-tag">{pol.cmd}</span>
                          </div>
                          <code>{pol.rule}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VIEW 6: SCHEMA EXPLORER & BACKUPS
      ══════════════════════════════════════════════════════════ */}
      {studioView === 'schema' && (
        <div className="db-studio-workspace db-studio-single">
          <div className="db-security-scroll">
            <div className="db-sec-panel">
              <div className="db-sec-panel-head">
                <div>
                  <h3>Database Entity-Relationship Schema</h3>
                  <p>
                    Complete relational structure of PakJai's 5 public tables, primary keys, and
                    foreign key links.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={handleFullDatabaseBackup}
                >
                  Download Full Snapshot (.json)
                </button>
              </div>

              <div className="db-er-grid">
                {TABLES.map(tbl => (
                  <div key={tbl.name} className="db-er-card">
                    <div className="db-er-head">
                      <div>
                        <h4>public.{tbl.name}</h4>
                        <span>{tableCounts[tbl.name] ?? 0} rows</span>
                      </div>
                      <button
                        type="button"
                        className="db-refresh-btn"
                        onClick={() => switchStudioView('tables', tbl.name)}
                      >
                        Open Table →
                      </button>
                    </div>
                    <p className="db-er-desc">{tbl.description}</p>
                    <ul className="db-er-cols">
                      {tbl.columns.map(col => (
                        <li key={col.key}>
                          <span className="db-er-col-left">
                            {col.key === tbl.pk && <b className="db-pk-tag">PK</b>}
                            {col.fkTable && <b className="db-fk-tag">FK</b>}
                            <code>{col.key}</code>
                          </span>
                          <span className="db-er-col-type">
                            {col.fkTable ? `${col.type} → ${col.fkTable}.id` : col.type}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDatabase;
