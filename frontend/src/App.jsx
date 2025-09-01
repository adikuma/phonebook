import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  ArrowUpRight,
  Building2,
  User,
  Globe,
  ExternalLink,
  Calendar,
  Clock,
  Target,
  Star,
  BarChart2,
  Newspaper,
} from 'lucide-react';

const API_BASE =
  import.meta?.env?.VITE_API_BASE || 'https://phonebook-qsal.onrender.com';

const scrollToBottom = (el) => {
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
};

const getDomain = (url) => {
  try {
    const u = new URL(url);
    return (u.hostname || '').replace(/^www\./, '');
  } catch {
    // fallback
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

function Row({ icon, label, children }) {
  return (
    <div className="flex items-start">
      <span className="mr-2 mt-0.5 text-neutral-300">{icon}</span>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-neutral-400">
          {label}
        </p>
        <p className="text-sm">{children}</p>
      </div>
    </div>
  );
}

function Bullets({ items }) {
  return (
    <ul className="space-y-1">
      {items.map((t, i) => (
        <li key={i} className="flex items-start text-sm">
          <span className="mr-2">•</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function CompanyProfile({ data }) {
  return (
    <div className="font-poppins text-white">
      <div className="border-b border-neutral-800 pb-3 mb-5">
        <h1 className="text-lg font-semibold mb-1">{data.name}</h1>
        {data.description && (
          <p className="text-sm text-neutral-300">{data.description}</p>
        )}
      </div>

      <div className="space-y-6">
        <section className="border-b border-neutral-800 pb-4">
          <h2 className="text-sm font-medium tracking-wide uppercase mb-3 text-neutral-300">
            Company Details
          </h2>
          <div className="space-y-2">
            {data.industry && (
              <Row icon={<BarChart2 size={16} />} label="Industry">
                {data.industry}
              </Row>
            )}
            {data.headquarters && (
              <Row icon={<Globe size={16} />} label="Headquarters">
                {data.headquarters}
              </Row>
            )}
            {data.website && (
              <Row icon={<Globe size={16} />} label="Website">
                <a
                  href={data.website}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {data.website}
                </a>
              </Row>
            )}
            {data.employee_count && (
              <Row icon={<User size={16} />} label="Employees">
                {data.employee_count}
              </Row>
            )}
            {data.founded_year && (
              <Row icon={<Calendar size={16} />} label="Founded">
                {data.founded_year}
              </Row>
            )}
          </div>
        </section>

        {Array.isArray(data.products_services) &&
          data.products_services.length > 0 && (
            <section className="border-b border-neutral-800 pb-4">
              <h2 className="text-sm font-medium tracking-wide uppercase mb-3 text-neutral-300">
                Products & Services
              </h2>
              <Bullets items={data.products_services} />
            </section>
          )}

        {Array.isArray(data.target_markets) &&
          data.target_markets.length > 0 && (
            <section className="border-b border-neutral-800 pb-4">
              <h2 className="text-sm font-medium tracking-wide uppercase mb-3 text-neutral-300">
                Target Markets
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.target_markets.map((t, i) => (
                  <span
                    key={i}
                    className="border border-neutral-700 px-2 py-1 text-xs text-neutral-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

        {Array.isArray(data.key_executives) &&
          data.key_executives.length > 0 && (
            <section className="border-b border-neutral-800 pb-4">
              <h2 className="text-sm font-medium tracking-wide uppercase mb-3 text-neutral-300">
                Key Executives
              </h2>
              <div className="space-y-2">
                {data.key_executives.map((e, i) => (
                  <div key={i} className="flex items-start text-sm">
                    <User size={16} className="mr-2 mt-0.5" />
                    <div>
                      <p>{e.name}</p>
                      {e.title && (
                        <p className="text-neutral-400 text-xs">{e.title}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
      </div>
    </div>
  );
}

function PersonProfile({ data }) {
  return (
    <div className="font-poppins text-white">
      <div className="border-b border-neutral-800 pb-3 mb-5">
        <h1 className="text-lg font-semibold mb-1">{data.name}</h1>
        {data.headline && (
          <p className="text-sm text-neutral-300">{data.headline}</p>
        )}
      </div>

      <div className="space-y-6">
        <section className="border-b border-neutral-800 pb-4">
          <h2 className="text-sm font-medium tracking-wide uppercase mb-3 text-neutral-300">
            Current Position
          </h2>
          <div className="space-y-2">
            {data.current_company && (
              <Row icon={<Building2 size={16} />} label="Company">
                {data.current_company}
              </Row>
            )}
            {data.current_role && (
              <Row icon={<Award size={16} />} label="Role">
                {data.current_role}
              </Row>
            )}
            {data.location && (
              <Row icon={<Globe size={16} />} label="Location">
                {data.location}
              </Row>
            )}
            {data.role_duration && (
              <Row icon={<Clock size={16} />} label="Duration">
                {data.role_duration}
              </Row>
            )}
          </div>
        </section>

        {Array.isArray(data.responsibilities) &&
          data.responsibilities.length > 0 && (
            <section className="border-b border-neutral-800 pb-4">
              <h2 className="text-sm font-medium tracking-wide uppercase mb-3 text-neutral-300">
                Responsibilities
              </h2>
              <Bullets items={data.responsibilities} />
            </section>
          )}
      </div>
    </div>
  );
}

function LoaderBubble() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d % 3) + 1);
    }, 500);
    return () => clearInterval(id);
  }, []);
  const text = `beep${'.'.repeat(dots)} `.padEnd(8, '\u00A0');
  return (
    <div className="p-3 bg-black border border-neutral-800 text-neutral-300 self-start flex items-center gap-2">
      <span className="inline-block h-2 w-2 bg-neutral-400 animate-pulse" />
      <span className="text-sm font-mono">{text}</span>
    </div>
  );
}

function SiteBadge({ url }) {
  const domain = getDomain(url);
  const src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  const [err, setErr] = useState(false);

  return (
    <span className="inline-flex items-center gap-2">
      {err ? (
        <Globe size={14} className="text-neutral-400" />
      ) : (
        <img
          src={src}
          alt={domain}
          className="h-4 w-4"
          onError={() => setErr(true)}
        />
      )}
      <span className="text-xs text-neutral-400">{domain || 'source'}</span>
    </span>
  );
}

function NewsDigestView({ digest }) {
  if (!digest) return null;

  const articles = Array.isArray(digest.articles) ? digest.articles : [];

  return (
    <div className="text-white">
      <div className="border-b border-neutral-800 pb-3 mb-4">
        <h2 className="text-base font-semibold">
          {digest.topic}{' '}
          <span className="text-xs text-neutral-400">({digest.mode})</span>
        </h2>
        <p className="text-xs text-neutral-500">
          Generated {formatDate(digest.generated_at)}
        </p>
      </div>

      {digest.overall_summary && (
        <p className="text-sm mb-4 text-neutral-200">
          {digest.overall_summary}
        </p>
      )}

      {Array.isArray(digest.top_takeaways) &&
        digest.top_takeaways.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs uppercase tracking-wide text-neutral-400 mb-2">
              Top Takeaways
            </h3>
            <div className="flex flex-wrap gap-2">
              {digest.top_takeaways.map((t, i) => (
                <span
                  key={i}
                  className="border border-neutral-700 px-2 py-1 text-xs text-neutral-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

      {/* cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {articles.slice(0, 8).map((a, i) => {
          const domain = getDomain(a.url);
          return (
            <div
              key={i}
              className="border border-neutral-800 p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <SiteBadge url={a.url} />
                <span className="text-[11px] text-neutral-500">
                  {formatDate(a.published_at)}
                </span>
              </div>

              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline inline-flex items-center gap-1"
                title={domain}
              >
                {a.title}
                <ExternalLink size={14} />
              </a>

              {a.summary && (
                <p className="text-sm text-neutral-200">{a.summary}</p>
              )}

              {Array.isArray(a.key_points) && a.key_points.length > 0 && (
                <div className="text-neutral-100">
                  <Bullets items={a.key_points.slice(0, 5)} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* citations (small) */}
      {Array.isArray(digest.citations) && digest.citations.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
            Citations
          </h3>
          <div className="flex flex-wrap gap-2">
            {digest.citations.slice(0, 8).map((c, i) => (
              <a
                key={i}
                href={c}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] underline text-neutral-400"
              >
                {getDomain(c)}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('company'); // company | person | news
  const [loadingId, setLoadingId] = useState(null);

  const scrollRef = useRef(null);
  const isInitial = messages.length === 0;

  useLayoutEffect(() => {
    if (!isInitial && scrollRef.current) {
      scrollToBottom(scrollRef.current);
    }
  }, [messages, loadingId, isInitial]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg = { id: crypto.randomUUID(), sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const loaderMsg = { id: crypto.randomUUID(), sender: 'loader' };
    setLoadingId(loaderMsg.id);
    setMessages((prev) => [...prev, loaderMsg]);

    try {
      let endpoint = '/company';
      let body = { name: text };

      if (mode === 'person') {
        endpoint = '/person';
        body = { linkedin_url: text };
      }
      if (mode === 'news') {
        endpoint = '/news';
        body = { topic: text, mode: 'briefing' };
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      const botMessage = {
        id: crypto.randomUUID(),
        sender: 'bot',
        data,
        type: mode,
        text: JSON.stringify(data, null, 2),
      };
      setMessages((prev) =>
        prev.filter((m) => m.id !== loaderMsg.id).concat(botMessage),
      );
      setLoadingId(null);
    } catch (e) {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== loaderMsg.id)
          .concat({
            id: crypto.randomUUID(),
            sender: 'bot',
            text: 'Error: ' + e.message,
          }),
      );
      setLoadingId(null);
    }
  };

  const renderMessage = (m) => {
    if (m.sender === 'user') {
      return (
        <div className="p-3 bg-white border border-neutral-800 text-black self-end">
          <p className="text-sm whitespace-pre-wrap">{m.text}</p>
        </div>
      );
    }
    if (m.sender === 'loader') return <LoaderBubble />;

    if (m.data && m.type) {
      if (m.type === 'company') {
        return (
          <div className="p-4 bg-black border border-neutral-800 text-white self-start w-full">
            <CompanyProfile data={m.data} />
          </div>
        );
      }
      if (m.type === 'person') {
        return (
          <div className="p-4 bg-black border border-neutral-800 text-white self-start w-full">
            <PersonProfile data={m.data} />
          </div>
        );
      }
      if (m.type === 'news') {
        return (
          <div className="p-4 bg-black border border-neutral-800 text-white self-start w-full">
            <NewsDigestView digest={m.data} />
          </div>
        );
      }
    }
    return (
      <div className="p-3 bg-black border border-neutral-800 text-white self-start">
        <pre className="whitespace-pre-wrap text-sm">{m.text}</pre>
      </div>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-black text-white font-poppins flex justify-center">
      <div className="w-full max-w-2xl h-full flex flex-col px-4">
        {/* thread (scrolls) */}
        <div
          ref={scrollRef}
          className={
            isInitial
              ? 'h-0'
              : 'flex-1 overflow-y-auto custom-scrollbar fade-bottom-mask'
          }
          style={{ scrollBehavior: 'smooth' }}
        >
          {!isInitial && (
            <div className="px-0 py-6 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className="flex flex-col">
                  {renderMessage(m)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* composer */}
        <div
          className={`${
            isInitial ? 'my-auto' : 'sticky bottom-0'
          } left-0 right-0 bg-black pt-2 pb-6 transition-all duration-300`}
        >
          <div className="w-full">
            <div className="bg-black border border-neutral-800">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  mode === 'company'
                    ? 'Enter company name...'
                    : mode === 'person'
                    ? 'Enter LinkedIn URL...'
                    : 'Enter news topic...'
                }
                rows={3}
                className="w-full resize-none px-4 py-3 bg-black text-white placeholder-neutral-500 focus:outline-none"
              />
              <div className="flex items-center px-2 py-2 border-t border-neutral-800">
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('company')}
                    className={`flex items-center px-3 py-2 text-xs ${
                      mode === 'company'
                        ? 'bg-white text-black border border-white'
                        : 'border border-neutral-700 text-neutral-300 hover:border-neutral-500'
                    }`}
                    title="Company"
                  >
                    <Building2 size={14} className="mr-1" />
                    Company
                  </button>
                  <button
                    onClick={() => setMode('person')}
                    className={`flex items-center px-3 py-1 text-xs ${
                      mode === 'person'
                        ? 'bg-white text-black border border-white'
                        : 'border border-neutral-700 text-neutral-300 hover:border-neutral-500'
                    }`}
                    title="Person"
                  >
                    <User size={14} className="mr-1" />
                    Person
                  </button>
                  <button
                    onClick={() => setMode('news')}
                    className={`flex items-center px-3 py-1 text-xs ${
                      mode === 'news'
                        ? 'bg-white text-black border border-white'
                        : 'border border-neutral-700 text-neutral-300 hover:border-neutral-500'
                    }`}
                    title="News"
                  >
                    <Newspaper size={14} className="mr-1" />
                    News
                  </button>
                </div>

                <div className="ml-auto flex items-center">
                  <span
                    aria-hidden
                    className="inline-block h-4 w-4 rounded-full mr-2"
                    style={{ backgroundColor: '#F5B301' }}
                  />
                  <span className="text-xs text-neutral-300 mr-2">
                    Phonebook
                  </span>
                  <button
                    onClick={handleSend}
                    className="p-2 border border-neutral-700 hover:border-neutral-500"
                    title="Send"
                  >
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-neutral-500 mt-2 px-1 text-center sm:text-left">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;