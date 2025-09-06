import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, Plus, Copy, Download, Loader2, X } from "lucide-react";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:8000";
const CHAT_STORAGE_KEY = "image_chat_cache_orange_v7";
const MEM = (window.__STUDIO_MEM__ ||= {});

const glass =
  "rounded-lg bg-black/35 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,.45)]";

const BOTTOM_PAD_PX = 192;
const FADE_PX = 72;

const scrollToBottom = (el) =>
  el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });

function extFromDataURL(src) {
  const m = /^data:(image\/[a-z0-9.+-]+);base64,/i.exec(src || "");
  const mime = m?.[1] || "";
  if (mime.includes("jpeg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}
async function copyImage(src) {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    await navigator.clipboard.write([new window.ClipboardItem({ [blob.type]: blob })]);
    return true;
  } catch {
    return false;
  }
}

function UserTextBubble({ text }) {
  if (!text) return null;
  return (
    <div className="self-end max-w-[72%]">
      <div className="inline-block rounded-lg px-3.5 py-2.5 bg-white text-black border border-black/5 shadow-sm">
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
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

const fileToDataURL = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
function sanitizeForStorage(messages) {
  return messages
    .filter((m) => m.sender !== "loader")
    .slice(-50)
    .map((m) => ({
      id: m.id,
      sender: m.sender,
      text: typeof m.text === "string" ? m.text.slice(0, 4000) : undefined,
      hasImage: !!(m.userImage || (Array.isArray(m.images) && m.images.length)),
      model: m.model || undefined,
      error: m.error || undefined,
    }));
}
function safePersist(key, payload) {
  try {
    sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    try {
      sessionStorage.setItem(key, JSON.stringify({ input: payload?.input || "" }));
    } catch {}
  }
}

function ImgBubble({ src }) {
  const download = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `image_${Date.now()}.${extFromDataURL(src)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const copy = async () => {
    await copyImage(src);
  };
  return (
    <div className={`${glass} p-2 self-start`}>
      <img
        src={src}
        alt="result"
        className="rounded-md object-cover w-full max-w-xs bg-black/20"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          onClick={copy}
          className="btn-ghost border border-white/10 px-2 py-1 rounded-md text-xs"
          title="Copy to clipboard"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={download}
          className="btn-ghost border border-white/10 px-2 py-1 rounded-md text-xs"
          title="Download"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );
}

function UserImgBubble({ src }) {
  if (!src) return null;
  return (
    <div className="self-end">
      <img
        src={src}
        alt="you sent"
        className="rounded-md border border-white/15 max-w-xs w-full object-cover bg-white/5"
      />
    </div>
  );
}

function ComposerThumb({ url, onClear }) {
  if (!url) return null;
  return (
    <div className="group relative h-16 w-16 overflow-hidden rounded-lg ring-1 ring-white/10 thumb-pop">
      <img src={url} alt="attachment" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onClear}
        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-black/70 text-white grid place-items-center border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Remove image"
        aria-label="Remove image"
      >
        <X size={10} />
      </button>
      <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/10" />
      <style>{`
        @keyframes popIn { 0% { transform: scale(.85); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
        .thumb-pop { animation: popIn .18s ease-out both; }
      `}</style>
    </div>
  );
}

export default function Studio() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const isInitial = messages.length === 0;

  useEffect(() => {
    if (Array.isArray(MEM.messages)) setMessages(MEM.messages);
    if (typeof MEM.input === "string") setInput(MEM.input);
    if (!MEM.messages) {
      const cache = sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (cache) {
        try {
          const parsed = JSON.parse(cache);
          if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
          if (typeof parsed.input === "string") setInput(parsed.input);
        } catch {}
      }
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    MEM.messages = messages;
    MEM.input = input;
    safePersist(CHAT_STORAGE_KEY, { messages: sanitizeForStorage(messages), input });
  }, [messages, input, hydrated]);
  useLayoutEffect(() => {
    if (!isInitial && scrollRef.current) scrollToBottom(scrollRef.current);
  }, [messages, loadingId, isInitial]);
  useEffect(() => {
    if (!attachment) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      return;
    }
    const url = URL.createObjectURL(attachment);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [attachment]);

  const onAttach = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAttachment(f);
    e.target.value = "";
  };
  const clearAttachment = () => {
    setAttachment(null);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = async () => {
    const text = input.trim();
    if (!text && !attachment) return;
    const file = attachment || null;
    let userImageData = null;
    if (file) {
      try {
        userImageData = await fileToDataURL(file);
      } catch {}
    }
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: "user",
        text,
        hasImage: !!file,
        userImage: userImageData || null,
      },
    ]);
    setInput("");
    clearAttachment();
    const loader = { id: crypto.randomUUID(), sender: "loader" };
    setLoadingId(loader.id);
    setMessages((prev) => [...prev, loader]);
    try {
      let data;
      if (file) {
        const fd = new FormData();
        fd.append("prompt", text || "");
        fd.append("n", "1");
        fd.append("image", file, file.name || "image");
        const res = await fetch(`${API_BASE}/image/edit`, { method: "POST", body: fd });
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const j = await res.json();
            if (j?.detail) msg = j.detail;
          } catch {}
          throw new Error(msg);
        }
        data = await res.json();
      } else {
        const res = await fetch(`${API_BASE}/image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text, n: 1 }),
        });
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const j = await res.json();
            if (j?.detail) msg = j.detail;
          } catch {}
          throw new Error(msg);
        }
        data = await res.json();
      }
      const images = (data?.images || []).map((i) => i?.data_url).filter(Boolean);
      const model = data?.model || "";
      setMessages((prev) =>
        prev.filter((m) => m.id !== loader.id).concat({
          id: crypto.randomUUID(),
          sender: "bot",
          images,
          model,
        })
      );
    } catch (e) {
      setMessages((prev) =>
        prev.filter((m) => m.id !== loader.id).concat({ id: crypto.randomUUID(), sender: "bot", error: String(e) })
      );
    } finally {
      setLoadingId(null);
    }
  };

  const fadeMask = `linear-gradient(
    to bottom,
    rgba(0,0,0,1) 0%,
    rgba(0,0,0,1) calc(100% - ${BOTTOM_PAD_PX + FADE_PX}px),
    rgba(0,0,0,0) calc(100% - ${BOTTOM_PAD_PX}px),
    rgba(0,0,0,0) 100%
  )`;

  const renderMessage = (m) => {
    if (m.sender === "user") {
      return (
        <div className="flex flex-col items-end gap-2">
          <UserTextBubble text={m.text} />
          {m.userImage ? (
            <div className="self-end">
              <img
                src={m.userImage}
                alt="you sent"
                className="rounded-md border border-white/15 max-w-xs w-full object-cover bg-white/5"
              />
            </div>
          ) : null}
          {!m.text && !m.userImage ? (
            <div className="self-end max-w-[72%]">
              <div className="inline-block rounded-lg px-3.5 py-2.5 bg-white text-black border border-black/5 shadow-sm">
                <span className="text-[13px] leading-relaxed text-black/70">Sent an image</span>
              </div>
            </div>
          ) : null}
        </div>
      );
    }
    
    if (m.sender === "loader") {
      return <LoaderBubble />;
    }
    if (m.sender === "bot") {
      if (m.error) {
        return (
          <div className={`${glass} p-3 text-red-300 self-start`}>
            <pre className="text-sm">{m.error}</pre>
          </div>
        );
      }
      return (
        <div className="flex flex-col gap-2">
          {Array.isArray(m.images) && m.images.length > 0 ? (
            m.images.map((src, idx) => <ImgBubble key={idx} src={src} />)
          ) : (
            <div className={`${glass} p-3 text-neutral-100 self-start`}>
              <pre className="text-sm">No image returned.</pre>
            </div>
          )}
          {m.model && <div className="text-sm text-neutral-400">Model: {m.model}</div>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 overflow-hidden text-neutral-100 flex justify-center">
      <div className="w-full max-w-3xl h-full flex flex-col px-4 md:px-6">
        <div
          ref={scrollRef}
          className={isInitial ? "h-0" : "flex-1 overflow-y-auto custom-scrollbar pb-64 relative pt-28"}
          style={{ scrollBehavior: "smooth", maskImage: fadeMask, WebkitMaskImage: fadeMask }}
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
        <div className="fixed bottom-0 left-1/2 z-40 -translate-x-1/2 w-[min(calc(100vw-32px),48rem)] px-4 md:px-0">
          <div className={`${glass} overflow-hidden rounded-b-none`}>
            <div className={`${previewUrl ? "px-3 pt-3" : "p-0"}`}>
              <ComposerThumb url={previewUrl} onClear={clearAttachment} />
            </div>
            <div className="flex items-start gap-3 p-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Type your message here…"
                rows={3}
                className="flex-1 min-h-[68px] max-h-48 bg-transparent text-neutral-100 placeholder-neutral-400 focus:outline-none resize-none text-sm"
              />
            </div>
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1.5 rounded-full border border-white/10 text-[11px] text-slate-200 bg-white/5">
                  Nano Banana
                </span>
                <button
                  type="button"
                  onClick={() => !loadingId && fileRef.current?.click()}
                  disabled={!!loadingId}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 hover:bg-white hover:text-black transition disabled:opacity-60"
                  title="Add image"
                  aria-label="Add image"
                >
                  <Plus size={14} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAttach}
                />
              </div>
              <button
                onClick={send}
                disabled={!!loadingId}
                className="p-3 rounded-md bg-white text-black border border-white/20 hover:bg-white/90 active:scale-[0.98] transition inline-flex items-center justify-center disabled:opacity-60"
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
