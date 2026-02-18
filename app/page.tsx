'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { Pencil, Trash2 } from 'lucide-react';
import './bookmarks.css';

export default function Home() {
  const [user, setUser]                       = useState<any>(null);
  const [bookmarks, setBookmarks]             = useState<any[]>([]);
  const [title, setTitle]                     = useState('');
  const [url, setUrl]                         = useState('');
  const [isAdding, setIsAdding]               = useState(false);
  const [addLoading, setAddLoading]           = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId]             = useState<string | null>(null);
  const [editTitle, setEditTitle]             = useState('');
  const [editUrl, setEditUrl]                 = useState('');
  const [saveLoading, setSaveLoading]         = useState(false);
  const [search, setSearch]                   = useState('');
  const [urlError, setUrlError]               = useState('');

  // ── Auth + realtime setup ──────────────────────────────────────────────────
  useEffect(() => {
    let channel: any;

    const setup = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { window.location.href = '/login'; return; }

      setUser(data.user);
      fetchBookmarks(data.user.id);

      channel = supabase
        .channel('bookmarks-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, () => {
          fetchBookmarks(data.user.id);
        })
        .subscribe();
    };

    setup();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  // ── Fetch all bookmarks urls ───────────────────────────────────────────────────────────
  const fetchBookmarks = async (userId: string) => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setBookmarks(data);
  };

  // url validation, domain extraction, and favicon retrieval helpers
  const isValidUrl = (raw: string) => {
    try {
      const u = new URL(raw);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch { return false; }
  };

  const getDomain = (raw: string) => {
    try { return new URL(raw).hostname.replace('www.', ''); }
    catch { return raw; }
  };

  const getFavicon = (raw: string) => {
    try { return `https://www.google.com/s2/favicons?sz=32&domain_url=${new URL(raw).origin}`; }
    catch { return null; }
  };

  // ── CRUD actions ───────────────────────────────────────────────────────────
  const addBookmark = async () => {
    if (!title || !url) return;
    if (!isValidUrl(url)) { setUrlError('Please enter a valid URL (e.g., https://example.com)'); return; }

    setUrlError('');
    setAddLoading(true);
    await supabase.from('bookmarks').insert([{ title, url, user_id: user.id }]);
    setTitle(''); setUrl(''); setIsAdding(false); setAddLoading(false);
    fetchBookmarks(user.id);
  };

  const deleteBookmark = async (id: string) => {
    setDeleteLoadingId(id);
    await supabase.from('bookmarks').delete().eq('id', id);
    setDeleteLoadingId(null);
    fetchBookmarks(user.id);
  };

  const startEdit = (bookmark: any) => {
    setEditingId(bookmark.id);
    setEditTitle(bookmark.title);
    setEditUrl(bookmark.url);
  };

  const updateBookmark = async () => {
    if (!editTitle || !editUrl || !editingId) return;
    if (!isValidUrl(editUrl)) { alert('Please enter a valid URL (e.g., https://example.com)'); return; }

    setSaveLoading(true);
    await supabase.from('bookmarks').update({ title: editTitle, url: editUrl }).eq('id', editingId);
    setEditingId(null); setSaveLoading(false);
    fetchBookmarks(user.id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const filteredBookmarks = bookmarks.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.url.toLowerCase().includes(search.toLowerCase())
  );

  // ── Shared class snippets (avoids repeating long strings) ──────────────────
  const fieldInputCls =
    'w-full rounded-[10px] px-[14px] py-[11px] text-[14px] outline-none ' +
    'bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] ' +
    'placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] ' +
    'focus:ring-2 focus:ring-[var(--accent)]/10 transition-all duration-[180ms]';

  const editInputCls =
    'w-full rounded-lg px-3 py-[9px] text-[13px] outline-none ' +
    'bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] ' +
    'placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] ' +
    'focus:ring-2 focus:ring-[var(--accent)]/10 transition-all duration-[180ms]';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app-wrapper min-h-screen bg-[var(--bg)]">
      <div className="max-w-[680px] mx-auto px-5 pb-20">

        {/* ── Header ── */}
        <header className="flex items-center justify-between py-9 mb-9 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="logo-icon w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-lg flex-shrink-0">
              🔖
            </div>
            <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Bookmarks</span>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              {/* User email badge */}
              <span className="font-mono-dm text-[11px] text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)] px-[10px] py-[5px] rounded-full max-w-[160px] truncate">
                {user.email}
              </span>

              {/* Sign out */}
              <button
                onClick={logout}
                className="flex items-center gap-[6px] px-[14px] py-[6px] rounded-lg text-[13px] font-medium border border-[var(--border)] text-[var(--text-secondary)] bg-transparent hover:border-[var(--danger)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all duration-[180ms] cursor-pointer"
              >
                <span>↩</span> Sign out
              </button>
            </div>
          )}
        </header>

        {user && (
          <>
            {/* ── Toolbar ── */}
            <div className="flex gap-3 mb-6">

              {/* Search input */}
              <div className="flex-1 relative">
                <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[15px] text-[var(--text-muted)] pointer-events-none">
                  ⌕
                </span>
                <input
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[10px] pl-[38px] pr-[14px] py-[10px] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--border-focus)] transition-[border-color] duration-[180ms]"
                  placeholder="Search bookmarks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* New bookmark button */}
              <button
                className="btn-primary flex items-center gap-[7px] px-[18px] py-[10px] rounded-[10px] text-[14px] font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] hover:-translate-y-px active:translate-y-0 transition-all duration-[180ms] cursor-pointer whitespace-nowrap"
                onClick={() => { setIsAdding((v) => !v); setTitle(''); setUrl(''); }}
              >
                <span className="text-lg leading-none">+</span> New
              </button>
            </div>

            {/* ── Add Panel ── */}
            {isAdding && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-6 mb-7 animate-slide-down">
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] mb-4">
                  Add new bookmark
                </p>

                <div className="flex flex-col gap-[10px]">
                  <input
                    className={fieldInputCls}
                    placeholder="Title  e.g. OpenAI Blog"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <input
                    className={fieldInputCls}
                    placeholder="URL  e.g. https://openai.com/blog"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setUrlError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && addBookmark()}
                  />
                  {urlError && (
                    <p className="text-[12px] -mt-[6px] text-[var(--danger)]">{urlError}</p>
                  )}
                </div>

                <div className="flex gap-[10px] mt-[14px]">
                  <button
                    className="btn-primary flex items-center gap-[7px] px-[18px] py-[10px] rounded-[10px] text-[14px] font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all duration-[180ms] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={addBookmark}
                    disabled={addLoading || !title || !url}
                  >
                    {addLoading && <span className="spinner" />}
                    {addLoading ? 'Saving…' : 'Save bookmark'}
                  </button>

                  <button
                    className="px-4 py-[9px] rounded-lg text-[13px] font-medium border border-[var(--border)] text-[var(--text-secondary)] bg-transparent hover:border-[var(--border-focus)] hover:text-[var(--text-primary)] transition-all duration-[150ms] cursor-pointer"
                    onClick={() => setIsAdding(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Stats Bar ── */}
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono-dm text-[12px] tracking-[0.04em] text-[var(--text-muted)]">
                <span className="text-[var(--text-secondary)]">{filteredBookmarks.length}</span>
                {search
                  ? ` of ${bookmarks.length} bookmarks`
                  : ` bookmark${bookmarks.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* ── Bookmark List ── */}
            <div className="flex flex-col gap-[10px]">
              {filteredBookmarks.length === 0 ? (

                /* ── Empty State ── */
                <div className="flex flex-col items-center gap-3 text-center py-16 px-5">
                  <div className="text-[40px] opacity-30">🔍</div>
                  <p className="text-[16px] font-semibold text-[var(--text-secondary)]">
                    {search ? 'No results found' : 'No bookmarks yet'}
                  </p>
                  <p className="text-[13px] text-[var(--text-muted)]">
                    {search ? 'Try a different search term' : 'Hit "+ New" to save your first bookmark'}
                  </p>
                </div>

              ) : filteredBookmarks.map((bookmark, i) => (

                /* ── Bookmark Card ── */
                <div
                  key={bookmark.id}
                  className="bookmark-card bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-[18px] hover:border-[var(--border-focus)] hover:bg-[var(--surface-hover)] transition-[border-color,background] duration-[180ms] animate-fade-in-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {editingId === bookmark.id ? (

                    /* ── Edit Mode ── */
                    <div className="flex flex-col gap-[10px]">
                      <input
                        className={editInputCls}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title"
                        autoFocus
                      />
                      <input
                        className={editInputCls}
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="URL"
                        onKeyDown={(e) => e.key === 'Enter' && updateBookmark()}
                      />
                      <div className="flex gap-2">
                        <button
                          className="flex items-center gap-[5px] px-[14px] py-[7px] rounded-[7px] text-[12px] font-bold text-black bg-[var(--success)] hover:opacity-[0.88] transition-opacity duration-[150ms] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={updateBookmark}
                          disabled={saveLoading || !editTitle || !editUrl}
                        >
                          {saveLoading ? <span className="spinner spinner-dark spinner-sm" /> : '✓'}
                          {saveLoading ? 'Saving…' : 'Save changes'}
                        </button>

                        <button
                          className="px-3 py-[7px] rounded-[7px] text-[12px] font-medium border border-[var(--border)] text-[var(--text-secondary)] bg-transparent hover:border-[var(--border-focus)] hover:text-[var(--text-primary)] transition-all duration-[150ms] cursor-pointer"
                          onClick={() => setEditingId(null)}
                        >
                          Discard
                        </button>
                      </div>
                    </div>

                  ) : (

                    /* ── View Mode ── */
                    <div className="flex items-start gap-[14px]">

                      {/* Favicon */}
                      <div className="w-9 h-9 rounded-[9px] bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {getFavicon(bookmark.url) && (
                          <img
                            src={getFavicon(bookmark.url)!}
                            alt=""
                            className="w-[18px] h-[18px] object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                            }}
                          />
                        )}
                        <span className="text-[15px] text-[var(--text-muted)]" style={{ display: 'none' }}>🌐</span>
                      </div>

                      {/* Title + domain + URL */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight mb-1 truncate">
                          {bookmark.title}
                        </p>
                        <span className="font-mono-dm text-[11px] text-[var(--text-muted)] block mb-0.5">
                          {getDomain(bookmark.url)}
                        </span>
                        <a
                          className="font-mono-dm text-[12px] text-[var(--accent)] hover:text-[var(--accent-hover)] max-w-[280px] truncate block transition-colors duration-[150ms]"
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {bookmark.url}
                        </a>
                      </div>

                      {/* Edit / Delete actions */}
                      <div className="flex gap-[6px] flex-shrink-0 ml-2">
                        <button
                          className="w-8 h-8 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--warning)] hover:text-[var(--warning)] hover:bg-[var(--warning)]/10 flex items-center justify-center transition-all duration-[150ms] cursor-pointer"
                          title="Edit"
                          onClick={() => startEdit(bookmark)}
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          className="w-8 h-8 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--danger)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 flex items-center justify-center transition-all duration-[150ms] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Delete"
                          onClick={() => deleteBookmark(bookmark.id)}
                          disabled={deleteLoadingId === bookmark.id}
                        >
                          {deleteLoadingId === bookmark.id
                            ? <span className="spinner spinner-sm" />
                            : <Trash2 size={14} />}
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}