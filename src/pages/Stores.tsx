import { useEffect, useMemo, useRef, useState } from "react";
import { api, uploadImage } from "../api";
import DeleteButton from "../components/DeleteButton";

type Store = {
  id: string;
  name: string;
  city: string;
  image?: string;
  address?: string;
  map_url?: string;
  phone?: string;
  hours?: string;
  city_order?: number;
  order?: number;
  active?: boolean;
};

const empty = { name: "", city: "", image: "", address: "", map_url: "", phone: "", hours: "", active: true };

export default function Stores() {
  const [items, setItems] = useState<Store[]>([]);
  const [f, setF] = useState({ ...empty });
  const [editId, setEditId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => api.get<Store[]>("/stores/admin").then(setItems).catch((e: any) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const reset = () => { setF({ ...empty }); setEditId(null); setErr(""); if (fileRef.current) fileRef.current.value = ""; };

  /* The storefront tabs follow city_order, so the admin reorders whole cities,
     not individual stores. */
  const cities = useMemo(() => {
    const seen: string[] = [];
    for (const s of items) if (!seen.includes(s.city)) seen.push(s.city);
    return seen;
  }, [items]);

  const pick = async (file?: File) => {
    if (!file) return;
    setErr("");
    setUploading(true);
    try { set("image", await uploadImage(file)); }
    catch (e: any) { setErr(e.message); }
    finally { setUploading(false); }
  };

  const save = async () => {
    setErr("");
    if (!f.name.trim()) { setErr("Store name required"); return; }
    if (!f.city.trim()) { setErr("City required"); return; }
    if (!f.image) { setErr("Store photo required — the card is a photo card"); return; }
    try {
      const body = { ...f, name: f.name.trim(), city: f.city.trim() };
      if (editId) await api.patch(`/stores/${editId}`, body);
      else await api.post("/stores", body);
      reset(); load();
    } catch (e: any) { setErr(e.message); }
  };

  const edit = (s: Store) => {
    setF({
      name: s.name, city: s.city, image: s.image || "", address: s.address || "",
      map_url: s.map_url || "", phone: s.phone || "", hours: s.hours || "", active: s.active !== false,
    });
    setEditId(s.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggle = async (s: Store) => { await api.patch(`/stores/${s.id}`, { active: !(s.active !== false) }); load(); };
  const del = (s: Store) => api.del(`/stores/${s.id}`);
  const afterDel = (s: Store) => { if (editId === s.id) reset(); load(); };

  const moveCity = async (city: string, delta: number) => {
    const next = [...cities];
    const from = next.indexOf(city);
    const to = from + delta;
    if (to < 0 || to >= next.length) return;
    next.splice(to, 0, next.splice(from, 1)[0]);
    await api.put("/stores/city-order", { cities: next });
    load();
  };

  const moveStore = async (city: string, id: string, delta: number) => {
    const ids = items.filter((s) => s.city === city).map((s) => s.id);
    const from = ids.indexOf(id);
    const to = from + delta;
    if (to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    await api.put("/stores/order", { ids });
    load();
  };

  return (
    <>
      <h1>Store Locations</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Powers “Find Your Nearest Store” on the home page. Stores are grouped into city tabs — the first city in the
        list below is the tab that opens by default.
      </p>

      <div className="card">
        <div className="between">
          <h3 style={{ marginTop: 0 }}>{editId ? "Edit store" : "Add store"}</h3>
          {editId && <button className="btn ghost sm" onClick={reset}>Cancel edit</button>}
        </div>

        <div className="row">
          <div><label>Store name</label><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Park Street" /></div>
          <div>
            <label>City</label>
            <input list="store-cities" value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Kolkata" />
            <datalist id="store-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
        </div>

        <div className="row">
          <div><label>Address line (optional)</label><input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="12B Park Street, near Flurys" /></div>
          <div><label>Google Maps link</label><input value={f.map_url} onChange={(e) => set("map_url", e.target.value)} placeholder="https://maps.app.goo.gl/…" /></div>
        </div>

        <div className="row">
          <div><label>Phone (optional)</label><input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98300 00000" /></div>
          <div><label>Hours (optional)</label><input value={f.hours} onChange={(e) => set("hours", e.target.value)} placeholder="10am – 9pm, all days" /></div>
        </div>

        <label>Store photo — 4:5 portrait works best</label>
        <div className="flex" style={{ alignItems: "center", gap: 14, marginBottom: 12 }}>
          {f.image
            ? <img src={f.image} alt="" style={{ width: 96, height: 120, objectFit: "cover", borderRadius: 10, border: "1px solid #e5e7eb" }} />
            : <div style={{ width: 96, height: 120, borderRadius: 10, border: "1px dashed #cbd5e1", display: "grid", placeItems: "center", color: "#94a3b8", fontSize: 12 }}>No photo</div>}
          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0])} />
            {uploading && <div className="muted">Uploading…</div>}
            {f.image && <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => { set("image", ""); if (fileRef.current) fileRef.current.value = ""; }}>Remove photo</button>}
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} style={{ width: "auto", margin: 0 }} />
          Visible on the website
        </label>

        {err && <div className="err">{err}</div>}
        <button className="btn" style={{ marginTop: 14 }} onClick={save} disabled={uploading}>
          {editId ? "Save changes" : "Add store"}
        </button>
      </div>

      {cities.length === 0 && (
        <div className="card"><p className="muted">No stores yet. Add one above — until then the website shows its bundled sample stores.</p></div>
      )}

      {cities.map((city, cityIdx) => {
        const rows = items.filter((s) => s.city === city);
        return (
          <div className="card" key={city}>
            <div className="between">
              <h3 style={{ marginTop: 0 }}>
                {city} <span className="muted" style={{ fontWeight: 400 }}>· {rows.length} store{rows.length === 1 ? "" : "s"}{cityIdx === 0 ? " · opens first" : ""}</span>
              </h3>
              <div className="flex">
                <button className="btn ghost sm" onClick={() => moveCity(city, -1)} disabled={cityIdx === 0}>↑ Tab</button>
                <button className="btn ghost sm" onClick={() => moveCity(city, 1)} disabled={cityIdx === cities.length - 1}>↓ Tab</button>
              </div>
            </div>
            <table>
              <thead><tr><th style={{ width: 70 }}>Photo</th><th>Store</th><th>Maps</th><th>Status</th><th style={{ width: 90 }}>Order</th><th></th></tr></thead>
              <tbody>
                {rows.map((s, i) => (
                  <tr key={s.id} style={editId === s.id ? { background: "#fff6f0" } : {}}>
                    <td>{s.image && <img src={s.image} alt="" style={{ width: 48, height: 60, objectFit: "cover", borderRadius: 8 }} />}</td>
                    <td>
                      <b>{s.name}</b>
                      {s.address && <div className="muted">{s.address}</div>}
                      {(s.phone || s.hours) && <div className="muted">{[s.phone, s.hours].filter(Boolean).join(" · ")}</div>}
                    </td>
                    <td>{s.map_url ? <a href={s.map_url} target="_blank" rel="noreferrer">Open ↗</a> : <span className="muted">—</span>}</td>
                    <td><button className="btn ghost sm" onClick={() => toggle(s)}>{s.active !== false ? "Live ✓" : "Hidden"}</button></td>
                    <td className="flex">
                      <button className="btn ghost sm" onClick={() => moveStore(city, s.id, -1)} disabled={i === 0}>↑</button>
                      <button className="btn ghost sm" onClick={() => moveStore(city, s.id, 1)} disabled={i === rows.length - 1}>↓</button>
                    </td>
                    <td className="flex">
                      <button className="btn ghost sm" onClick={() => edit(s)}>Edit</button>
                      <DeleteButton confirm={`Delete ${s.name}?`} onDelete={() => del(s)} onDone={() => afterDel(s)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}
