import { Link, useLocation } from 'react-router-dom';
import { Eye, History, Activity } from 'lucide-react';

export default function Header() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group text-white hover:text-primary transition-colors">
          <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
            <Eye className="w-6 h-6 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-xl">Retina<span className="text-primary">AI</span></span>
        </Link>
        
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link 
            to="/" 
            className={`flex items-center gap-2 transition-colors hover:text-white ${isActive('/') ? 'text-white' : 'text-slate-400'}`}
          >
            <Activity className="w-4 h-4" />
            Analysis
          </Link>
          <Link 
            to="/history" 
            className={`flex items-center gap-2 transition-colors hover:text-white ${isActive('/history') ? 'text-white' : 'text-slate-400'}`}
          >
            <History className="w-4 h-4" />
            History
          </Link>
        </nav>
      </div>
    </header>
  );
}
