import { LayoutDashboard, Package, Truck, Settings, Bell, Search, Menu, X, ArrowUpRight, LogIn, LogOut, Crown, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { OWNER_EMAIL, isMainAdmin } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('public-search');
  };

  const menuItems = [
    { id: 'public-search', label: 'Public Tracking', icon: Search, public: true },
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, public: false },
    { id: 'shipments', label: 'All Shipments', icon: Package, public: false },
    { id: 'add-shipment', label: 'Create Shipment', icon: Truck, public: false },
    { id: 'settings', label: 'Settings', icon: Settings, public: false },
  ];

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-[#09090b] border-r border-zinc-800 transition-transform duration-300 lg:translate-x-0 bg-opacity-95 backdrop-blur-sm",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setActiveTab('public-search')}>
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/30 flex items-center justify-center">
              <Truck className="text-red-500" size={24} />
            </div>
            <h1 className="text-lg font-black tracking-tight text-white leading-tight">DELHIVERY<br/><span className="text-red-500 text-xs font-semibold tracking-widest uppercase">Express Freight</span></h1>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              if (!item.public && !user) return null;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                    activeTab === item.id 
                      ? "text-white font-bold" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  )}
                >
                  <item.icon size={20} className="relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                  {activeTab === item.id && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-red-600 rounded-xl z-0 shadow-lg shadow-red-600/30"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-800 space-y-4">
            {user ? (
              <>
                <div className="px-4 py-3 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 group cursor-pointer" onClick={handleLogout}>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Session</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white group-hover:text-orange-500">Log Out</span>
                    <LogOut size={14} className="text-zinc-500 group-hover:text-orange-500 transition-colors" />
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                  <img 
                    src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                    className={cn(
                      "w-9 h-9 rounded-full border-2",
                      isMainAdmin(user.email) ? "border-amber-500 shadow-md shadow-amber-500/20" : "border-blue-500"
                    )}
                    alt="User profile"
                  />
                  <div className="flex-1 overflow-hidden text-left">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate">{user.displayName || 'User'}</p>
                      {isMainAdmin(user.email) ? (
                        <Crown size={12} className="text-amber-400 shrink-0" />
                      ) : (
                        <Shield size={12} className="text-blue-400 shrink-0" />
                      )}
                    </div>
                    <span className={cn(
                      "inline-block text-[9px] font-bold uppercase tracking-wider",
                      isMainAdmin(user.email) ? "text-amber-400" : "text-blue-400"
                    )}>
                      {isMainAdmin(user.email) ? "Main Admin (Owner)" : "Staff Access"}
                    </span>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="px-4 py-3 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                <p className="text-[10px] text-orange-500/60 font-bold uppercase tracking-widest leading-relaxed">Secure gateway for Indian Delivery Ltd employees.</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
