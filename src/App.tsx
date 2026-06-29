import { useState, ReactNode, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home as HomeIcon, Users, Video, BarChart3, Search, Settings as LucideSettings,
  Plus, ArrowLeft, ShieldCheck, LogOut, Command, Zap, MoreHorizontal, X, GraduationCap
} from 'lucide-react';

import Home from './screens/Home';
import Leads from './screens/Leads';
import Demos from './screens/Demos';
import Analytics from './screens/Analytics';
import EnquiryForm from './screens/EnquiryForm';
import Joined from './screens/Joined';
import Settings from './screens/Settings';
import Admin from './screens/Admin';
import LoginScreen from './screens/LoginScreen';

import { StaffProvider } from './contexts/StaffContext';
import { DataProvider, useData } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardBackground from './components/DashboardBackground';
import BottomSheet from './components/BottomSheet';
import { fetchClientIp } from './utils/ip';
import { useIsMobile } from './hooks/useIsMobile';
import { useScrollLock } from './hooks/useScrollLock';
import { useAppearancePrefs } from './hooks/useAppearancePrefs';
import { MOBILE_FAB_BOTTOM } from './constants/layout';
import { filterViewableLeads } from './utils/leadAccess';

const PRIMARY_NAV_PATHS = ['/', '/leads', '/joined', '/demos', '/settings'];

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { dashboardBackground, dashboardVideoId, dashboardGradientId, dashboardImageId } = useAppearancePrefs();
  const { currentUser, logout, hasPermission, isAuthenticated } = useAuth();
  const { leads, addAccessLog } = useData();

  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showMoreNav, setShowMoreNav] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const staffPickerRef = useRef<HTMLDivElement>(null);
  const appOpenLoggedRef = useRef(false);

  useEffect(() => {
    if (!currentUser || appOpenLoggedRef.current) return;
    appOpenLoggedRef.current = true;
    fetchClientIp().then(ip => {
      addAccessLog({
        staffName: currentUser.name,
        role: currentUser.role,
        ipAddress: ip,
        action: 'app_open'
      });
    });
  }, [currentUser, addAccessLog]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (staffPickerRef.current && !staffPickerRef.current.contains(event.target as Node)) {
        setShowStaffPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowMoreNav(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allNavItems = useMemo(() => [
    { path: '/', label: 'Home', icon: HomeIcon, show: true },
    { path: '/leads', label: 'Leads', icon: Users, show: true },
    { path: '/joined', label: 'Joined', icon: GraduationCap, show: true },
    { path: '/demos', label: 'Demos', icon: Video, show: true },
    { path: '/settings', label: 'Settings', icon: LucideSettings, show: true },
    { path: '/admin', label: 'Admin', icon: ShieldCheck, show: hasPermission('admin_dashboard') },
    { path: '/analytics', label: 'Insights', icon: BarChart3, show: hasPermission('view_analytics') },
  ].filter(item => item.show), [hasPermission]);

  const primaryNavItems = allNavItems.filter(item => PRIMARY_NAV_PATHS.includes(item.path));
  const overflowNavItems = allNavItems.filter(item => !PRIMARY_NAV_PATHS.includes(item.path));
  const showMoreTab = isMobile && overflowNavItems.length > 0;

  useScrollLock(showCommandPalette || showMoreNav);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'ClapsCRM';
      case '/admin': return 'Admin';
      case '/leads': return 'Leads';
      case '/joined': return 'Joined Students';
      case '/demos': return 'Demos';
      case '/analytics': return 'Insights';
      case '/settings': return 'Settings';
      case '/enquiry': return 'New Lead';
      default: return 'ClapsCRM';
    }
  };

  const isFormPage = location.pathname === '/enquiry';
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    if (isAuthenticated && currentUser) {
      return <Navigate to="/" replace />;
    }
    return (
      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/login" element={<LoginScreen />} />
        </Routes>
      </AnimatePresence>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  const viewableLeads = filterViewableLeads(
    leads,
    currentUser.name,
    hasPermission('view_all_leads')
  );
  const searchResults = searchQuery ? viewableLeads.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone.includes(searchQuery)
  ).slice(0, 8) : [];

  return (
    <div className="relative h-[100dvh] overflow-hidden text-[#18181b] font-sans selection:bg-black/10">
      <DashboardBackground
        mode={dashboardBackground}
        videoId={dashboardVideoId}
        gradientId={dashboardGradientId}
        imageId={dashboardImageId}
      />

      <div className="relative z-10 h-[100dvh] flex overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-[240px] lg:w-[260px] shrink-0 border-r border-[#e4e4e7] bg-white sticky top-0 h-[100dvh] safe-top">
        <div className="p-5 border-b border-[#e4e4e7]">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#18181b] rounded-lg flex items-center justify-center text-white">
              <Zap size={18} strokeWidth={2.5} />
            </div>
            <span className="text-base font-semibold tracking-tight">ClapsCRM</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {allNavItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all interactive-element ${
                  isActive ? 'bg-[#18181b] text-white shadow-md' : 'text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#18181b]'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="font-semibold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#e4e4e7]">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <img src={currentUser.avatar} alt="" className="w-9 h-9 rounded-full border border-[#e4e4e7]" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{currentUser.name}</p>
              <p className="text-[11px] text-[#a1a1aa] capitalize">{currentUser.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-[#a1a1aa] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden ${isMobile && !isFormPage ? 'pb-[calc(64px+env(safe-area-inset-bottom,0px))]' : ''}`}>

        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-[#e4e4e7] flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 safe-top shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isFormPage ? (
              <Link to="/leads" className="p-2.5 hover:bg-[#f4f4f5] rounded-xl transition-colors interactive-element">
                <ArrowLeft size={22} />
              </Link>
            ) : (
              <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate md:hidden">{getPageTitle()}</h1>
            )}
            {isFormPage && <h1 className="text-base font-semibold">{getPageTitle()}</h1>}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {!isFormPage && (
              <button
                onClick={() => { setShowCommandPalette(true); setSearchQuery(''); }}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 h-10 min-w-[44px] bg-[#f4f4f5] hover:bg-white border border-[#e4e4e7] rounded-xl text-[#a1a1aa] transition-all interactive-element"
                aria-label="Search"
              >
                <Search size={18} />
                <span className="text-sm font-semibold hidden sm:inline">Search</span>
                <span className="hidden lg:flex items-center gap-1 text-[10px] font-medium bg-white px-1.5 py-0.5 rounded border border-[#e4e4e7] ml-1 text-[#71717a]">
                  <Command size={10} />K
                </span>
              </button>
            )}

            <div className="relative md:hidden" ref={staffPickerRef}>
              <button
                onClick={() => setShowStaffPicker(!showStaffPicker)}
                className="w-10 h-10 rounded-full border-2 border-white ring-1 ring-[#e4e4e7] overflow-hidden interactive-element"
              >
                <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
              </button>
              <AnimatePresence>
                {showStaffPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute top-12 right-0 w-52 bg-white border border-[#e4e4e7] rounded-2xl shadow-2xl overflow-hidden z-[100]"
                  >
                    <div className="p-4 bg-[#f8f9fa] border-b border-[#e4e4e7]">
                      <p className="text-xs text-[#a1a1aa] mb-1">Signed in as</p>
                      <p className="text-sm font-medium truncate">{currentUser.name}</p>
                      <p className="text-xs text-[#71717a] mt-0.5 capitalize">{currentUser.role}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/settings"
                        onClick={() => setShowStaffPicker(false)}
                        className="w-full px-4 py-3 text-left text-xs font-bold text-[#18181b] hover:bg-[#f4f4f5] rounded-xl flex items-center gap-2"
                      >
                        <LucideSettings size={16} /> Settings
                      </Link>
                      <button
                        onClick={() => { setShowStaffPicker(false); logout(); }}
                        className="w-full px-4 py-3 text-left text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Command palette — bottom sheet on mobile, centered on desktop */}
        <AnimatePresence>
          {showCommandPalette && (
            <div className={`fixed inset-0 z-[100] flex ${isMobile ? 'items-end' : 'items-start justify-center pt-[12vh]'} p-0 sm:p-4`}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCommandPalette(false)}
                className="absolute inset-0 bg-[#09090b]/40 backdrop-blur-sm"
              />
              <motion.div
                initial={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, scale: 0.95, y: -20 }}
                animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                exit={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                className={`relative w-full bg-white shadow-2xl overflow-hidden border border-[#e4e4e7] flex flex-col ${
                  isMobile ? 'rounded-t-[28px] max-h-[85dvh]' : 'max-w-2xl rounded-[28px]'
                }`}
              >
                {isMobile && (
                  <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 bg-[#d4d4d8] rounded-full" />
                  </div>
                )}
                <div className="p-4 border-b border-[#f4f4f5] flex items-center gap-3 shrink-0">
                  <Search size={20} className="text-[#a1a1aa] shrink-0" />
                  <input
                    autoFocus
                    type="search"
                    enterKeyHint="search"
                    placeholder="Search leads by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-base font-medium text-[#18181b] placeholder:text-[#a1a1aa] min-h-[44px]"
                  />
                  <button onClick={() => setShowCommandPalette(false)} className="p-2 sm:hidden">
                    <X size={20} className="text-[#71717a]" />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 overscroll-contain p-2 max-h-[60dvh]">
                  {searchQuery && searchResults.length === 0 ? (
                    <p className="p-8 text-center text-[#71717a] font-medium">No results for "{searchQuery}"</p>
                  ) : !searchQuery ? (
                    <p className="p-8 text-center text-[#a1a1aa] text-sm">Type to search your pipeline</p>
                  ) : (
                    <div className="space-y-1">
                      {searchResults.map((lead) => (
                        <button
                          key={lead.id}
                          onClick={() => {
                            setShowCommandPalette(false);
                            navigate('/leads', { state: { highlightLeadId: lead.id } });
                          }}
                          className="w-full text-left p-4 min-h-[56px] rounded-2xl hover:bg-[#f4f4f5] active:bg-[#e4e4e7] transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-[#18181b] truncate">{lead.name}</p>
                            <p className="text-xs text-[#71717a] truncate">{lead.phone} · {lead.class}</p>
                          </div>
                          <span className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-medium ${
                            lead.status === 'JOINED' ? 'bg-green-100 text-green-700' :
                            lead.status === 'LOST' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>{lead.status}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <main className={`flex-1 max-w-[1400px] mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col min-h-0 ${location.pathname === '/leads' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route path="/" element={<ProtectedRoute><PageTransition routeKey="home"><Home /></PageTransition></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireRole="admin"><PageTransition routeKey="admin"><Admin /></PageTransition></ProtectedRoute>} />
              <Route path="/leads" element={<ProtectedRoute><PageTransition routeKey="leads"><Leads /></PageTransition></ProtectedRoute>} />
              <Route path="/joined" element={<ProtectedRoute><PageTransition routeKey="joined"><Joined /></PageTransition></ProtectedRoute>} />
              <Route path="/demos" element={<ProtectedRoute><PageTransition routeKey="demos"><Demos /></PageTransition></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><PageTransition routeKey="analytics"><Analytics /></PageTransition></ProtectedRoute>} />
              <Route path="/enquiry" element={<ProtectedRoute><PageTransition routeKey="enquiry"><EnquiryForm /></PageTransition></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><PageTransition routeKey="settings"><Settings /></PageTransition></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>

        {/* Universal FAB — leads only */}
        {location.pathname === '/leads' && hasPermission('create_lead') && (
          <Link
            to="/enquiry"
            style={{ bottom: isMobile ? MOBILE_FAB_BOTTOM : '2rem' }}
            className="fixed right-6 md:right-8 w-14 h-14 bg-[#18181b] text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-1 transition-all flex items-center justify-center z-[60]"
            aria-label="Add lead"
          >
            <Plus size={26} strokeWidth={2.5} />
          </Link>
        )}

        {/* Mobile bottom nav */}
        {isMobile && !isFormPage && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e4e4e7] z-40 safe-bottom md:hidden">
            <div className="flex items-stretch h-16 px-1">
              {primaryNavItems.map(item => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex flex-col items-center justify-center flex-1 min-w-0 py-1 transition-colors ${
                      isActive ? 'text-[#18181b]' : 'text-[#a1a1aa]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-pill"
                        className="absolute inset-x-1 top-1 bottom-1 bg-[#f4f4f5] rounded-xl -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 1.8} />
                    <span className="text-[10px] font-semibold mt-0.5 truncate max-w-full px-0.5">{item.label}</span>
                  </Link>
                );
              })}
              {showMoreTab && (
                <button
                  onClick={() => setShowMoreNav(true)}
                  className={`relative flex flex-col items-center justify-center flex-1 min-w-0 py-1 ${
                    overflowNavItems.some(i => i.path === location.pathname) ? 'text-[#18181b]' : 'text-[#a1a1aa]'
                  }`}
                >
                  <MoreHorizontal size={20} />
                  <span className="text-[10px] font-semibold mt-0.5">More</span>
                </button>
              )}
            </div>
          </nav>
        )}

        {/* More nav bottom sheet */}
        <BottomSheet
          isOpen={showMoreNav}
          onClose={() => setShowMoreNav(false)}
          title="More"
          subtitle="Admin & analytics"
        >
          <div className="p-4 space-y-1">
            {overflowNavItems.map(item => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMoreNav(false)}
                  className={`flex items-center gap-4 p-4 min-h-[52px] rounded-2xl transition-colors ${
                    isActive ? 'bg-[#18181b] text-white' : 'hover:bg-[#f4f4f5] active:bg-[#e4e4e7]'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-bold">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </BottomSheet>
      </div>
      </div>
    </div>
  );
}

function PageTransition({ children, routeKey }: { children: ReactNode; routeKey: string }) {
  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col flex-1 min-h-0"
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <Router>
      <StaffProvider>
        <AuthProvider>
          <DataProvider>
            <MainLayout />
          </DataProvider>
        </AuthProvider>
      </StaffProvider>
    </Router>
  );
}
