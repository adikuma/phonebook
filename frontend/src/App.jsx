import React, { useState } from 'react';
import Chat from './Chat';
import Dashboard from './Dashboard';

const PASS_PHRASE = import.meta.env.VITE_PASS_PHRASE || 'PASSWORD';

function Tabs({ view, setView }) {
  const isDash = view === 'dashboard';
  return (
    <div className="flex justify-center pt-4">
      <div className="relative flex w-64 border border-neutral-800 text-xs bg-black">
        <button
          onClick={() => setView('dashboard')}
          className={`w-1/2 py-2 z-10 ${isDash ? 'text-black' : 'text-neutral-300'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setView('chat')}
          className={`w-1/2 py-2 z-10 ${!isDash ? 'text-black' : 'text-neutral-300'}`}
        >
          Chat
        </button>
        <span
          className="absolute top-0 h-full w-1/2 bg-white transition-transform duration-200"
          style={{ transform: isDash ? 'translateX(0%)' : 'translateX(100%)' }}
        />
      </div>
    </div>
  );
}

function Gate({ children }) {
  const [value, setValue] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(
    typeof window !== 'undefined' &&
      window.sessionStorage.getItem('phonebook_authed') === 'true'
  );

  const onSubmit = (e) => {
    e.preventDefault();
    setErr('');
    const pass = value.trim();
    if (!pass) return setErr('Passphrase is required');
    if (pass !== PASS_PHRASE) return setErr('Incorrect passphrase');
    window.sessionStorage.setItem('phonebook_authed', 'true');
    setOk(true);
  };

  if (ok) return children;

  return (
    <div className="h-screen bg-black text-white font-poppins flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm border border-neutral-800 p-5">
        <h1 className="text-lg mb-4">Enter passphrase</h1>
        <input
          autoFocus
          type="password"
          className={`w-full px-3 py-2 bg-black border ${
            err ? 'border-red-600' : 'border-neutral-700'
          } text-white focus:outline-none mb-3 placeholder-neutral-500`}
          placeholder="Enter the secret passphrase"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="submit"
          className="w-full border border-neutral-700 hover:border-neutral-500 px-3 py-2 text-sm"
        >
          Continue
        </button>
        <div className="h-5 mt-2">
          {err ? (
            <div role="alert" className="text-xs text-red-500" aria-live="assertive">
              {err}
            </div>
          ) : (
            <p className="text-[11px] text-neutral-500">Session-only.</p>
          )}
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('dashboard');
  return (
    <Gate>
      <div className="h-screen overflow-hidden bg-black text-white font-poppins flex flex-col">
        <Tabs view={view} setView={setView} />
        {view === 'dashboard' ? <Dashboard /> : <Chat />}
      </div>
    </Gate>
  );
}