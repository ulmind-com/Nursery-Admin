/* Support inbox — the "Talk to a human" queue.
 *
 * Chat transcripts are never stored: the customer's browser holds the thread
 * and drops it the moment their order is delivered or cancelled. What lands
 * here is only the handoffs — a customer asked for a person — each carrying
 * the order, the plants involved and the last few lines that were said, so the
 * team can pick the conversation up cold. Delivering or cancelling the order
 * resolves its open ticket automatically.
 */
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { fmtDateTime } from "../date";

type Ticket = {
  id: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  order_id?: string | null;
  order_short?: string | null;
  order_status?: string | null;
  order_total?: number | null;
  product_id?: string | null;
  product_title?: string | null;
  items?: Array<{ product_id?: string; title?: string; image?: string | null; qty?: number; size_variant?: string | null }>;
  topic?: string;
  message?: string;
  transcript?: Array<{ role: string; content: string }>;
  status: "open" | "closed";
  admin_note?: string;
  close_reason?: string;
  created_at?: string;
  updated_at?: string;
  closed_at?: string;
};

const STATUS_TINT: Record<string, string> = {
  placed: "#64748b", confirmed: "#0e7c56", shipped: "#2563eb",
  out_for_delivery: "#b45309", delivered: "#15803d", cancelled: "#b91c1c",
};

export default function Support() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [counts, setCounts] = useState<{ open: number; closed: number }>({ open: 0, closed: 0 });
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    api.get<{ items: Ticket[]; counts: { open: number; closed: number } }>("/chat/admin/tickets")
      .then((d) => { setItems(d.items || []); setCounts(d.counts); })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    // New handoffs arrive while the team is looking at this screen.
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  const shown = useMemo(() => items.filter((t) => t.status === tab), [items, tab]);

  const setStatus = async (id: string, status: "open" | "closed") => {
    setBusy(true);
    try {
      await api.patch(`/chat/admin/tickets/${id}`, { status, note: "" });
      load();
    } catch (e: any) { alert(e.message); } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this support request permanently?")) return;
    setBusy(true);
    try { await api.del(`/chat/admin/tickets/${id}`); load(); }
    catch (e: any) { alert(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <style>{`
        .sup-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:28px; flex-wrap:wrap; gap:16px; }
        .sup-title { font-size:32px; font-weight:800; color:#0f172a; margin:0 0 6px 0; letter-spacing:-0.5px; }
        .sup-sub { color:#64748b; font-size:15px; margin:0; font-weight:500; }
        .sup-tabs { display:flex; gap:8px; background:#f1f5f9; padding:5px; border-radius:14px; }
        .sup-tab { border:0; background:transparent; padding:9px 18px; border-radius:10px; font-weight:700; font-size:14px; color:#64748b; cursor:pointer; transition:all .18s; }
        .sup-tab.on { background:#fff; color:#0e7c56; box-shadow:0 2px 8px rgba(0,0,0,.06); }
        .sup-card { background:#fff; border-radius:20px; border:1px solid rgba(15,23,42,.06); box-shadow:0 4px 20px rgba(0,0,0,.03); padding:22px; margin-bottom:16px; }
        .sup-top { display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; }
        .sup-who { display:flex; gap:14px; align-items:flex-start; min-width:0; }
        .sup-avatar { width:44px; height:44px; border-radius:14px; background:linear-gradient(135deg,#0e7c56,#16a34a); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; flex:0 0 auto; }
        .sup-name { font-weight:800; color:#0f172a; font-size:16px; margin:0; }
        .sup-meta { color:#64748b; font-size:13px; margin:3px 0 0; }
        .sup-chip { display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:999px; font-size:12px; font-weight:700; background:#ecfdf5; color:#0e7c56; border:1px solid #a7f3d0; }
        .sup-chip.muted { background:#f1f5f9; color:#475569; border-color:#e2e8f0; }
        .sup-body { margin-top:16px; background:#f8fafc; border:1px solid #eef2f7; border-radius:14px; padding:14px 16px; color:#334155; font-size:14px; line-height:1.6; }
        .sup-items { display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
        .sup-item { display:flex; align-items:center; gap:9px; background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:6px 12px 6px 6px; font-size:13px; font-weight:600; color:#334155; }
        .sup-item img { width:34px; height:34px; border-radius:9px; object-fit:cover; background:#f1f5f9; }
        .sup-actions { display:flex; gap:9px; flex-wrap:wrap; margin-top:16px; }
        .sup-btn { border:0; border-radius:11px; padding:10px 16px; font-weight:700; font-size:13px; cursor:pointer; transition:filter .18s; }
        .sup-btn:hover { filter:brightness(.95); }
        .sup-btn.primary { background:#0e7c56; color:#fff; }
        .sup-btn.ghost { background:#f1f5f9; color:#334155; }
        .sup-btn.danger { background:#fef2f2; color:#b91c1c; }
        .sup-line { display:flex; gap:8px; margin-bottom:8px; font-size:13px; line-height:1.55; }
        .sup-role { flex:0 0 68px; font-weight:800; color:#0e7c56; text-transform:capitalize; }
        .sup-role.user { color:#334155; }
        .sup-empty { text-align:center; padding:70px 20px; color:#94a3b8; }
      `}</style>

      <div className="sup-header">
        <div>
          <h1 className="sup-title">Support Inbox</h1>
          <p className="sup-sub">
            Customers who asked to talk to a human. Chats themselves aren't stored — they disappear from the
            customer's device once the order is delivered.
          </p>
        </div>
        <div className="sup-tabs">
          <button className={`sup-tab ${tab === "open" ? "on" : ""}`} onClick={() => setTab("open")}>
            Open · {counts.open}
          </button>
          <button className={`sup-tab ${tab === "closed" ? "on" : ""}`} onClick={() => setTab("closed")}>
            Resolved · {counts.closed}
          </button>
        </div>
      </div>

      {shown.length === 0 && (
        <div className="sup-card sup-empty">
          <div style={{ fontSize: 40, marginBottom: 10 }}>🌿</div>
          <p style={{ margin: 0, fontWeight: 600 }}>
            {tab === "open" ? "No one is waiting on a reply right now." : "Nothing resolved yet."}
          </p>
        </div>
      )}

      {shown.map((t) => {
        const open = expanded === t.id;
        const initials = (t.user_name || "C").trim().charAt(0).toUpperCase();
        return (
          <div className="sup-card" key={t.id}>
            <div className="sup-top">
              <div className="sup-who">
                <div className="sup-avatar">{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <p className="sup-name">{t.user_name || "Customer"}</p>
                  <p className="sup-meta">
                    {[t.user_phone, t.user_email].filter(Boolean).join(" · ") || "No contact on file"}
                  </p>
                  <p className="sup-meta">Asked {fmtDateTime(t.created_at)}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                {t.order_short && (
                  <span className="sup-chip" style={{ color: STATUS_TINT[t.order_status || ""] || "#0e7c56" }}>
                    #{t.order_short} · {(t.order_status || "").replace(/_/g, " ")}
                  </span>
                )}
                {t.product_title && !t.order_short && <span className="sup-chip muted">🪴 {t.product_title}</span>}
                {t.order_total != null && <span className="sup-chip muted">₹{t.order_total}</span>}
              </div>
            </div>

            <div className="sup-body">
              <strong>{t.topic || "General enquiry"}</strong>
              {t.message ? <div style={{ marginTop: 6 }}>{t.message}</div> : null}
              {t.close_reason ? <div style={{ marginTop: 6, color: "#64748b" }}>Auto-resolved: {t.close_reason}</div> : null}
            </div>

            {!!t.items?.length && (
              <div className="sup-items">
                {t.items.map((it, i) => (
                  <span className="sup-item" key={`${it.product_id}-${i}`}>
                    {it.image ? <img src={it.image} alt="" /> : <span style={{ width: 34, height: 34, borderRadius: 9, background: "#f1f5f9" }} />}
                    {it.title}{it.size_variant ? ` · ${it.size_variant}` : ""} × {it.qty}
                  </span>
                ))}
              </div>
            )}

            {open && !!t.transcript?.length && (
              <div className="sup-body" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
                {t.transcript.map((m, i) => (
                  <div className="sup-line" key={i}>
                    <span className={`sup-role ${m.role === "user" ? "user" : ""}`}>{m.role === "user" ? "Customer" : "Sage"}</span>
                    <span>{m.content}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="sup-actions">
              {t.user_phone && (
                <a className="sup-btn primary" href={`tel:${t.user_phone}`} style={{ textDecoration: "none", display: "inline-block" }}>
                  📞 Call back
                </a>
              )}
              {t.user_phone && (
                <a
                  className="sup-btn ghost"
                  style={{ textDecoration: "none", display: "inline-block" }}
                  href={`https://wa.me/${(t.user_phone || "").replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              )}
              {t.user_email && (
                <a className="sup-btn ghost" href={`mailto:${t.user_email}`} style={{ textDecoration: "none", display: "inline-block" }}>
                  Email
                </a>
              )}
              {t.order_id && (
                <a className="sup-btn ghost" href={`/orders?q=${t.order_short}`} style={{ textDecoration: "none", display: "inline-block" }}>
                  Open order
                </a>
              )}
              {!!t.transcript?.length && (
                <button className="sup-btn ghost" onClick={() => setExpanded(open ? null : t.id)}>
                  {open ? "Hide chat" : "View chat"}
                </button>
              )}
              {t.status === "open" ? (
                <button className="sup-btn primary" disabled={busy} onClick={() => setStatus(t.id, "closed")}>
                  ✓ Mark resolved
                </button>
              ) : (
                <button className="sup-btn ghost" disabled={busy} onClick={() => setStatus(t.id, "open")}>
                  Reopen
                </button>
              )}
              <button className="sup-btn danger" disabled={busy} onClick={() => remove(t.id)}>Delete</button>
            </div>
          </div>
        );
      })}
    </>
  );
}
