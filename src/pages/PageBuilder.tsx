import { useEffect, useMemo, useRef, useState } from "react";
import { api, uploadImage, uploadVideo } from "../api";
import DeleteButton from "../components/DeleteButton";

/* Every band on the storefront home page is a row here. The shape of each
   band's form comes from the API's own type catalogue, so a new section type
   added on the backend shows up in this screen without a change to this file. */

type FieldSpec = {
  key: string;
  label: string;
  type: "text" | "textarea" | "image" | "video" | "lottie" | "link" | "number" | "bool" | "select";
  options?: string[];
};

type TypeSpec = {
  type: string;
  label: string;
  description: string;
  source?: string;
  fields: FieldSpec[];
  item_fields: FieldSpec[];
};

type Section = {
  id: string;
  type: string;
  order?: number;
  active?: boolean;
  items?: Record<string, any>[];
  [key: string]: any;
};

/* ── Field inputs ─────────────────────────────────────────────────────────── */

function MediaField({
  label,
  value,
  kind,
  onChange,
}: {
  label: string;
  value: string;
  kind: "image" | "video";
  onChange: (url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pick = async (file?: File) => {
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      onChange(kind === "video" ? (await uploadVideo(file)).url : await uploadImage(file));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label>{label}</label>
      <div className="flex" style={{ alignItems: "center", gap: 14 }}>
        {value ? (
          kind === "video" ? (
            <video src={value} muted playsInline style={thumb} />
          ) : (
            <img src={value} alt="" style={thumb} />
          )
        ) : (
          <div style={{ ...thumb, border: "1px dashed #cbd5e1", display: "grid", placeItems: "center", color: "#94a3b8", fontSize: 11 }}>
            None
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <input ref={ref} type="file" accept={kind === "video" ? "video/*" : "image/*"} onChange={(e) => pick(e.target.files?.[0])} />
          {/* A path can also be typed by hand — the bundled artwork lives under /public. */}
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="or paste a URL / path" style={{ marginTop: 6 }} />
          {busy && <div className="muted">Uploading…</div>}
          {err && <div className="err">{err}</div>}
          {value && (
            <button
              className="btn ghost sm"
              style={{ marginTop: 6 }}
              onClick={() => {
                onChange("");
                if (ref.current) ref.current.value = "";
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const thumb: React.CSSProperties = {
  width: 96,
  height: 64,
  objectFit: "cover",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#fff",
  flexShrink: 0,
};

function Field({ spec, value, onChange }: { spec: FieldSpec; value: any; onChange: (v: any) => void }) {
  if (spec.type === "image" || spec.type === "video") {
    return <MediaField label={spec.label} kind={spec.type} value={value || ""} onChange={onChange} />;
  }
  if (spec.type === "textarea") {
    return (
      <div style={{ marginBottom: 10 }}>
        <label>{spec.label}</label>
        <textarea rows={3} value={value || ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (spec.type === "select") {
    return (
      <div style={{ marginBottom: 10 }}>
        <label>{spec.label}</label>
        <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {(spec.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (spec.type === "number") {
    return (
      <div style={{ marginBottom: 10 }}>
        <label>{spec.label}</label>
        <input
          type="number"
          min={1}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      </div>
    );
  }
  if (spec.type === "bool") {
    return (
      <label className="flex" style={{ alignItems: "center", gap: 8, marginBottom: 10 }}>
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        {spec.label}
      </label>
    );
  }
  return (
    <div style={{ marginBottom: 10 }}>
      <label>{spec.label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={spec.type === "link" ? "/plants or https://…" : spec.type === "lottie" ? "/lottie/soil.json" : ""}
      />
    </div>
  );
}

/* ── One band ─────────────────────────────────────────────────────────────── */

function SectionCard({
  section,
  spec,
  first,
  last,
  onMove,
  onSaved,
  onDeleted,
}: {
  section: Section;
  spec: TypeSpec | undefined;
  first: boolean;
  last: boolean;
  onMove: (delta: number) => void;
  onSaved: (updated: Section) => void;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Section>(section);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  /* A reorder or a toggle replaces the row from the server; drop the local
     draft so the form never shows a value that is no longer stored. */
  useEffect(() => setDraft(section), [section]);

  const set = (key: string, value: any) => setDraft((prev) => ({ ...prev, [key]: value }));
  const items: Record<string, any>[] = Array.isArray(draft.items) ? draft.items : [];
  const setItems = (next: Record<string, any>[]) => set("items", next);

  const setItem = (index: number, key: string, value: any) =>
    setItems(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));

  const moveItem = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    next.splice(to, 0, next.splice(index, 1)[0]);
    setItems(next);
  };

  const save = async () => {
    setErr("");
    setBusy(true);
    try {
      const body: Record<string, any> = { items };
      for (const field of spec?.fields || []) body[field.key] = draft[field.key] ?? (field.type === "number" ? null : "");
      const updated = await api.patch<Section>(`/page-sections/${section.id}`, body);
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async () => {
    setErr("");
    try {
      onSaved(await api.patch<Section>(`/page-sections/${section.id}`, { active: !section.active }));
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const remove = () => api.del(`/page-sections/${section.id}`);

  const editable = (spec?.fields.length || 0) + (spec?.item_fields.length || 0) > 0;
  const dimmed = section.active === false ? 0.55 : 1;

  return (
    <div className="card" style={{ opacity: dimmed }}>
      <div className="flex" style={{ alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0 }}>
            {spec?.label || section.type}
            {section.active === false && <span className="muted" style={{ fontWeight: 400 }}> · hidden</span>}
          </h3>
          <p className="muted" style={{ margin: "4px 0 0" }}>{spec?.description || ""}</p>
          {spec?.source && (
            <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
              Content comes from <strong>{spec.source}</strong> — this screen controls its position, heading and visibility.
            </p>
          )}
        </div>
        <div className="flex" style={{ gap: 6, flexShrink: 0 }}>
          <button className="btn ghost sm" onClick={() => onMove(-1)} disabled={first} title="Move up">↑</button>
          <button className="btn ghost sm" onClick={() => onMove(1)} disabled={last} title="Move down">↓</button>
          <button className="btn ghost sm" onClick={toggleActive}>{section.active === false ? "Show" : "Hide"}</button>
          {editable && <button className="btn sm" onClick={() => setOpen((v) => !v)}>{open ? "Close" : "Edit"}</button>}
          <DeleteButton
            confirm={`Remove "${spec?.label || section.type}" from the home page?`}
            onDelete={remove}
            onDone={onDeleted}
          />
        </div>
      </div>

      {err && <div className="err" style={{ marginTop: 8 }}>{err}</div>}

      {open && editable && (
        <div style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
          {(spec?.fields || []).map((field) => (
            <Field key={field.key} spec={field} value={draft[field.key]} onChange={(v) => set(field.key, v)} />
          ))}

          {(spec?.item_fields.length || 0) > 0 && (
            <>
              <div className="flex" style={{ alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <h4 style={{ margin: 0 }}>Items ({items.length})</h4>
                <button className="btn ghost sm" onClick={() => setItems([...items, {}])}>+ Add item</button>
              </div>

              {items.length === 0 && <p className="muted">No items yet — the storefront falls back to the bundled artwork.</p>}

              {items.map((item, index) => (
                <div key={index} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, marginTop: 10 }}>
                  <div className="flex" style={{ alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <strong className="muted">#{index + 1}</strong>
                    <div className="flex" style={{ gap: 6 }}>
                      <button className="btn ghost sm" onClick={() => moveItem(index, -1)} disabled={index === 0}>↑</button>
                      <button className="btn ghost sm" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}>↓</button>
                      <DeleteButton
                        label="Remove"
                        onDelete={() => undefined}
                        onDone={() => setItems(items.filter((_, i) => i !== index))}
                      />
                    </div>
                  </div>
                  {(spec?.item_fields || []).map((field) => (
                    <Field
                      key={field.key}
                      spec={field}
                      value={item[field.key]}
                      onChange={(v) => setItem(index, field.key, v)}
                    />
                  ))}
                </div>
              ))}
            </>
          )}

          <div className="flex" style={{ gap: 10, alignItems: "center", marginTop: 16 }}>
            <button className="btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save section"}</button>
            <button className="btn ghost" onClick={() => setDraft(section)} disabled={busy}>Undo changes</button>
            {saved && <span className="muted">Saved ✓</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function PageBuilder() {
  const [types, setTypes] = useState<TypeSpec[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [adding, setAdding] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = () =>
    api
      .get<Section[]>("/page-sections/admin?page=home")
      .then(setSections)
      .catch((e: any) => setErr(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    api.get<TypeSpec[]>("/page-sections/types").then(setTypes).catch((e: any) => setErr(e.message));
    load();
  }, []);

  const specByType = useMemo(() => Object.fromEntries(types.map((t) => [t.type, t])), [types]);
  const used = useMemo(() => new Set(sections.map((s) => s.type)), [sections]);

  /* Types backed by another collection can only appear once; the rest are
     free-form bands the admin can stack as many times as they like. */
  const addable = types.filter((t) => !t.source || !used.has(t.type));

  const move = async (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    next.splice(to, 0, next.splice(index, 1)[0]);
    setSections(next);
    setErr("");
    try {
      await api.put("/page-sections/order", { ids: next.map((s) => s.id) });
    } catch (e: any) {
      setErr(e.message);
      load();
    }
  };

  const add = async () => {
    if (!adding) return;
    setErr("");
    try {
      const created = await api.post<Section>("/page-sections", { page: "home", type: adding });
      setSections((prev) => [...prev, created]);
      setAdding("");
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const reset = async () => {
    if (!confirm("Throw away every edit and restore the layout the site ships with?")) return;
    setErr("");
    try {
      await api.post("/page-sections/reset?page=home");
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <>
      <h1>Home Page Builder</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Every band on the storefront home page, top to bottom. Reorder them, hide one, rewrite its copy, swap its
        artwork, or add a new band. Changes go live as soon as you save.
      </p>

      {err && <div className="err">{err}</div>}

      <div className="card">
        <div className="flex" style={{ alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>Add a band</label>
            <select value={adding} onChange={(e) => setAdding(e.target.value)}>
              <option value="">Choose a section type…</option>
              {addable.map((t) => (
                <option key={t.type} value={t.type}>{t.label}</option>
              ))}
            </select>
          </div>
          <button className="btn" onClick={add} disabled={!adding}>Add to bottom</button>
          <button className="btn ghost" onClick={reset}>Restore default layout</button>
        </div>
        {adding && <p className="muted" style={{ marginTop: 10 }}>{specByType[adding]?.description}</p>}
      </div>

      {loading && <p className="muted">Loading…</p>}

      {sections.map((section, index) => (
        <SectionCard
          key={section.id}
          section={section}
          spec={specByType[section.type]}
          first={index === 0}
          last={index === sections.length - 1}
          onMove={(delta) => move(index, delta)}
          onSaved={(updated) => setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))}
          onDeleted={() => setSections((prev) => prev.filter((s) => s.id !== section.id))}
        />
      ))}

      {!loading && sections.length === 0 && (
        <p className="muted">No bands yet — use “Restore default layout” to start from the shipped home page.</p>
      )}
    </>
  );
}
