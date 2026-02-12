import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

export default function ScheduledEmails() {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search')?.toLowerCase() || '';

    const { data: emails, isLoading } = useQuery({
        queryKey: ['scheduledEmails'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:3000/api/scheduled-emails', { withCredentials: true });
            return res.data;
        }
    });

    if (isLoading) return <div className="p-10 text-center text-gray-400">Loading schedules...</div>;

    // Filter for PENDING or non-SENT and by search query
    const scheduled = emails?.filter((e: any) => {
        const isPending = e.status === 'PENDING' || e.status === 'FAILED';
        if (!isPending) return false;

        if (!searchQuery) return true;
        return (
            e.recipient.toLowerCase().includes(searchQuery) ||
            e.subject.toLowerCase().includes(searchQuery) ||
            (e.body && e.body.toLowerCase().includes(searchQuery))
        );
    });

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Scheduled Emails</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {scheduled?.map((email: any) => (
                            <tr key={email.idString} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{email.recipient}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{email.subject}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {format(new Date(email.scheduledAt), 'MMM d, yyyy h:mm a')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${email.status === 'FAILED'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-orange-100 text-orange-800'
                                        }`}>
                                        {email.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {isLoading && (
                    <div className="p-10 text-center text-gray-400">Loading schedules...</div>
                )}

                {!isLoading && scheduled?.length === 0 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="bg-gray-100 p-3 rounded-full mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No scheduled emails</h3>
                        <p className="text-gray-500 text-sm mt-1">Emails you schedule will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
