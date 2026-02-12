import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ScheduledEmails from '../components/ScheduledEmails';
import SentEmails from '../components/SentEmails';
import ComposeEmail from '../components/ComposeEmail';
import { Search, Filter, RotateCw } from 'lucide-react';

export default function Dashboard() {
    // const { user, logout } = useAuth(); // Moved to Sidebar/Header specific if needed
    // const location = useLocation();

    // Helper to determine title based on path - Not used in new header
    // const getTitle = () => {
    //     if (location.pathname.includes('/compose')) return 'Compose';
    //     if (location.pathname.includes('/sent')) return 'Sent Emails';
    //     return 'Scheduled Emails';
    // };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-10">
                    <div className="flex items-center flex-1 max-w-2xl">
                        <div className="relative w-full max-w-lg">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </span>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border-none rounded-md leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                                placeholder="Search"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Filter className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <RotateCw className="w-4 h-4" />
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <Routes>
                        <Route path="/" element={<ScheduledEmails />} />
                        <Route path="/sent" element={<SentEmails />} />
                        <Route path="/compose" element={<ComposeEmail />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}
