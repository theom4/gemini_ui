import React, { useState } from 'react';

interface StoreSelectorProps {
    selectedBrand: string;
    setSelectedBrand: (brand: string) => void;
    userStores: string[];
}

const StoreSelector: React.FC<StoreSelectorProps> = ({ selectedBrand, setSelectedBrand, userStores }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className="relative z-50">
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="btn-3d-secondary px-5 py-2.5 rounded-xl text-sm font-normal flex items-center gap-3 hover:text-white transition-all min-w-[160px] justify-between h-[42px]">
                <div className="flex items-center gap-2">
                    <span className="material-icons-round text-lg text-primary">store</span>
                    <span>{selectedBrand || 'Selectează'}</span>
                </div>
                <span className={`material-icons-round text-xl transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {isDropdownOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-full rounded-xl bg-[#13141a] border border-white/5 shadow-xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                        {userStores.map((store) => (
                            <button key={store} onClick={() => { setSelectedBrand(store); setIsDropdownOpen(false); }} className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3 hover:bg-white/5 ${selectedBrand === store ? 'text-white bg-white/5' : 'text-gray-400'}`}>
                                <span className={`w-2 h-2 rounded-full ${selectedBrand === store ? 'bg-primary shadow-[0_0_8px_rgba(0,210,255,0.5)]' : 'bg-transparent border border-gray-600'}`}></span>
                                {store}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default StoreSelector;
