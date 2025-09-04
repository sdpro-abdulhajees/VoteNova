import React, { useState, useEffect } from "react";
import FaceRegister from "./FaceRegister";
import FaceVerify from "./FaceVerify";
import "./App.css";
import axios from "axios";

function AdminPanel() {
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState({ id: '', name: '', party: '', manifesto: '', photoUrl: '' });
  const [votes, setVotes] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [c, v] = await Promise.all([
      axios.get('http://localhost:5000/api/candidates'),
      axios.get('http://localhost:5000/api/candidates/votes')
    ]);
    setCandidates(c.data || []);
    setVotes(v.data || []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/candidates/upsert', form);
      setMsg('Saved');
      setForm({ id: '', name: '', party: '', manifesto: '', photoUrl: '' });
      await load();
    } catch (e) {
      setMsg(e.response?.data?.error || 'Save failed');
    }
  };

  return (
    <div>
      <div className="vn-form-row">
        <input className="vn-input" placeholder="Name" value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} />
        <input className="vn-input" placeholder="Party" value={form.party} onChange={e=>setForm({ ...form, party: e.target.value })} />
        <input className="vn-input" placeholder="Photo URL" value={form.photoUrl} onChange={e=>setForm({ ...form, photoUrl: e.target.value })} />
        <textarea className="vn-input" placeholder="Manifesto" value={form.manifesto} onChange={e=>setForm({ ...form, manifesto: e.target.value })} />
        <div className="vn-actions">
          <button className="vn-btn" onClick={save}>Save / Update</button>
          <span className="vn-status">{msg}</span>
        </div>
      </div>

      <div className="vn-divider" />
      <h3>Candidates</h3>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {candidates.map(c => (
          <div key={c._id} className="vn-card" style={{ padding: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{c.name} ({c.party})</div>
                <div className="vn-status">{c.manifesto}</div>
              </div>
              <button className="vn-btn" onClick={()=>setForm({ id: c._id, name: c.name, party: c.party, manifesto: c.manifesto, photoUrl: c.photoUrl })}>Edit</button>
            </div>
          </div>
        ))}
      </div>

      <div className="vn-divider" />
      <h3>Votes</h3>
      <div className="vn-status">Total: {votes.length}</div>
      <div style={{ maxHeight: 260, overflow: 'auto', marginTop: '0.5rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
        {votes.map(v => (
          <div key={v._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
            <span>{v.email}</span>
            <span>{new Date(v.createdAt).toLocaleString()}</span>
            <strong>{v.candidate}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
function Login({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const login = async () => {
    if (!email) return setMessage("Enter your email");
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, role });
      setMessage("");
      onLoggedIn({ ...res.data, role });
    } catch (err) {
      setMessage(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vn-card">
      <h2 className="vn-card-title">Welcome back</h2>
      <p className="vn-card-desc">Login with your registered email to continue.</p>
      <div className="vn-form-row">
        <select className="vn-input" value={role} onChange={(e)=>setRole(e.target.value)}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <input
          className="vn-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="vn-actions">
        <button className="vn-btn" onClick={login} disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
        <span className={`vn-status ${message ? 'error' : ''}`}>{message}</span>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="votenova-app">
      <header className="vn-header">
        <div className="vn-logo">VN</div>
        <div className="vn-title-group">
          <h1 className="vn-title">VoteNova</h1>
          <p className="vn-subtitle">Secure. Seamless. Face‑verified voting.</p>
        </div>
      </header>

      <main className="vn-main">
        {!user ? (
          <section className="vn-panels">
            <Login onLoggedIn={setUser} />
            <div className="vn-card">
              <h2 className="vn-card-title">New to VoteNova?</h2>
              <p className="vn-card-desc">Create an account with your face ID.</p>
              {!showRegister ? (
                <div className="vn-actions">
                  <button className="vn-btn secondary" onClick={() => setShowRegister(true)}>Create account</button>
                </div>
              ) : (
                <FaceRegister />
              )}
            </div>
          </section>
        ) : user.role === 'admin' ? (
          <section className="vn-panels">
            <div className="vn-card">
              <div className="vn-chip">Signed in as Admin {user.name || user.email}</div>
              <h2 className="vn-card-title">Manage Candidates</h2>
              <AdminPanel />
            </div>
          </section>
        ) : (
          <section className="vn-panels">
            <div className="vn-card">
              <div className="vn-chip">Signed in as {user.name || user.email}</div>
              <h2 className="vn-card-title">Verify & Vote</h2>
              <p className="vn-card-desc">Verify your identity and cast your vote.</p>
              <FaceVerify />
            </div>
          </section>
        )}
      </main>

      <footer className="vn-footer">© {new Date().getFullYear()} VoteNova</footer>
    </div>
  );
}

export default App;
