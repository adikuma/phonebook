import React, { useEffect, useMemo, useState } from "react";
import Gradient from "./Gradient";
import Chat from "./Chat";
import Dashboard from "./Dashboard";
import Studio from "./Studio";
import { LayoutDashboard, MessageSquare, Image as ImageIcon } from "lucide-react";

const PASS_PHRASE = import.meta.env.VITE_PASS_PHRASE || "PASSWORD";

function Toast({ message, open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [open, onClose]);
  return (
    <div aria-live="assertive" className={`pointer-events-none fixed left-1/2 top-6 z-50 -translate-x-1/2 transition-all duration-300 ${open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
      <div className="pointer-events-auto rounded-lg border border-red-500/60 bg-black/30 px-4 py-2 text-sm text-red-300 shadow-[0_10px_30px_rgba(0,0,0,.45)] backdrop-blur-xl">
        {message}
      </div>
    </div>
  );
}

function Orb({ size = 24 }) {
  const s = { width: `${size}px`, height: `${size}px` };
  return (
    <span style={s} className="relative inline-block">
      <span className="relative z-10 block h-full w-full rounded-full bg-amber-500 blur-sm ring-white/20" />
    </span>
  );
}

function Tabs({ view, setView }) {
  const tabs = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "images", icon: ImageIcon, label: "Studio" },
  ];
  const Btn = ({ id, icon: Icon, label }) => {
    const active = view === id;
    return (
      <button
        type="button"
        onClick={() => setView(id)}
        aria-pressed={active}
        aria-current={active ? "page" : undefined}
        className={`inline-flex items-center gap-1 h-9 px-3 rounded-full text-xs font-medium transition ${active ? "border border-white/5 text-white shadow-[inset_0_-2px_5px_rgba(255,255,255,.20)]" : "text-neutral-600 hover:text-white hover:bg-white/5"}`}
      >
        <Icon size={14} className="text-current" />
        <span>{label}</span>
      </button>
    );
  };
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div className="relative flex items-center gap-2 rounded-full border border-white/5 bg-black/70 backdrop-blur-xl shadow-[0_6px_30px_rgba(0,0,0,.45)] ring-1 ring-white/5">
        <div className="pl-3 pr-2 py-1 flex items-center gap-2">
          <Orb />
          <span className="text-sm font-semibold tracking-tight text-white/90">Phonebook</span>
        </div>
        <div className="h-6 w-px bg-white/10" />
        <div className="flex items-center gap-1 px-2 py-2 rounded-full">
          {tabs.map((t) => (
            <Btn key={t.id} {...t} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.08)" }} />
        <div className="pointer-events-none absolute inset-0 rounded-full opacity-80 bg-[radial-gradient(120%_120%_at_50%_-20%,rgba(255,255,255,.12),rgba(255,255,255,0))]" />
      </div>
    </nav>
  );
}

function Gate({ children }) {
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(typeof window !== "undefined" && window.sessionStorage.getItem("phonebook_authed") === "true");
  const inputRing = useMemo(() => (err ? "focus:ring-red-500/70" : "focus:ring-orange-400/50"), [err]);
  const submit = () => {
    setErr("");
    const pass = value.trim();
    if (!pass) return setErr("Passphrase is required");
    if (pass !== PASS_PHRASE) return setErr("Incorrect passphrase");
    window.sessionStorage.setItem("phonebook_authed", "true");
    setOk(true);
  };
  if (ok) return children;
  return (
    <div className="min-h-screen font-poppins text-neutral-100 relative grid place-items-center px-4">
      <Gradient />
      <Toast message={err} open={!!err} onClose={() => setErr("")} />
      <div>
        <div className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-neutral-300">Password</div>
        <div className="relative group">
          <input
            autoFocus
            type="password"
            className={`input ${inputRing} pr-12`}
            placeholder="Enter the secret passphrase"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          />
          <button
            type="button"
            onClick={submit}
            className="absolute right-1.5 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-neutral-100 hover:bg-white hover:text-black transition"
            aria-label="Submit passphrase"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
        <p className="mt-2 h-5 text-xs text-neutral-400" aria-live="polite">You know what the password is :)</p>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("dashboard");
  return (
    <Gate>
      <div className="relative flex h-screen flex-col overflow-hidden font-poppins text-neutral-100">
        <Gradient />
        <Tabs view={view} setView={setView} />
        <div className="relative flex-1 min-h-0 flex flex-col">
          <section className={view === "dashboard" ? "flex h-full min-h-0 flex-col" : "hidden"}>
            <Dashboard />
          </section>
          <section className={view === "chat" ? "flex h-full min-h-0 flex-col" : "hidden"}>
            <Chat />
          </section>
          <section className={view === "images" ? "flex h-full min-h-0 flex-col" : "hidden"}>
            <Studio />
          </section>
        </div>
      </div>
    </Gate>
  );
}
