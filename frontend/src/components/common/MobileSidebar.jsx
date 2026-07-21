import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, Droplets } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutGrid,
  Users,
  BedDouble,
  Droplet,
  ClipboardList,
  BarChart3,
  UserCog,
} from 'lucide-react';

const linksByRole = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { to: '/patients', label: 'Patients', icon: Users },
    { to: '/rooms', label: 'Rooms', icon: BedDouble },
    { to: '/staff', label: 'Staff', icon: UserCog },
    { to: '/iv-fluids', label: 'IV Fluids', icon: Droplet },
    { to: '/tasks', label: 'Tasks', icon: ClipboardList },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ],
  doctor: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { to: '/patients', label: 'My Patients', icon: Users },
    { to: '/iv-fluids', label: 'IV Fluids', icon: Droplet },
    { to: '/tasks', label: 'Tasks', icon: ClipboardList },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ],
  nurse: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { to: '/patients', label: 'My Patients', icon: Users },
    { to: '/iv-fluids', label: 'IV Fluids', icon: Droplet },
    { to: '/tasks', label: 'Tasks', icon: ClipboardList },
  ],
  support_staff: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { to: '/tasks', label: 'My Tasks', icon: ClipboardList },
  ],
};

const MobileSidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const links = linksByRole[user?.role] || [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-teal-600 text-white">
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <Droplets size={20} />
            <span className="font-display text-lg font-semibold">DripWatch</span>
          </div>
          <button onClick={onClose} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-white/15 text-white' : 'text-teal-50/80 hover:bg-white/10'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default MobileSidebar;
