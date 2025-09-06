import React, { useEffect, useState } from "react";
import { ExternalLink, ChevronDown } from "lucide-react";

const RAW_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const API_BASE = RAW_BASE.includes("0.0.0.0") ? RAW_BASE.replace("0.0.0.0", "localhost") : RAW_BASE;
const TOKEN = import.meta.env.VITE_TOKEN || "";
const DASH_CACHE_KEY = "dashboard_cache_v4_news";

const domainOf = (url = "") => {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return (url || "").replace(/^https?:\/\//, "").split("/")[0]; }
};
const fmtDate = (s) => { if (!s) return ""; const d = new Date(s); return isNaN(+d) ? s : d.toLocaleDateString(); };
const clip = (t = "", n = 180) => { const c = (t || "").trim(); return c.length <= n ? c : c.slice(0, n - 10).trimEnd() + "…"; };

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10">
      <div className="h-6 w-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      <div className="text-xs text-neutral-300">Loading…</div>
    </div>
  );
}

function Favicon({ url, className = "h-4 w-4" }) {
  const d = domainOf(url);
  const [err, setErr] = useState(false);
  const src = `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
  return err ? (
    <svg viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="10" fill="currentColor" /></svg>
  ) : (
    <img src={src} alt={d} className={className} onError={() => setErr(true)} />
  );
}

function BadgeRow({ url, date }) {
  const d = domainOf(url);
  return (
    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1">
        <Favicon url={url} />
        <span className="font-medium text-neutral-200">{d}</span>
      </span>
      {date ? <span>{fmtDate(date)}</span> : null}
    </div>
  );
}

function Summary({ open, article }) {
  return (
    <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="overflow-hidden">
        <div className="pt-2">
          {article?.summary ? (
            <p className="text-sm text-neutral-200 leading-relaxed">{article.summary}</p>
          ) : (
            <p className="text-sm text-neutral-400">No summary available.</p>
          )}
          {Array.isArray(article?.key_points) && article.key_points.length > 0 ? (
            <ul className="mt-2 list-disc pl-4 text-sm text-neutral-200 space-y-1">
              {article.key_points.slice(0, 5).map((k, i) => (<li key={i}>{k}</li>))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ArticleCard({ a }) {
  const [open, setOpen] = useState(false);
  const openLink = () => window.open(a.url, "_blank", "noopener,noreferrer");
  return (
    <div onClick={openLink} className="group cursor-pointer transition p-4 border-b border-white/10" title={domainOf(a.url)}>
      <BadgeRow url={a.url} date={a.published_at} />
      <h3 className="mt-2 text-[17px] md:text-xl font-semibold text-white leading-snug">{a.title}</h3>
      {a.summary ? <p className="mt-1 text-sm text-neutral-400">{clip(a.summary, 140)}</p> : null}
      <div className="mt-3 flex items-center justify-between">
        <a href={a.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
           className="text-[12px] font-medium underline underline-offset-[3px] text-neutral-200 hover:text-white inline-flex items-center gap-1">
          Continue Reading <ExternalLink size={14} />
        </a>
        <button
          type="button"
          aria-expanded={open}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); }}
          className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-white/10 bg-black/30 hover:bg-black/20 transition"
          title={open ? "Hide summary" : "Show summary"}
        >
          <ChevronDown size={16} className={`transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`} />
        </button>
      </div>
      <Summary open={open} article={a} />
    </div>
  );
}

function Section({ title, digest }) {
  const items = Array.isArray(digest?.articles) ? digest.articles : [];
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <h2 className="text-xs font-semibold tracking-[0.14em] uppercase text-neutral-300">{title}</h2>
        <span className="text-[11px] text-neutral-400">{fmtDate(digest?.generated_at)}</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {items.slice(0, 20).map((a, i) => (<ArticleCard key={i} a={a} />))}
      </div>
    </section>
  );
}

async function fetchNews() {
  const headers = { "Content-Type": "application/json", ...(TOKEN ? { "x-api-key": TOKEN } : {}) };
  const res = await fetch(`${API_BASE}/news`, {
    method: "POST",
    headers,
    body: JSON.stringify({ topic: "solar energy Singapore", mode: "briefing", days: 7 }),
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cache = JSON.parse(sessionStorage.getItem(DASH_CACHE_KEY) || "null");
        if (cache?.news) {
          setNews(cache.news);
          setLoading(false);
        }
      } catch {}
      try {
        const n = await fetchNews();
        const newsVal = n?.solar_sg || n;
        if (!cancelled) {
          setNews(newsVal);
          sessionStorage.setItem(DASH_CACHE_KEY, JSON.stringify({ news: newsVal }));
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pt-28 pb-12 px-4 md:px-6 py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {loading ? <Spinner /> : (
          Array.isArray(news?.articles) && news.articles.length ? (
            <Section title="Latest News" digest={news} />
          ) : (
            <div className="text-neutral-400 text-sm">No articles available.</div>
          )
        )}
      </div>
    </div>
  );
}
