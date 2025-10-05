// src/components/ThemeSwitcher.tsx
"use client";

const THEMES = [
  { id: "croche", label: "Crochê" },
  { id: "dark",   label: "Escuro" },
  { id: "salvia", label: "Sálvia" },
];

export default function ThemeSwitcher() {
  function setTheme(id: string) {
    document.documentElement.dataset.theme = id;
    try { localStorage.setItem("theme", id); } catch {}
  }

  const current =
    typeof document !== "undefined"
      ? document.documentElement.dataset.theme || "croche"
      : "croche";

  return (
    <div className="flex gap-2 rounded-full border px-2 py-1"
         style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`text-sm px-3 py-1 rounded-full transition btn ${
            current === t.id ? "btn-neutral" : ""
          }`}
          style={
            current === t.id
              ? undefined
              : { background: "transparent", color: "var(--ink)" }
          }
          aria-pressed={current === t.id}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
