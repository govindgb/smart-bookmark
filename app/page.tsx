'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { Pencil, Trash2 } from 'lucide-react';
import './bookmarks.css';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Search
  const [search, setSearch] = useState('');
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    let channel: any;

    const setup = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = '/login';
        return;
      }

      setUser(data.user);
      fetchBookmarks(data.user.id);

      channel = supabase
        .channel('bookmarks-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookmarks' },
          () => {
            fetchBookmarks(data.user.id);
          }
        )
        .subscribe();
    };

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchBookmarks = async (userId: string) => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) setBookmarks(data);
  };

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const addBookmark = async () => {
    if (!title || !url) return;
    
    if (!isValidUrl(url)) {
      setUrlError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }
    
    setUrlError('');
    setAddLoading(true);

    await supabase.from('bookmarks').insert([
      {
        title,
        url,
        user_id: user.id,
      },
    ]);

    setTitle('');
    setUrl('');
    setIsAdding(false);
    setAddLoading(false);
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
    
    if (!isValidUrl(editUrl)) {
      alert('Please enter a valid URL (e.g., https://example.com)');
      return;
    }
    
    setSaveLoading(true);

    await supabase
      .from('bookmarks')
      .update({ title: editTitle, url: editUrl })
      .eq('id', editingId);

    setEditingId(null);
    setSaveLoading(false);
    fetchBookmarks(user.id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase())
  );

  const getDomain = (rawUrl: string) => {
    try {
      return new URL(rawUrl).hostname.replace('www.', '');
    } catch {
      return rawUrl;
    }
  };

  const getFavicon = (rawUrl: string) => {
    try {
      const domain = new URL(rawUrl).origin;
      return `https://www.google.com/s2/favicons?sz=32&domain_url=${domain}`;
    } catch {
      return null;
    }
  };

  return (
    <div className="app-wrapper">
        <div className="container">
          {/* ── Header ── */}
          <header className="header">
            <div className="logo-group">
              <div className="logo-icon">🔖</div>
              <span className="logo-text">Bookmarks</span>
            </div>

            {user && (
              <div className="header-right">
                <span className="user-badge">{user.email}</span>
                <button className="btn-ghost" onClick={logout}>
                  <span>↩</span> Sign out
                </button>
              </div>
            )}
          </header>

          {user && (
            <>
              {/* ── Toolbar ── */}
              <div className="toolbar">
                <div className="search-wrap">
                  <span className="search-icon">⌕</span>
                  <input
                    className="search-input"
                    placeholder="Search bookmarks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button
                  className="btn-primary"
                  onClick={() => { setIsAdding((v) => !v); setTitle(''); setUrl(''); }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
                  New
                </button>
              </div>

              {/* ── Add Panel ── */}
              {isAdding && (
                <div className="add-panel">
                  <p className="add-panel-header">Add new bookmark</p>
                  <div className="field-group">
                    <input
                      className="field-input"
                      placeholder="Title  e.g. OpenAI Blog"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <input
                      className="field-input"
                      placeholder="URL  e.g. https://openai.com/blog"
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setUrlError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && addBookmark()}
                    />
                    {urlError && <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '-6px' }}>{urlError}</p>}
                  </div>
                  <div className="panel-actions">
                    <button
                      className="btn-primary"
                      onClick={addBookmark}
                      disabled={addLoading || !title || !url}
                    >
                      {addLoading ? <span className="spinner" /> : null}
                      {addLoading ? 'Saving…' : 'Save bookmark'}
                    </button>
                    <button className="btn-cancel" onClick={() => setIsAdding(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── Stats ── */}
              <div className="stats-bar">
                <p className="stats-count">
                  <span>{filteredBookmarks.length}</span>
                  {search ? ` of ${bookmarks.length} bookmarks` : ` bookmark${bookmarks.length !== 1 ? 's' : ''}`}
                </p>
              </div>

              {/* ── Bookmark List ── */}
              <div className="bookmarks-list">
                {filteredBookmarks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <p className="empty-title">
                      {search ? 'No results found' : 'No bookmarks yet'}
                    </p>
                    <p className="empty-sub">
                      {search
                        ? `Try a different search term`
                        : `Hit "+ New" to save your first bookmark`}
                    </p>
                  </div>
                ) : (
                  filteredBookmarks.map((bookmark, i) => (
                    <div
                      className="bookmark-card"
                      key={bookmark.id}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      {editingId === bookmark.id ? (
                        /* ── Edit Mode ── */
                        <div className="card-edit">
                          <input
                            className="edit-input"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Title"
                            autoFocus
                          />
                          <input
                            className="edit-input"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="URL"
                            onKeyDown={(e) => e.key === 'Enter' && updateBookmark()}
                          />
                          <div className="edit-actions">
                            <button
                              className="btn-save"
                              onClick={updateBookmark}
                              disabled={saveLoading || !editTitle || !editUrl}
                            >
                              {saveLoading ? <span className="spinner" style={{ borderTopColor: '#000' }} /> : '✓'}
                              {saveLoading ? 'Saving…' : 'Save changes'}
                            </button>
                            <button className="btn-discard" onClick={() => setEditingId(null)}>
                              Discard
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── View Mode ── */
                        <div className="card-view">
                          <div className="favicon-wrap">
                            {getFavicon(bookmark.url) ? (
                              <img
                                src={getFavicon(bookmark.url)!}
                                alt=""
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                                }}
                              />
                            ) : null}
                            <span className="favicon-fallback" style={{ display: 'none' }}>🌐</span>
                          </div>

                          <div className="card-body">
                            <p className="card-title">{bookmark.title}</p>
                            <div className="card-meta">
                              <span className="card-domain">{getDomain(bookmark.url)}</span>
                            </div>
                            <a
                              className="card-link"
                              href={bookmark.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {bookmark.url}
                            </a>
                          </div>

                          <div className="card-actions">
                            <button
                              className="icon-btn"
                              title="Edit"
                              onClick={() => startEdit(bookmark)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="icon-btn danger"
                              title="Delete"
                              onClick={() => deleteBookmark(bookmark.id)}
                              disabled={deleteLoadingId === bookmark.id}
                            >
                              {deleteLoadingId === bookmark.id
                                ? <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                                : <Trash2 size={14} />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
  );
}