
import { Link, useLocation } from 'react-router-dom';
import { Home, Send, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../config';

export default function Sidebar() {
    console.log('Sidebar rendering...');
    const location = useLocation();
    const { user, logout } = useAuth();

    const { data: counts } = useQuery({
        queryKey: ['emailCounts'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/api/email-counts`, { withCredentials: true });
            return res.data;
        },
        refetchInterval: 5000 // Poll every 5 seconds for updates
    });

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen flex-shrink-0 font-sans">
            {/* Logo Section */}
            <div className="h-16 flex items-center px-6">
                <span className="text-2xl font-bold tracking-tighter text-black">ReachinBox</span>
            </div>

            {/* User Profile Section */}
            <div className="px-5 mb-4 relative group">
                <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                    {user?.photo ? (
                        <img
                            src={user.photo}
                            alt="User"
                            className="h-10 w-10 rounded-full border border-gray-200 object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-emerald-800 flex items-center justify-center text-white font-bold text-sm border border-emerald-900">
                            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'B'}
                        </div>
                    )}
                    {/* Fallback container */}
                    <div className="hidden h-10 w-10 rounded-full bg-emerald-800 flex items-center justify-center text-white font-bold text-sm border border-emerald-900">
                        {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'B'}
                    </div>

                    <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900 truncate block">{user?.displayName || 'User'}</span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-xs text-gray-500 truncate block">{user?.email || 'user@email.com'}</span>
                    </div>

                    {/* Dropdown for Logout (Simple implementation) */}
                    <div className="absolute top-full left-0 w-full px-5 pt-2 hidden group-hover:block z-20">
                        <button
                            onClick={logout}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md shadow-lg hover:bg-red-50 hover:text-red-600 flex items-center"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Log Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Compose Button */}
            <div className="px-5 mb-8">
                <Link
                    to="/dashboard/compose"
                    className="flex items-center justify-center w-full px-4 py-2.5 bg-white border-2 border-emerald-600 text-emerald-700 font-bold rounded-full shadow-sm hover:bg-emerald-50 transition-all text-sm uppercase tracking-wide"
                >
                    Compose
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex flex-col flex-1 overflow-y-auto px-5">
                <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-3">
                        CORE
                    </h3>

                    <Link
                        to="/dashboard"
                        className={`flex items-center px-3 py-2.5 rounded-r-full border-l-4 transition-all ${isActive('/dashboard')
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                            : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        <Home className={`mr-3 h-5 w-5 ${isActive('/dashboard') ? 'text-emerald-700' : 'text-gray-400'}`} />
                        <span className="font-medium text-sm">Scheduled</span>
                        <span className={`ml-auto text-xs ${isActive('/dashboard') ? 'text-emerald-800 font-bold' : 'text-gray-400'}`}>
                            {counts?.scheduled ?? '-'}
                        </span>
                    </Link>

                    <Link
                        to="/dashboard/sent"
                        className={`flex items-center px-3 py-2.5 rounded-r-full border-l-4 transition-all ${isActive('/dashboard/sent')
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                            : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        <Send className={`mr-3 h-5 w-5 ${isActive('/dashboard/sent') ? 'text-emerald-700' : 'text-gray-400'}`} />
                        <span className="font-medium text-sm">Sent</span>
                        <span className={`ml-auto text-xs ${isActive('/dashboard/sent') ? 'text-emerald-800 font-bold' : 'text-gray-400'}`}>
                            {counts?.sent ?? '-'}
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
