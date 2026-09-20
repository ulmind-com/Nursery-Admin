import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getUser, hasSection, isSuper, logout } from "../auth";
import { SECTIONS } from "../sections";

// Owner-only links (super admin).
const superLinks = [{ to: "/admins", label: "Team & Access", icon: "🛡️" }];

export default function Layout() {
  const nav = useNavigate();
  const user = getUser();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🌿</span>
          Nursery<span>Admin</span>
        </div>
        <nav className="nav">
          {SECTIONS.filter((s) => hasSection(s.key)).map((s) => (
            <NavLink key={s.path} to={s.path} end={s.end}>
              <span className="nav-icon">{s.icon}</span>
              {s.label}
            </NavLink>
          ))}
          {isSuper() &&
            superLinks.map((l) => (
              <NavLink key={l.to} to={l.to}>
                <span className="nav-icon">{l.icon}</span>
                {l.label}
              </NavLink>
            ))}
        </nav>
        <div style={{ 
          padding: '14px', 
          marginTop: 'auto',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.4)',
          textAlign: 'center'
        }}>
          🌱 Plant Nursery Admin v1.0
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <div />
          <div className="flex">
            <span className="muted" style={{ fontSize: '13px' }}>{user?.email}</span>
            <button
              className="logout"
              onClick={() => {
                logout();
                nav("/login");
              }}
            >
              Log out
            </button>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
