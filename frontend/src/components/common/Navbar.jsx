import React, { useState } from 'react';
import { LogOut, Menu, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { roleLabel } from '../../utils/helpers.js';
import MobileSidebar from './MobileSidebar.jsx';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 md:px-8">
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg p-2 text-ink/60 hover:bg-mist md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold text-ink md:text-xl">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <span
          className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:flex ${
            connected ? 'bg-good/10 text-good' : 'bg-ink/5 text-ink/40'
          }`}
        >
          {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
          {connected ? 'Live' : 'Offline'}
        </span>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-ink">{user?.name}</p>
          <p className="text-xs text-ink/50">{roleLabel[user?.role]}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:bg-mist"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
};

export default Navbar;
