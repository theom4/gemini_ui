import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import StoreSelector from '../components/StoreSelector';

const ControlRobotPage = () => {
    const { profile } = useAuth();
    const userStores = profile?.stores || [];
    const [selectedBrand, setSelectedBrand] = useState<string>('');

    useEffect(() => {
        if (userStores.length > 0 && !selectedBrand) {
            setSelectedBrand(userStores[0]);
        }
    }, [userStores, selectedBrand]);

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between px-8 py-6 mb-8">
                <h1 className="text-3xl font-light dark:text-white tracking-tight">Control Robot</h1>
                <StoreSelector
                    selectedBrand={selectedBrand}
                    setSelectedBrand={setSelectedBrand}
                    userStores={userStores}
                />
            </header>

            <div className="flex-1 px-8 space-y-6">
                <div className="bg-surface-light dark:bg-surface-dark-lighter p-8 rounded-2xl border border-gray-200 dark:border-white/5 shadow-lg">
                    <p className="text-xl text-gray-800 dark:text-gray-200 mb-2">Actiune apelare comanda</p>
                    <p className="text-sm text-yellow-500 font-light flex items-center gap-2 mb-6">
                        <span className="material-icons-round text-base">warning</span>
                        Atentie, trebuie sa introduci o comanda cu tag-ul 'n-a raspuns', altfel clientul va fi sunat de mai multe ori
                    </p>

                    <div className="max-w-md flex gap-4">
                        <input
                            type="text"
                            placeholder="numar comanda, de exemplu 4545"
                            className="flex-1 px-4 py-3 rounded-xl bg-background-light dark:bg-[#0a0b14] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-light"
                        />
                        <button className="btn-3d-primary px-6 py-3 rounded-xl text-white font-medium text-sm tracking-wide flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Apeleaza
                        </button>
                    </div>
                </div>

                <div className="bg-surface-light dark:bg-surface-dark-lighter p-8 rounded-2xl border border-gray-200 dark:border-white/5 shadow-lg">
                    <p className="text-xl text-gray-800 dark:text-gray-200 mb-2">Oprire apeluri asupra unui client</p>
                    <p className="text-sm text-yellow-500 font-light flex items-center gap-2 mb-6">
                        <span className="material-icons-round text-base">warning</span>
                        Atentie, pentru urmatoarele 5 zile, clientul nu va mai fi sunat de loc
                    </p>

                    <div className="max-w-md flex gap-4">
                        <input
                            type="text"
                            placeholder="Numarul de telefon, de ex. 0734 343 343"
                            className="flex-1 px-4 py-3 rounded-xl bg-background-light dark:bg-[#0a0b14] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-light"
                        />
                        <button className="btn-3d-primary px-6 py-3 rounded-xl text-white font-medium text-sm tracking-wide flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Activeaza
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ControlRobotPage;
