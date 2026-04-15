import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function OnboardingPage() {
    const { profile } = useAuth();
    const [view, setView] = useState<'list' | 'add'>(profile?.stores && profile.stores.length > 0 ? 'list' : 'add');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [storeType, setStoreType] = useState<'shopify' | 'wordpress' | null>(null);
    const [credentials, setCredentials] = useState({
        shopifyClientId: '',
        shopifyClientSecret: '',
        wordpressApiKey: ''
    });

    const navigate = useNavigate();

    const normalizeUrl = (url: string) => {
        const trimmed = url.trim();
        if (!trimmed) return "";
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        // If it looks like a domain (e.g., example.com), add https://
        return `https://${trimmed}`;
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        
        const normalized = normalizeUrl(websiteUrl);
        setWebsiteUrl(normalized);
        
        setLoading(true);
        // Simulate progress/validation
        setTimeout(() => {
            setLoading(false);
            setStep(step + 1);
        }, 800);
    };

    const handleImportFinal = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Final simulation
        setTimeout(() => {
            setLoading(false);
            setStep(4); // Success step
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#0a0b14] flex items-center justify-center overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/20 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
            </div>

            <div className="w-full max-w-2xl p-8 relative z-10">
                <div className="glass-panel-3d rounded-2xl p-10 border border-white/5 shadow-2xl relative overflow-hidden">
                    
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold tracking-tight text-white mb-3" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                            {view === 'list' ? "Magazinele Tale" : "Configurare Magazin"}
                        </h1>
                        <p className="text-gray-400 text-lg font-light max-w-md mx-auto">
                            {view === 'list' 
                                ? "Gestionați conexiunile magazinelor asociate contului dumneavoastră." 
                                : step === 1 ? "Începeți prin a introduce adresa magazinului."
                                : step === 2 ? "Selectați platforma pe care este construit magazinul."
                                : step === 3 ? `Introduceți datele de conectare pentru ${storeType === 'shopify' ? 'Shopify' : 'WordPress'}.`
                                : "Totul este gata!"
                            }
                        </p>
                    </div>

                    {/* Step Indicator / List Header */}
                    {view === 'add' && step < 4 && (
                        <div className="flex items-center justify-center gap-3 mb-10">
                            {[1, 2, 3].map((s) => (
                                <div 
                                    key={s}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? 'w-12 bg-cyan-500 shadow-[0_0_15px_rgba(0,210,255,0.5)]' : s < step ? 'w-4 bg-cyan-500/40' : 'w-4 bg-white/10'}`}
                                />
                            ))}
                        </div>
                    )}

                    <div className="min-h-[320px] flex flex-col justify-center">
                        {view === 'list' ? (
                            <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
                                <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                                    {(profile?.stores || []).map((store) => (
                                        <div key={store} className="glass-panel-3d p-6 rounded-xl border border-white/5 flex items-center justify-between group hover:border-cyan-500/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                                    <span className="material-icons-round">store</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-medium">{store}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                                                        <span className="text-xs text-gray-500 font-light">Sincronizat</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                                                <span className="material-icons-round text-lg">settings</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                
                                <button 
                                    onClick={() => setView('add')}
                                    className="w-full btn-3d-primary py-4 rounded-xl text-white font-semibold text-base tracking-wide flex items-center justify-center gap-3 mt-4"
                                >
                                    <span className="material-icons-round text-xl">add_circle</span>
                                    ADĂUGĂ MAGAZIN NOU
                                </button>
                            </div>
                        ) : (
                            <>
                                {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <form onSubmit={handleNextStep} className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-sm text-gray-400 font-medium ml-1">Adresa Website</label>
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/50 to-blue-500/50 rounded-xl blur opacity-30 group-focus-within:opacity-70 transition duration-300"></div>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-icons-round text-xl">language</span>
                                                <input
                                                    type="text"
                                                    value={websiteUrl}
                                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#13151d] border border-white/10 text-white placeholder-gray-600 text-base focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-sans"
                                                    placeholder="magazin.ro"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full btn-3d-primary py-4 rounded-xl text-white font-semibold text-base tracking-wide flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "CONTINUĂ"}
                                        {!loading && <span className="material-icons-round text-xl">arrow_forward</span>}
                                    </button>
                                </form>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <PlatformCard 
                                        name="Shopify" 
                                        icon="shopping_bag" 
                                        selected={storeType === 'shopify'} 
                                        onClick={() => setStoreType('shopify')} 
                                    />
                                    <PlatformCard 
                                        name="WordPress" 
                                        icon="language" 
                                        selected={storeType === 'wordpress'} 
                                        onClick={() => setStoreType('wordpress')} 
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex-1 btn-3d-secondary py-4 rounded-xl text-gray-400 font-semibold"
                                    >
                                        ÎNAPOI
                                    </button>
                                    <button
                                        disabled={!storeType}
                                        onClick={() => setStep(3)}
                                        className="flex-[2] btn-3d-primary py-4 rounded-xl text-white font-semibold tracking-wide flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        CONTINUĂ
                                        <span className="material-icons-round text-xl">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <form onSubmit={handleImportFinal} className="space-y-6">
                                    {storeType === 'shopify' ? (
                                        <>
                                            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 mb-6">
                                                <p className="text-xs text-cyan-400 flex items-center gap-2">
                                                    <span className="material-icons-round text-sm">info</span>
                                                    Mergi la shopify {'->'} setări {'->'} apps și creează un app nou
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-500 font-medium ml-1 uppercase tracking-wider">Shopify Client ID</label>
                                                <input
                                                    type="text"
                                                    value={credentials.shopifyClientId}
                                                    onChange={(e) => setCredentials({...credentials, shopifyClientId: e.target.value})}
                                                    className="w-full px-4 py-4 rounded-xl bg-[#13151d] border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                                                    placeholder="Introduceți Client ID"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-500 font-medium ml-1 uppercase tracking-wider">Shopify Client Secret</label>
                                                <input
                                                    type="password"
                                                    value={credentials.shopifyClientSecret}
                                                    onChange={(e) => setCredentials({...credentials, shopifyClientSecret: e.target.value})}
                                                    className="w-full px-4 py-4 rounded-xl bg-[#13151d] border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                                                    placeholder="••••••••••••••••"
                                                    required
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 font-medium ml-1 uppercase tracking-wider">WordPress Admin API Key</label>
                                            <input
                                                type="text"
                                                value={credentials.wordpressApiKey}
                                                onChange={(e) => setCredentials({...credentials, wordpressApiKey: e.target.value})}
                                                className="w-full px-4 py-4 rounded-xl bg-[#13151d] border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                                                placeholder="Introduceți API Key"
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="flex-1 btn-3d-secondary py-4 rounded-xl text-gray-400 font-semibold"
                                        >
                                            ÎNAPOI
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-[2] btn-3d-primary py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "FINALIZEAZĂ IMPORTUL"}
                                            {!loading && <span className="material-icons-round text-xl">check_circle</span>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                                {step === 4 && (
                                    <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-500">
                                        <span className="material-icons-round text-7xl text-green-400 mb-6 drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]">task_alt</span>
                                        <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Configurare Completă!</h2>
                                        <p className="text-gray-400 mb-10 max-w-sm mx-auto">
                                            Magazinul tău a fost conectat cu succes. Începem sincronizarea datelor.
                                        </p>
                                        <button
                                            onClick={() => { setStep(1); setView('list'); }}
                                            className="w-full btn-3d-primary py-4 rounded-xl text-white font-semibold text-base"
                                        >
                                            REVENIȚI LA LISTĂ
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <button 
                        onClick={() => view === 'add' ? setView('list') : navigate('/')}
                        className="text-gray-500 hover:text-cyan-400 text-sm font-light transition-all flex items-center gap-2 mx-auto"
                    >
                        <span className="material-icons-round text-sm">{view === 'add' ? 'arrow_back' : 'dashboard'}</span>
                        {view === 'add' ? 'Anulează și revino la listă' : 'Sari peste și mergi la Dashboard'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PlatformCard({ name, icon, selected, onClick }: { name: string; icon: string; selected: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-8 rounded-2xl border transition-all duration-300 gap-4 group ${
                selected 
                ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(0,210,255,0.2)]' 
                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
            }`}
        >
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all ${
                selected ? 'bg-cyan-500 text-white shadow-glow' : 'bg-[#13151d] text-gray-500 group-hover:text-gray-300'
            }`}>
                <span className="material-icons-round text-3xl">{icon}</span>
            </div>
            <span className={`text-lg font-semibold ${selected ? 'text-white' : 'text-gray-400'}`}>{name}</span>
            {selected && (
                <div className="absolute top-3 right-3">
                    <span className="material-icons-round text-cyan-500 text-xl">check_circle</span>
                </div>
            )}
        </button>
    );
}
