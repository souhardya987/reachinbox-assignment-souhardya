
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { API_URL } from '../config';

export default function SentEmails() {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search')?.toLowerCase() || '';
    const queryClient = useQueryClient();

    const { data: sentEmails, isLoading } = useQuery({
        queryKey: ['sentEmails'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/api/sent-emails`, { withCredentials: true });
            return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`${API_URL}/api/scheduled-emails/${id}`, { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sentEmails'] });
            queryClient.invalidateQueries({ queryKey: ['emailCounts'] });
        }
    });

    const sent = sentEmails?.filter((e: any) => {
        if (!searchQuery) return true;
        return (
            e.recipient.toLowerCase().includes(searchQuery) ||
            e.subject.toLowerCase().includes(searchQuery) ||
            (e.body && e.body.toLowerCase().includes(searchQuery))
        );
    });

    return (
        <div className="bg-white shadow rounded-lg p-6 min-h-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Sent Emails</h2>
            <div className="divide-y divide-gray-100">
                {sent?.map((email: any) => (
                    <div key={email.idString} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors group cursor-pointer">
                        {/* Recipient */}
                        <div className="w-48 flex-shrink-0">
                            <div className="text-sm font-medium text-gray-900">To: {email.recipient}</div>
                        </div>

                        {/* Status Pill */}
                        <div className="flex-shrink-0">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-600">
                                Sent
                            </span>
                        </div>

                        {/* Subject + Body Preview */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                                <span className="font-bold text-gray-900">{email.subject}</span>
                                <span className="text-gray-400">-</span>
                                <span className="text-gray-500 truncate">{email.body || 'No content preview'}</span>
                            </div>
                        </div>

                        {/* Validated/Time */}
                        <div className="flex-shrink-0 text-xs text-gray-400">
                            {email.sentAt ? format(new Date(email.sentAt), 'MMM d, h:mm a') : ''}
                        </div>

                        {/* Actions (Delete Icon) */}
                        <div className="flex-shrink-0 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Are you sure you want to delete this email?')) {
                                        deleteMutation.mutate(email.idString);
                                    }
                                }}
                                className="p-1 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="p-10 text-center text-gray-400">Loading history...</div>
                )}

                {!isLoading && sent?.length === 0 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="bg-gray-100 p-3 rounded-full mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No sent emails</h3>
                        <p className="text-gray-500 text-sm mt-1">Emails you send will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
