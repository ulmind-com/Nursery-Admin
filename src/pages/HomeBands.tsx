import { useEffect, useRef, useState } from "react";
import { api, uploadImage } from "../api";

type Logo = { id: string; name: string; image: string; url?: string; order?: number; active?: boolean };

const emptyLogo = { name: "", image: "", url: "", active: true };

function PhotoField({ label, value, onChange, hint }: { label: string; value: string; onChange: (url: string) => void; hint?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pick = async (file?: File) => {
    if (!file) return;
    setErr(""); setBusy(true);
    try { onChange(await uploadImage(file)); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label>{label}</label>
      {hint && <p className="muted" style={{ marginTop: -6 }}>{hint}</p>}
      <div className="flex" style={{ alignItems: "center", gap: 14 }}>
        {value
          ? <img src={value} alt="" style={{ width: 120, height: 60, objectFit: "contain", borderRadius: 8, border: "1px solid #e5e7eb", padding: 4, background: "#fff" }} />
          : <div style={{ width: 120, height: 60, borderRadius: 8, border: "1px dashed #cbd5e1", display: "grid", placeItems: "center", color: "#94a3b8", fontSize: 12 }}>No image</div>}
        <div>
          <input ref={ref} type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0])} />
          {busy && <div className="muted">Uploading…</div>}
          {err && <div className="err">{err}</div>}
          {value && <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => { onChange(""); if (ref.current) ref.current.value = ""; }}>Remove</button>}
        </div>
      </div>
    </div>
  );
}

export default function HomeBands() {
  /* ---- gifting band ---- */
  const [gift, setGift] = useState<Record<string, any>>({});
  const [giftSaved, setGiftSaved] = useState(false);

  /* ---- press strip ---- */
  const [press, setPress] = useState<Record<string, any>>({});
  const [logos, setLogos] = useState<Logo[]>([]);
  const [pressSaved, setPressSaved] = useState(false);
  const [l, setL] = useState({ ...emptyLogo });
  const [editId, setEditId] = useState<string | null>(null);

  const [err, setErr] = useState("");

  const loadGift = () => api.get<Record<string, any>>("/gifting").then(setGift).catch((e: any) => setErr(e.message));
  const loadPress = () =>
    api.get<{ section: Record<string, any>; items: Logo[] }>("/press/admin")
      .then((d) => { setPress(d.section || {}); setLogos(d.items || []); })
      .catch((e: any) => setErr(e.message));
  useEffect(() => { loadGift(); loadPress(); }, []);

  const setG = (k: string, v: any) => setGift((p) => ({ ...p, [k]: v }));
  const setP = (k: string, v: any) => setPress((p) => ({ ...p, [k]: v }));
  const setLK = (k: string, v: any) => setL((p) => ({ ...p, [k]: v }));
  const resetLogo = () => { setL({ ...emptyLogo }); setEditId(null); setErr(""); };

  const saveGift = async () => {
    setErr(""); setGiftSaved(false);
    try { setGift(await api.put("/gifting", gift)); setGiftSaved(true); setTimeout(() => setGiftSaved(false), 3000); }
    catch (e: any) { setErr(e.message); }
  };

  const savePress = async () => {
    setErr(""); setPressSaved(false);
    try { setPress(await api.put("/press/section", press)); setPressSaved(true); setTimeout(() => setPressSaved(false), 3000); }
    catch (e: any) { setErr(e.message); }
  };

  const saveLogo = async () => {
    setErr("");
    if (!l.name.trim()) { setErr("Publication name required"); return; }
    if (!l.image) { setErr("Logo image required"); return; }
    try {
      if (editId) await api.patch(`/press/${editId}`, l);
      else await api.post("/press", { ...l, name: l.name.trim() });
      resetLogo(); loadPress();
    } catch (e: any) { setErr(e.message); }
  };

  const move = async (id: string, delta: number) => {
    const ids = logos.map((x) => x.id);
    const from = ids.indexOf(id); const to = from + delta;
    if (to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    await api.put("/press/order", { ids }); loadPress();
  };

  return (
    <>
      <h1>Home Bands</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        The two full-width bands near the bottom of the home page — the gifting banner and the “As featured in” logo strip.
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Gifting band</h3>
        <label>Heading — press Enter for the line break</label>
        <textarea rows={2} value={gift.title || ""} onChange={(e) => setG("title", e.target.value)} placeholder={"Green gifting,\nmade easy."} />
        <label>Body copy</label>
        <textarea rows={3} value={gift.body || ""} onChange={(e) => setG("body", e.target.value)} placeholder="Festive hampers. Onboarding kits. Office refreshes. GST invoicing." />
        <label>Highlight line (shown in yellow)</label>
        <input value={gift.brands_line || ""} onChange={(e) => setG("brands_line", e.target.value)} placeholder="Trusted by 50+ brands across India" />
        <PhotoField label="Band photo" hint="Wide landscape, subject to the right — the copy sits over the left half." value={gift.image || ""} onChange={(v) => setG("image", v)} />
        <div className="row">
          <div><label>Primary button</label><input value={gift.primary_label || ""} onChange={(e) => setG("primary_label", e.target.value)} placeholder="Shop Hampers" /></div>
          <div><label>Primary link</label><input value={gift.primary_url || ""} onChange={(e) => setG("primary_url", e.target.value)} placeholder="/combos" /></div>
        </div>
        <div className="row">
          <div><label>Secondary button</label><input value={gift.secondary_label || ""} onChange={(e) => setG("secondary_label", e.target.value)} placeholder="Bulk Order" /></div>
          <div><label>Secondary link</label><input value={gift.secondary_url || ""} onChange={(e) => setG("secondary_url", e.target.value)} placeholder="/contact" /></div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={gift.active !== false} onChange={(e) => setG("active", e.target.checked)} style={{ width: "auto", margin: 0 }} />
          Show this band on the home page
        </label>
        {giftSaved && <div className="muted">Saved ✓</div>}
        <button className="btn" style={{ marginTop: 14 }} onClick={saveGift}>Save gifting band</button>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>“As featured in” strip</h3>
        <p className="muted" style={{ marginTop: -6 }}>
          Only add outlets that have actually covered the shop — the strip is a public claim of coverage. Until you add
          your own, the site shows neutral placeholder wordmarks.
        </p>
        <label>Heading</label>
        <input value={press.title || ""} onChange={(e) => setP("title", e.target.value)} placeholder="As featured in" />
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={press.active !== false} onChange={(e) => setP("active", e.target.checked)} style={{ width: "auto", margin: 0 }} />
          Show this strip on the home page
        </label>
        {pressSaved && <div className="muted">Saved ✓</div>}
        <button className="btn ghost sm" style={{ marginTop: 12 }} onClick={savePress}>Save strip settings</button>
      </div>

      <div className="card">
        <div className="between">
          <h3 style={{ marginTop: 0 }}>{editId ? "Edit logo" : "Add logo"}</h3>
          {editId && <button className="btn ghost sm" onClick={resetLogo}>Cancel edit</button>}
        </div>
        <div className="row">
          <div><label>Publication name</label><input value={l.name} onChange={(e) => setLK("name", e.target.value)} placeholder="The Plant Post" /></div>
          <div><label>Article link (optional)</label><input value={l.url} onChange={(e) => setLK("url", e.target.value)} placeholder="https://…" /></div>
        </div>
        <PhotoField label="Logo" hint="Transparent PNG or SVG, dark on light. It renders greyscale and turns full colour on hover." value={l.image} onChange={(v) => setLK("image", v)} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={l.active} onChange={(e) => setLK("active", e.target.checked)} style={{ width: "auto", margin: 0 }} />
          Visible on the website
        </label>
        {err && <div className="err">{err}</div>}
        <button className="btn" style={{ marginTop: 14 }} onClick={saveLogo}>{editId ? "Save changes" : "Add logo"}</button>

        {logos.length > 0 && (
          <table style={{ marginTop: 20 }}>
            <thead><tr><th style={{ width: 130 }}>Logo</th><th>Publication</th><th>Status</th><th style={{ width: 90 }}>Order</th><th></th></tr></thead>
            <tbody>
              {logos.map((logo, i) => (
                <tr key={logo.id} style={editId === logo.id ? { background: "#fff6f0" } : {}}>
                  <td><img src={logo.image} alt="" style={{ width: 110, height: 40, objectFit: "contain" }} /></td>
                  <td><b>{logo.name}</b>{logo.url && <div className="muted"><a href={logo.url} target="_blank" rel="noreferrer">Open ↗</a></div>}</td>
                  <td><button className="btn ghost sm" onClick={async () => { await api.patch(`/press/${logo.id}`, { active: !(logo.active !== false) }); loadPress(); }}>{logo.active !== false ? "Live ✓" : "Hidden"}</button></td>
                  <td className="flex">
                    <button className="btn ghost sm" onClick={() => move(logo.id, -1)} disabled={i === 0}>↑</button>
                    <button className="btn ghost sm" onClick={() => move(logo.id, 1)} disabled={i === logos.length - 1}>↓</button>
                  </td>
                  <td className="flex">
                    <button className="btn ghost sm" onClick={() => { setL({ name: logo.name, image: logo.image, url: logo.url || "", active: logo.active !== false }); setEditId(logo.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
                    <button className="btn danger sm" onClick={async () => { if (confirm(`Delete ${logo.name}?`)) { await api.del(`/press/${logo.id}`); if (editId === logo.id) resetLogo(); loadPress(); } }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {logos.length === 0 && <p className="muted">No logos yet — the site shows placeholder wordmarks until you add one.</p>}
      </div>
    </>
  );
}
