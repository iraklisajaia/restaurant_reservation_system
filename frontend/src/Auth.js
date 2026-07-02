import { useState } from "react";

const AUTH_API = "http://localhost:5000/api/auth";

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password || (mode === "register" && !form.name)) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API}/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Something went wrong.");
        setLoading(false);
        return;
      }
      onAuthenticated(data.token, data.user);
    } catch {
      setError("Cannot connect to server. Please try again.");
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => (m === "login" ? "register" : "login"));
    setError("");
  };

  return (
    <main className="main single">
      <div className="panel" style={{ maxWidth: 440, margin: "0 auto" }}>
        <h2 className="panel-title">{mode === "login" ? "Sign In" : "Register"}</h2>
        <p className="panel-sub">{mode === "login" ? "Welcome back" : "Create a customer account"}</p>

        {error && <div className="toast error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="field">
              <label className="label">Full Name *</label>
              <input className="input" value={form.name} onChange={e => handleField("name", e.target.value)} />
            </div>
          )}
          <div className="field">
            <label className="label">Email *</label>
            <input className="input" type="email" value={form.email} onChange={e => handleField("email", e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Password *</label>
            <input className="input" type="password" value={form.password} onChange={e => handleField("password", e.target.value)} />
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            <span>{loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}</span>
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button type="button" className="action-btn" style={{ marginLeft: 8 }} onClick={switchMode}>
            {mode === "login" ? "Register" : "Sign In"}
          </button>
        </p>
      </div>
    </main>
  );
}
