import { useState, useRef } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bold, Italic, Underline, Paperclip, Clock, X, Send as SendIcon } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

export default function ComposeEmail() {
    const { user } = useAuth();
    const [recipients, setRecipients] = useState<string[]>([]);
    const [fromEmail, setFromEmail] = useState(user?.email || '');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    // Custom Scheduling State
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleHour, setScheduleHour] = useState('12');
    const [scheduleMinute, setScheduleMinute] = useState('00');
    const [schedulePeriod, setSchedulePeriod] = useState('AM');

    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [error, setError] = useState('');
    const [rateLimit, setRateLimit] = useState<number>(0);
    const [delay, setDelay] = useState<number>(0);
    const [attachments, setAttachments] = useState<File[]>([]);

    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const editorRef = useRef<HTMLDivElement>(null);
    const recipientInputRef = useRef<HTMLInputElement>(null);

    const scheduleMutation = useMutation({
        mutationFn: async (data: any) => {
            return axios.post(`${API_URL}/api/schedule-email`, data, { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduledEmails'] });
            navigate('/dashboard');
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to schedule email');
        }
    });

    const handleInput = () => {
        if (editorRef.current) {
            setBody(editorRef.current.innerHTML);
        }
    };

    const handleFormat = (command: string) => {
        document.execCommand(command, false, '');
        editorRef.current?.focus();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAttachments(prev => [...prev, file]);
        }
    };

    const handleRecipientFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const emails = text.split(/[\n,]/).map(e => e.trim()).filter(e => e.includes('@'));
                setRecipients(prev => [...new Set([...prev, ...emails])]);
            };
            reader.readAsText(file);
        }
    };

    const addPendingRecipient = () => {
        if (recipientInputRef.current) {
            const val = recipientInputRef.current.value.trim();
            if (val && val.includes('@')) {
                setRecipients(prev => {
                    if (!prev.includes(val)) return [...prev, val];
                    return prev;
                });
                recipientInputRef.current.value = '';
            }
        }
    };

    const handleManualAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addPendingRecipient();
        }
    };

    const getScheduledISO = () => {
        if (!scheduleDate) return new Date().toISOString();
        const date = new Date(scheduleDate);
        let hour = parseInt(scheduleHour);
        if (schedulePeriod === 'PM' && hour !== 12) hour += 12;
        if (schedulePeriod === 'AM' && hour === 12) hour = 0;

        date.setHours(hour, parseInt(scheduleMinute), 0, 0);
        return date.toISOString();
    };

    const handleScheduleSubmit = () => {
        setIsScheduleOpen(false);
        submitEmail(getScheduledISO());
    };

    const handleSendNow = () => {
        submitEmail(new Date().toISOString());
    };

    const submitEmail = (scheduledTime: string) => {
        addPendingRecipient();
        let currentRecipients = [...recipients]; // Copy existing

        // Add current input if valid
        if (recipientInputRef.current) {
            const val = recipientInputRef.current.value.trim();
            if (val && val.includes('@') && !currentRecipients.includes(val)) {
                currentRecipients.push(val);
            }
        }

        if (currentRecipients.length === 0) {
            setError("Please add at least one recipient");
            return;
        }

        scheduleMutation.mutate({
            recipients: currentRecipients,
            fromEmail,
            subject,
            body,
            scheduledAt: scheduledTime,
            rateLimit: Number(rateLimit),
            delay: Number(delay),
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white min-h-[600px] mt-8 rounded-xl shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">New Message</h1>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Dialog.Root open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                        <Dialog.Trigger asChild>
                            <button className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-full text-sm font-medium hover:bg-indigo-50 transition-colors">
                                <Clock className="w-4 h-4" />
                                <span className="hidden sm:inline">Schedule</span>
                            </button>
                        </Dialog.Trigger>
                        <Dialog.Portal>
                            <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20" />
                            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-[380px] z-30 animate-in fade-in zoom-in duration-200 border border-gray-100">
                                <Dialog.Title className="text-lg font-bold text-gray-900 mb-4">Schedule Email</Dialog.Title>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-2">Date</label>
                                        <input
                                            type="date"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-500 mb-2">Hour</label>
                                            <select
                                                value={scheduleHour} onChange={(e) => setScheduleHour(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                            >
                                                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-500 mb-2">Minute</label>
                                            <select
                                                value={scheduleMinute} onChange={(e) => setScheduleMinute(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                            >
                                                {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-500 mb-2">AM/PM</label>
                                            <select
                                                value={schedulePeriod} onChange={(e) => setSchedulePeriod(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                            >
                                                <option value="AM">AM</option>
                                                <option value="PM">PM</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-50">
                                        <button className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 font-medium" onClick={() => setIsScheduleOpen(false)}>Cancel</button>
                                        <button
                                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium text-sm shadow-md transition-all active:scale-95"
                                            onClick={handleScheduleSubmit}
                                        >
                                            Schedule
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>

                    <button
                        onClick={handleSendNow}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium text-sm shadow-md transition-all active:scale-95"
                    >
                        <SendIcon className="w-4 h-4" />
                        Send Now
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center"><span className="mr-2">⚠️</span>{error}</div>}

            <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                    <label className="w-16 text-sm font-semibold text-gray-500 group-hover:text-indigo-500 transition-colors">From</label>
                    <input
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        className="flex-1 bg-transparent text-gray-800 px-2 py-1.5 rounded text-sm font-medium outline-none border-b border-transparent focus:border-indigo-200"
                        placeholder="sender@example.com"
                    />
                </div>

                <div className="flex items-start gap-4 border-b border-gray-100 pb-2 group">
                    <label className="w-16 text-sm font-semibold text-gray-500 mt-2 group-hover:text-indigo-500 transition-colors">To</label>
                    <div className="flex-1">
                        <div className="flex flex-wrap gap-2 items-center min-h-[32px]">
                            {recipients.map(r => (
                                <span key={r} className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full flex items-center gap-1 border border-indigo-100">
                                    {r} <button onClick={() => setRecipients(recipients.filter(x => x !== r))} className="hover:text-indigo-900 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                            <input
                                type="text"
                                ref={recipientInputRef}
                                onKeyDown={handleManualAdd}
                                onBlur={addPendingRecipient}
                                placeholder="Add recipients..."
                                className="flex-1 outline-none text-sm text-gray-700 placeholder:text-gray-400 bg-transparent py-1.5 px-2 min-w-[150px]"
                            />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <div className="flex gap-4">
                                <p className="text-xs text-gray-400">Press Enter to add multiple</p>
                                <p className="text-xs font-semibold text-indigo-600">{recipients.length} recipients added</p>
                            </div>
                            <label className="cursor-pointer text-indigo-600 text-xs font-medium hover:text-indigo-700 flex items-center gap-1">
                                <span className="hover:underline">Import CSV</span>
                                <input type="file" accept=".csv,.txt" onChange={handleRecipientFileUpload} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 border-b border-gray-100 pb-2 group">
                    <label className="w-16 text-sm font-semibold text-gray-500 group-hover:text-indigo-500 transition-colors">Subject</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject line"
                        className="flex-1 outline-none text-sm font-medium text-gray-900 placeholder:text-gray-300 py-1.5 px-2 bg-transparent"
                    />
                </div>

                <div className="flex items-center gap-8 py-2">
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 font-medium">Delay (sec)</label>
                        <input
                            type="number"
                            min="0"
                            value={delay || ''}
                            onChange={(e) => setDelay(Number(e.target.value))}
                            placeholder="0"
                            className="w-16 border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500 text-center"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 font-medium">Hourly Limit</label>
                        <input
                            type="number"
                            min="0"
                            value={rateLimit || ''}
                            onChange={(e) => setRateLimit(Number(e.target.value))}
                            placeholder="0"
                            className="w-16 border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500 text-center"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 py-2 px-1 border-b border-gray-100">
                    <button onClick={() => handleFormat('bold')} className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors" title="Bold">
                        <Bold className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleFormat('italic')} className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors" title="Italic">
                        <Italic className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleFormat('underline')} className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors" title="Underline">
                        <Underline className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                    <label className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors cursor-pointer" title="Attach File">
                        <Paperclip className="w-4 h-4" />
                        <input type="file" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>

                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-2">
                        {attachments.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-medium border border-gray-200">
                                <span className="max-w-[150px] truncate">{file.name}</span>
                                <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>
                )}

                <div
                    className="min-h-[300px] outline-none text-gray-800 text-sm leading-relaxed p-2"
                    contentEditable
                    ref={editorRef}
                    onInput={handleInput}
                    data-placeholder="Start typing your email..."
                />
            </div>
        </div>
    );
}
