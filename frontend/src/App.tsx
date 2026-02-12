import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import ScheduledEmails from './components/ScheduledEmails';
import SentEmails from './components/SentEmails';
import ComposeEmail from './components/ComposeEmail';
import PrivateRoute from './components/PrivateRoute';

function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <DashboardLayout />
                        </PrivateRoute>
                    }>
                        <Route index element={<ScheduledEmails />} />
                        <Route path="sent" element={<SentEmails />} />
                        <Route path="compose" element={<ComposeEmail />} />
                    </Route>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
