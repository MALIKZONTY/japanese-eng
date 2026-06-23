import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Heart, 
  FolderHeart, 
  PlusCircle, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Sparkles 
} from 'lucide-react';
import { cn } from '../utils/cn';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') return 'light';
    return 'dark'; // Dark theme default
  });

  // Apply theme to document element
  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const navigation: SidebarItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Dictionary', path: '/dictionary', icon: BookOpen },
    { name: 'Add Word', path: '/add', icon: PlusCircle },
    { name: 'Favorites', path: '/favorites', icon: Heart },
    { name: 'Word Groups', path: '/groups', icon: FolderHeart },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/40 bg-card p-4 shrink-0 shadow-sm">
        {/* Logo */}
        <div className="flex items-center space-x-3 px-2 py-4 mb-6 border-b border-border/10">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md animate-float">
            <span className="text-white font-extrabold text-sm">語</span>
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight">日本語 Dictionary</h1>
            <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-0.5">
              AI Powered <Sparkles className="h-2.5 w-2.5 text-indigo-400 animate-pulse-subtle" />
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent text-accent-foreground shadow-sm shadow-indigo-950/10 border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-border/10 pt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Theme Mode</span>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-secondary hover:bg-accent hover:text-accent-foreground text-foreground transition-all active:scale-95"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between px-4 py-2 border-b border-border/20 bg-card/85 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-950/20">
              <span className="text-white font-extrabold text-[10px]">語</span>
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">日本語 Dictionary</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-indigo-400" /> : <Moon className="h-4 w-4 text-indigo-650" />}
          </button>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-lg border-t border-border/30 px-3 py-2 flex justify-around items-center shadow-lg shadow-black/25 pb-safe">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 relative select-none",
                  isActive
                    ? "text-primary font-bold scale-105"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 transition-transform", isActive ? "stroke-[2.5px] text-indigo-400 scale-110" : "")} />
                <span className="text-[9px] font-bold tracking-tight">{item.name}</span>
                {isActive && (
                  <span className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
