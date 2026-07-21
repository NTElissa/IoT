import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  BedDouble,
  Droplet,
  ClipboardList,
  BarChart3,
  UserCog,
  Droplets,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

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

const Sidebar = () => {
  const { user } = useAuth();
  const links = linksByRole[user?.role] || [];

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-teal-700/20 bg-teal-600 text-white md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="rounded-lg bg-white/10 p-1.5">
          <Droplets size={20} />
        </div>
        <span className="font-display text-lg font-semibold">DripWatch</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-white/15 text-white' : 'text-teal-50/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-xs text-teal-50/60">
        Remera Rukoma Hospital
        <br />
        Smart IV Monitoring
      </div>
    </aside>
  );
};

export default Sidebar;
