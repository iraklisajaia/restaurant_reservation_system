import { useState, useEffect, useCallback } from "react";
import Auth from "./Auth";

const API = "http://localhost:5000/api/bookings";
const SETTINGS_API = "http://localhost:5000/api/settings";
const WAITLIST_API = "http://localhost:5000/api/waitlist";

const TIMES = ["12:00", "12:30", "13:00", "13:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];
const OCCASIONS = ["None", "Birthday", "Anniversary", "Business Dinner", "Date Night", "Graduation", "Other"];

const today = new Date().toISOString().split("T")[0];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::selection { background: rgba(201,168,76,0.35); color: var(--cream); }

  :root {
    --bg: #0d0b08;
    --surface: #151209;
    --card: #1a1510;
    --border: #2e2619;
    --gold: #c9a84c;
    --gold-dim: #8a6f32;
    --gold-glow: rgba(201,168,76,0.12);
    --cream: #f0e6cc;
    --muted: #7a6e5a;
    --danger: #c0392b;
    --success: #2ecc71;
    --ff-display: 'Cormorant Garamond', Georgia, serif;
    --ff-body: 'Jost', sans-serif;
  }

  body { background: var(--bg); color: var(--cream); font-family: var(--ff-body); font-weight: 300; }

  .app {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201,168,76,0.07) 0%, transparent 60%),
      var(--bg);
  }

  /* HERO */
  .hero {
    text-align: center;
    padding: 72px 24px 56px;
    position: relative;
  }
  .hero::before {
    content: '';
    display: block;
    width: 1px;
    height: 56px;
    background: linear-gradient(to bottom, transparent, var(--gold-dim));
    margin: 0 auto 32px;
  }
  .hero-eyebrow {
    font-family: var(--ff-body);
    font-weight: 200;
    font-size: 11px;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 16px;
  }
  .hero-title {
    font-family: var(--ff-display);
    font-size: clamp(48px, 8vw, 96px);
    font-weight: 300;
    line-height: 1;
    letter-spacing: -0.01em;
    color: var(--cream);
    margin-bottom: 8px;
  }
  .hero-title em {
    font-style: italic;
    color: var(--gold);
  }
  .hero-subtitle {
    font-family: var(--ff-display);
    font-size: 18px;
    font-weight: 300;
    font-style: italic;
    color: var(--muted);
    margin-top: 16px;
  }
  .hero::after {
    content: '—';
    display: block;
    color: var(--gold-dim);
    margin-top: 36px;
    font-size: 20px;
    letter-spacing: 8px;
  }

  /* LAYOUT */
  .main { max-width: 1100px; margin: 0 auto; padding: 0 24px 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .main.single { grid-template-columns: 1fr; }
  .main > * { min-width: 0; }
  @media (max-width: 768px) { .main { grid-template-columns: 1fr; } }

  /* ROLE SWITCHER */
  .role-switcher {
    max-width: 720px;
    margin: -20px auto 40px;
    padding: 0 24px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .role-btn {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--muted);
    font-family: var(--ff-body);
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 14px 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .role-btn:hover { border-color: var(--gold-dim); color: var(--cream); }
  .role-btn.active { background: var(--gold-glow); border-color: var(--gold); color: var(--gold); }

  /* PANEL */
  .panel {
    background: var(--card);
    border: 1px solid var(--border);
    padding: 40px;
    position: relative;
    overflow: hidden;
  }
  .panel::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
  }
  .panel-title {
    font-family: var(--ff-display);
    font-size: 28px;
    font-weight: 300;
    color: var(--cream);
    margin-bottom: 8px;
  }
  .panel-sub {
    font-size: 12px;
    font-weight: 200;
    letter-spacing: 0.15em;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 32px;
  }

  /* FORM */
  .field { margin-bottom: 24px; }
  .label {
    display: block;
    font-size: 10px;
    font-weight: 300;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--gold-dim);
    margin-bottom: 8px;
  }
  .field-error {
    color: var(--danger);
    font-size: 11px;
    margin-top: 5px;
    font-weight: 300;
  }
  .input, .select, .textarea {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--cream);
    font-family: var(--ff-body);
    font-size: 14px;
    font-weight: 300;
    padding: 12px 16px;
    outline: none;
    transition: border-color 0.2s;
    appearance: none;
    -webkit-appearance: none;
  }
  .input:focus, .select:focus, .textarea:focus {
    border-color: var(--gold-dim);
    box-shadow: 0 0 0 3px var(--gold-glow);
  }
  .input.has-error, .select.has-error { border-color: var(--danger); }
  .input[type="date"] { color-scheme: dark; }
  .input[type="date"]::-webkit-datetime-edit { color: var(--cream); }
  .input[type="date"]::-webkit-datetime-edit-fields-wrapper { background: transparent; }
  .input[type="date"]::-webkit-datetime-edit-text,
  .input[type="date"]::-webkit-datetime-edit-month-field,
  .input[type="date"]::-webkit-datetime-edit-day-field,
  .input[type="date"]::-webkit-datetime-edit-year-field { color: var(--cream); }
  .select { cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a6f32' fill='none' stroke-width='1.5'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }
  .select option { background: var(--surface); }
  .textarea { resize: vertical; min-height: 80px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .compact-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items: end; margin-top: 14px; }
  @media (max-width: 768px) { .compact-row, .role-switcher { grid-template-columns: 1fr; } }

  /* TIME GRID */
  .time-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .time-btn {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--muted);
    font-family: var(--ff-body);
    font-size: 13px;
    font-weight: 300;
    padding: 10px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
  }
  .time-btn:hover { border-color: var(--gold-dim); color: var(--cream); }
  .time-btn.selected { background: var(--gold-glow); border-color: var(--gold); color: var(--gold); }
  .time-grid.has-error { outline: 1px solid var(--danger); }

  /* SUBMIT */
  .submit-btn {
    width: 100%;
    background: transparent;
    border: 1px solid var(--gold);
    color: var(--gold);
    font-family: var(--ff-body);
    font-size: 11px;
    font-weight: 300;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 8px;
    position: relative;
    overflow: hidden;
  }
  .submit-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--gold);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }
  .submit-btn:hover::before { transform: scaleX(1); }
  .submit-btn:hover { color: var(--bg); }
  .submit-btn span { position: relative; z-index: 1; }
  .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .submit-btn:disabled::before { display: none; }

  /* TOAST */
  .toast {
    padding: 12px 16px;
    margin-bottom: 20px;
    font-size: 13px;
    font-weight: 300;
    border-left: 2px solid;
    animation: fadeIn 0.3s ease;
  }
  .toast.success { border-color: var(--success); background: rgba(46,204,113,0.06); color: var(--success); }
  .toast.error { border-color: var(--danger); background: rgba(192,57,43,0.06); color: #e74c3c; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

  /* RESERVATIONS LIST */
  .empty-state {
    text-align: center;
    padding: 48px 0;
    color: var(--muted);
  }
  .empty-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.4; }
  .empty-text { font-family: var(--ff-display); font-style: italic; font-size: 18px; }

  .booking-card {
    border: 1px solid var(--border);
    padding: 20px 24px;
    margin-bottom: 12px;
    position: relative;
    transition: border-color 0.2s;
    animation: fadeIn 0.3s ease;
  }
  .booking-card:hover { border-color: var(--gold-dim); }
  .booking-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 2px;
    background: var(--gold);
  }
  .booking-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .booking-name { font-family: var(--ff-display); font-size: 20px; font-weight: 400; color: var(--cream); }
  .booking-id { font-size: 10px; color: var(--muted); letter-spacing: 0.15em; }
  .booking-meta { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 12px; }
  .meta-chip {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 300; color: var(--muted);
  }
  .meta-chip .icon { color: var(--gold-dim); font-size: 11px; }
  .occasion-tag {
    display: inline-block;
    margin-top: 8px;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    background: var(--gold-glow);
    padding: 3px 10px;
    border: 1px solid rgba(201,168,76,0.2);
  }
  .notes-text { margin-top: 8px; font-size: 12px; color: var(--muted); font-style: italic; }
  .delete-btn {
    background: none; border: none; color: var(--muted); cursor: pointer;
    font-size: 18px; line-height: 1; padding: 4px; transition: color 0.15s;
    flex-shrink: 0;
  }
  .delete-btn:hover { color: var(--danger); }
  .delete-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .action-btn {
    background: transparent;
    border: 1px solid var(--gold-dim);
    color: var(--gold);
    font-family: var(--ff-body);
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 12px 14px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .action-btn:hover { border-color: var(--gold); background: var(--gold-glow); }
  .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ADMIN */
  .settings-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  @media (max-width: 768px) { .settings-grid { grid-template-columns: 1fr; } }

  /* STATS */
  .stats { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
  .stat { flex: 1; min-width: 80px; text-align: center; padding: 16px; border: 1px solid var(--border); }
  .stat-value { font-family: var(--ff-display); font-size: 32px; font-weight: 300; color: var(--gold); }
  .stat-label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-top: 4px; }

  /* SEARCH */
  .search-wrap { position: relative; margin-bottom: 20px; }
  .search-wrap .input { padding-left: 36px; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 14px; pointer-events: none; }

  /* DIVIDER */
  .divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }

  /* VIEW TABS */
  .view-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
  .view-tab {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--muted);
    font-family: var(--ff-body);
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 10px 16px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .view-tab:hover { border-color: var(--gold-dim); color: var(--cream); }
  .view-tab.active { background: var(--gold-glow); border-color: var(--gold); color: var(--gold); }

  /* DAY VIEW */
  .day-row { border: 1px solid var(--border); margin-bottom: 12px; }
  .day-row-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: var(--surface);
  }
  .day-row-time { font-family: var(--ff-display); font-size: 16px; color: var(--gold); }
  .day-row-occupancy { font-size: 11px; letter-spacing: 0.1em; color: var(--muted); text-transform: uppercase; }
  .day-row-occupancy.full { color: var(--danger); }
  .day-row-bookings { padding: 4px 16px 12px; }
  .day-row-empty { padding: 12px 16px; font-size: 12px; color: var(--muted); font-style: italic; }

  /* WEEK VIEW */
  .week-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .week-table { border-collapse: collapse; width: 100%; min-width: 560px; }
  .week-table th, .week-table td { border: 1px solid var(--border); padding: 8px 4px; text-align: center; font-size: 11px; }
  .week-table th { background: var(--surface); color: var(--gold-dim); font-weight: 300; letter-spacing: 0.08em; white-space: nowrap; }
  .week-time-label { color: var(--muted); white-space: nowrap; }
  .week-cell { cursor: pointer; color: var(--muted); transition: background 0.15s; }
  .week-cell:hover { background: var(--gold-glow); }
  .week-cell.full { color: var(--danger); font-weight: 400; }
  .week-cell.has-bookings { color: var(--cream); }

  /* WAITLIST */
  .waitlist-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid var(--border);
    margin-bottom: 10px;
    flex-wrap: wrap;
  }
  .waitlist-info { font-size: 13px; color: var(--cream); }
  .waitlist-meta { font-size: 11px; color: var(--muted); margin-top: 4px; }
  .waitlist-actions { display: flex; gap: 8px; flex-shrink: 0; }
  .waitlist-prompt {
    border: 1px solid var(--gold-dim);
    background: var(--gold-glow);
    padding: 16px;
    margin-bottom: 20px;
  }
  .waitlist-prompt p { font-size: 13px; color: var(--cream); margin-bottom: 12px; }
  .waitlist-prompt-actions { display: flex; gap: 10px; flex-wrap: wrap; }

  /* FOOTER */
  .footer {
    text-align: center;
    padding: 32px;
    font-size: 11px;
    letter-spacing: 0.2em;
    color: var(--muted);
    text-transform: uppercase;
    border-top: 1px solid var(--border);
  }

  /* MOBILE */
  @media (max-width: 480px) {
    .panel { padding: 24px 20px; }
    .time-grid { grid-template-columns: repeat(2, 1fr); }
    .row { grid-template-columns: 1fr; }
    .compact-row { grid-template-columns: 1fr 1fr; }
    .compact-row .action-btn { grid-column: 1 / -1; }
    .booking-meta { gap: 8px; }
  }
`;

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });
  const [editing, setEditing] = useState({});
  const [settings, setSettings] = useState({
    tableCapacity: 40,
    openingTime: "12:00",
    closingTime: "21:00"
  });
  const [waitlist, setWaitlist] = useState([]);
  const [waitlistPrompt, setWaitlistPrompt] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [dayDate, setDayDate] = useState(today);
  const [weekStart, setWeekStart] = useState(today);

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    date: "", time: "", party_size: "",
    occasion: "None", notes: "", special_requests: ""
  });

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setBookings([]);
    setWaitlist([]);
  }, []);

  const handleAuthenticated = useCallback((newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  // Adds the JWT to every protected request and logs out automatically
  // if the token is missing/expired (server returns 401).
  const authedFetch = useCallback((url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.status === 401) handleLogout();
      return res;
    });
  }, [token, handleLogout]);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await authedFetch(API);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      showToast("Cannot connect to server. Showing local state.", "error");
    }
  }, [authedFetch, showToast]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(SETTINGS_API);
      const data = await res.json();
      setSettings(data);
    } catch {}
  }, []);

  const fetchWaitlist = useCallback(async () => {
    try {
      const res = await authedFetch(WAITLIST_API);
      const data = await res.json();
      setWaitlist(Array.isArray(data) ? data : []);
    } catch {}
  }, [authedFetch]);

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchSettings();
      fetchWaitlist();
    }
  }, [user, fetchBookings, fetchSettings, fetchWaitlist]);

  const handleField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (fieldErrors[k]) setFieldErrors(prev => { const next = { ...prev }; delete next[k]; return next; });
  };

  const handleSubmit = async () => {
    const required = ["name", "email", "phone", "date", "time", "party_size"];
    const errors = {};
    required.forEach(k => { if (!form[k]) errors[k] = "This field is required."; });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    setWaitlistPrompt(null);
    try {
      const res = await authedFetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Could not complete the reservation.", "error");
        if (data.waitlistAvailable) {
          setWaitlistPrompt({ message: data.message, payload: { ...form } });
        }
        return;
      }
      setBookings(prev => [...prev, data.booking]);
      showToast(`Reservation confirmed for ${form.name}.`);
      setForm({ name: "", email: "", phone: "", date: "", time: "", party_size: "", occasion: "None", notes: "", special_requests: "" });
    } catch {
      // Fallback: add locally
      const local = { id: Date.now(), ...form };
      setBookings(prev => [...prev, local]);
      showToast(`Reservation saved locally (server offline).`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!waitlistPrompt) return;
    setBusy(b => ({ ...b, waitlistJoin: true }));
    try {
      const res = await authedFetch(WAITLIST_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waitlistPrompt.payload)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Could not join the waitlist.", "error");
        return;
      }
      setWaitlist(prev => [...prev, data.entry]);
      setWaitlistPrompt(null);
      showToast(`Added to the waitlist for ${waitlistPrompt.payload.time} on ${waitlistPrompt.payload.date}.`);
      setForm({ name: "", email: "", phone: "", date: "", time: "", party_size: "", occasion: "None", notes: "", special_requests: "" });
    } catch {
      showToast("Cannot connect to server.", "error");
    } finally {
      setBusy(b => { const n = { ...b }; delete n.waitlistJoin; return n; });
    }
  };

  const handleRemoveWaitlist = async (id) => {
    setBusy(b => ({ ...b, [`removeWl-${id}`]: true }));
    try {
      await authedFetch(`${WAITLIST_API}/${id}`, { method: "DELETE" });
    } catch {}
    setWaitlist(prev => prev.filter(w => w.id !== id));
    showToast("Removed from waitlist.", "error");
    setBusy(b => { const n = { ...b }; delete n[`removeWl-${id}`]; return n; });
  };

  const handleSeatFromWaitlist = async (entry) => {
    setBusy(b => ({ ...b, [`seat-${entry.id}`]: true }));
    try {
      const res = await authedFetch(`${WAITLIST_API}/${entry.id}/seat`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Could not seat this party yet.", "error");
        return;
      }
      setBookings(prev => [...prev, data.booking]);
      setWaitlist(prev => prev.filter(w => w.id !== entry.id));
      showToast(`Seated ${entry.name} from the waitlist.`);
    } catch {
      showToast("Cannot connect to server.", "error");
    } finally {
      setBusy(b => { const n = { ...b }; delete n[`seat-${entry.id}`]; return n; });
    }
  };

  const handleDelete = async (id) => {
    setBusy(b => ({ ...b, [`delete-${id}`]: true }));
    try {
      await authedFetch(`${API}/${id}`, { method: "DELETE" });
    } catch {}
    setBookings(prev => prev.filter(b => b.id !== id));
    showToast("Reservation cancelled.", "error");
    setBusy(b => { const n = { ...b }; delete n[`delete-${id}`]; return n; });
  };

  const handleEditField = (id, key, value) => {
    setEditing(prev => ({
      ...prev,
      [id]: { ...prev[id], [key]: value }
    }));
  };

  const handleUpdateBooking = async (booking) => {
    const changes = editing[booking.id] || {};
    const updatedBooking = { ...booking, ...changes };
    setBusy(b => ({ ...b, [`update-${booking.id}`]: true }));

    try {
      const res = await authedFetch(`${API}/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Could not update reservation.", "error");
        return;
      }
      setBookings(prev => prev.map(b => b.id === booking.id ? data.booking : b));
    } catch {
      setBookings(prev => prev.map(b => b.id === booking.id ? updatedBooking : b));
    } finally {
      setBusy(b => { const n = { ...b }; delete n[`update-${booking.id}`]; return n; });
    }

    setEditing(prev => {
      const next = { ...prev };
      delete next[booking.id];
      return next;
    });
    showToast("Reservation updated.");
  };

  const handleSettingsField = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setBusy(b => ({ ...b, settings: true }));
    try {
      const res = await authedFetch(SETTINGS_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Could not save settings.", "error");
        return;
      }
      setSettings(data.settings);
      showToast("Restaurant settings saved.");
    } catch {
      showToast("Cannot connect to server.", "error");
    } finally {
      setBusy(b => { const n = { ...b }; delete n.settings; return n; });
    }
  };

  const filtered = bookings.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.email?.toLowerCase().includes(search.toLowerCase()) ||
    b.date?.includes(search)
  );

  const availableTimes = TIMES.filter(t => t >= settings.openingTime && t <= settings.closingTime);

  const totalGuests = bookings.reduce((s, b) => s + (parseInt(b.party_size) || 0), 0);
  const role = user?.role;
  const canManageReservations = role === "Staff" || role === "Admin";

  const addDays = (dateStr, n) => {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
  };

  const seatsForSlot = (date, time) =>
    bookings.filter(b => b.date === date && b.time === time).reduce((s, b) => s + (parseInt(b.party_size) || 0), 0);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayRows = availableTimes.map(t => ({
    time: t,
    bookings: filtered.filter(b => b.date === dayDate && b.time === t),
    occupied: seatsForSlot(dayDate, t)
  }));

  const renderBookingCard = (b) => (
    <div className="booking-card" key={b.id}>
      <div className="booking-header">
        <div>
          <div className="booking-name">{b.name}</div>
          <div className="booking-id">#{String(b.id).padStart(4, "0")}</div>
        </div>
        <button
          className="delete-btn"
          onClick={() => handleDelete(b.id)}
          disabled={!!busy[`delete-${b.id}`]}
          title="Cancel reservation"
        >
          {busy[`delete-${b.id}`] ? "…" : "×"}
        </button>
      </div>
      <div className="booking-meta">
        <span className="meta-chip"><span className="icon">📅</span>{b.date}</span>
        <span className="meta-chip"><span className="icon">🕐</span>{b.time}</span>
        <span className="meta-chip"><span className="icon">👤</span>{b.party_size} {parseInt(b.party_size) === 1 ? "guest" : "guests"}</span>
        <span className="meta-chip"><span className="icon">✉</span>{b.email}</span>
        <span className="meta-chip"><span className="icon">📞</span>{b.phone}</span>
      </div>
      {b.occasion && b.occasion !== "None" && <div className="occasion-tag">{b.occasion}</div>}
      {b.special_requests && <p className="notes-text">"{b.special_requests}"</p>}
      {b.notes && <p className="notes-text">Kitchen: {b.notes}</p>}
      <div className="compact-row">
        <div>
          <label className="label">Time</label>
          <select className="select" value={editing[b.id]?.time ?? b.time} onChange={e => handleEditField(b.id, "time", e.target.value)}>
            {availableTimes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Guests</label>
          <select className="select" value={editing[b.id]?.party_size ?? b.party_size} onChange={e => handleEditField(b.id, "party_size", e.target.value)}>
            {PARTY_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button
          className="action-btn"
          onClick={() => handleUpdateBooking(b)}
          disabled={!!busy[`update-${b.id}`]}
        >
          {busy[`update-${b.id}`] ? "Saving…" : "Update"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <header className="hero">
          <p className="hero-eyebrow">Reservations</p>
          <h1 className="hero-title">Burger <em>Bonanza</em></h1>
          <p className="hero-subtitle">{user ? "Reserve your table" : "Sign in to reserve your table"}</p>
        </header>

        {user && (
          <div className="role-switcher" style={{ gridTemplateColumns: "1fr auto" }}>
            <div className="role-btn active" style={{ cursor: "default", textAlign: "left" }}>
              {user.name} · {user.role}
            </div>
            <button className="role-btn" onClick={handleLogout}>Logout</button>
          </div>
        )}

        {toast && (
          <div style={{ maxWidth: "1100px", margin: "0 auto 20px", padding: "0 24px" }}>
            <div className={`toast ${toast.type}`}>{toast.msg}</div>
          </div>
        )}

        {!user ? (
          <Auth onAuthenticated={handleAuthenticated} />
        ) : (
        <main className={`main ${role !== "Admin" ? "single" : ""}`}>
          {/* BOOKING FORM */}
          {role === "Customer" && (
          <div className="panel">
            <h2 className="panel-title">Make a Reservation</h2>
            <p className="panel-sub">Complete the form below</p>

            {waitlistPrompt && (
              <div className="waitlist-prompt">
                <p>{waitlistPrompt.message} Would you like to join the waitlist for this slot?</p>
                <div className="waitlist-prompt-actions">
                  <button className="action-btn" onClick={handleJoinWaitlist} disabled={busy.waitlistJoin}>
                    {busy.waitlistJoin ? "Adding…" : "Join Waitlist"}
                  </button>
                  <button className="action-btn" onClick={() => setWaitlistPrompt(null)}>Dismiss</button>
                </div>
              </div>
            )}

            <div className="field">
              <label className="label">Full Name *</label>
              <input
                className={`input${fieldErrors.name ? " has-error" : ""}`}
                placeholder="Jean-Pierre Moreau"
                value={form.name}
                onChange={e => handleField("name", e.target.value)}
              />
              {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
            </div>

            <div className="row">
              <div className="field">
                <label className="label">Email *</label>
                <input
                  className={`input${fieldErrors.email ? " has-error" : ""}`}
                  type="email"
                  placeholder="guest@email.com"
                  value={form.email}
                  onChange={e => handleField("email", e.target.value)}
                />
                {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
              </div>
              <div className="field">
                <label className="label">Phone *</label>
                <input
                  className={`input${fieldErrors.phone ? " has-error" : ""}`}
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={form.phone}
                  onChange={e => handleField("phone", e.target.value)}
                />
                {fieldErrors.phone && <p className="field-error">{fieldErrors.phone}</p>}
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label className="label">Date *</label>
                <input
                  className={`input${fieldErrors.date ? " has-error" : ""}`}
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={e => handleField("date", e.target.value)}
                />
                {fieldErrors.date && <p className="field-error">{fieldErrors.date}</p>}
              </div>
              <div className="field">
                <label className="label">Party Size *</label>
                <select
                  className={`select${fieldErrors.party_size ? " has-error" : ""}`}
                  value={form.party_size}
                  onChange={e => handleField("party_size", e.target.value)}
                >
                  <option value="">Guests</option>
                  {PARTY_SIZES.map(n => <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>)}
                </select>
                {fieldErrors.party_size && <p className="field-error">{fieldErrors.party_size}</p>}
              </div>
            </div>

            <div className="field">
              <label className="label">Preferred Time *</label>
              <div className={`time-grid${fieldErrors.time ? " has-error" : ""}`}>
                {availableTimes.map(t => (
                  <button key={t} className={`time-btn ${form.time === t ? "selected" : ""}`} onClick={() => handleField("time", t)}>{t}</button>
                ))}
              </div>
              {fieldErrors.time && <p className="field-error">{fieldErrors.time}</p>}
            </div>

            <div className="field">
              <label className="label">Occasion</label>
              <select className="select" value={form.occasion} onChange={e => handleField("occasion", e.target.value)}>
                {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="field">
              <label className="label">Special Requests</label>
              <textarea className="textarea input" placeholder="Dietary requirements, seating preferences, accessibility needs…" value={form.special_requests} onChange={e => handleField("special_requests", e.target.value)} />
            </div>

            <div className="field">
              <label className="label">Notes for the Kitchen</label>
              <textarea className="textarea input" placeholder="Allergies, preparation preferences…" value={form.notes} onChange={e => handleField("notes", e.target.value)} />
            </div>

            <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
              <span>{loading ? "Confirming…" : "Confirm Reservation"}</span>
            </button>
          </div>
          )}

          {/* RESERVATIONS */}
          {role === "Admin" && (
          <div className="panel">
            <h2 className="panel-title">Admin Panel</h2>
            <p className="panel-sub">Manage capacity and hours</p>

            <div className="settings-grid">
              <div className="field">
                <label className="label">Table Capacity</label>
                <input className="input" type="number" min="1" value={settings.tableCapacity} onChange={e => handleSettingsField("tableCapacity", e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Opening Time</label>
                <select className="select" value={settings.openingTime} onChange={e => handleSettingsField("openingTime", e.target.value)}>
                  {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Closing Time</label>
                <select className="select" value={settings.closingTime} onChange={e => handleSettingsField("closingTime", e.target.value)}>
                  {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <button className="submit-btn" onClick={handleSaveSettings} disabled={busy.settings}>
              <span>{busy.settings ? "Saving…" : "Save Settings"}</span>
            </button>
          </div>
          )}

          {canManageReservations && (
          <div>
            {/* STATS */}
            <div className="stats">
              <div className="stat">
                <div className="stat-value">{bookings.length}</div>
                <div className="stat-label">Reservations</div>
              </div>
              <div className="stat">
                <div className="stat-value">{totalGuests}</div>
                <div className="stat-label">Total Guests</div>
              </div>
              <div className="stat">
                <div className="stat-value">{bookings.filter(b => b.occasion && b.occasion !== "None").length}</div>
                <div className="stat-label">Occasions</div>
              </div>
              <div className="stat">
                <div className="stat-value">{waitlist.length}</div>
                <div className="stat-label">Waitlisted</div>
              </div>
            </div>

            {waitlist.length > 0 && (
              <div className="panel" style={{ marginBottom: 32 }}>
                <h2 className="panel-title">Waitlist</h2>
                <p className="panel-sub">Seat a party once a slot opens up</p>
                {waitlist.map(w => (
                  <div className="waitlist-item" key={w.id}>
                    <div>
                      <div className="waitlist-info">{w.name} · {w.party_size} {parseInt(w.party_size) === 1 ? "guest" : "guests"}</div>
                      <div className="waitlist-meta">{w.date} at {w.time}</div>
                    </div>
                    <div className="waitlist-actions">
                      <button
                        className="action-btn"
                        onClick={() => handleSeatFromWaitlist(w)}
                        disabled={!!busy[`seat-${w.id}`]}
                      >
                        {busy[`seat-${w.id}`] ? "Seating…" : "Seat Now"}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleRemoveWaitlist(w.id)}
                        disabled={!!busy[`removeWl-${w.id}`]}
                        title="Remove from waitlist"
                      >
                        {busy[`removeWl-${w.id}`] ? "…" : "×"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="panel" style={{ maxHeight: "680px", overflowY: "auto" }}>
              <h2 className="panel-title">Reservations</h2>
              <p className="panel-sub">Upcoming bookings</p>

              <div className="view-tabs">
                <button className={`view-tab ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")}>List</button>
                <button className={`view-tab ${viewMode === "day" ? "active" : ""}`} onClick={() => setViewMode("day")}>Day</button>
                <button className={`view-tab ${viewMode === "week" ? "active" : ""}`} onClick={() => setViewMode("week")}>Week</button>
              </div>

              {viewMode === "list" && (
                <div className="search-wrap">
                  <span className="search-icon">⌕</span>
                  <input className="input" placeholder="Search by name, email or date…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              )}

              {viewMode === "day" && (
                <div className="field">
                  <label className="label">Date</label>
                  <input className="input" type="date" value={dayDate} onChange={e => setDayDate(e.target.value)} />
                </div>
              )}

              {viewMode === "week" && (
                <div className="field">
                  <label className="label">Week Starting</label>
                  <input className="input" type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} />
                </div>
              )}

              <hr className="divider" />

              {viewMode === "list" && (
                filtered.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🕯</div>
                    <p className="empty-text">{search ? "No results found." : "No reservations yet."}</p>
                  </div>
                ) : filtered.map(renderBookingCard)
              )}

              {viewMode === "day" && (
                dayRows.every(row => row.bookings.length === 0) ? (
                  <div className="empty-state">
                    <div className="empty-icon">🕯</div>
                    <p className="empty-text">No reservations on {dayDate}.</p>
                  </div>
                ) : dayRows.map(row => (
                  <div className="day-row" key={row.time}>
                    <div className="day-row-header">
                      <span className="day-row-time">{row.time}</span>
                      <span className={`day-row-occupancy ${row.occupied >= settings.tableCapacity ? "full" : ""}`}>
                        {row.occupied} / {settings.tableCapacity} seated
                      </span>
                    </div>
                    {row.bookings.length === 0 ? (
                      <p className="day-row-empty">No reservations at this time.</p>
                    ) : (
                      <div className="day-row-bookings">{row.bookings.map(renderBookingCard)}</div>
                    )}
                  </div>
                ))
              )}

              {viewMode === "week" && (
                <div className="week-table-wrap">
                  <table className="week-table">
                    <thead>
                      <tr>
                        <th></th>
                        {weekDates.map(d => <th key={d}>{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {availableTimes.map(t => (
                        <tr key={t}>
                          <td className="week-time-label">{t}</td>
                          {weekDates.map(d => {
                            const occupied = seatsForSlot(d, t);
                            const full = occupied >= settings.tableCapacity;
                            return (
                              <td
                                key={d}
                                className={`week-cell ${full ? "full" : occupied > 0 ? "has-bookings" : ""}`}
                                title={`${occupied} / ${settings.tableCapacity} seated — click to view this day`}
                                onClick={() => { setDayDate(d); setViewMode("day"); }}
                              >
                                {occupied}/{settings.tableCapacity}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          )}
        </main>
        )}
        <footer className="footer">Burger Bonanza · Reservations</footer>
      </div>
    </>
  );
}
