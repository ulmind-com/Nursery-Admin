import { useEffect, useRef, useState } from "react";
import { api, uploadImage } from "../api";
import DeleteButton from "../components/DeleteButton";
import { fmtDate } from "../date";

type Section = Record<string, any>;
type Service = { id: string; title: string; summary?: string; description?: string; image?: string; price_from?: string; duration?: string; features?: string[]; order?: number; active?: boolean };
type Block = { id: string; kind: string; title?: string; body?: string; image?: string; author?: string; order?: number; active?: boolean };
type Enquiry = { id: string; name: string; phone: string; location?: string; service?: string; handled?: boolean; created_at?: string };

const emptyService = { title: "", summary: "", image: "", price_from: "", duration: "", features: "", active: true };
const emptyBlock = { kind: "project", title: "", body: "", image: "", author: "", active: true };

/* Each block kind maps to one strip on the services page; the labels explain
   which fields that strip actually renders. */
const BLOCK_KINDS = [
  { key: "project", label: "Projects", hint: "Photo grid. Only the photo shows — the title is the alt text.", needs: "image" },
  { key: "process", label: "Our Process", hint: "Numbered cards. Title + body.", needs: "text" },
  { key: "step", label: "How it works?", hint: "Icon row. Title, optional small icon image.", needs: "text" },
  { key: "testimonial", label: "Testimonials", hint: "Quote cards. Body + author.", needs: "text" },
  { key: "client", label: "Client logos", hint: "Logo strip. Transparent PNG works best. Hidden while empty.", needs: "image" },
  { key: "faq", label: "FAQs", hint: "Accordion. Title is the question, body is the answer.", needs: "text" },
] as const;

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
  const [section, setSection] = useState<Section>({});
  const [items, setItems] = useState<Service[]>([]);
  const [blocks, setBlocks] = useState<Record<string, Block[]>>({});
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  const [f, setF] = useState({ ...emptyService });
  const [editId, setEditId] = useState<string | null>(null);
  const [b, setB] = useState({ ...emptyBlock });
  const [editBlockId, setEditBlockId] = useState<string | null>(null);

  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  const load = () =>
    api.get<{ section: Section; items: Service[]; blocks: Record<string, Block[]> }>("/garden-services/admin")
      .then((d) => { setSection(d.section || {}); setItems(d.items || []); setBlocks(d.blocks || {}); })
      .catch((e: any) => setErr(e.message));
  const loadEnquiries = () => api.get<Enquiry[]>("/garden-services/enquiries").then(setEnquiries).catch(() => {});
  useEffect(() => { load(); loadEnquiries(); }, []);

  const setS = (k: string, v: any) => setSection((p) => ({ ...p, [k]: v }));
  const lines = (k: string) => (section[k] || []).join("\n");
  const setLines = (k: string, v: string) => setS(k, v.split("\n").map((s) => s.trim()).filter(Boolean));

  const saveSection = async () => {
    setErr(""); setSaved(false);
    try { const res = await api.put("/garden-services/section", section); setSection(res); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (e: any) { setErr(e.message); }
  };

  /* ---- services ---- */
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const resetService = () => { setF({ ...emptyService }); setEditId(null); setErr(""); };

  const saveService = async () => {
    setErr("");
    if (!f.title.trim()) { setErr("Service title required"); return; }
    const body = { ...f, title: f.title.trim(), features: f.features.split("\n").map((s) => s.trim()).filter(Boolean) };
    try {
      if (editId) await api.patch(`/garden-services/${editId}`, body);
      else await api.post("/garden-services", body);
      resetService(); load();
    } catch (e: any) { setErr(e.message); }
  };

  const editService = (s: Service) => {
    setF({ title: s.title, summary: s.summary || "", image: s.image || "", price_from: s.price_from || "", duration: s.duration || "", features: (s.features || []).join("\n"), active: s.active !== false });
    setEditId(s.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const moveService = async (id: string, delta: number) => {
    const ids = items.map((s) => s.id);
    const from = ids.indexOf(id); const to = from + delta;
    if (to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    await api.put("/garden-services/order", { ids }); load();
  };

  /* ---- blocks ---- */
  const setBK = (k: string, v: any) => setB((p) => ({ ...p, [k]: v }));
  const resetBlock = () => { setB({ ...emptyBlock, kind: b.kind }); setEditBlockId(null); setErr(""); };

  const saveBlock = async () => {
    setErr("");
    const spec = BLOCK_KINDS.find((k) => k.key === b.kind)!;
    if (spec.needs === "image" && !b.image) { setErr(`${spec.label} need an image`); return; }
    if (spec.needs === "text" && !b.title.trim() && !b.body.trim()) { setErr(`${spec.label} need a title or body`); return; }
    try {
      if (editBlockId) await api.patch(`/garden-services/blocks/${editBlockId}`, b);
      else await api.post("/garden-services/blocks", b);
      resetBlock(); load();
    } catch (e: any) { setErr(e.message); }
  };

  const editBlock = (item: Block) => {
    setB({ kind: item.kind, title: item.title || "", body: item.body || "", image: item.image || "", author: item.author || "", active: item.active !== false });
    setEditBlockId(item.id);
  };

  const moveBlock = async (kind: string, id: string, delta: number) => {
    const ids = (blocks[kind] || []).map((x) => x.id);
    const from = ids.indexOf(id); const to = from + delta;
    if (to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    await api.put("/garden-services/blocks/order", { ids }); load();
  };

  const currentKind = BLOCK_KINDS.find((k) => k.key === b.kind)!;
  const currentBlocks = blocks[b.kind] || [];

  return (
    <>
      <h1>Garden Services</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Controls the yellow band on the home page and every strip of the /garden-services page.
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Home page band</h3>
        <label>Heading</label>
        <input value={section.title || ""} onChange={(e) => setS("title", e.target.value)} placeholder="Garden services by MyGarden" />
        <label>Body copy</label>
        <textarea rows={4} value={section.body || ""} onChange={(e) => setS("body", e.target.value)} />
        <label>Button label</label>
        <input value={section.cta_label || ""} onChange={(e) => setS("cta_label", e.target.value)} placeholder="View all Garden Service" />
        <PhotoField label="Band photo — shown beside the copy" value={section.image || ""} onChange={(v) => setS("image", v)} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={section.active !== false} onChange={(e) => setS("active", e.target.checked)} style={{ width: "auto", margin: 0 }} />
          Show this band on the home page
        </label>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Page hero</h3>
        <div className="row">
          <div><label>Hero heading</label><input value={section.hero_title || ""} onChange={(e) => setS("hero_title", e.target.value)} placeholder="Year round care" /></div>
          <div><label>Hero sub-heading</label><input value={section.hero_subtitle || ""} onChange={(e) => setS("hero_subtitle", e.target.value)} placeholder="for your garden & office space" /></div>
        </div>
        <label>Hero button label</label>
        <input value={section.hero_cta_label || ""} onChange={(e) => setS("hero_cta_label", e.target.value)} placeholder="Book service" />
        <PhotoField label="Hero photo — wide landscape (roughly 3:1)" value={section.hero_image || ""} onChange={(v) => setS("hero_image", v)} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={!!section.hero_overlay} onChange={(e) => setS("hero_overlay", e.target.checked)} style={{ width: "auto", margin: 0 }} />
          Draw the heading and button over the photo
        </label>
        <p className="muted">Leave this off when the artwork already has the headline and button printed on it — the bundled hero does. Turn it on after uploading a plain photo.</p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Services grid</h3>
        <label>Heading</label>
        <input value={section.services_title || ""} onChange={(e) => setS("services_title", e.target.value)} placeholder="What are you looking for ?" />
        <label>Note under the heading</label>
        <input value={section.services_note || ""} onChange={(e) => setS("services_note", e.target.value)} placeholder="(Currently providing services in Kolkata and Mumbai)" />
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Why us + call-back form</h3>
        <label>“Why choose us” heading</label>
        <input value={section.why_title || ""} onChange={(e) => setS("why_title", e.target.value)} placeholder="Why Choose MyGarden?" />
        <label>Points — one per line</label>
        <textarea rows={4} value={lines("why_points")} onChange={(e) => setLines("why_points", e.target.value)} />
        <div className="row">
          <div><PhotoField label="Collage photo 1 (back)" value={section.split_image_1 || ""} onChange={(v) => setS("split_image_1", v)} /></div>
          <div><PhotoField label="Collage photo 2 (front)" value={section.split_image_2 || ""} onChange={(v) => setS("split_image_2", v)} /></div>
        </div>
        <label>Form heading</label>
        <input value={section.form_title || ""} onChange={(e) => setS("form_title", e.target.value)} placeholder="Get in touch with us." />
        <label>Form note</label>
        <textarea rows={2} value={section.form_note || ""} onChange={(e) => setS("form_note", e.target.value)} />
        <label>Form button label</label>
        <input value={section.form_cta_label || ""} onChange={(e) => setS("form_cta_label", e.target.value)} placeholder="Get a Call Back" />
        <label>Locations in the dropdown — one per line</label>
        <textarea rows={3} value={lines("locations")} onChange={(e) => setLines("locations", e.target.value)} placeholder={"Kolkata\nMumbai"} />
        <div className="row">
          <div><label>Phone shown under the form</label><input value={section.phone || ""} onChange={(e) => setS("phone", e.target.value)} placeholder="+91 98300 00000" /></div>
          <div><label>Working hours</label><input value={section.hours || ""} onChange={(e) => setS("hours", e.target.value)} placeholder="Mon – Sat | 9:30 am – 6:30 pm" /></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Lower section headings</h3>
        <div className="row">
          <div><label>Process</label><input value={section.process_title || ""} onChange={(e) => setS("process_title", e.target.value)} placeholder="Our Process" /></div>
          <div><label>Process note</label><input value={section.process_note || ""} onChange={(e) => setS("process_note", e.target.value)} /></div>
        </div>
        <div className="row">
          <div><label>Clients</label><input value={section.clients_title || ""} onChange={(e) => setS("clients_title", e.target.value)} placeholder="Our Esteemed Clients" /></div>
          <div><label>Clients note</label><input value={section.clients_note || ""} onChange={(e) => setS("clients_note", e.target.value)} /></div>
        </div>
        <div className="row">
          <div><label>Projects</label><input value={section.projects_title || ""} onChange={(e) => setS("projects_title", e.target.value)} placeholder="Our Projects" /></div>
          <div><label>How it works</label><input value={section.steps_title || ""} onChange={(e) => setS("steps_title", e.target.value)} placeholder="How it works?" /></div>
        </div>
        <div className="row">
          <div><label>Testimonials</label><input value={section.testimonials_title || ""} onChange={(e) => setS("testimonials_title", e.target.value)} placeholder="What our customers say" /></div>
          <div><label>FAQs</label><input value={section.faq_title || ""} onChange={(e) => setS("faq_title", e.target.value)} placeholder="FAQs" /></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Long-form copy</h3>
        <p className="muted" style={{ marginTop: -6 }}>
          Supports <code>## Heading</code>, <code>### Sub-heading</code>, <code>- bullet</code> and <code>**bold**</code>. Leave a blank line between paragraphs.
        </p>
        <label>“More about” heading</label>
        <input value={section.about_title || ""} onChange={(e) => setS("about_title", e.target.value)} placeholder="More About MyGarden Garden Services" />
        <label>“More about” body</label>
        <textarea rows={8} value={section.about_body || ""} onChange={(e) => setS("about_body", e.target.value)} />
        <label>SEO / services detail block (bottom of the page)</label>
        <textarea rows={12} value={section.seo_body || ""} onChange={(e) => setS("seo_body", e.target.value)} />
        <label>Contact note (highlighted box at the very bottom)</label>
        <textarea rows={3} value={section.contact_note || ""} onChange={(e) => setS("contact_note", e.target.value)} />
        {err && <div className="err">{err}</div>}
        {saved && <div className="muted">Saved ✓</div>}
        <button className="btn" style={{ marginTop: 14 }} onClick={saveSection}>Save all page settings</button>
      </div>

      <div className="card">
        <div className="between">
          <h3 style={{ marginTop: 0 }}>{editId ? "Edit service" : "Add service"}</h3>
          {editId && <button className="btn ghost sm" onClick={resetService}>Cancel edit</button>}
        </div>
        <div className="row">
          <div><label>Title</label><input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Vertical Gardens" /></div>
          <div><label>Price from ₹ (optional)</label><input value={f.price_from} onChange={(e) => set("price_from", e.target.value)} placeholder="4,999" /></div>
          <div><label>Timeline (optional)</label><input value={f.duration} onChange={(e) => set("duration", e.target.value)} placeholder="2–3 days" /></div>
        </div>
        <label>Short summary — the bold line on the card</label>
        <textarea rows={2} value={f.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Turn plain walls into stunning green features." />
        <label>What's included — one per line</label>
        <textarea rows={4} value={f.features} onChange={(e) => set("features", e.target.value)} />
        <PhotoField label="Card photo — square crop" value={f.image} onChange={(v) => set("image", v)} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} style={{ width: "auto", margin: 0 }} />
          Visible on the website
        </label>
        <button className="btn" style={{ marginTop: 14 }} onClick={saveService}>{editId ? "Save changes" : "Add service"}</button>

        {items.length > 0 && (
          <table style={{ marginTop: 20 }}>
            <thead><tr><th style={{ width: 80 }}>Photo</th><th>Service</th><th>Status</th><th style={{ width: 90 }}>Order</th><th></th></tr></thead>
            <tbody>
              {items.map((s, i) => (
                <tr key={s.id} style={editId === s.id ? { background: "#fff6f0" } : {}}>
                  <td>{s.image && <img src={s.image} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />}</td>
                  <td><b>{s.title}</b>{s.summary && <div className="muted">{s.summary}</div>}</td>
                  <td><button className="btn ghost sm" onClick={async () => { await api.patch(`/garden-services/${s.id}`, { active: !(s.active !== false) }); load(); }}>{s.active !== false ? "Live ✓" : "Hidden"}</button></td>
                  <td className="flex">
                    <button className="btn ghost sm" onClick={() => moveService(s.id, -1)} disabled={i === 0}>↑</button>
                    <button className="btn ghost sm" onClick={() => moveService(s.id, 1)} disabled={i === items.length - 1}>↓</button>
                  </td>
                  <td className="flex">
                    <button className="btn ghost sm" onClick={() => editService(s)}>Edit</button>
                    <DeleteButton
                      confirm={`Delete "${s.title}"?`}
                      onDelete={() => api.del(`/garden-services/${s.id}`)}
                      onDone={() => { if (editId === s.id) resetService(); load(); }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {items.length === 0 && <p className="muted">No services yet — the page shows its bundled samples until you add one.</p>}
      </div>

      <div className="card">
        <div className="between">
          <h3 style={{ marginTop: 0 }}>Page strips</h3>
          {editBlockId && <button className="btn ghost sm" onClick={resetBlock}>Cancel edit</button>}
        </div>
        <label>Strip</label>
        <select value={b.kind} onChange={(e) => { setB({ ...emptyBlock, kind: e.target.value }); setEditBlockId(null); }}>
          {BLOCK_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
        </select>
        <p className="muted">{currentKind.hint}</p>

        {currentKind.key !== "client" && (
          <>
            <label>{currentKind.key === "faq" ? "Question" : "Title"}</label>
            <input value={b.title} onChange={(e) => setBK("title", e.target.value)} />
          </>
        )}
        {(currentKind.key === "process" || currentKind.key === "step" || currentKind.key === "faq" || currentKind.key === "testimonial") && (
          <>
            <label>{currentKind.key === "faq" ? "Answer" : currentKind.key === "testimonial" ? "Quote" : "Body"}</label>
            <textarea rows={4} value={b.body} onChange={(e) => setBK("body", e.target.value)} />
          </>
        )}
        {currentKind.key === "testimonial" && (
          <>
            <label>Attribution</label>
            <input value={b.author} onChange={(e) => setBK("author", e.target.value)} placeholder="Anita. Cravatex Ltd, Mumbai" />
          </>
        )}
        {currentKind.key === "client" && (
          <>
            <label>Client name (alt text)</label>
            <input value={b.title} onChange={(e) => setBK("title", e.target.value)} />
          </>
        )}
        {currentKind.key !== "faq" && currentKind.key !== "testimonial" && (
          <PhotoField label={currentKind.needs === "image" ? "Image (required)" : "Icon image (optional)"} value={b.image} onChange={(v) => setBK("image", v)} />
        )}
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={b.active} onChange={(e) => setBK("active", e.target.checked)} style={{ width: "auto", margin: 0 }} />
          Visible on the website
        </label>
        <button className="btn" style={{ marginTop: 14 }} onClick={saveBlock}>{editBlockId ? "Save changes" : `Add to ${currentKind.label}`}</button>

        {currentBlocks.length > 0 && (
          <table style={{ marginTop: 20 }}>
            <thead><tr><th style={{ width: 80 }}>Image</th><th>Content</th><th>Status</th><th style={{ width: 90 }}>Order</th><th></th></tr></thead>
            <tbody>
              {currentBlocks.map((item, i) => (
                <tr key={item.id} style={editBlockId === item.id ? { background: "#fff6f0" } : {}}>
                  <td>{item.image && <img src={item.image} alt="" style={{ width: 56, height: 40, objectFit: "contain", borderRadius: 6 }} />}</td>
                  <td><b>{item.title || "—"}</b>{item.body && <div className="muted">{item.body.slice(0, 120)}{item.body.length > 120 ? "…" : ""}</div>}{item.author && <div className="muted">— {item.author}</div>}</td>
                  <td><button className="btn ghost sm" onClick={async () => { await api.patch(`/garden-services/blocks/${item.id}`, { active: !(item.active !== false) }); load(); }}>{item.active !== false ? "Live ✓" : "Hidden"}</button></td>
                  <td className="flex">
                    <button className="btn ghost sm" onClick={() => moveBlock(item.kind, item.id, -1)} disabled={i === 0}>↑</button>
                    <button className="btn ghost sm" onClick={() => moveBlock(item.kind, item.id, 1)} disabled={i === currentBlocks.length - 1}>↓</button>
                  </td>
                  <td className="flex">
                    <button className="btn ghost sm" onClick={() => editBlock(item)}>Edit</button>
                    <DeleteButton
                      confirm="Delete this item?"
                      onDelete={() => api.del(`/garden-services/blocks/${item.id}`)}
                      onDone={() => { if (editBlockId === item.id) resetBlock(); load(); }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {currentBlocks.length === 0 && <p className="muted">Nothing in this strip yet — the page shows its bundled samples until you add one.</p>}
      </div>

      <div className="card">
        <div className="between">
          <h3 style={{ marginTop: 0 }}>Call-back requests <span className="muted" style={{ fontWeight: 400 }}>· {enquiries.filter((e) => !e.handled).length} open</span></h3>
          <button className="btn ghost sm" onClick={loadEnquiries}>Refresh</button>
        </div>
        {enquiries.length === 0 && <p className="muted">No requests yet.</p>}
        {enquiries.length > 0 && (
          <table>
            <thead><tr><th>Received</th><th>Name</th><th>Phone</th><th>Location</th><th>Service</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {enquiries.map((e) => (
                <tr key={e.id} style={e.handled ? { opacity: 0.6 } : {}}>
                  <td className="muted">{e.created_at ? fmtDate(e.created_at) : "—"}</td>
                  <td><b>{e.name}</b></td>
                  <td><a href={`tel:${e.phone}`}>{e.phone}</a></td>
                  <td>{e.location || "—"}</td>
                  <td>{e.service || "—"}</td>
                  <td><button className="btn ghost sm" onClick={async () => { await api.patch(`/garden-services/enquiries/${e.id}`, { handled: !e.handled }); loadEnquiries(); }}>{e.handled ? "Handled ✓" : "Mark handled"}</button></td>
                  <td>
                    <DeleteButton
                      confirm={`Delete request from ${e.name}?`}
                      onDelete={() => api.del(`/garden-services/enquiries/${e.id}`)}
                      onDone={loadEnquiries}
                    />
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
