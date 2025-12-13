import { NavLink } from 'react-router-dom';
import { GlossarySheet } from './GlossarySheet';

export function Navigation() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <nav className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-2">
        <NavLink to="/" className={linkClass}>
          🔍 Analyse
        </NavLink>
        <NavLink to="/trending" className={linkClass}>
          🇺🇸 Trending US
        </NavLink>
      </div>
      <GlossarySheet />
    </nav>
  );
}
