import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function ProcessedOrders() {
    const { profile } = useAuth();
    const userStores = profile?.stores || [];

    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [previewCell, setPreviewCell] = useState<{ col: string; val: string; rowId: any } | null>(null);
    const [editVal, setEditVal] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('Toate');
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [viewOrder, setViewOrder] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const handleSaveCell = async () => {
        if (!previewCell || !previewCell.rowId) return;
        setIsSaving(true);
        const { error } = await supabase
            .from('orders')
            .update({ [previewCell.col]: editVal })
            .eq('id', previewCell.rowId);
            
        if (!error) {
            setOrders(prev => prev.map(p => 
                p.id === previewCell.rowId ? { ...p, [previewCell.col]: editVal } : p
            ));
            setPreviewCell(null);
        } else {
            console.error('Error updating cell:', error);
            alert('A apărut o eroare la salvare.');
        }
        setIsSaving(false);
    };

    useEffect(() => {
        if (userStores.length > 0 && !selectedBrand) {
            setSelectedBrand(userStores[0]);
        }
    }, [userStores, selectedBrand]);

    useEffect(() => {
        if (!selectedBrand) return;
        
        console.log('[ProcessedOrders] Fetching with store_name:', selectedBrand);
        setLoading(true);
        supabase
            .from('orders')
            .select('*')
            .ilike('store_name', selectedBrand)
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                console.log('[ProcessedOrders] Result:', { count: data?.length, error });
                if (error) {
                    console.error('Error fetching orders:', error);
                } else if (data) {
                    setOrders(data);
                }
            })
            .finally(() => setLoading(false));
    }, [selectedBrand]);

    const COLUMN_LABELS: Record<string, string> = {
        phone: 'Telefon',
        phone_number: 'Telefon',
        value: 'Total',
        type: 'Tip',
        name: 'Client',
        sunat_count: 'Apeluri date'
    };

    const columns = orders.length > 0 ? Object.keys(orders[0]).filter(col => col !== 'user_id' && col !== 'store_name' && col !== 'id' && col !== 'created_at' && col !== 'cerere' && col !== 'cerere_adresa' && col !== 'cerere_upsell' && col !== 'istoric' && col !== 'product_id' && col !== 'tags' && col !== 'client_personal_id' && col !== 'email' && col !== 'produse' && col !== 'adresa' && col !== 'order_id' && col !== 'notes' && col !== 'oras' && col !== 'judet' && col !== 'prooduse' && col !== 'health' && col !== 'link') : [];

    const filteredOrders = orders.filter(row => {
        if (selectedType !== 'Toate' && row.type !== selectedType.toLowerCase()) return false;
        if (!searchQuery) return true;
        return columns.some(col => {
            const val = row[col];
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(searchQuery.toLowerCase());
        });
    });

    // Reset page on search or type change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedType, selectedBrand]);

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="xl:min-w-[200px]">
                    <h2 className="text-3xl font-light dark:text-white mb-2 tracking-tight">Comenzi Procesate</h2>
                </div>

                <div className="flex flex-wrap gap-3 items-center justify-end">
                    <div className="relative w-full sm:w-80">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                        <input 
                            type="text" 
                            placeholder="Caută în toate coloanele..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#13141a] border border-white/10 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-500 shadow-inner h-[42px]"
                        />
                    </div>

                    <div className="relative">
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="btn-3d-secondary px-5 py-2.5 rounded-xl text-sm min-w-[160px] flex justify-between items-center h-[42px] hover:text-white transition-all">
                            <span>{selectedBrand || 'Selectează'}</span>
                            <span className={`material-icons-round transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-full rounded-xl bg-[#13141a] border border-white/5 shadow-xl z-50 overflow-hidden backdrop-blur-md">
                                    {userStores.map(store => (
                                        <button key={store} onClick={() => { setSelectedBrand(store); setIsDropdownOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${selectedBrand === store ? 'bg-primary shadow-[0_0_8px_rgba(0,210,255,0.4)]' : 'bg-transparent border border-gray-600'}`} />
                                            {store}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    
                    <div className="relative">
                        <button onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                            className="btn-3d-secondary px-5 py-2.5 rounded-xl text-sm min-w-[120px] flex justify-between items-center h-[42px] hover:text-white transition-all">
                            <span className="capitalize">{selectedType}</span>
                            <span className={`material-icons-round transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        {isTypeDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsTypeDropdownOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-full rounded-xl bg-[#13141a] border border-white/5 shadow-xl z-50 overflow-hidden backdrop-blur-md">
                                    {['Toate', 'draft', 'comanda'].map(typeOption => (
                                        <button key={typeOption} onClick={() => { setSelectedType(typeOption); setIsTypeDropdownOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 capitalize">
                                            <span className={`w-1.5 h-1.5 rounded-full ${selectedType === typeOption ? 'bg-primary shadow-[0_0_8px_rgba(0,210,255,0.4)]' : 'bg-transparent border border-gray-600'}`} />
                                            {typeOption}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="card-depth p-1 rounded-2xl overflow-hidden min-h-[400px] border border-white/5 relative">
                {loading && (
                    <div className="flex items-center justify-center h-48 text-gray-600 text-sm gap-2">
                        <span className="material-icons-round animate-spin text-base">autorenew</span> Se încarcă...
                    </div>
                )}
                {!loading && (
                    <div className="overflow-x-auto overflow-y-visible max-w-full">
                        <table className="w-max text-left border-collapse">
                            <thead>
                                <tr className="text-sm text-gray-500 uppercase tracking-widest border-b border-gray-800/50 bg-surface-dark-lighter/30">
                                    {columns.map(col => (
                                        <th key={col} className="py-4 px-6 font-semibold whitespace-nowrap text-[13px]">{COLUMN_LABELS[col] || col}</th>
                                    ))}
                                    <th className="py-4 px-6 font-medium whitespace-nowrap text-right">Acțiuni</th>
                                </tr>
                            </thead>
                            <tbody className="text-base divide-y divide-gray-800/50">
                                {paginatedOrders.length === 0 && (
                                    <tr><td colSpan={columns.length || 1} className="py-12 text-center text-gray-600 text-sm">Niciun rezultat găsit.</td></tr>
                                )}
                                {paginatedOrders.map((row, i) => (
                                    <tr key={i} className="group hover:bg-white/5 transition-colors">
                                        {columns.map(col => {
                                            const val = row[col];
                                            let strVal = val === null || val === undefined ? '-' : String(val);
                                            
                                            if (col === 'phone' || col === 'phone_number') {
                                                const cleaned = strVal.replace(/\s+/g, '');
                                                if (cleaned.startsWith('+40') && cleaned.length === 12) {
                                                    strVal = `+40 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
                                                } else if (cleaned.startsWith('07') && cleaned.length === 10) {
                                                    strVal = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
                                                }
                                            }
                                            
                                            const truncated = strVal.length > 50 ? strVal.substring(0, 50) + '...' : strVal;
                                            return (
                                                <td 
                                                    key={col} 
                                                    onClick={() => {
                                                        setPreviewCell({ col, val: strVal, rowId: row.id });
                                                        setEditVal(strVal === '-' ? '' : strVal);
                                                    }}
                                                    className="py-4 px-6 text-white whitespace-nowrap font-semibold text-base cursor-pointer hover:bg-white/10 transition-colors" 
                                                    title={strVal}
                                                >
                                                    {truncated}
                                                </td>
                                            );
                                        })}
                                        <td className="py-4 px-6 text-right">
                                            <button 
                                                onClick={() => setViewOrder(row)} 
                                                className="w-8 h-8 btn-3d-secondary rounded-lg inline-flex items-center justify-center hover:text-white transition-colors"
                                                title="Vezi detalii"
                                            >
                                                <span className="material-icons-round text-[18px]">visibility</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-end gap-4 px-2 py-2">
                    <span className="text-sm text-gray-400">
                        Total: <span className="font-semibold text-white">{filteredOrders.length}</span> comenzi
                    </span>
                    <span className="text-sm text-gray-400">
                        Pagina <span className="font-semibold text-white">{currentPage}</span> din <span className="font-semibold text-white">{totalPages}</span>
                    </span>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 text-white"
                        >
                            <span className="material-icons-round text-[18px]">first_page</span>
                        </button>
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 text-white"
                        >
                            <span className="material-icons-round text-[18px]">chevron_left</span>
                        </button>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 text-white"
                        >
                            <span className="material-icons-round text-[18px]">chevron_right</span>
                        </button>
                        <button 
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 text-white"
                        >
                            <span className="material-icons-round text-[18px]">last_page</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Cell Preview Modal */}
            {previewCell && (
                <>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !isSaving && setPreviewCell(null)}>
                        <div className="glass-panel-3d rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-white/10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 shrink-0">
                                <h3 className="text-lg font-medium text-white">Editează: {previewCell.col}</h3>
                                <button onClick={() => setPreviewCell(null)} disabled={isSaving} className="text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                                    <span className="material-icons-round">close</span>
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1 flex flex-col min-h-[300px]">
                                <textarea
                                    value={editVal}
                                    onChange={(e) => setEditVal(e.target.value)}
                                    className="w-full flex-1 bg-[#1a1b23] border border-white/10 rounded-xl p-4 text-sm text-gray-200 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                    placeholder="Introduceți valoarea..."
                                />
                            </div>
                            <div className="p-4 border-t border-white/5 bg-white/5 shrink-0 flex justify-end gap-3">
                                <button onClick={() => setPreviewCell(null)} disabled={isSaving} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50">
                                    Anulează
                                </button>
                                <button onClick={handleSaveCell} disabled={isSaving} className="btn-3d-primary px-6 py-2.5 rounded-xl text-sm font-medium shadow-lg disabled:opacity-50 flex items-center gap-2">
                                    {isSaving ? <span className="material-icons-round animate-spin text-sm">autorenew</span> : <span className="material-icons-round text-sm">save</span>}
                                    {isSaving ? 'Se salvează...' : 'Salvează'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* View Order Modal */}
            {viewOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setViewOrder(null)}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative w-full max-w-2xl bg-[#13141a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                            <h3 className="text-xl font-light text-white flex items-center gap-2">
                                <span className="material-icons-round text-primary">visibility</span>
                                Detalii Comandă
                            </h3>
                            <button 
                                onClick={() => setViewOrder(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <span className="material-icons-round text-xl">close</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.keys(viewOrder).map(key => (
                                    <div key={key} className="bg-white/5 rounded-xl p-4 border border-white/5">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">{key}</div>
                                        <div className="text-gray-200 text-sm break-words font-mono">
                                            {viewOrder[key] === null || viewOrder[key] === undefined 
                                                ? '-' 
                                                : typeof viewOrder[key] === 'object' 
                                                    ? JSON.stringify(viewOrder[key])
                                                    : String(viewOrder[key])}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-end">
                            <button 
                                onClick={() => setViewOrder(null)}
                                className="btn-3d-secondary px-6 py-2.5 rounded-xl text-sm font-medium hover:text-white transition-all"
                            >
                                Închide
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
