import { NavLink } from 'react-router-dom';
import { GlossarySheet } from './GlossarySheet';

export function Navigation() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <nav className="flex items-center justify-between mb-8 flex-wrap gap-2">
      <div className="flex items-center gap-1 flex-wrap">
        <NavLink to="/" className={linkClass}>
          🔍 Analyse
        </NavLink>
        <NavLink to="/trending" className={linkClass}>
          🇺🇸 Trending
        </NavLink>
        <NavLink to="/cac40" className={linkClass}>
          🇫🇷 CAC 40
        </NavLink>
        <NavLink to="/dividends" className={linkClass}>
          🇪🇺 Dividendes
        </NavLink>
        <NavLink to="/pea" className={linkClass}>
          💰 PEA
        </NavLink>
      </div>
      <GlossarySheet />
    </nav>
  );
}
