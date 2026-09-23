import { useEffect, useRef, useState } from "react";
import { api, uploadImage } from "../api";

type Section = {
  title: string; body: string; image: string; cta_label: string;
  page_title: string; page_subtitle: string; page_image: string;
  contact_note: string; whatsapp: string; active: boolean;
};

type Service = {
  id: string; title: string; summary?: string; description?: string; image?: string;
  price_from?: string; duration?: string; features?: string[]; order?: number; active?: boolean;
};

const emptySection: Section = {
  title: "Garden services by MyGarden", body: "", image: "", cta_label: "View all Garden Service",
  page_title: "Garden Services", page_subtitle: "", page_image: "", contact_note: "", whatsapp: "", active: true,
};

const emptyService = { title: "", summary: "", description: "", image: "", price_from: "", duration: "", features: "", active: true };

/** Small photo picker shared by the band, the page hero and each service card. */
function PhotoField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
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
      <div className="flex" style={{ alignItems: "center", gap: 14 }}>
        {value
          ? <img src={value} alt="" style={{ width: 120, height: 84, objectFit: "cover", borderRadius: 10, border: "1px solid #e5e7eb" }} />
          : <div style={{ width: 120, height: 84, borderRadius: 10, border: "1px dashed #cbd5e1", display: "grid", placeItems: "center", color: "#94a3b8", fontSize: 12 }}>No photo</div>}
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

export default function GardenServices() {
  const [section, setSection] = useState<Section>({ ...emptySection });
  const [items, setItems] = useState<Service[]>([]);
  const [f, setF] = useState({ ...emptyService });
  const [editId, setEditId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  const load = () =>
    api.get<{ section: Section; items: Service[] }>("/garden-services/admin")
      .then((d) => { setSection({ ...emptySection, ...d.section }); setItems(d.items || []); })
      .catch((e: any) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const setS = (k: keyof Section, v: any) => setSection((p) => ({ ...p, [k]: v }));
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const reset = () => { setF({ ...emptyService }); setEditId(null); setErr(""); };

  const saveSection = async () => {
    setErr(""); setSaved(false);
    try { await api.put("/garden-services/section", section); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (e: any) { setErr(e.message); }
  };

  const saveService = async () => {
    setErr("");
    if (!f.title.trim()) { setErr("Service title required"); return; }
    const body = {
      ...f,
      title: f.title.trim(),
      features: f.features.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editId) await api.patch(`/garden-services/${editId}`, body);
      else await api.post("/garden-services", body);
      reset(); load();
    } catch (e: any) { setErr(e.message); }
  };

  const edit = (s: Service) => {
    setF({
      title: s.title, summary: s.summary || "", description: s.description || "", image: s.image || "",
      price_from: s.price_from || "", duration: s.duration || "", features: (s.features || []).join("\n"),
      active: s.active !== false,
    });
    setEditId(s.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggle = async (s: Service) => { await api.patch(`/garden-services/${s.id}`, { active: !(s.active !== false) }); load(); };
  const del = async (s: Service) => { if (confirm(`Delete "${s.title}"?`)) { await api.del(`/garden-services/${s.id}`); if (editId === s.id) reset(); load(); } };

  const move = async (id: string, delta: number) => {
    const ids = items.map((s) => s.id);
    const from = ids.indexOf(id);
    const to = from + delta;
    if (to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    await api.put("/garden-services/order", { ids });
    load();
  };

  return (
    <>
      <h1>Garden Services</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Controls the yellow “Garden services” band on the home page and the /garden-services page it links to.
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Home page band</h3>
        <label>Heading</label>
        <input value={section.title} onChange={(e) => setS("title", e.target.value)} placeholder="Garden services by MyGarden" />
        <label>Body copy</label>
        <textarea rows={4} value={section.body} onChange={(e) => setS("body", e.target.value)} placeholder="Our end-to-end Garden Services cover everything from…" />
        <label>Button label</label>
        <input value={section.cta_label} onChange={(e) => setS("cta_label", e.target.value)} placeholder="View all Garden Service" />
        <PhotoField label="Band photo — shown to the right of the copy" value={section.image} onChange={(v) => setS("image", v)} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={section.active} onChange={(e) => setS("active", e.target.checked)} style={{ width: "auto", margin: 0 }} />
          Show this band on the home page
        </label>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Services page</h3>
        <label>Page heading</label>
        <input value={section.page_title} onChange={(e) => setS("page_title", e.target.value)} placeholder="Garden Services" />
        <label>Page intro (falls back to the band copy)</label>
        <textarea rows={3} value={section.page_subtitle} onChange={(e) => setS("page_subtitle", e.target.value)} />
        <PhotoField label="Hero photo (falls back to the band photo)" value={section.page_image} onChange={(v) => setS("page_image", v)} />
        <label>Closing note above the “Get in touch” button</label>
        <textarea rows={3} value={section.contact_note} onChange={(e) => setS("contact_note", e.target.value)} />
        <label>WhatsApp number (optional — adds a WhatsApp button to the hero)</label>
        <input value={section.whatsapp} onChange={(e) => setS("whatsapp", e.target.value)} placeholder="+91 98300 00000" />
        {err && <div className="err">{err}</div>}
        {saved && <div className="muted">Saved ✓</div>}
        <button className="btn" style={{ marginTop: 14 }} onClick={saveSection}>Save page settings</button>
      </div>

      <div className="card">
        <div className="between">
          <h3 style={{ marginTop: 0 }}>{editId ? "Edit service" : "Add service"}</h3>
          {editId && <button className="btn ghost sm" onClick={reset}>Cancel edit</button>}
        </div>
        <div className="row">
          <div><label>Title</label><input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Botanical styling" /></div>
          <div><label>Price from ₹ (optional)</label><input value={f.price_from} onChange={(e) => set("price_from", e.target.value)} placeholder="4,999" /></div>
        </div>
        <div className="row">
          <div><label>Timeline (optional)</label><input value={f.duration} onChange={(e) => set("duration", e.target.value)} placeholder="2–3 days" /></div>
        </div>
        <label>Short summary — the paragraph on the card</label>
        <textarea rows={3} value={f.summary} onChange={(e) => set("summary", e.target.value)} placeholder="A curated plant palette chosen for your light…" />
        <label>What's included — one per line</label>
        <textarea rows={4} value={f.features} onChange={(e) => set("features", e.target.value)} placeholder={"On-site light study\nPlant + planter palette\nStyling and placement"} />
        <PhotoField label="Card photo — 16:10 landscape (optional; a numbered tile shows without one)" value={f.image} onChange={(v) => set("image", v)} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} style={{ width: "auto", margin: 0 }} />
          Visible on the website
        </label>
        {err && <div className="err">{err}</div>}
        <button className="btn" style={{ marginTop: 14 }} onClick={saveService}>{editId ? "Save changes" : "Add service"}</button>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Services <span className="muted" style={{ fontWeight: 400 }}>· {items.length}</span></h3>
        {items.length === 0 && <p className="muted">No services yet — the page shows its bundled sample services until you add one.</p>}
        {items.length > 0 && (
          <table>
            <thead><tr><th style={{ width: 90 }}>Photo</th><th>Service</th><th>Price</th><th>Status</th><th style={{ width: 90 }}>Order</th><th></th></tr></thead>
            <tbody>
              {items.map((s, i) => (
                <tr key={s.id} style={editId === s.id ? { background: "#fff6f0" } : {}}>
                  <td>{s.image && <img src={s.image} alt="" style={{ width: 64, height: 44, objectFit: "cover", borderRadius: 8 }} />}</td>
                  <td>
                    <b>{s.title}</b>
                    {s.summary && <div className="muted">{s.summary}</div>}
                    {s.features && s.features.length > 0 && <div className="muted">{s.features.length} inclusion{s.features.length === 1 ? "" : "s"}{s.duration ? ` · ${s.duration}` : ""}</div>}
                  </td>
                  <td>{s.price_from ? `₹${s.price_from}` : "—"}</td>
                  <td><button className="btn ghost sm" onClick={() => toggle(s)}>{s.active !== false ? "Live ✓" : "Hidden"}</button></td>
                  <td className="flex">
                    <button className="btn ghost sm" onClick={() => move(s.id, -1)} disabled={i === 0}>↑</button>
                    <button className="btn ghost sm" onClick={() => move(s.id, 1)} disabled={i === items.length - 1}>↓</button>
                  </td>
                  <td className="flex">
                    <button className="btn ghost sm" onClick={() => edit(s)}>Edit</button>
                    <button className="btn danger sm" onClick={() => del(s)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
