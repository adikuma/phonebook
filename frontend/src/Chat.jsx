import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  ArrowUpRight,
  Building2,
  User,
  MoreVertical,
  RotateCcw,
  Clipboard,
  Loader2,
  Newspaper,
} from "lucide-react";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:8000";
const CHAT_STORAGE_KEY = "chat_cache_orange_v4";

const BOTTOM_PAD_PX = 192;
const FADE_PX = 72;

const scrollToBottom = (el) =>
  el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });

const getDomain = (url) => {
  try {
    const u = new URL(url);
    return (u.hostname || "").replace(/^www\./, "");
  } catch {
    return (url || "").replace(/^https?:\/\//, "").split("/")[0];
  }
};

const formatDate = (s) => {
  if (!s) return "";
  try {
    const d = new Date(s);
    return isNaN(+d) ? s : d.toLocaleDateString();
  } catch {
    return s;
  }
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text || "");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text || "";
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
};

const glass =
  "rounded-lg bg-black/35 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,.45)]";

function CompanyProfile({ data }) {
  if (!data) return null;
  return (
    <div className="text-neutral-100">
      <div className="mb-2">
        <h2 className="text-sm font-semibold">{data.name}</h2>
        {data.description && (
          <p className="text-[13px] text-neutral-300 leading-relaxed pb-2">{data.description}</p>
        )}
      </div>
      <ul className="rounded-xl border border-white/10 bg-black/20 divide-y divide-white/10">
        {data.industry && (
          <li className="p-3 sm:p-4 flex items-center justify-between gap-4">
            <span className="text-[11px] text-neutral-400">Industry</span>
            <span className="text-[13px]">{data.industry}</span>
          </li>
        )}
        {data.headquarters && (
          <li className="p-3 sm:p-4 flex items-center justify-between gap-4">
            <span className="text-[11px] text-neutral-400">Headquarters</span>
            <span className="text-[13px]">{data.headquarters}</span>
          </li>
        )}
        {data.founded_year && (
          <li className="p-3 sm:p-4 flex items-center justify-between gap-4">
            <span className="text-[11px] text-neutral-400">Founded</span>
            <span className="text-[13px]">{data.founded_year}</span>
          </li>
        )}
        {data.employee_count && (
          <li className="p-3 sm:p-4 flex items-center justify-between gap-4">
            <span className="text-[11px] text-neutral-400">Employees</span>
            <span className="text-[13px]">{data.employee_count}</span>
          </li>
        )}
        {data.website && (
          <li className="p-3 sm:p-4 flex items-center justify-between gap-4">
            <span className="text-[11px] text-neutral-400">Website</span>
            <a
              href={data.website}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] underline"
              title={data.website}
            >
              {getDomain(data.website)}
            </a>
          </li>
        )}
      </ul>
      {Array.isArray(data.products_services) && data.products_services.length > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
          <div className="text-[11px] text-neutral-400 mb-1.5">Products & Services</div>
          <ul className="space-y-1 text-[13px]">
            {data.products_services.slice(0, 8).map((t, i) => (
              <li key={i} className="flex">
                <span className="mr-2">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {Array.isArray(data.target_markets) && data.target_markets.length > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
          <div className="text-[11px] text-neutral-400 mb-1.5">Target Markets</div>
          <div className="flex flex-wrap gap-1.5">
            {data.target_markets.slice(0, 10).map((t, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-md text-[11px] border border-white/10 bg-black/10"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
      {Array.isArray(data.key_executives) && data.key_executives.length > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
          <div className="text-[11px] text-neutral-400 mb-1.5">Key Executives</div>
          <ul className="space-y-1 text-[13px]">
            {data.key_executives.slice(0, 8).map((e, i) => (
              <li key={i}>
                <span className="font-medium">{e.name}</span>
                {e.title ? <span className="text-neutral-400"> — {e.title}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PersonProfile({ data }) {
  if (!data) return null;
  const prevCompanies = Array.isArray(data.previous_companies)
    ? data.previous_companies.map((p) =>
        typeof p === "string" ? { company: p, role: "" } : { company: p.company, role: p.role || "" }
      )
    : [];
  const companiesWorked = [...new Set(prevCompanies.map((p) => p.company))].slice(0, 12);
  const education = Array.isArray(data.education) ? data.education : [];
  const starters  = Array.isArray(data.conversation_starters) ? data.conversation_starters : [];
  const engage    = Array.isArray(data.engagement_tips) ? data.engagement_tips : [];
  const skills    = Array.isArray(data.skills) ? data.skills.slice(0, 12) : [];
  const topics    = Array.isArray(data.post_topics) ? data.post_topics.slice(0, 12) :
                    Array.isArray(data.discussion_topics) ? data.discussion_topics.slice(0, 12) : [];
  const interests = Array.isArray(data.interests) ? data.interests.slice(0, 12) : [];
  const Fact = ({ label, value }) =>
    value ? (
      <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-1.5 py-2">
        <dt className="text-[11px] text-neutral-400">{label}</dt>
        <dd className="text-[13px] text-neutral-100 leading-[1.8]">{value}</dd>
      </div>
    ) : null;
  const Bullets = ({ items }) =>
    items?.length ? (
      <ul className="list-disc pl-5 space-y-2 text-[13px] leading-[1.8]">
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    ) : null;
  const Line = () => <hr className="my-4 border-transparent" />;
  return (
    <article className="text-neutral-100 leading-[1.9]">
      <header className="space-y-1 mb-3">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-base font-semibold">{data.name}</h1>
          {data.linkedin_url && (
            <a
              href={data.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="text-[12px] underline text-neutral-300 hover:text-white"
            >
              View on LinkedIn
            </a>
          )}
        </div>
        {data.headline && <p className="text-[13px] text-neutral-300">{data.headline}</p>}
      </header>
      <section className="px-3 rounded-xl border border-white/10 overflow-hidden">
        <dl className="bg-black/10 divide-y divide-white/10">
          <Fact label="Company"  value={data.current_company} />
          <Fact label="Role"     value={data.current_role} />
          <Fact label="Location" value={data.location} />
          <Fact label="Duration" value={data.role_duration} />
          <Fact label="Companies Worked" value={companiesWorked.join(" · ")} />
        </dl>
      </section>
      {data.bio && (
        <>
          <Line />
          <section>
            <h3 className="text-[11px] text-neutral-400 mb-1">Summary</h3>
            <p className="text-[13px]">{data.bio}</p>
          </section>
        </>
      )}
      {education.length > 0 && (
        <>
          <Line />
          <section>
            <h3 className="text-[11px] text-neutral-400 mb-1">Education</h3>
            <Bullets items={education.slice(0, 6)} />
          </section>
        </>
      )}
      {(skills.length || topics.length || interests.length) && (
        <>
          <Line />
          <section className="space-y-2 text-[13px]">
            {skills.length > 0 && (
              <p><span className="text-[11px] text-neutral-400 mr-2">Skills</span>{skills.join(" · ")}</p>
            )}
            {interests.length > 0 && (
              <p><span className="text-[11px] text-neutral-400 mr-2">Interests</span>{interests.join(" · ")}</p>
            )}
          </section>
        </>
      )}
      {starters.length > 0 && (
        <>
          <Line />
          <section>
            <h3 className="text-[11px] text-neutral-400 mb-1">Conversation Starters</h3>
            <Bullets items={starters.slice(0, 6)} />
          </section>
        </>
      )}
      {engage.length > 0 && (
        <>
          <Line />
          <section>
            <h3 className="text-[11px] text-neutral-400 mb-1">How to Engage</h3>
            <Bullets items={engage.slice(0, 6)} />
          </section>
        </>
      )}
    </article>
  );
}

function LoaderBubble() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 450);
    return () => clearInterval(id);
  }, []);
  const text = `beep boop ${".".repeat(dots)} `.padEnd(12, "\u00A0");
  return (
    <div className={`${glass} px-3 py-2 text-neutral-300 self-start flex items-center gap-2`}>
      <span className="inline-block h-2 w-2 rounded-md bg-neutral-300 animate-pulse" />
      <span className="text-sm font-mono">{text}</span>
    </div>
  );
}

function NewsDigestView({ digest }) {
  if (!digest) return null;
  const articles = Array.isArray(digest.articles) ? digest.articles : [];
  return (
    <div className="text-neutral-100">
      <div className="mb-2">
        <h2 className="text-sm font-semibold">
          {digest.topic} <span className="text-[11px] text-neutral-400">({digest.mode})</span>
        </h2>
        <p className="text-[11px] text-neutral-400">{formatDate(digest.generated_at)}</p>
      </div>
      <ul className="rounded-xl border border-white/10 bg-black/20 divide-y divide-white/10">
        {articles.slice(0, 8).map((a, i) => {
          const domain = getDomain(a.url);
          return (
            <li key={i} className="p-3 sm:p-4 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="inline-flex items-center gap-2">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                    alt=""
                    className="h-4 w-4"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <span>{domain}</span>
                </span>
                <span>{formatDate(a.published_at)}</span>
              </div>
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="block text-[15px] leading-snug font-semibold hover:underline"
                title={domain}
              >
                {a.title}
              </a>
              {a.summary && (
                <p className="text-[13px] text-neutral-300 leading-relaxed">
                  {a.summary}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function UserBubble({ text }) {
  if (!text) return null;
  return (
    <div className="self-end max-w-[72%]">
      <div className="inline-block rounded-lg px-3.5 py-2.5 bg-white text-black border border-black/5 shadow-sm">
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}

function ModeChip({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1 text-xs rounded-md px-3 py-2.5 transition ${active ? "bg-white text-black border border-white" : "bg-transparent border border-white/15 text-neutral-300 hover:bg-white hover:text-black"}`}
    >
      <Icon size={14} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function sanitizeCompany(d = {}) {
  return {
    name: d.name,
    description: d.description?.slice(0, 600),
    industry: d.industry,
    headquarters: d.headquarters,
    website: d.website,
    employee_count: d.employee_count,
    founded_year: d.founded_year,
    products_services: (d.products_services || []).slice(0, 20),
    target_markets: (d.target_markets || []).slice(0, 20),
    key_executives: (d.key_executives || []).slice(0, 20).map((e) => ({ name: e.name, title: e.title })),
  };
}
function sanitizePerson(d = {}) {
  const prev = (d.previous_companies || []).slice(0, 12).map((p) =>
    typeof p === "string" ? { company: p, role: "" } : { company: p.company, role: p.role }
  );
  return {
    name: d.name,
    headline: d.headline?.slice(0, 300),
    linkedin_url: d.linkedin_url,
    current_company: d.current_company,
    current_role: d.current_role,
    location: d.location,
    role_duration: d.role_duration,
    bio: d.bio?.slice(0, 800),
    previous_companies: prev,
    education: (d.education || []).slice(0, 6),
    skills: (d.skills || []).slice(0, 12),
    post_topics: (d.post_topics || d.discussion_topics || []).slice(0, 12),
    interests: (d.interests || []).slice(0, 12),
    conversation_starters: (d.conversation_starters || []).slice(0, 6),
    engagement_tips: (d.engagement_tips || []).slice(0, 6),
  };
}
function sanitizeNews(d = {}) {
  return {
    topic: d.topic,
    mode: d.mode,
    generated_at: d.generated_at,
    articles: (d.articles || []).slice(0, 8).map((a) => ({
      url: a.url,
      title: a.title,
      summary: a.summary?.slice(0, 600),
      key_points: (a.key_points || []).slice(0, 6),
      published_at: a.published_at,
    })),
    citations: (d.citations || []).slice(0, 10),
  };
}
function sanitizeMessages(messages) {
  return messages
    .filter((m) => m.sender !== "loader")
    .slice(-24)
    .map((m) => {
      const base = {
        id: m.id,
        sender: m.sender,
        text: typeof m.text === "string" ? m.text.slice(0, 4000) : undefined,
        type: m.type,
        prompt: m.prompt,
      };
      if (m.sender === "bot" && m.data) {
        if (m.type === "company") base.data = sanitizeCompany(m.data);
        else if (m.type === "person") base.data = sanitizePerson(m.data);
        else if (m.type === "news") base.data = sanitizeNews(m.data);
      }
      return base;
    });
}
function safePersist(key, payload) {
  try {
    sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {}
}

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("company");
  const [loadingId, setLoadingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef(null);
  const isInitial = messages.length === 0;

  useEffect(() => {
    const cache = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (cache) {
      try {
        const { messages: m = [], input: i = "", mode: mo = "company" } = JSON.parse(cache);
        if (Array.isArray(m)) setMessages(m);
        if (typeof i === "string") setInput(i);
        if (typeof mo === "string") setMode(mo);
      } catch {}
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    safePersist(CHAT_STORAGE_KEY, {
      messages: sanitizeMessages(messages),
      input,
      mode,
    });
  }, [messages, input, mode, hydrated]);

  useLayoutEffect(() => {
    if (!isInitial && scrollRef.current) scrollToBottom(scrollRef.current);
  }, [messages, loadingId, isInitial]);

  const runQuery = async (promptText, forceMode) => {
    const currentMode = forceMode || mode;
    const loaderMsg = { id: crypto.randomUUID(), sender: "loader" };
    setLoadingId(loaderMsg.id);
    setMessages((prev) => [...prev, loaderMsg]);
    try {
      let endpoint = "/company";
      let body = { name: promptText };
      if (currentMode === "person") {
        endpoint = "/person";
        body = { linkedin_url: promptText };
      }
      if (currentMode === "news") {
        endpoint = "/news";
        body = { topic: promptText, mode: "briefing" };
      }
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const botMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        data,
        type: currentMode,
        text: JSON.stringify(data, null, 2),
        prompt: promptText,
      };
      setMessages((prev) => prev.filter((m) => m.id !== loaderMsg.id).concat(botMessage));
      setLoadingId(null);
    } catch (e) {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== loaderMsg.id)
          .concat({
            id: crypto.randomUUID(),
            sender: "bot",
            text: "Error: " + e.message,
            type: "error",
            prompt: promptText,
          })
      );
      setLoadingId(null);
    }
  };

  const handleSend = async () => {
    if (loadingId) return;
    const text = input.trim();
    if (!text) return;
    const userMsg = { id: crypto.randomUUID(), sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    await runQuery(text, mode);
  };

  const handleRegenerate = async (m, idx) => {
    setOpenMenuId(null);
    let promptText = m?.prompt;
    if (!promptText) {
      for (let i = idx - 1; i >= 0; i--) {
        if (messages[i].sender === "user") {
          promptText = messages[i].text;
          break;
        }
      }
    }
    if (!promptText) return;
    const loaderMsg = { id: crypto.randomUUID(), sender: "loader", replacing: m.id };
    setLoadingId(loaderMsg.id);
    setMessages((prev) => {
      const copy = [...prev];
      copy[idx] = loaderMsg;
      return copy;
    });
    try {
      const currentMode = m.type;
      let endpoint = "/company";
      let body = { name: promptText };
      if (currentMode === "person") {
        endpoint = "/person";
        body = { linkedin_url: promptText };
      }
      if (currentMode === "news") {
        endpoint = "/news";
        body = { topic: promptText, mode: "briefing" };
      }
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const botMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        data,
        type: currentMode,
        text: JSON.stringify(data, null, 2),
        prompt: promptText,
      };
      setMessages((prev) => {
        const copy = [...prev];
        const pos = Math.max(0, copy.findIndex((x) => x.id === loaderMsg.id));
        if (pos !== -1) copy[pos] = botMessage;
        return copy;
      });
    } catch (e) {
      setMessages((prev) => {
        const copy = [...prev];
        const pos = copy.findIndex((x) => x.id === loaderMsg.id);
        const errMsg = {
          id: crypto.randomUUID(),
          sender: "bot",
          text: "Error: " + e.message,
          type: "error",
          prompt: promptText,
        };
        if (pos !== -1) copy[pos] = errMsg;
        return copy;
      });
    } finally {
      setLoadingId(null);
    }
  };

  const renderMessage = (m, idx) => {
    const Wrapper = ({ children }) => (
      <div className="relative group pb-12">
        {children}
        <div className="">
          <div className="flex gap-2 mt-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(m.text || "")}
                className="flex items-center border border-white/10 bg-black/20 py-2 px-3 rounded-lg hover:bg-black/10 transition"
                aria-label="Copy"
                title="Copy"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-transparent">
                  <Clipboard size={15} />
                </span>
                <span className="text-[11px] text-neutral-300">Copy</span>
              </button>
              <button
                type="button"
                onClick={() => handleRegenerate(m, idx)}
                className="flex items-center border border-white/10 bg-black/20 px-2 py-2 rounded-lg hover:bg-black/10 transition"
                aria-label="Regenerate"
                title="Regenerate"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-transparent">
                  <RotateCcw size={15} />
                </span>
                <span className="text-[11px] text-neutral-300">Regenerate</span>
              </button>
            </div>
            <button
              aria-label="More"
              onClick={() => setOpenMenuId((id) => (id === m.id ? null : m.id))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5 sm:hidden"
              title="Toggle actions"
            >
              <MoreVertical size={15} />
            </button>
          </div>
        </div>
      </div>
    );
    if (m.sender === "user") return <UserBubble text={m.text} />;
    if (m.sender === "loader") return <LoaderBubble />;
    if (m.data && m.type) {
      if (m.type === "company")
        return (
          <Wrapper>
            <CompanyProfile data={m.data} />
          </Wrapper>
        );
      if (m.type === "person")
        return (
          <Wrapper>
            <PersonProfile data={m.data} />
          </Wrapper>
        );
      if (m.type === "news")
        return (
          <Wrapper>
            <NewsDigestView digest={m.data} />
          </Wrapper>
        );
    }
    return (
      <Wrapper>
        <div className={`${glass} p-3 text-neutral-100 self-start`}>
          <pre className="whitespace-pre-wrap text-sm">{m.text}</pre>
        </div>
      </Wrapper>
    );
  };

  const fadeMask = `linear-gradient(
    to bottom,
    rgba(0,0,0,1) 0%,
    rgba(0,0,0,1) calc(100% - ${BOTTOM_PAD_PX + FADE_PX}px),
    rgba(0,0,0,0) calc(100% - ${BOTTOM_PAD_PX}px),
    rgba(0,0,0,0) 100%
  )`;

  return (
    <div className="flex-1 overflow-hidden text-neutral-100 flex justify-center">
      <div className="w-full max-w-3xl h-full flex flex-col px-4 md:px-6">
        <div
          ref={scrollRef}
          className={isInitial ? "h-0" : "flex-1 overflow-y-auto custom-scrollbar pb-40 relative pt-28"}
          style={{ scrollBehavior: "smooth", maskImage: fadeMask, WebkitMaskImage: fadeMask }}
        >
          {!isInitial && (
            <div className="px-0 py-6 space-y-4">
              {messages.map((m, idx) => (
                <div key={m.id} className="flex flex-col">
                  {renderMessage(m, idx)}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="fixed bottom-0 left-1/2 z-40 -translate-x-1/2 w-[min(calc(100vw-32px),48rem)] px-4 md:px-0">
          <div className={`${glass} overflow-hidden rounded-b-none`}>
            <div className="flex items-start gap-3 p-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    if (loadingId) return;
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={mode === "company" ? "Enter company name..." : mode === "person" ? "Enter LinkedIn URL..." : "Enter news topic..."}
                rows={3}
                className="flex-1 min-h-[68px] max-h-48 bg-transparent text-neutral-100 placeholder-neutral-400 focus:outline-none resize-none text-sm"
              />
            </div>
            <div className="flex items-center justify-between px-3 py-3 ">
              <div className="flex items-center gap-2">
                <ModeChip active={mode === "company"} onClick={() => setMode("company")} icon={Building2} label="Company" />
                <ModeChip active={mode === "person"} onClick={() => setMode("person")} icon={User} label="Person" />
                <ModeChip active={mode === "news"} onClick={() => setMode("news")} icon={Newspaper} label="News" />
              </div>
              <button
                onClick={handleSend}
                disabled={!!loadingId}
                aria-busy={!!loadingId}
                className="p-3 rounded-md bg-white text-black border border-white/20 hover:bg-white/90 active:scale-[0.98] transition disabled:opacity-60"
                title="Send"
              >
                {loadingId ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpRight size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
