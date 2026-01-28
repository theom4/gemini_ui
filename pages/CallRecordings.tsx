import React, { useState, useEffect, useRef } from 'react';
import { useCallRecordingsOptimized, CallRecording } from '../hooks/useCallRecordings';
import { useAuth } from '../contexts/AuthContext';

export default function CallRecordings() {
    const { profile, loading: authLoading } = useAuth();
    // Use the ID pulled from the database lookup
    const userId = profile?.id || '';
    const userStores = profile?.stores || [];

    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // Auto-select first brand on load
    useEffect(() => {
        if (userStores.length > 0 && !selectedBrand) {
            setSelectedBrand(userStores[0]);
        }
    }, [userStores, selectedBrand]);

    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const [searchInput, setSearchInput] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [selectedRecording, setSelectedRecording] = useState<CallRecording | null>(null);

    useEffect(() => {
        setPage(1);
    }, [selectedBrand, startDate, endDate, activeSearch, statusFilter]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const { recordings, totalCount, loading: recordingsLoading, error, isRefetching } = useCallRecordingsOptimized(
        userId,
        selectedBrand, 
        startDate, 
        endDate, 
        page, 
        pageSize,
        activeSearch,
        statusFilter
    );

    const totalPages = Math.ceil(totalCount / pageSize);

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ro-RO', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string | null | undefined) => {
        if (!status) return <span className="text-gray-500 font-light italic text-xs">Nespecificat</span>;
        const s = status.toLowerCase();
        let colorClass = 'bg-gray-500/10 text-gray-400 border-gray-500/20'; 
        if (s.includes('confirm')) colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        else if (s.includes('anulat')) colorClass = 'bg-red-500/10 text-red-400 border-red-500/20';
        else if (s.includes('neraspuns')) colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        return <span className={`px-2 py-0.5 rounded-lg text-[10px] border font-medium ${colorClass}`}>{status}</span>;
    };

    if (!authLoading && userStores.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center">
                <span className="material-icons-round text-6xl text-gray-700 mb-4 p-4 rounded-full bg-surface-dark-lighter border border-white/5">storefront</span>
                <h2 className="text-2xl font-light text-white mb-2">Niciun magazin configurat</h2>
                <p className="text-gray-500 max-w-md font-light">Contactați suportul Nanoassist pentru configurare.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="xl:min-w-[200px]">
                    <h2 className="text-3xl font-light dark:text-white mb-2 tracking-tight">Înregistrări Apeluri</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light">Ultimele conversații AI pentru {selectedBrand}</p>
                </div>
                
                <div className="flex-1 max-w-lg w-full relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons-round text-gray-500">search</span>
                    <input 
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setActiveSearch(searchInput)}
                        placeholder="Cauta dupa ID comanda sau telefon..."
                        className="w-full pl-10 pr-24 py-3 bg-[#13141a] border border-white/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-gray-200"
                    />
                    <button onClick={() => setActiveSearch(searchInput)} className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-surface-dark-lighter border border-white/5 text-gray-400 hover:text-white text-xs font-medium rounded-lg transition-colors">Caută</button>
                </div>
                
                <div className="flex flex-wrap gap-3 items-center justify-end">
                    <div className="flex items-center gap-2 bg-[#13141a] p-1 rounded-xl border border-white/5 shadow-inner">
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-gray-200 text-sm border-none focus:ring-0 cursor-pointer" />
                        <span className="text-gray-600">-</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-gray-200 text-sm border-none focus:ring-0 cursor-pointer" />
                    </div>

                    <div className="relative">
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="btn-3d-secondary px-5 py-2.5 rounded-xl text-sm min-w-[160px] flex justify-between items-center h-[42px]">
                            <span>{selectedBrand || 'Selectează'}</span>
                            <span className={`material-icons-round transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-full rounded-xl bg-[#13141a] border border-white/5 shadow-xl z-50 overflow-hidden">
                                    {userStores.map(store => (
                                        <button 
                                            key={store} 
                                            onClick={() => { setSelectedBrand(store); setIsDropdownOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${selectedBrand === store ? 'bg-primary' : 'bg-transparent border border-gray-600'}`}></span>
                                            {store}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="card-depth p-1 rounded-2xl overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800/50 bg-surface-dark-lighter/30">
                                <th className="py-4 px-6 font-medium">Data</th>
                                <th className="py-4 px-6 font-medium">Status</th>
                                <th className="py-4 px-6 font-medium">Telefon</th>
                                <th className="py-4 px-6 font-medium">Durată</th>
                                <th className="py-4 px-6 font-medium">Înregistrare</th>
                                <th className="py-4 px-6 text-right font-medium">Acțiune</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-800/50">
                            {recordingsLoading ? (
                                <tr><td colSpan={6} className="py-12 text-center text-gray-500 font-light italic">Se încarcă înregistrările...</td></tr>
                            ) : recordings.length === 0 ? (
                                <tr><td colSpan={6} className="py-12 text-center text-gray-500 font-light italic">Nu s-au găsit rezultate.</td></tr>
                            ) : (
                                recordings.map((rec) => (
                                    <tr key={rec.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6 text-gray-300 font-num">{formatDate(rec.created_at)}</td>
                                        <td className="py-4 px-6">{getStatusBadge(rec.status)}</td>
                                        <td className="py-4 px-6 text-gray-300 font-num">{rec.phone_number || 'Necunoscut'}</td>
                                        <td className="py-4 px-6 text-gray-300 font-num">{formatDuration(rec.duration_seconds)}</td>
                                        <td className="py-4 px-6">
                                            <audio controls className="h-8 w-64 opacity-50 hover:opacity-100 transition-opacity" src={rec.recording_url} preload="none" />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button onClick={() => setSelectedRecording(rec)} className="w-8 h-8 btn-3d-secondary rounded-lg inline-flex items-center justify-center hover:text-white transition-colors">
                                                <span className="material-icons-round text-lg">visibility</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {!recordingsLoading && totalCount > 0 && (
                <div className="flex justify-between items-center px-2">
                    <p className="text-xs text-gray-500 italic font-light">Afișare {recordings.length} din {totalCount} înregistrări</p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-9 h-9 btn-3d-secondary rounded-xl disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center">
                            <span className="material-icons-round">chevron_left</span>
                        </button>
                        <div className="px-4 flex items-center text-xs text-gray-400 font-num">
                            {page} / {totalPages}
                        </div>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-9 h-9 btn-3d-secondary rounded-xl disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center">
                            <span className="material-icons-round">chevron_right</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
