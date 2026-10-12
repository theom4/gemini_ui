import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const AVAILABLE_PRODUCTS = [
    { name: 'Ser pete pigmentare', sku: 'DRF-001', link: '' },
    { name: 'Sampon Solid Polygonum', sku: 'DCC-004', link: 'https://kordanostore.ro/polygonum/' },
    { name: 'Sampon solid Rozmarin', sku: 'DCC-007', link: 'https://kordanostore.ro/rozmarin/' },
    { name: 'Plasturi cu Pelin', sku: 'DCC-005', link: '' },
    { name: 'Kit Reparatii', sku: 'DCC-006', link: 'https://kordanostore.ro/kitmagic/' },
    { name: 'Sampon Solid cu Ghimbir', sku: 'DCC-003', link: 'https://kordanostore.ro/sampon/' },
    { name: 'Ser cu Biotina', sku: 'DCC-002', link: 'https://kordanostore.ro/biotina/' },
    { name: 'Bandă Etanșare', sku: 'DCC-010', link: 'https://kordanostore.ro/' },
    { name: 'Ulei Germinal cu Ghimbir', sku: 'DCC-001', link: 'https://kordanostore.ro/ghimbir/' },
    { name: 'Ascutitor Cutite', sku: 'DCC-011', link: 'https://kordanostore.ro/sharpblade/' },
    { name: 'Cutit Magic', sku: 'DRF-008', link: 'https://kordanostore.ro/cutitmagic/' },
];

export default function ProcessedOrders() {
    const { profile, session } = useAuth();
    const userStores = profile?.stores || [];

    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const isKordano = Boolean(selectedBrand && selectedBrand.toLowerCase().includes('kordano'));

    useEffect(() => {
        if (!isKordano) {
            setIsSearchModalOpen(false);
            setIsHistoryOpen(false);
        }
    }, [isKordano]);
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

    // ── Search Order Webhook & Robot Call Modal State ─────────────────
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchPhone, setSearchPhone] = useState('');
    const [isSearchingOrder, setIsSearchingOrder] = useState(false);
    const [searchFeedback, setSearchFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [foundOrders, setFoundOrders] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isOrderNotFound, setIsOrderNotFound] = useState(false);
    const [callingOrderId, setCallingOrderId] = useState<string | null>(null);
    const [callFeedback, setCallFeedback] = useState<{ orderId?: string; type: 'success' | 'error'; message: string } | null>(null);

    // ── Manual Order Input State (când comanda este negăsită) ────────
    const [manualName, setManualName] = useState('');
    const [manualAddress, setManualAddress] = useState('');
    const [manualSelectedProductSku, setManualSelectedProductSku] = useState(AVAILABLE_PRODUCTS[0].sku);
    const [manualQuantity, setManualQuantity] = useState(1);
    const [manualTotal, setManualTotal] = useState('');
    const [isCallingManual, setIsCallingManual] = useState(false);

    // ── Call History & 1-Hour Cooldown Checker ───────────────────────
    const ONE_HOUR_MS = 60 * 60 * 1000;

    const [callHistory, setCallHistory] = useState<any[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('kordano_robot_calls_history') || '[]');
        } catch {
            return [];
        }
    });
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const getRecentCallTimeRemaining = (phone: string): { isBlocked: boolean; minutesRemaining: number } => {
        if (!phone) return { isBlocked: false, minutesRemaining: 0 };
        const norm = phone.replace(/\s+/g, '').slice(-9);
        try {
            const cooldowns = JSON.parse(localStorage.getItem('kordano_called_cooldowns') || '{}');
            const lastCall = cooldowns[norm];
            if (lastCall && typeof lastCall === 'number') {
                const elapsed = Date.now() - lastCall;
                if (elapsed < ONE_HOUR_MS) {
                    const remainingMinutes = Math.ceil((ONE_HOUR_MS - elapsed) / (60 * 1000));
                    return { isBlocked: true, minutesRemaining: Math.max(1, remainingMinutes) };
                }
            }
        } catch (e) {
            console.error('Eroare verificare cooldown apel:', e);
        }
        return { isBlocked: false, minutesRemaining: 0 };
    };

    const handleCallRobot = async (order: any) => {
        if (!isKordano) return;
        const rawPhone = order?.phone_number || order?.phone || searchPhone;
        if (!rawPhone) {
            alert('Numărul de telefon lipsește.');
            return;
        }

        const cleanPhone = rawPhone.trim().replace(/\s+/g, '');
        const cooldownCheck = getRecentCallTimeRemaining(cleanPhone);
        const orderKey = String(order?.id || order?.order_id || order?.order_number || cleanPhone);

        if (cooldownCheck.isBlocked) {
            setCallFeedback({
                orderId: orderKey,
                type: 'error',
                message: `Acest număr a fost deja trimis să sune recent! Poți trimite din nou peste ${cooldownCheck.minutesRemaining} ${cooldownCheck.minutesRemaining === 1 ? 'minut' : 'minute'}.`
            });
            return;
        }

        setCallingOrderId(orderKey);
        setCallFeedback(null);

        try {
            const webhookUrl = 'https://n8n.voisero.info/webhook/control-robot-kordanostore';
            const orderNum = order?.order_id || order?.id || order?.order_number || '';
            const orderType = order?.type || order?.tip_comanda || 'comanda';

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`
                },
                body: JSON.stringify({
                    shop: selectedBrand || 'Kordanostore',
                    store: selectedBrand || 'Kordanostore',
                    phone_number: cleanPhone,
                    phone: cleanPhone,
                    order_number: orderNum,
                    order_id: orderNum,
                    tip_comanda: orderType,
                    type: orderType,
                    action: 'call'
                })
            });

            if (response.ok) {
                setCallFeedback({
                    orderId: orderKey,
                    type: 'success',
                    message: `Comanda ${orderNum ? '#' + orderNum : ''} a fost trimisă cu succes către robot!`
                });

                // Salvează cooldown de 1 oră în localStorage
                try {
                    const norm = cleanPhone.slice(-9);
                    const cooldowns = JSON.parse(localStorage.getItem('kordano_called_cooldowns') || '{}');
                    cooldowns[norm] = Date.now();
                    localStorage.setItem('kordano_called_cooldowns', JSON.stringify(cooldowns));
                } catch (e) {
                    console.error('Eroare salvare cooldown:', e);
                }

                // Salvează în istoricul local
                const newCallItem = {
                    name: order?.name || order?.client_name || 'Client',
                    phone: cleanPhone,
                    orderId: orderNum,
                    total: order?.value || order?.total || '',
                    time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
                    date: new Date().toLocaleDateString('ro-RO')
                };

                setCallHistory(prev => {
                    const updated = [newCallItem, ...prev].slice(0, 50);
                    try {
                        localStorage.setItem('kordano_robot_calls_history', JSON.stringify(updated));
                    } catch (e) {
                        console.error('Eroare salvare istoric apeluri:', e);
                    }
                    return updated;
                });
            } else {
                setCallFeedback({
                    orderId: orderKey,
                    type: 'error',
                    message: `Eroare server robot (${response.status}).`
                });
            }
        } catch (error: any) {
            console.error('Eroare webhook control-robot:', error);
            setCallFeedback({
                orderId: orderKey,
                type: 'error',
                message: 'Eroare la conectarea cu robotul n8n.'
            });
        } finally {
            setCallingOrderId(null);
        }
    };

    const handleResetSearch = () => {
        setFoundOrders([]);
        setHasSearched(false);
        setIsOrderNotFound(false);
        setSearchFeedback(null);
        setCallFeedback(null);
        setManualName('');
        setManualAddress('');
        setManualSelectedProductSku(AVAILABLE_PRODUCTS[0].sku);
        setManualQuantity(1);
        setManualTotal('');
    };

    const handleCallManualOrder = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!isKordano) return;
        const cleanPhone = searchPhone.trim().replace(/\s+/g, '');
        if (!cleanPhone) {
            alert('Numărul de telefon lipsește.');
            return;
        }
        const cleanTotal = manualTotal.trim().replace(',', '.');
        if (!cleanTotal) {
            alert('Te rugăm să introduci totalul comenzii.');
            return;
        }
        const quantityNum = Math.max(1, Number(manualQuantity) || 1);
        const prodObj = AVAILABLE_PRODUCTS.find(p => p.sku === manualSelectedProductSku) || AVAILABLE_PRODUCTS[0];

        const cooldownCheck = getRecentCallTimeRemaining(cleanPhone);
        if (cooldownCheck.isBlocked) {
            setCallFeedback({
                type: 'error',
                message: `Acest număr a fost deja trimis să sune recent! Poți trimite din nou peste ${cooldownCheck.minutesRemaining} ${cooldownCheck.minutesRemaining === 1 ? 'minut' : 'minute'}.`
            });
            return;
        }

        setIsCallingManual(true);
        setCallFeedback(null);

        try {
            const webhookUrl = 'https://n8n.voisero.info/webhook/control-robot-kordanostore';
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`
                },
                body: JSON.stringify({
                    shop: selectedBrand || 'Kordanostore',
                    store: selectedBrand || 'Kordanostore',
                    phone_number: cleanPhone,
                    phone: cleanPhone,
                    name: manualName.trim(),
                    client_name: manualName.trim(),
                    adresa: manualAddress.trim(),
                    address: manualAddress.trim(),
                    produs: prodObj.name,
                    product: prodObj.name,
                    sku: prodObj.sku,
                    link: prodObj.link,
                    cantitate: quantityNum,
                    quantity: quantityNum,
                    total: cleanTotal,
                    total_price: cleanTotal,
                    valoare: cleanTotal,
                    value: cleanTotal,
                    total_comanda: cleanTotal,
                    produse: `${prodObj.name} (${prodObj.sku}) x${quantityNum}`,
                    order_number: '',
                    order_id: '',
                    tip_comanda: 'comanda',
                    type: 'comanda',
                    action: 'call'
                })
            });

            if (response.ok) {
                setCallFeedback({
                    type: 'success',
                    message: 'Comanda a fost trimisă cu succes către robot!'
                });

                // Salvează cooldown de 1 oră în localStorage
                try {
                    const norm = cleanPhone.slice(-9);
                    const cooldowns = JSON.parse(localStorage.getItem('kordano_called_cooldowns') || '{}');
                    cooldowns[norm] = Date.now();
                    localStorage.setItem('kordano_called_cooldowns', JSON.stringify(cooldowns));
                } catch (err) {
                    console.error('Eroare salvare cooldown:', err);
                }

                // Salvează în istoricul local
                const newCallItem = {
                    name: manualName.trim() || 'Comandă manuală',
                    phone: cleanPhone,
                    orderId: 'Manual',
                    total: cleanTotal,
                    time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
                    date: new Date().toLocaleDateString('ro-RO')
                };

                setCallHistory(prev => {
                    const updated = [newCallItem, ...prev].slice(0, 50);
                    try {
                        localStorage.setItem('kordano_robot_calls_history', JSON.stringify(updated));
                    } catch (err) {
                        console.error('Eroare salvare istoric apeluri:', err);
                    }
                    return updated;
                });
            } else {
                setCallFeedback({
                    type: 'error',
                    message: `Eroare server robot (${response.status}).`
                });
            }
        } catch (err: any) {
            console.error('Eroare webhook control-robot:', err);
            setCallFeedback({
                type: 'error',
                message: 'Eroare la conectarea cu robotul n8n.'
            });
        } finally {
            setIsCallingManual(false);
        }
    };

    const handleSearchOrder = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!isKordano) return;
        const trimmed = searchPhone.trim();
        if (!trimmed) {
            alert('Te rugăm să introduci numărul de telefon.');
            return;
        }

        setIsSearchingOrder(true);
        setSearchFeedback(null);
        setCallFeedback(null);
        setFoundOrders([]);
        setHasSearched(false);
        setIsOrderNotFound(false);

        try {
            const cleanPhone = trimmed.replace(/\s+/g, '');
            const webhookUrl = 'https://n8n.voisero.info/webhook/search-order-kordano';

            let webhookOrders: any[] = [];
            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token || ''}`
                    },
                    body: JSON.stringify({
                        phone_number: cleanPhone,
                        shop: selectedBrand || 'Kordanostore',
                        store: selectedBrand || 'Kordanostore'
                    })
                });

                if (response.ok) {
                    const webhookData = await response.json().catch(() => null);
                    if (webhookData) {
                        if (Array.isArray(webhookData)) {
                            webhookOrders = webhookData.map(item => item?.json || item).filter(Boolean);
                        } else if (typeof webhookData === 'object') {
                            if (Array.isArray(webhookData.orders)) {
                                webhookOrders = webhookData.orders;
                            } else if (Array.isArray(webhookData.data)) {
                                webhookOrders = webhookData.data;
                            } else if (Array.isArray(webhookData.items)) {
                                webhookOrders = webhookData.items;
                            } else if (webhookData.order) {
                                webhookOrders = [webhookData.order];
                            } else if (webhookData.name || webhookData.produse || webhookData.total || webhookData.value || webhookData.adresa || webhookData.order_id || webhookData.id) {
                                webhookOrders = [webhookData];
                            }
                        }
                    }
                }
            } catch (whErr) {
                console.warn('Webhook search order error/timeout, fallback to DB:', whErr);
            }

            // Căutăm și în baza de date Supabase orders după numărul de telefon
            const last9 = cleanPhone.slice(-9);
            const { data: dbOrders, error: dbError } = await supabase
                .from('orders')
                .select('*')
                .or(`phone_number.ilike.%${last9}%,phone.ilike.%${last9}%`)
                .order('created_at', { ascending: false });

            if (dbError) {
                console.error('Eroare căutare comenzi în DB:', dbError);
            }

            // Combinăm rezultatele din webhook și din DB fără duplicate
            const combinedList: any[] = [];
            const seenKeys = new Set<string>();

            const addOrder = (ord: any) => {
                if (!ord) return;
                const idKey = String(ord.id || ord.order_id || ord.order_number || `${ord.phone_number || ord.phone || cleanPhone}_${ord.created_at || Math.random()}`);
                if (!seenKeys.has(idKey)) {
                    seenKeys.add(idKey);
                    combinedList.push(ord);
                }
            };

            webhookOrders.forEach(addOrder);
            (dbOrders || []).forEach(addOrder);

            if (combinedList.length > 0) {
                setFoundOrders(combinedList);
                setSearchFeedback({
                    type: 'success',
                    message: combinedList.length === 1 
                        ? 'A fost găsită 1 comandă pentru acest număr!' 
                        : `S-au găsit ${combinedList.length} comenzi pentru acest număr!`
                });
                setHasSearched(true);
                setIsOrderNotFound(false);
            } else {
                setFoundOrders([]);
                setIsOrderNotFound(true);
                setHasSearched(true);
                setSearchFeedback(null);
            }
        } catch (error: any) {
            console.error('Eroare generală la căutarea comenzii:', error);
            setFoundOrders([]);
            setIsOrderNotFound(true);
            setHasSearched(true);
            setSearchFeedback(null);
        } finally {
            setIsSearchingOrder(false);
        }
    };

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
                console.log(`[ProcessedOrders] S-au găsit ${data?.length || 0} comenzi pentru ${selectedBrand}.`, { count: data?.length, error, data });
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
                    {/* Funcționalitate Apeluri Robot disponibilă exclusiv pentru magazinul Kordano */}
                    {isKordano && (
                        <>
                            {/* Mini popup cu istoric comenzi trimise să sune */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                    className="btn-3d-secondary px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 h-[42px] hover:text-white transition-all shadow-sm"
                                    title="Istoric comenzi trimise la robot"
                                >
                                    <span className="material-icons-round text-base text-gray-400">history</span>
                                    <span className="hidden sm:inline">Istoric</span>
                                    {callHistory.length > 0 && (
                                        <span className="bg-primary/20 text-primary border border-primary/30 text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-[20px] text-center">
                                            {callHistory.length}
                                        </span>
                                    )}
                                </button>

                                {isHistoryOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsHistoryOpen(false)} />
                                        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#13141a] border border-white/10 shadow-2xl z-50 overflow-hidden backdrop-blur-md p-4 space-y-3 animate-fade-in">
                                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-icons-round text-primary text-base">history</span>
                                                    <h4 className="text-sm font-semibold text-white">Comenzi trimise la robot</h4>
                                                </div>
                                                {callHistory.length > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            setCallHistory([]);
                                                            localStorage.removeItem('kordano_robot_calls_history');
                                                        }}
                                                        className="text-[11px] text-gray-400 hover:text-red-400 transition-colors"
                                                    >
                                                        Șterge
                                                    </button>
                                                )}
                                            </div>

                                            {callHistory.length === 0 ? (
                                                <div className="py-6 text-center text-xs text-gray-500">
                                                    Nicio comandă trimisă la robot încă.
                                                </div>
                                            ) : (
                                                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                                    {callHistory.map((item, idx) => (
                                                        <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 text-xs space-y-1 hover:bg-white/[0.05] transition-colors">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-semibold text-white truncate max-w-[180px]">
                                                                    {item.name || 'Client'}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400">{item.time}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[11px]">
                                                                <span className="font-mono text-gray-300">{item.phone}</span>
                                                                <span className="text-emerald-400 font-medium">
                                                                    {item.total ? `${item.total} lei` : ''}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[10px] text-emerald-400 pt-0.5">
                                                                <span className="material-icons-round text-[13px]">check_circle</span>
                                                                <span>Trimis la robot</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setIsSearchModalOpen(true);
                                    handleResetSearch();
                                }}
                                className="btn-3d-primary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 h-[42px] hover:text-white transition-all shadow-sm"
                                title="Caută comanda după număr de telefon"
                            >
                                <span className="material-icons-round text-base">call</span>
                                Sună acum
                            </button>
                        </>
                    )}

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

            {/* Modal Sună Acum / Caută Comandă - exclusiv Kordano */}
            {isSearchModalOpen && isKordano && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-[#13141a] border border-white/10 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col p-6 animate-scale-up">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <span className="material-icons-round text-xl">phone_in_talk</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white leading-tight">Caută comandă</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {hasSearched
                                            ? (isOrderNotFound ? `Comandă negăsită pentru: ${searchPhone}` : `Rezultate căutare pentru: ${searchPhone}`)
                                            : 'Introdu numărul de telefon al clientului'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsSearchModalOpen(false);
                                    handleResetSearch();
                                }}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                            >
                                <span className="material-icons-round text-lg">close</span>
                            </button>
                        </div>

                        {/* Content: Form sau Lista Comenzi Găsite */}
                        {!hasSearched ? (
                            <form onSubmit={handleSearchOrder} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                                        Număr de telefon
                                    </label>
                                    <div className="relative">
                                        <span className="material-icons-round absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg">call</span>
                                        <input
                                            type="tel"
                                            value={searchPhone}
                                            onChange={(e) => setSearchPhone(e.target.value)}
                                            placeholder="07xx xxx xxx"
                                            autoFocus
                                            className="w-full bg-[#1a1b23] border border-white/10 text-white text-base rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-600 font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Feedback Message */}
                                {searchFeedback && (
                                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                                        searchFeedback.type === 'success' 
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                                    }`}>
                                        <span className="material-icons-round text-base">
                                            {searchFeedback.type === 'success' ? 'check_circle' : 'error'}
                                        </span>
                                        <span>{searchFeedback.message}</span>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSearchModalOpen(false);
                                            handleResetSearch();
                                        }}
                                        className="btn-3d-secondary px-5 py-3 rounded-xl text-sm font-medium hover:text-white transition-all flex-1"
                                    >
                                        Anulează
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSearchingOrder || !searchPhone.trim()}
                                        className="btn-3d-primary px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 flex-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg"
                                    >
                                        {isSearchingOrder ? (
                                            <>
                                                <span className="material-icons-round animate-spin text-base">autorenew</span>
                                                <span>Se caută...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-icons-round text-base">search</span>
                                                <span>Caută comanda</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : isOrderNotFound ? (
                            <div className="flex flex-col flex-1 min-h-0 space-y-4">
                                {/* Alertă Comandă negăsită */}
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 shrink-0">
                                    <span className="material-icons-round text-amber-400 text-xl mt-0.5 shrink-0">info</span>
                                    <div>
                                        <h4 className="text-sm font-semibold text-white">Comandă negăsită</h4>
                                        <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                                            Nu a fost găsită nicio comandă pentru numărul <span className="font-mono font-bold text-white">{searchPhone}</span>.
                                            Introdu detaliile comenzii pentru a putea suna:
                                        </p>
                                    </div>
                                </div>

                                {/* Formular introducere detalii comandă */}
                                <form onSubmit={handleCallManualOrder} className="space-y-3.5 overflow-y-auto pr-1.5 custom-scrollbar flex-1 max-h-[50vh]">
                                    {/* Nume client */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1 tracking-wider flex items-center justify-between">
                                            <span className="uppercase">Nume client</span>
                                            <span className="text-[11px] text-cyan-400 font-normal normal-case">(indicat să completezi cu ce ai)</span>
                                        </label>
                                        <div className="relative">
                                            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">person</span>
                                            <input
                                                type="text"
                                                value={manualName}
                                                onChange={(e) => setManualName(e.target.value)}
                                                placeholder="ex: Ion Popescu"
                                                className="w-full bg-[#1a1b23] border border-white/10 text-white text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Adresă / Stradă */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1 tracking-wider flex items-center justify-between">
                                            <span className="uppercase">Adresă / Stradă</span>
                                            <span className="text-[11px] text-cyan-400 font-normal normal-case">(indicat să completezi cu ce ai)</span>
                                        </label>
                                        <div className="relative">
                                            <span className="material-icons-round absolute left-3 top-3 text-gray-500 text-base">home</span>
                                            <textarea
                                                rows={2}
                                                value={manualAddress}
                                                onChange={(e) => setManualAddress(e.target.value)}
                                                placeholder="ex: Str. Libertății nr. 10, Bl. 2, Ap. 15, București"
                                                className="w-full bg-[#1a1b23] border border-white/10 text-white text-sm rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-600 resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Produs */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                                            Produs *
                                        </label>
                                        <div className="relative">
                                            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">inventory_2</span>
                                            <select
                                                value={manualSelectedProductSku}
                                                onChange={(e) => setManualSelectedProductSku(e.target.value)}
                                                className="w-full bg-[#1a1b23] border border-white/10 text-white text-sm rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                                            >
                                                {AVAILABLE_PRODUCTS.map((prod) => (
                                                    <option key={prod.sku} value={prod.sku} className="bg-[#13141a] text-white">
                                                        {prod.name} ({prod.sku})
                                                    </option>
                                                ))}
                                            </select>
                                            <span className="material-icons-round absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">expand_more</span>
                                        </div>
                                    </div>

                                    {/* Cantitate și Total Comandă */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                                                Cantitate *
                                            </label>
                                            <div className="relative">
                                                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">format_list_numbered</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    required
                                                    value={manualQuantity}
                                                    onChange={(e) => setManualQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="w-full bg-[#1a1b23] border border-white/10 text-white text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                                                Total comandă (lei) *
                                            </label>
                                            <div className="relative">
                                                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">payments</span>
                                                <input
                                                    type="text"
                                                    required
                                                    value={manualTotal}
                                                    onChange={(e) => setManualTotal(e.target.value)}
                                                    placeholder="ex: 149.00"
                                                    className="w-full bg-[#1a1b23] border border-white/10 text-white text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-600 font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Call Feedback dacă există */}
                                    {callFeedback && (
                                        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                                            callFeedback.type === 'success' 
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                                        }`}>
                                            <span className="material-icons-round text-base">
                                                {callFeedback.type === 'success' ? 'check_circle' : 'error'}
                                            </span>
                                            <span>{callFeedback.message}</span>
                                        </div>
                                    )}

                                    {/* Avertisment Cooldown 1 oră dacă numărul e blocat */}
                                    {(() => {
                                        const clean = searchPhone.trim().replace(/\s+/g, '');
                                        const cooldown = getRecentCallTimeRemaining(clean);
                                        if (cooldown.isBlocked) {
                                            return (
                                                <div className="p-3 rounded-xl text-xs flex items-center gap-2 border bg-amber-500/10 border-amber-500/30 text-amber-300">
                                                    <span className="material-icons-round text-base text-amber-400">schedule</span>
                                                    <span>Numărul a fost deja trimis să sune recent. Poate fi resunat peste {cooldown.minutesRemaining} {cooldown.minutesRemaining === 1 ? 'minut' : 'minute'}.</span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Buton Sună Acum */}
                                    <div className="pt-1">
                                        {(() => {
                                            const clean = searchPhone.trim().replace(/\s+/g, '');
                                            const cooldown = getRecentCallTimeRemaining(clean);
                                            const isBlocked = cooldown.isBlocked;
                                            const isMissingTotal = !manualTotal.trim();

                                            return (
                                                <button
                                                    type="submit"
                                                    disabled={isCallingManual || isBlocked || isMissingTotal}
                                                    className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-md text-white ${
                                                        isBlocked || isMissingTotal
                                                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 cursor-not-allowed opacity-60'
                                                            : 'btn-3d-primary active:scale-95 disabled:opacity-50'
                                                    }`}
                                                >
                                                    {isCallingManual ? (
                                                        <>
                                                            <span className="material-icons-round animate-spin text-lg">autorenew</span>
                                                            <span>Se inițiază apelul robotului...</span>
                                                        </>
                                                    ) : isBlocked ? (
                                                        <>
                                                            <span className="material-icons-round text-lg text-amber-400">lock_clock</span>
                                                            <span>Blocat 1 oră ({cooldown.minutesRemaining} min rămase)</span>
                                                        </>
                                                    ) : isMissingTotal ? (
                                                        <>
                                                            <span className="material-icons-round text-lg text-amber-400">payments</span>
                                                            <span>Introdu totalul pentru a suna</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="material-icons-round text-lg">call</span>
                                                            <span>Sună acum</span>
                                                        </>
                                                    )}
                                                </button>
                                            );
                                        })()}
                                    </div>
                                </form>

                                {/* Butoane Caută alt număr / Închide fereastra */}
                                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleResetSearch}
                                        className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                                    >
                                        <span className="material-icons-round text-sm">arrow_back</span>
                                        Caută alt număr
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSearchModalOpen(false);
                                            handleResetSearch();
                                        }}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        Închide fereastra
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col flex-1 min-h-0 space-y-4">
                                {/* Bară informativă număr comenzi găsite */}
                                <div className="flex items-center justify-between pb-1 border-b border-white/5 shrink-0 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">Comenzi găsite:</span>
                                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
                                            {foundOrders.length}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleResetSearch}
                                        className="text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                                    >
                                        <span className="material-icons-round text-sm">arrow_back</span>
                                        Caută alt număr
                                    </button>
                                </div>

                                {/* Feedback Căutare dacă există */}
                                {searchFeedback && (
                                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border shrink-0 ${
                                        searchFeedback.type === 'success' 
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                    }`}>
                                        <span className="material-icons-round text-base">
                                            {searchFeedback.type === 'success' ? 'check_circle' : 'info'}
                                        </span>
                                        <span>{searchFeedback.message}</span>
                                    </div>
                                )}

                                {/* Listă carduri pentru fiecare comandă */}
                                <div className="overflow-y-auto pr-1.5 custom-scrollbar space-y-3.5 flex-1 max-h-[55vh]">
                                    {foundOrders.map((order, idx) => {
                                        const orderKey = String(order?.id || order?.order_id || order?.order_number || idx);
                                        const orderPhone = order?.phone_number || order?.phone || searchPhone;
                                        const cleanOrderPhone = (orderPhone || '').trim().replace(/\s+/g, '');
                                        const cooldown = getRecentCallTimeRemaining(cleanOrderPhone);
                                        const isBlocked = cooldown.isBlocked;
                                        const isCallingThis = callingOrderId === orderKey;
                                        const isCallingAny = callingOrderId !== null;

                                        return (
                                            <div key={orderKey} className="bg-[#1a1b23] border border-white/10 rounded-2xl p-4 space-y-3 shadow-md hover:border-white/20 transition-all">
                                                {/* Header Card Comandă */}
                                                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <span className="font-semibold text-white text-base truncate">
                                                            {order.name || order.client_name || 'Client'}
                                                        </span>
                                                        {(order.order_id || order.id || order.order_number) && (
                                                            <span className="text-xs text-gray-400 font-mono shrink-0">
                                                                #{order.order_id || order.id || order.order_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {order.type && (
                                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                                                                {order.type}
                                                            </span>
                                                        )}
                                                        {order.status && (
                                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30 uppercase">
                                                                {order.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Informații cheie: Telefon, Valoare, Dată */}
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                                    <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                                                        <span className="text-gray-500 block mb-0.5 font-medium">Telefon</span>
                                                        <span className="text-white font-mono font-semibold">
                                                            {orderPhone}
                                                        </span>
                                                    </div>
                                                    <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                                                        <span className="text-gray-500 block mb-0.5 font-medium">Valoare</span>
                                                        <span className="text-emerald-400 font-bold">
                                                            {order.value ?? order.total ?? '-'} {order.value || order.total ? 'lei' : ''}
                                                        </span>
                                                    </div>
                                                    {order.created_at && (
                                                        <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
                                                            <span className="text-gray-500 block mb-0.5 font-medium">Dată</span>
                                                            <span className="text-gray-300">
                                                                {new Date(order.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Adresă livrare dacă există */}
                                                {(order.adresa || order.oras || order.judet) && (
                                                    <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5 text-xs">
                                                        <span className="text-gray-500 block mb-0.5 font-medium">Adresă livrare</span>
                                                        <span className="text-gray-200">
                                                            {[order.adresa, order.oras, order.judet].filter(Boolean).join(', ')}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Produse dacă există */}
                                                {order.produse && (
                                                    <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5 text-xs">
                                                        <span className="text-gray-500 block mb-0.5 font-medium">Produse comandate</span>
                                                        <span className="text-gray-300 break-words">
                                                            {typeof order.produse === 'object' ? JSON.stringify(order.produse) : String(order.produse)}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Feedback specific apel robot pentru această comandă */}
                                                {callFeedback && (callFeedback.orderId === orderKey || !callFeedback.orderId) && (
                                                    <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                                                        callFeedback.type === 'success' 
                                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                                                    }`}>
                                                        <span className="material-icons-round text-base">
                                                            {callFeedback.type === 'success' ? 'check_circle' : 'error'}
                                                        </span>
                                                        <span>{callFeedback.message}</span>
                                                    </div>
                                                )}

                                                {/* Avertisment Cooldown 1 oră */}
                                                {isBlocked && (
                                                    <div className="p-2.5 rounded-xl text-xs flex items-center gap-2 border bg-amber-500/10 border-amber-500/30 text-amber-300">
                                                        <span className="material-icons-round text-base text-amber-400">schedule</span>
                                                        <span>Numărul a fost deja trimis să sune recent. Poate fi resunat peste {cooldown.minutesRemaining} {cooldown.minutesRemaining === 1 ? 'minut' : 'minute'}.</span>
                                                    </div>
                                                )}

                                                {/* Buton Sună Acum individual pentru fiecare comandă */}
                                                <div className="pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCallRobot(order)}
                                                        disabled={isCallingThis || isCallingAny || isBlocked}
                                                        className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-md text-white ${
                                                            isBlocked
                                                                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 cursor-not-allowed'
                                                                : 'btn-3d-primary active:scale-95 disabled:opacity-50'
                                                        }`}
                                                    >
                                                        {isCallingThis ? (
                                                            <>
                                                                <span className="material-icons-round animate-spin text-lg">autorenew</span>
                                                                <span>Se trimite comanda către robot...</span>
                                                            </>
                                                        ) : isBlocked ? (
                                                            <>
                                                                <span className="material-icons-round text-lg text-amber-400">lock_clock</span>
                                                                <span>Blocat 1 oră ({cooldown.minutesRemaining} min rămase)</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="material-icons-round text-lg">call</span>
                                                                <span>Sună acum</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Butoane Caută alt număr / Închide fereastra */}
                                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleResetSearch}
                                        className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                                    >
                                        <span className="material-icons-round text-sm">arrow_back</span>
                                        Caută altă comandă
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSearchModalOpen(false);
                                            handleResetSearch();
                                        }}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        Închide fereastra
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
