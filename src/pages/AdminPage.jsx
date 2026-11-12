import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Eye,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
} from 'lucide-react';
import { BLOG_CATEGORIES } from '../../shared/validation';
import PageHead from '../components/PageHead';
import { formatPostDate } from '../components/InsightCard';

const BUILTIN_COVERS = [
  { label: 'Balance Transfer Graphic', url: '/images/insights/balance-transfer-cover.svg' },
  { label: 'Loan Documentation Graphic', url: '/images/insights/documentation-cover.svg' },
  { label: 'Home Loans Graphic', url: '/images/insights/home-loans-cover.svg' },
  { label: 'Banking Knowledge Graphic', url: '/images/insights/banking-knowledge-cover.svg' },
];

const EMPTY_EDITOR = {
  id: null,
  title: '',
  category: BLOG_CATEGORIES[0],
  excerpt: '',
  coverImage: BUILTIN_COVERS[0].url,
  featured: false,
  content: '<p>Start writing your article here...</p>',
};

function cleanPastedHtml(rawHtml) {
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['h2', 'h3', 'h4', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 'blockquote', 'a'],
    ALLOWED_ATTR: ['href'],
  });
}

async function optimizeCoverImage(file) {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return file;
  }
  const MAX_WIDTH = 1600;
  const TARGET_BYTES = 350 * 1024;

  try {
    const bitmap = await createImageBitmap(file);
    const needsResize = bitmap.width > MAX_WIDTH;
    if (!needsResize && file.size <= TARGET_BYTES) {
      bitmap.close?.();
      return file;
    }

    const scale = needsResize ? MAX_WIDTH / bitmap.width : 1;
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close?.();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const outputType = file.type === 'image/png' ? 'image/webp' : file.type;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, 0.84));
    if (!blob || blob.size >= file.size) {
      return file;
    }

    const ext = outputType === 'image/webp' ? '.webp' : outputType === 'image/png' ? '.png' : '.jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}${ext}`, { type: outputType });
  } catch {
    return file;
  }
}

export default function AdminPage() {
  const [authState, setAuthState] = useState({ loading: true, authenticated: false, admin: null });
  const [loginForm, setLoginForm] = useState({ email: 'gopal.arora@nexafundadvisor.com', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  const [posts, setPosts] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  const [editor, setEditor] = useState(EMPTY_EDITOR);
  const [mode, setMode] = useState('list'); // 'list' | 'edit'
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const editorSurfaceRef = useRef(null);

  async function refreshSession() {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      setAuthState({
        loading: false,
        authenticated: Boolean(data.authenticated),
        admin: data.admin || null,
      });
    } catch {
      setAuthState({ loading: false, authenticated: false, admin: null });
    }
  }

  async function fetchAdminData() {
    try {
      const [postsRes, diagRes] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/auth/diagnostics'),
      ]);
      const postsData = await postsRes.json();
      if (postsData.ok) setPosts(postsData.posts || []);

      if (diagRes.ok) {
        const diagData = await diagRes.json();
        setDiagnostics(diagData.googleSheets || null);
      }
    } catch {
      setNotice({ type: 'error', text: 'Failed to load published articles.' });
    }
  }

  useEffect(() => {
    refreshSession();
  }, []);

  useEffect(() => {
    if (authState.authenticated) {
      fetchAdminData();
    }
  }, [authState.authenticated]);

  useEffect(() => {
    if (mode === 'edit' && editorSurfaceRef.current) {
      editorSurfaceRef.current.innerHTML = editor.content || '<p></p>';
    }
  }, [mode, editor.id]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    setLoginBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setLoginError(data.message || 'Sign in failed.');
        return;
      }
      setAuthState({ loading: false, authenticated: true, admin: data.admin });
      setLoginForm((prev) => ({ ...prev, password: '' }));
    } catch {
      setLoginError('Unable to reach the server. Please verify the backend is running.');
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthState({ loading: false, authenticated: false, admin: null });
    setMode('list');
  }

  function startCreate() {
    setNotice({ type: '', text: '' });
    setEditor(EMPTY_EDITOR);
    setMode('edit');
  }

  function startEdit(post) {
    setNotice({ type: '', text: '' });
    setEditor({
      id: post.id,
      title: post.title,
      category: post.category,
      excerpt: post.excerpt || '',
      coverImage: post.coverImage || BUILTIN_COVERS[0].url,
      featured: Boolean(post.featured),
      content: post.content || '<p></p>',
    });
    setMode('edit');
  }

  function execFormat(command, value = null) {
    if (!editorSurfaceRef.current) return;
    editorSurfaceRef.current.focus();
    document.execCommand(command, false, value);
    setEditor((prev) => ({ ...prev, content: editorSurfaceRef.current.innerHTML }));
  }

  function addLink() {
    const url = window.prompt('Enter the web address (e.g., https://nexafundadvisor.com):');
    if (url && /^https?:\/\//i.test(url.trim())) {
      execFormat('createLink', url.trim());
    }
  }

  async function handleImageUpload(e) {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    setUploading(true);
    setNotice({ type: '', text: '' });

    try {
      const file = await optimizeCoverImage(rawFile);
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setNotice({ type: 'error', text: data.message || 'Cover image upload failed.' });
        return;
      }
      setEditor((prev) => ({ ...prev, coverImage: data.url }));
      setNotice({ type: 'success', text: 'Cover image uploaded successfully.' });
    } catch {
      setNotice({ type: 'error', text: 'Could not upload cover image.' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSaveArticle(e) {
    e.preventDefault();
    const htmlContent = editorSurfaceRef.current
      ? editorSurfaceRef.current.innerHTML
      : editor.content;

    setSaving(true);
    setNotice({ type: '', text: '' });

    try {
      const endpoint = editor.id ? `/api/posts/${editor.id}` : '/api/posts';
      const method = editor.id ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editor.title,
          category: editor.category,
          excerpt: editor.excerpt,
          coverImage: editor.coverImage,
          featured: editor.featured,
          content: htmlContent,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const firstErr = data.errors ? Object.values(data.errors)[0] : data.message;
        setNotice({ type: 'error', text: firstErr || 'Could not save article.' });
        return;
      }

      await fetchAdminData();
      setMode('list');
      setNotice({
        type: 'success',
        text: editor.id
          ? 'Article updated and live on Nexa Insights.'
          : 'New article published and live on Nexa Insights.',
      });
    } catch {
      setNotice({ type: 'error', text: 'Network error while saving article.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(post) {
    if (!window.confirm(`Delete "${post.title}" permanently?`)) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setNotice({ type: 'error', text: data.message || 'Could not delete article.' });
        return;
      }
      await fetchAdminData();
      setNotice({ type: 'success', text: 'Article deleted.' });
    } catch {
      setNotice({ type: 'error', text: 'Network error while deleting article.' });
    }
  }

  if (authState.loading) {
    return (
      <section className="section">
        <div className="container">
          <p>Checking session...</p>
        </div>
      </section>
    );
  }

  if (!authState.authenticated) {
    return (
      <>
        <PageHead
          title="Author Portal Sign In"
          description="Restricted publishing portal for Nexa Insights."
          path="/admin"
          noIndex
        />
        <section className="section section-ivory" style={{ minHeight: '72vh' }}>
          <div className="container" style={{ maxWidth: '460px' }}>
            <div className="card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Lock size={20} style={{ color: 'var(--gold)' }} />
                <span className="eyebrow eyebrow-navy" style={{ marginBottom: 0 }}>
                  Author Publishing Portal
                </span>
              </div>
              <h1 style={{ fontSize: '1.65rem', marginBottom: '8px' }}>Nexa Insights Admin</h1>
              <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginBottom: '22px' }}>
                Sign in with your authorised credentials to write, publish, edit, or manage Nexa Insights articles.
              </p>

              {loginError && <div className="alert alert-error">{loginError}</div>}

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="admin-email">Author Email</label>
                  <input
                    id="admin-email"
                    type="email"
                    className="form-control"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-password">Password</label>
                  <input
                    id="admin-password"
                    type="password"
                    className="form-control"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-navy"
                  style={{ width: '100%' }}
                  disabled={loginBusy}
                >
                  {loginBusy ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Nexa Insights Publisher"
        description="Manage and publish articles for Nexa Fund Advisor LLP."
        path="/admin"
        noIndex
      />

      <section className="page-banner" style={{ padding: '32px 0' }}>
        <div
          className="container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: '4px' }}>
              Signed in as {authState.admin?.name || 'Mr. Gopal Arora'}
            </div>
            <h1 style={{ fontSize: '1.85rem', marginBottom: 0 }}>Nexa Insights Publishing Studio</h1>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {mode === 'list' ? (
              <button type="button" className="btn btn-gold btn-sm" onClick={startCreate}>
                <Plus size={16} />
                Write New Article
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={() => setMode('list')}
              >
                Back to All Articles
              </button>
            )}
            <Link to="/insights" className="btn btn-outline-light btn-sm">
              <Eye size={15} />
              View Live Insights
            </Link>
            <button type="button" className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      </section>

      <section className="section section-ivory" style={{ paddingTop: '36px' }}>
        <div className="container">
          {diagnostics && (
            <div
              className={`alert ${diagnostics.configured ? 'alert-success' : 'alert-warning'}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}
            >
              <div>
                <strong>Lead Sheet Status:</strong>{' '}
                {diagnostics.configured
                  ? `Connected to Google Sheets (Tab: "${diagnostics.sheetName}").`
                  : diagnostics.localFallbackEnabled
                  ? 'Google Sheets credentials not yet set in .env (local preview fallback active).'
                  : 'Google Sheets credentials not configured yet in .env. See SETUP_GUIDE.md to connect your sheet.'}
              </div>
            </div>
          )}

          {notice.text && (
            <div className={`alert ${notice.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              {notice.type === 'error' ? (
                <AlertCircle size={16} style={{ verticalAlign: '-3px', marginRight: '8px' }} />
              ) : (
                <CheckCircle2 size={16} style={{ verticalAlign: '-3px', marginRight: '8px' }} />
              )}
              {notice.text}
            </div>
          )}

          {mode === 'list' ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="card"
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '18px',
                    padding: '20px 24px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: '1 1 420px' }}>
                    <img
                      src={post.coverImage || BUILTIN_COVERS[0].url}
                      alt=""
                      style={{
                        width: '108px',
                        height: '64px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '4px' }}>
                        <strong style={{ color: 'var(--navy)' }}>{post.category}</strong> •{' '}
                        {formatPostDate(post.publishedAt)}
                        {post.featured ? ' • ★ Featured' : ''}
                      </div>
                      <h2 style={{ fontSize: '1.12rem', marginBottom: '2px' }}>{post.title}</h2>
                      <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                        URL: /insights/{post.slug}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link
                      to={`/insights/${post.slug}`}
                      className="btn btn-outline-navy btn-sm"
                    >
                      <Eye size={14} />
                      View
                    </Link>
                    <button
                      type="button"
                      className="btn btn-navy btn-sm"
                      onClick={() => startEdit(post)}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-navy btn-sm"
                      style={{ color: 'var(--danger)', borderColor: '#F3C0BD' }}
                      onClick={() => handleDelete(post)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSaveArticle} className="card" style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '20px' }}>
                {editor.id ? 'Edit Published Article' : 'Publish a New Article'}
              </h2>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="post-title">Article Title *</label>
                  <input
                    id="post-title"
                    type="text"
                    className="form-control"
                    placeholder="Enter a clear, helpful article title"
                    value={editor.title}
                    onChange={(e) => setEditor((p) => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="post-category">Category *</label>
                  <select
                    id="post-category"
                    className="form-control"
                    value={editor.category}
                    onChange={(e) => setEditor((p) => ({ ...p, category: e.target.value }))}
                  >
                    {BLOG_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="post-excerpt">Short Summary (Optional — auto-created if left blank)</label>
                <textarea
                  id="post-excerpt"
                  rows={2}
                  className="form-control"
                  placeholder="1–2 sentences summarizing what readers will learn"
                  value={editor.excerpt}
                  onChange={(e) => setEditor((p) => ({ ...p, excerpt: e.target.value }))}
                />
              </div>

              {/* Cover Image Upload or Built-In Cover Picker */}
              <div className="form-group">
                <label>Article Cover Image</label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '18px',
                    alignItems: 'center',
                    padding: '16px',
                    background: 'var(--bg-ivory)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                  }}
                >
                  <img
                    src={editor.coverImage}
                    alt="Selected article cover preview"
                    style={{
                      width: '100%',
                      aspectRatio: '16 / 9',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                    }}
                  />
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                      <label className="btn btn-outline-navy btn-sm" style={{ margin: 0, cursor: 'pointer' }}>
                        <Upload size={15} />
                        {uploading ? 'Uploading...' : 'Upload Custom Image (JPG/PNG/WebP)'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {BUILTIN_COVERS.map((item) => (
                        <button
                          key={item.url}
                          type="button"
                          className={`calc-tab-btn ${editor.coverImage === item.url ? 'active' : ''}`}
                          style={{ minHeight: '34px', padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => setEditor((p) => ({ ...p, coverImage: item.url }))}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Word-Style Visual Rich Text Editor */}
              <div className="form-group">
                <label>Article Content * (Write or paste directly from Word / Google Docs)</label>
                <div className="editor-toolbar" role="toolbar" aria-label="Text formatting toolbar">
                  <button type="button" className="editor-tool-btn" onClick={() => execFormat('formatBlock', 'h2')}>
                    Heading
                  </button>
                  <button type="button" className="editor-tool-btn" onClick={() => execFormat('formatBlock', 'h3')}>
                    Subheading
                  </button>
                  <button type="button" className="editor-tool-btn" onClick={() => execFormat('formatBlock', 'p')}>
                    Paragraph
                  </button>
                  <button type="button" className="editor-tool-btn" onClick={() => execFormat('bold')}>
                    Bold
                  </button>
                  <button type="button" className="editor-tool-btn" onClick={() => execFormat('italic')}>
                    Italic
                  </button>
                  <button type="button" className="editor-tool-btn" onClick={() => execFormat('underline')}>
                    Underline
                  </button>
                  <button type="button" className="editor-tool-btn" onClick={() => execFormat('insertUnorderedList')}>
                    Bullet List
                  </button>
                  <button type="button" className="editor-tool-btn" onClick={() => execFormat('insertOrderedList')}>
                    Numbered List
                  </button>
                  <button type="button" className="editor-tool-btn" onClick={() => execFormat('formatBlock', 'blockquote')}>
                    Key Quote
                  </button>
                  <button type="button" className="editor-tool-btn" onClick={addLink}>
                    Add Link
                  </button>
                </div>
                <div
                  ref={editorSurfaceRef}
                  className="editor-surface article-prose"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) =>
                    setEditor((p) => ({ ...p, content: e.currentTarget.innerHTML }))
                  }
                  onPaste={(e) => {
                    const html = e.clipboardData?.getData('text/html');
                    if (html) {
                      e.preventDefault();
                      const cleaned = cleanPastedHtml(html);
                      document.execCommand('insertHTML', false, cleaned);
                    }
                  }}
                />
              </div>

              <div className="checkbox-row">
                <input
                  id="post-featured"
                  type="checkbox"
                  checked={editor.featured}
                  onChange={(e) => setEditor((p) => ({ ...p, featured: e.target.checked }))}
                />
                <label htmlFor="post-featured">
                  <Sparkles size={14} style={{ verticalAlign: '-2px', marginRight: '5px', color: 'var(--gold)' }} />
                  Highlight as the Featured Article at the top of Nexa Insights
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-gold" disabled={saving}>
                  {saving ? 'Publishing...' : editor.id ? 'Save Changes' : 'Publish Article'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-navy"
                  onClick={() => setMode('list')}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
