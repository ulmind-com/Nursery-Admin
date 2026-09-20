import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, uploadImage } from "../api";

const emptySpec = {
  plant_type: "", sunlight: "", watering: "", difficulty_level: "",
  height_range: "", spread: "", flowering: false, flower_color: "",
  fragrant: false, pet_safe: false, air_purifying: false, medicinal: false,
  season: "", soil_type: "", growth_rate: "", max_height: "",
  origin: "", scientific_name: "", common_names: [] as string[],
  temperature_range: "", humidity: "",
};

const empty = {
  title: "", description: "", short_description: "", tags: [] as string[], brand: "", category_id: "",
  mrp: 0, price: 0, discount_pct: 0, discount_on: "price",
  cgst: "" as number | string, sgst: "" as number | string, igst: "" as number | string,
  images: [] as string[],
  sizes: [] as any[],
  plant_spec: { ...emptySpec },
  care_instructions: "", care_tips: [] as string[], includes: [] as string[],
  warranty: "30-day plant guarantee",
  sku: "", shipping_weight: "" as number | string,
  stock: 0, low_stock_threshold: 5,
  rating: 0, review_count: 0, sold_count: 0,
  is_active: true, is_featured: false, is_bestseller: false, is_new_arrival: false,
};

export default function ProductEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState({ ...empty });
  const [cats, setCats] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [brandFocus, setBrandFocus] = useState(false);
  const [brandCreating, setBrandCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const genFile = useRef<HTMLInputElement>(null);

  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const setSpec = (k: string, v: any) => setF((p) => ({ ...p, plant_spec: { ...p.plant_spec, [k]: v } }));

  useEffect(() => {
    api.get("/categories").then(setCats).catch(() => {});
    api.get("/brands").then(setBrands).catch(() => {});
    if (id) api.get(`/products/${id}`).then((p) => setF({
      ...empty,
      ...p,
      category_id: p.category_id || "",
      plant_spec: { ...emptySpec, ...(p.plant_spec || {}) },
      care_tips: p.care_tips || [],
      includes: p.includes || [],
      sizes: p.sizes || [],
    }));
  }, [id]);

  // live price preview
  const base = f.discount_on === "mrp" ? f.mrp : f.price;
  const final = f.discount_pct > 0 ? Math.round(base * (1 - f.discount_pct / 100) * 100) / 100 : f.price;
  const off = f.mrp > final ? Math.round(((f.mrp - final) / f.mrp) * 100) : 0;

  const uploadTo = async (files: FileList | null, cb: (urls: string[]) => void) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) urls.push(await uploadImage(file));
      cb(urls);
    } catch (e: any) { setErr(e.message); } finally { setUploading(false); }
  };

  // --- Size variants ---
  const blankSize = () => ({ name: "", pot_size: "", pot_type: "", pot_color: "", height: "", price: "" as any, mrp: "" as any, discount_pct: "" as any, stock: 0, images: [] as string[], sku: "" });
  const addSize = () => set("sizes", [...f.sizes, blankSize()]);
  const updSize = (si: number, k: string, v: any) => set("sizes", f.sizes.map((s: any, idx: number) => (idx === si ? { ...s, [k]: v } : s)));
  const rmSize = (si: number) => set("sizes", f.sizes.filter((_: any, idx: number) => idx !== si));

  // --- Care tips ---
  const addTip = () => set("care_tips", [...f.care_tips, ""]);
  const updTip = (i: number, v: string) => set("care_tips", f.care_tips.map((t, idx) => idx === i ? v : t));
  const rmTip = (i: number) => set("care_tips", f.care_tips.filter((_, idx) => idx !== i));

  // --- Includes ---
  const defaultIncludes = ["Plant", "Pot", "Soil", "Pebbles", "Care Card"];
  const toggleInclude = (item: string) => {
    if (f.includes.includes(item)) set("includes", f.includes.filter((i) => i !== item));
    else set("includes", [...f.includes, item]);
  };

  const save = async () => {
    setErr("");
    if (!f.title || !f.price) { setErr("Title and selling price are required"); return; }

    const { rating, review_count, sold_count, ...rest } = f as any;
    const body = {
      ...rest,
      short_description: f.short_description || null,
      tags: f.tags,
      category_id: f.category_id || null,
      mrp: Number(f.mrp), price: Number(f.price), discount_pct: Number(f.discount_pct),
      cgst: f.cgst === "" ? null : Number(f.cgst),
      sgst: f.sgst === "" ? null : Number(f.sgst),
      igst: f.igst === "" ? null : Number(f.igst),
      stock: Number(f.stock), low_stock_threshold: Number(f.low_stock_threshold),
      sku: f.sku || null,
      shipping_weight: f.shipping_weight === "" ? null : Number(f.shipping_weight),
      care_instructions: f.care_instructions || null,
      warranty: f.warranty || null,
      brand: f.brand || null,
      sizes: (f.sizes || [])
        .filter((s: any) => (s.name || "").trim())
        .map((s: any) => ({
          name: s.name.trim(),
          pot_size: (s.pot_size || "").trim() || null,
          pot_type: (s.pot_type || "").trim() || null,
          pot_color: (s.pot_color || "").trim() || null,
          height: (s.height || "").trim() || null,
          price: s.price === "" || s.price == null ? null : Number(s.price),
          mrp: s.mrp === "" || s.mrp == null ? null : Number(s.mrp),
          discount_pct: s.discount_pct === "" || s.discount_pct == null ? null : Number(s.discount_pct),
          stock: Number(s.stock) || 0,
          images: s.images || [],
          sku: (s.sku || "").trim() || null,
        })),
    };

    setSaving(true);
    try {
      if (id) await api.patch(`/products/${id}`, body);
      else await api.post("/products", body);
      nav("/products");
    } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
  };

  const sp = f.plant_spec;

  return (
    <>
      <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <span className="emoji">🌿</span> {id ? "Edit Plant" : "Add New Plant"}
      </h1>

      {/* Basic Info */}
      <div className="card">
        <h3 style={{ marginTop: 0, color: "var(--primary-dark)" }}>🏷️ Basic Information</h3>
        <label>Plant Name *</label>
        <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Peace Lily (Spathiphyllum)" />
        <label>Description</label>
        <textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe this plant — its beauty, benefits, and ideal placement..." />
        <label>Short Description (Subtitle)</label>
        <input value={f.short_description || ""} onChange={(e) => set("short_description", e.target.value)} placeholder="e.g. Stunning air-purifying plant" />
        <label>Tags (Comma separated)</label>
        <input
          value={f.tags.join(", ")}
          onChange={(e) => set("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
          placeholder="e.g. indoor, air-purifying, low-maintenance, pet-safe"
        />
        <div className="row" style={{ marginTop: 16 }}>
          <div style={{ position: "relative" }}>
            <label>Brand / Nursery</label>
            <input
              type="text" autoComplete="off"
              value={f.brand} onChange={(e) => set("brand", e.target.value)}
              onFocus={() => setBrandFocus(true)}
              onBlur={() => setTimeout(() => setBrandFocus(false), 200)}
              placeholder="Select or type a brand..."
            />
            {brandFocus && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--border)", zIndex: 10, borderRadius: 10, maxHeight: 200, overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", marginTop: 4 }}>
                {brands.filter((b) => b.name.toLowerCase().includes(f.brand.toLowerCase())).map((b) => (
                  <div key={b.slug} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f0f0f0", fontSize: 14 }} onClick={() => set("brand", b.name)}>
                    {b.name}
                  </div>
                ))}
                {!brands.some((b) => b.name.toLowerCase() === f.brand.trim().toLowerCase()) && f.brand.trim() !== "" && (
                  <div style={{ padding: "10px 14px", cursor: "pointer", color: "var(--primary)", fontWeight: 600, fontSize: 14 }}
                       onClick={async () => {
                         try {
                           setBrandCreating(true);
                           const slug = f.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                           const res = await api.post("/brands", { name: f.brand.trim(), slug });
                           setBrands([...brands, res]);
                           set("brand", res.name);
                         } catch (e: any) { setErr(e.message); } finally { setBrandCreating(false); }
                       }}>
                    {brandCreating ? "Creating..." : `+ Add "${f.brand}" as new brand`}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label>Category</label>
            <select value={f.category_id} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">— none —</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Plant Specifications */}
      <div className="card">
        <h3 style={{ marginTop: 0, color: "var(--primary-dark)" }}>🌱 Plant Specifications</h3>
        <div className="row">
          <div>
            <label>Plant Type</label>
            <select value={sp.plant_type} onChange={(e) => setSpec("plant_type", e.target.value)}>
              <option value="">— select —</option>
              <option value="Indoor">Indoor</option>
              <option value="Outdoor">Outdoor</option>
              <option value="Indoor/Outdoor">Indoor/Outdoor</option>
              <option value="Semi-shade">Semi-shade</option>
            </select>
          </div>
          <div>
            <label>Sunlight Requirement</label>
            <select value={sp.sunlight} onChange={(e) => setSpec("sunlight", e.target.value)}>
              <option value="">— select —</option>
              <option value="Full Sun">Full Sun (6+ hrs)</option>
              <option value="Partial Sun">Partial Sun (4-6 hrs)</option>
              <option value="Bright Indirect">Bright Indirect Light</option>
              <option value="Partial Shade">Partial Shade</option>
              <option value="Low Light">Low Light</option>
            </select>
          </div>
          <div>
            <label>Watering Frequency</label>
            <select value={sp.watering} onChange={(e) => setSpec("watering", e.target.value)}>
              <option value="">— select —</option>
              <option value="Daily">Daily</option>
              <option value="Alternate Days">Alternate Days</option>
              <option value="Twice a Week">Twice a Week</option>
              <option value="Weekly">Weekly</option>
              <option value="When Soil Dries">When Soil Dries</option>
              <option value="Minimal">Minimal (Succulent/Cactus)</option>
            </select>
          </div>
        </div>
        <div className="row">
          <div>
            <label>Difficulty Level</label>
            <select value={sp.difficulty_level} onChange={(e) => setSpec("difficulty_level", e.target.value)}>
              <option value="">— select —</option>
              <option value="Easy">🟢 Easy (Beginner)</option>
              <option value="Medium">🟡 Medium (Intermediate)</option>
              <option value="Hard">🔴 Hard (Expert)</option>
            </select>
          </div>
          <div>
            <label>Season</label>
            <select value={sp.season} onChange={(e) => setSpec("season", e.target.value)}>
              <option value="">— select —</option>
              <option value="All Season">All Season</option>
              <option value="Summer">Summer</option>
              <option value="Winter">Winter</option>
              <option value="Monsoon">Monsoon</option>
              <option value="Spring">Spring</option>
            </select>
          </div>
          <div>
            <label>Growth Rate</label>
            <select value={sp.growth_rate} onChange={(e) => setSpec("growth_rate", e.target.value)}>
              <option value="">— select —</option>
              <option value="Slow">Slow</option>
              <option value="Medium">Medium</option>
              <option value="Fast">Fast</option>
            </select>
          </div>
        </div>
        <div className="row">
          <div>
            <label>Soil Type</label>
            <select value={sp.soil_type} onChange={(e) => setSpec("soil_type", e.target.value)}>
              <option value="">— select —</option>
              <option value="Well-drained">Well-drained</option>
              <option value="Loamy">Loamy</option>
              <option value="Sandy">Sandy</option>
              <option value="Clay">Clay</option>
              <option value="Peat-based">Peat-based</option>
              <option value="Cactus Mix">Cactus Mix</option>
              <option value="Any">Any</option>
            </select>
          </div>
          <div>
            <label>Humidity</label>
            <select value={sp.humidity} onChange={(e) => setSpec("humidity", e.target.value)}>
              <option value="">— select —</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label>Temperature Range</label>
            <input value={sp.temperature_range} onChange={(e) => setSpec("temperature_range", e.target.value)} placeholder="e.g. 18-30°C" />
          </div>
        </div>
        <div className="row">
          <div><label>Scientific Name</label><input value={sp.scientific_name} onChange={(e) => setSpec("scientific_name", e.target.value)} placeholder="e.g. Spathiphyllum wallisii" /></div>
          <div><label>Origin</label><input value={sp.origin} onChange={(e) => setSpec("origin", e.target.value)} placeholder="e.g. Tropical Americas" /></div>
          <div><label>Max Height</label><input value={sp.max_height} onChange={(e) => setSpec("max_height", e.target.value)} placeholder="e.g. Up to 3 feet" /></div>
        </div>
        <div className="row">
          <div><label>Height Range (at purchase)</label><input value={sp.height_range} onChange={(e) => setSpec("height_range", e.target.value)} placeholder="e.g. 6-12 inches" /></div>
          <div><label>Spread</label><input value={sp.spread} onChange={(e) => setSpec("spread", e.target.value)} placeholder="e.g. 6-12 inches" /></div>
        </div>

        {/* Plant tags / badges */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 18, padding: "14px 0", borderTop: "1px solid var(--border)" }}>
          {([
            ["pet_safe", "🐾 Pet Safe"],
            ["air_purifying", "💨 Air Purifying"],
            ["medicinal", "💊 Medicinal"],
            ["flowering", "🌸 Flowering"],
            ["fragrant", "🌺 Fragrant"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex" style={{ cursor: "pointer", background: sp[key] ? "var(--primary-50)" : "#f8fafc", border: `1.5px solid ${sp[key] ? "var(--primary)" : "var(--border)"}`, padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, transition: "all 0.2s ease" }}>
              <input type="checkbox" style={{ width: "auto" }} checked={!!sp[key]} onChange={(e) => setSpec(key, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>
        {sp.flowering && (
          <div style={{ marginTop: 8 }}>
            <label>Flower Color</label>
            <input value={sp.flower_color || ""} onChange={(e) => setSpec("flower_color", e.target.value)} placeholder="e.g. White, Pink, Red" />
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="card">
        <h3 style={{ marginTop: 0, color: "var(--primary-dark)" }}>💰 Pricing</h3>
        <div className="row">
          <div><label>MRP (struck through)</label><input type="number" value={f.mrp} onChange={(e) => set("mrp", e.target.value)} /></div>
          <div><label>Selling Price *</label><input type="number" value={f.price} onChange={(e) => set("price", e.target.value)} /></div>
        </div>
        <div className="row">
          <div><label>Extra discount %</label><input type="number" value={f.discount_pct} onChange={(e) => set("discount_pct", e.target.value)} /></div>
          <div>
            <label>Discount applies on</label>
            <select value={f.discount_on} onChange={(e) => set("discount_on", e.target.value)}>
              <option value="price">Selling price</option>
              <option value="mrp">MRP</option>
            </select>
          </div>
        </div>
        <label style={{ marginTop: 8 }}>GST (same-state = CGST + SGST · other state = IGST)</label>
        <div className="row">
          <div><label>CGST %</label><input type="number" value={f.cgst} onChange={(e) => set("cgst", e.target.value)} placeholder="e.g. 2.5" /></div>
          <div><label>SGST %</label><input type="number" value={f.sgst} onChange={(e) => set("sgst", e.target.value)} placeholder="e.g. 2.5" /></div>
          <div><label>IGST %</label><input type="number" value={f.igst} onChange={(e) => set("igst", e.target.value)} placeholder="e.g. 5" /></div>
        </div>
        <p className="muted" style={{ marginTop: 14 }}>
          Customer sees: <span style={{ textDecoration: "line-through" }}>₹{f.mrp}</span>{" "}
          <b style={{ color: "var(--primary)", fontSize: 16 }}>₹{final}</b>{" "}
          {off > 0 && <span style={{ color: "var(--green)" }}>({off}% off)</span>}
        </p>
      </div>

      {/* Gallery */}
      <div className="card">
        <h3 style={{ marginTop: 0, color: "var(--primary-dark)" }}>📸 Gallery Images</h3>
        <div className="imgs">
          {f.images.map((u, i) => (
            <div className="imgbox" key={u + i}>
              <img src={u} />
              <button className="x" onClick={() => set("images", f.images.filter((_, idx) => idx !== i))}>×</button>
            </div>
          ))}
          <button className="addimg" onClick={() => genFile.current?.click()} disabled={uploading}>{uploading ? "…" : "+"}</button>
          <input ref={genFile} type="file" accept="image/*" multiple hidden
            onChange={(e) => uploadTo(e.target.files, (urls) => set("images", [...f.images, ...urls]))} />
        </div>
      </div>

      {/* Size Variants */}
      <div className="card">
        <div className="between">
          <h3 style={{ marginTop: 0, color: "var(--primary-dark)" }}>📏 Size & Pot Variants</h3>
          <button type="button" className="btn sm" onClick={addSize}>+ Add Size</button>
        </div>
        <p className="muted" style={{ marginTop: -4 }}>
          Add size/pot combinations. Each variant can have its own price, stock, and images.
          Leave Price/MRP blank to use the base price above.
        </p>

        {f.sizes.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table>
              <thead><tr>
                <th>Size</th><th>Pot Size</th><th>Pot Type</th><th>Height</th>
                <th>Price ₹</th><th>MRP ₹</th><th>Stock</th><th>Images</th><th></th>
              </tr></thead>
              <tbody>
                {f.sizes.map((s: any, si: number) => (
                  <tr key={si}>
                    <td>
                      <select style={{ minWidth: 90 }} value={s.name} onChange={(e) => updSize(si, "name", e.target.value)}>
                        <option value="">—</option>
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                        <option value="XL">XL</option>
                      </select>
                    </td>
                    <td><input style={{ minWidth: 80 }} value={s.pot_size} onChange={(e) => updSize(si, "pot_size", e.target.value)} placeholder="4 inch" /></td>
                    <td>
                      <select style={{ minWidth: 110 }} value={s.pot_type} onChange={(e) => updSize(si, "pot_type", e.target.value)}>
                        <option value="">—</option>
                        <option value="Nursery Pot">Nursery Pot</option>
                        <option value="Ceramic Pot">Ceramic Pot</option>
                        <option value="Terracotta">Terracotta</option>
                        <option value="GraPot">GraPot</option>
                        <option value="Hanging Pot">Hanging Pot</option>
                        <option value="Self-watering">Self-watering</option>
                      </select>
                    </td>
                    <td><input style={{ minWidth: 80 }} value={s.height} onChange={(e) => updSize(si, "height", e.target.value)} placeholder="6-8 in" /></td>
                    <td><input style={{ width: 75 }} type="number" value={s.price} onChange={(e) => updSize(si, "price", e.target.value)} placeholder="base" /></td>
                    <td><input style={{ width: 75 }} type="number" value={s.mrp} onChange={(e) => updSize(si, "mrp", e.target.value)} placeholder="base" /></td>
                    <td><input style={{ width: 64 }} type="number" value={s.stock} onChange={(e) => updSize(si, "stock", e.target.value)} /></td>
                    <td>
                      <div className="flex" style={{ gap: 4, flexWrap: "wrap" }}>
                        {(s.images || []).map((u: string, ii: number) => (
                          <div key={u + ii} style={{ position: "relative" }}>
                            <img src={u} style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 6 }} />
                            <button type="button" onClick={() => updSize(si, "images", s.images.filter((_: string, idx: number) => idx !== ii))}
                              style={{ position: "absolute", top: -5, right: -5, background: "var(--red)", color: "#fff", border: "none", borderRadius: "50%", width: 16, height: 16, cursor: "pointer", fontSize: 10 }}>×</button>
                          </div>
                        ))}
                        <label className="btn ghost sm" style={{ cursor: "pointer" }}>
                          +
                          <input type="file" accept="image/*" multiple hidden
                            onChange={(e) => uploadTo(e.target.files, (urls) => updSize(si, "images", [...(s.images || []), ...urls]))} />
                        </label>
                      </div>
                    </td>
                    <td><button type="button" className="btn danger sm" onClick={() => rmSize(si)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Care & Includes */}
      <div className="card">
        <h3 style={{ marginTop: 0, color: "var(--primary-dark)" }}>🌿 Care & What's Included</h3>
        <label>Care Instructions</label>
        <textarea rows={3} value={f.care_instructions} onChange={(e) => set("care_instructions", e.target.value)} placeholder="Detailed care paragraph for this plant..." />

        <div className="between" style={{ marginTop: 14 }}>
          <label style={{ margin: 0 }}>Quick Care Tips</label>
          <button className="btn ghost sm" onClick={addTip}>+ Add Tip</button>
        </div>
        {f.care_tips.map((tip, i) => (
          <div className="flex" key={i} style={{ marginTop: 6 }}>
            <input value={tip} onChange={(e) => updTip(i, e.target.value)} placeholder="e.g. Water when topsoil feels dry" style={{ flex: 1 }} />
            <button className="btn danger sm" onClick={() => rmTip(i)}>✕</button>
          </div>
        ))}

        <label style={{ marginTop: 16 }}>What's Included</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
          {defaultIncludes.map((item) => (
            <button key={item} type="button"
              style={{
                padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${f.includes.includes(item) ? "var(--primary)" : "var(--border)"}`,
                background: f.includes.includes(item) ? "var(--primary-50)" : "#fff",
                color: f.includes.includes(item) ? "var(--primary-dark)" : "var(--muted)",
                fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s ease",
              }}
              onClick={() => toggleInclude(item)}>
              {f.includes.includes(item) ? "✓" : "+"} {item}
            </button>
          ))}
        </div>

        <label>Plant Guarantee</label>
        <input value={f.warranty || ""} onChange={(e) => set("warranty", e.target.value)} placeholder="e.g. 30-day plant guarantee" />
      </div>

      {/* Inventory */}
      <div className="card">
        <h3 style={{ marginTop: 0, color: "var(--primary-dark)" }}>📦 Inventory & Details</h3>
        <div className="row">
          <div><label>Base Stock (no variants)</label><input type="number" value={f.stock} onChange={(e) => set("stock", e.target.value)} /></div>
          <div><label>Low-stock alert at</label><input type="number" value={f.low_stock_threshold} onChange={(e) => set("low_stock_threshold", e.target.value)} /></div>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <div><label>SKU</label><input value={f.sku || ""} onChange={(e) => set("sku", e.target.value)} placeholder="e.g. PLT-PL-001" /></div>
          <div><label>Shipping Weight (grams)</label><input type="number" value={f.shipping_weight || ""} onChange={(e) => set("shipping_weight", e.target.value)} placeholder="Weight including pot & soil" /></div>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 20, padding: "16px 0", borderTop: "1px solid var(--border)" }}>
          {([
            ["is_active", "👁️ Visible in Store"],
            ["is_featured", "⭐ Featured"],
            ["is_bestseller", "🔥 Bestseller"],
            ["is_new_arrival", "🆕 New Arrival"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex" style={{
              cursor: "pointer",
              background: (f as any)[key] ? "var(--primary-50)" : "#f8fafc",
              border: `1.5px solid ${(f as any)[key] ? "var(--primary)" : "var(--border)"}`,
              padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              transition: "all 0.2s ease",
            }}>
              <input type="checkbox" style={{ width: "auto" }} checked={(f as any)[key]} onChange={(e) => set(key, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {err && <div className="err">{err}</div>}
      <div className="flex" style={{ marginTop: 12, marginBottom: 40 }}>
        <button className="btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "🌿 Save Plant"}</button>
        <button className="btn ghost" onClick={() => nav("/products")}>Cancel</button>
      </div>
    </>
  );
}
