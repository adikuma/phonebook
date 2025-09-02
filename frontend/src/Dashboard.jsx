import React, { useEffect, useState } from 'react';
import { ExternalLink, Globe } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
const TOKEN = import.meta.env.VITE_TOKEN || '';

const getDomain = (url) => {
  try {
    const u = new URL(url);
    return (u.hostname || '').replace(/^www\./, '');
  } catch {
    return (url || '').replace(/^https?:\/\//, '').split('/')[0];
  }
};

const formatDate = (s) => {
  if (!s) return '';
  try {
    const d = new Date(s);
    if (isNaN(+d)) return s;
    return d.toLocaleDateString();
  } catch {
    return s;
  }
};

const clip = (t = '', n = 140) => {
  const clean = (t || '').trim();
  if (clean.length <= n) return clean;
  return clean.slice(0, n - 10).trimEnd() + '…';
};

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10">
      <div className="h-6 w-6 rounded-full border-2 border-neutral-700 border-t-white animate-spin" />
      <div className="text-xs text-neutral-400">Getting you the latest news…</div>
    </div>
  );
}

function SiteBadge({ url }) {
  const domain = getDomain(url);
  const src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  const [err, setErr] = useState(false);
  return (
    <span className="inline-flex items-center gap-2 text-neutral-400">
      {err ? (
        <Globe size={14} />
      ) : (
        <img src={src} alt={domain} className="h-4 w-4" onError={() => setErr(true)} />
      )}
      <span className="text-[11px] clamp-1">{domain || 'source'}</span>
    </span>
  );
}

function Card({ article }) {
  const domain = getDomain(article.url);
  const long = (article.summary || '').trim().length > 140;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noreferrer"
      className="group block border border-neutral-900 hover:border-neutral-800 bg-black hover:bg-[#0b0b0b] transition-colors h-64 p-3 overflow-hidden"
      title={domain}
    >
      <div className="flex items-center justify-between">
        <SiteBadge url={article.url} />
        <span className="text-[11px] text-neutral-500">{formatDate(article.published_at)}</span>
      </div>

      <div className="mt-2 text-sm underline inline-flex items-center gap-1 text-white group-hover:underline clamp-2">
        {article.title}
        <ExternalLink size={14} />
      </div>

      {article.summary && (
        <p className="mt-2 text-sm text-neutral-300 clamp-3">
          {clip(article.summary, 140)}
        </p>
      )}

      {long && (
        <span className="mt-1 inline-block text-xs text-neutral-400 underline">
          Read more
        </span>
      )}

      {Array.isArray(article.key_points) && article.key_points.length > 0 && (
        <ul className="mt-3 text-neutral-200 text-sm list-disc pl-4 space-y-1">
          {article.key_points.slice(0, 2).map((k, i) => (
            <li key={i} className="clamp-1">{k}</li>
          ))}
        </ul>
      )}
    </a>
  );
}

function Section({ title, digest }) {
  const articles = Array.isArray(digest?.articles) ? digest.articles.slice(0, 9) : [];
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {articles.map((a, i) => (
          <Card key={i} article={a} />
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [ai, setAi] = useState(null);
  const [solar, setSolar] = useState(null);

  useEffect(() => {
    const cache = sessionStorage.getItem('news_cache_v1');
    if (cache) {
      try {
        const parsed = JSON.parse(cache);
        setAi(parsed.ai);
        setSolar(parsed.solar);
        setLoading(false);
        return;
      } catch {}
    }
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/news/dashboard`, {
          headers: { 'x-api-key': TOKEN },
        });
        if (!res.ok) throw new Error('API error');
        const d = await res.json();
        sessionStorage.setItem(
          'news_cache_v1',
          JSON.stringify({ ai: d.ai_agents, solar: d.solar_sg })
        );
        setAi(d.ai_agents);
        setSolar(d.solar_sg);
      } catch {
        setAi({ overall_summary: 'Failed to load', articles: [] });
        setSolar({ overall_summary: 'Failed to load', articles: [] });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">News</h1>
        </div>
        {loading ? (
          <Spinner />
        ) : (
          <div className="space-y-6">
            <Section title="Solar in Singapore — Latest" digest={solar} />
            <Section title="AI Agents — Latest" digest={ai} />
          </div>
        )}
      </div>
    </div>
  );
}