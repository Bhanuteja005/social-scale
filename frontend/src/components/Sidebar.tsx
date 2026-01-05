import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2,
  ShoppingCart,
  BarChart3,
  LogOut,
  Menu,
  X,
  Layers,
  TrendingUp,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  React.useEffect(() => {
    // Auto-collapse sidebar on small screens, keep open on md+
    const setInitial = () => setIsOpen(window.innerWidth >= 768);
    setInitial();
    const onResize = () => setIsOpen(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const getMenuItems = () => {
    return [
      { path: '/', label: 'Dashboard', icon: TrendingUp },
      { path: '/new-order', label: 'New Order', icon: ShoppingCart },
      { path: '/orders', label: 'All Orders', icon: Layers },
      { path: '/companies', label: 'Companies', icon: Building2 },
      { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    ];
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white text-gray-700 rounded-lg border border-gray-200 shadow-md hover:bg-gray-50 transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 shadow-lg transition-transform duration-300 z-20 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-72`}
      >
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div className="p-8 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Social Scale</h1>
                <p className="text-sm text-gray-600">Admin Dashboard</p>
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-base font-semibold text-white">
                  {user?.email?.[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-600">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6">
            <div className="space-y-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-200 transform ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600 shadow-sm scale-[1.02]'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 hover:text-indigo-700 hover:shadow-md hover:scale-[1.02] hover:border-r-2 hover:border-indigo-300'
                    }`}
                    onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                  >
                    <div className={`p-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <span className={`font-medium text-base transition-all duration-200 ${
                      isActive ? 'font-semibold' : 'group-hover:font-semibold'
                    }`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-5 py-4 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-base"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
