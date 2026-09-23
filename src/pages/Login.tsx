import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { setAuth } from "../auth";
import "./Login.css";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.user.role !== "admin") throw new Error("Not an admin account");
      setAuth(res.access_token, res.user);
      nav("/");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-brand-icon">🌿</span>
          <h1>Nursery Admin</h1>
          <p>Plant management dashboard</p>
        </div>

        <form onSubmit={submit}>
          <div>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="admin@nursery.com"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {err && <div className="err">{err}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign in to Dashboard"}
          </button>
        </form>

        <div className="login-footer">
          🌱 MyGarden Admin Panel • Powered by FastAPI
        </div>
      </div>
    </div>
  );
}
