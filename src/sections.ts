// The single source of truth for the left-nav sections. Used by the sidebar,
// the route guards, and the per-admin access checkboxes so they never drift.
export type Section = { key: string; label: string; path: string; end?: boolean; icon: string };

export const SECTIONS: Section[] = [
  { key: "dashboard",     label: "Dashboard",           path: "/",              end: true,  icon: "📊" },
  { key: "analytics",     label: "Analytics & Reports",  path: "/analytics",                icon: "📈" },
  { key: "products",      label: "Plant Inventory",      path: "/products",                 icon: "🌿" },
  { key: "categories",    label: "Categories",           path: "/categories",               icon: "📂" },
  { key: "waitlist",      label: "Restock Alerts",       path: "/waitlist",                 icon: "🔔" },
  { key: "combos",        label: "Plant Bundles",        path: "/combos",                   icon: "🎁" },
  { key: "orders",        label: "Customer Orders",      path: "/orders",                   icon: "📦" },
  { key: "users",         label: "Customers",            path: "/users",                    icon: "👥" },
  { key: "reviews",       label: "Plant Reviews",        path: "/reviews",                  icon: "⭐" },
  { key: "coupons",       label: "Discount Codes",       path: "/coupons",                  icon: "🏷️" },
  { key: "home-layout",   label: "Storefront Layout",    path: "/home-layout",              icon: "🎨" },
  { key: "garden-services", label: "Garden Services",      path: "/garden-services",          icon: "🌱" },
  { key: "stores",        label: "Store Locations",      path: "/stores",                   icon: "📍" },
  { key: "blog",          label: "Plant Care Blog",      path: "/blog",                     icon: "✍️" },
  { key: "settings",      label: "Store Settings",       path: "/settings",                 icon: "⚙️" },
  { key: "announcements", label: "Marquee Banner",       path: "/announcements",            icon: "📢" },
];

export const ALL_SECTION_KEYS = SECTIONS.map((s) => s.key);
