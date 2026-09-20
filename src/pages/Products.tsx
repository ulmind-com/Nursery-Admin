import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Products() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [categories, setCategories] = useState<any[]>([]);

  const load = () => {
    setLoading(true);
    api.get("/products?limit=100&admin=true").then(setItems).catch(() => {}).finally(() => setLoading(false));
  };
  
  const loadCats = () => {
    api.get("/categories").then(setCategories).catch(() => {});
  };

  useEffect(() => { load(); loadCats(); }, []);

  const del = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await api.del(`/products/${id}`);
    setItems((p) => p.filter((x) => x.id !== id));
  };

  const filteredItems = items.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !(p.sku || "").toLowerCase().includes(search.toLowerCase()) && !(p.plant_spec?.scientific_name || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && p.category_id !== catFilter) return false;
    if (statusFilter === "active" && !p.is_active) return false;
    if (statusFilter === "hidden" && p.is_active) return false;
    if (statusFilter === "low_stock" && p.total_stock > (p.low_stock_threshold || 5)) return false;
    if (statusFilter === "bestseller" && !p.is_bestseller) return false;
    return true;
  });

  return (
    <>
      <div className="between">
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <span className="emoji">🌿</span> Plant Inventory
        </h1>
        <Link to="/products/new" className="btn">+ Add Plant</Link>
      </div>
      
      <div className="card" style={{ marginTop: 18, marginBottom: -18, padding: 14, display: "flex", gap: 12, background: "var(--primary-50)", border: "1px solid var(--primary-100)" }}>
        <input 
          placeholder="Search by name, SKU or scientific name..."
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ flex: 1, margin: 0, padding: "9px 14px" }}
        />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ margin: 0, padding: "9px 14px", width: 200 }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ margin: 0, padding: "9px 14px", width: 160 }}>
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="hidden">Hidden Only</option>
          <option value="low_stock">Low Stock</option>
          <option value="bestseller">Bestsellers</option>
        </select>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        {loading ? (
          <p className="muted">Loading plants…</p>
        ) : (
          <table>
            <thead>
              <tr><th></th><th>Plant Info</th><th>Specs</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filteredItems.map((p) => (
                <React.Fragment key={p.id}>
                  <tr>
                    <td><img className="thumb" src={p.images?.[0] || p.sizes?.[0]?.images?.[0] || "https://via.placeholder.com/60"} /></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {p.plant_spec?.scientific_name && <span style={{ fontStyle: "italic" }}>{p.plant_spec.scientific_name} • </span>}
                        {p.brand && <span>{p.brand} • </span>}
                        {p.sku && <span>SKU: {p.sku}</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {p.plant_spec?.plant_type && <span className="pill green" style={{ fontSize: 10, padding: "2px 8px" }}>{p.plant_spec.plant_type}</span>}
                        {p.plant_spec?.sunlight && <span className="pill blue" style={{ fontSize: 10, padding: "2px 8px" }}>☀️ {p.plant_spec.sunlight}</span>}
                        {p.plant_spec?.difficulty_level && <span className="pill yellow" style={{ fontSize: 10, padding: "2px 8px" }}>{p.plant_spec.difficulty_level}</span>}
                        {p.plant_spec?.pet_safe && <span className="pill green" style={{ fontSize: 10, padding: "2px 8px" }}>🐾</span>}
                        {p.plant_spec?.air_purifying && <span className="pill blue" style={{ fontSize: 10, padding: "2px 8px" }}>💨</span>}
                      </div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                        {p.sold_count > 0 ? `🔥 ${p.sold_count} sold` : "0 sold"}
                        {p.review_count > 0 ? ` • ★ ${p.rating?.toFixed(1)} (${p.review_count})` : " • No reviews"}
                      </div>
                    </td>
                    <td>
                      {p.struck_price && <span style={{ textDecoration: "line-through", color: "#a79e95", marginRight: 6 }}>₹{p.struck_price}</span>}
                      <b>₹{p.final_price}</b>
                      {p.off_pct > 0 && <span style={{ color: "var(--green)" }}> ({p.off_pct}% off)</span>}
                      {p.price_varies && <div className="muted" style={{ fontSize: 11 }}>₹{p.price_from} – ₹{p.price_to}</div>}
                    </td>
                    <td>
                      <span className="pill" style={{ background: p.total_stock <= 5 ? "#fef2f2" : "var(--primary-100)", color: p.total_stock <= 5 ? "var(--red)" : "var(--primary-dark)" }}>
                        {p.total_stock}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {p.is_active ? <span className="pill green" style={{ fontSize: 11 }}>Active</span> : <span className="muted">Hidden</span>}
                        {p.is_bestseller && <span className="pill" style={{ fontSize: 10, background: "#fff7ed", color: "#c2410c" }}>🔥</span>}
                        {p.is_new_arrival && <span className="pill blue" style={{ fontSize: 10 }}>🆕</span>}
                      </div>
                    </td>
                    <td className="flex">
                      <Link to={`/products/${p.id}`} className="btn ghost sm">Edit</Link>
                      <button className="btn danger sm" onClick={() => del(p.id, p.title)}>Delete</button>
                    </td>
                  </tr>
                  
                  {p.sizes && p.sizes.length > 0 && p.sizes.map((s: any, i: number) => {
                    const sStock = s.stock || 0;
                    return (
                      <tr key={`${p.id}-size-${i}`} style={{ background: "var(--primary-50)" }}>
                        <td style={{ paddingLeft: 30 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "var(--primary-300)", fontSize: 16 }}>↳</span>
                            {s.images?.[0] ? (
                               <img src={s.images[0]} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                            ) : (
                               <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--primary-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🪴</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, color: "var(--text-light)" }}>
                            <span style={{ fontWeight: 600 }}>{s.name}</span>
                            {s.pot_size && <span> • {s.pot_size}</span>}
                            {s.pot_type && <span> • {s.pot_type}</span>}
                          </div>
                        </td>
                        <td>{s.height && <span className="muted" style={{ fontSize: 12 }}>📏 {s.height}</span>}</td>
                        <td>
                          {s.price ? <b style={{ fontSize: 13, color: "var(--text-light)" }}>₹{s.price}</b> : <span className="muted" style={{ fontSize: 12 }}>Base (₹{p.final_price})</span>}
                        </td>
                        <td>
                          <span className="pill" style={{ fontSize: 11, padding: "2px 8px", background: sStock <= 5 ? "#fef2f2" : "var(--primary-100)", color: sStock <= 5 ? "var(--red)" : "var(--primary-dark)" }}>
                            {sStock}
                          </span>
                        </td>
                        <td></td>
                        <td></td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              {filteredItems.length === 0 && <tr><td colSpan={7} className="muted">No plants found matching filters.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
