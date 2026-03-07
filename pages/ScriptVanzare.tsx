import React from 'react';

const dummyData = [
    {
        idProdus: 'PRD-001',
        produs: 'Tricou Clasic Alb',
        pret: [29.99, 27.99, 25.99, 23.99, 21.99],
        script: [
            'Acest tricou este perfect pentru zilele calde de vară.',
            'La 2 bucăți beneficiați de livrare gratuită!',
            'Pachet de 3 — ideal ca cadou pentru cei dragi.',
            'Cu 4 bucăți economisiți 24% față de prețul individual.',
            'Cel mai bun raport calitate/preț la 5 bucăți!',
        ],
    },
    {
        idProdus: 'PRD-002',
        produs: 'Pantaloni Sport Negri',
        pret: [89.99, 84.99, 79.99, 74.99, 69.99],
        script: [
            'Confort maxim pentru orice activitate sportivă.',
            '2 perechi = prețul unei perechi premium din altă parte.',
            'Pachet 3 — completați tot garderoba sport.',
            '4 perechi asigură un an întreg de confort.',
            'La 5 bucăți oferta noastră este de nerefuzat.',
        ],
    },
    {
        idProdus: 'PRD-003',
        produs: 'Geacă Impermeabilă',
        pret: [199.99, 189.99, 179.99, 169.99, 159.99],
        script: [
            'Protecție completă împotriva intemperiilor.',
            '2 geci — una pentru tine, una cadou partenerului.',
            'Pachet 3 pentru întreaga familie.',
            'Comandă 4 și te bucuri de prețul de angro.',
            'Cel mai mic preț per geacă la 5 bucăți.',
        ],
    },
    {
        idProdus: 'PRD-004',
        produs: 'Șosete Premium 3-Pack',
        pret: [19.99, 17.99, 15.99, 13.99, 11.99],
        script: [
            'Calitate premium la un preț accesibil.',
            'Dublează confortul cu 2 pachete.',
            '3 pachete = șosete proaspete în fiecare zi.',
            '4 pachete — stoc pentru întregul sezon.',
            'La 5 pachete economisiți 40% instantly.',
        ],
    },
    {
        idProdus: 'PRD-005',
        produs: 'Bluză Lână Merinos',
        pret: [149.99, 139.99, 129.99, 119.99, 109.99],
        script: [
            'Căldură naturală și confort toată iarna.',
            '2 bluze — una casual, una pentru birou.',
            'Pachet 3 pentru o colecție completă de iarnă.',
            '4 bluze în diferite culori pentru orice outfit.',
            'La 5 bucăți, prețul scade sub 110 lei/buc.',
        ],
    },
];

export default function ScriptVanzare() {
    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="xl:min-w-[200px]">
                    <h2 className="text-3xl font-light dark:text-white mb-2 tracking-tight">Script Vanzare</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light">Scripturi și prețuri per produs</p>
                </div>
            </div>

            <div className="card-depth p-1 rounded-2xl overflow-hidden border border-white/5 relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800/50 bg-surface-dark-lighter/30">
                                <th className="py-4 px-4 font-medium sticky left-0 bg-[#0d0e19] z-10">Produs</th>
                                {[1, 2, 3, 4, 5].map(n => (
                                    <th key={n} className="py-4 px-4 font-medium whitespace-nowrap">Pret {n} {n === 1 ? 'bucata' : 'bucati'}</th>
                                ))}
                                {[1, 2, 3, 4, 5].map(n => (
                                    <th key={n} className="py-4 px-4 font-medium whitespace-nowrap">Script {n} {n === 1 ? 'bucata' : 'bucati'}</th>
                                ))}
                                <th className="py-4 px-4 font-medium whitespace-nowrap text-purple-400">ID Produs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {dummyData.map((row) => (
                                <tr key={row.idProdus} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-4 text-gray-200 font-medium sticky left-0 bg-[#0d0e19] group-hover:bg-[#13141a] transition-colors whitespace-nowrap z-10">
                                        {row.produs}
                                    </td>
                                    {row.pret.map((p, i) => (
                                        <td key={i} className="py-4 px-4 font-num whitespace-nowrap">
                                            <span className="px-2 py-0.5 rounded-lg text-[11px] border font-medium bg-emerald-800/20 text-emerald-400 border-emerald-700/30">
                                                {p.toFixed(2)} lei
                                            </span>
                                        </td>
                                    ))}
                                    {row.script.map((s, i) => (
                                        <td key={i} className="py-4 px-4 text-gray-400 font-light max-w-[180px]">
                                            <span className="line-clamp-2 text-xs leading-relaxed" title={s}>{s}</span>
                                        </td>
                                    ))}
                                    <td className="py-4 px-4">
                                        <span className="px-2 py-0.5 rounded-lg text-[11px] border font-mono font-medium bg-purple-500/10 text-purple-400 border-purple-500/20">
                                            {row.idProdus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
