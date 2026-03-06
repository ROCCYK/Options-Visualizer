import { useOptions } from '../context/OptionContext';
import type { OptionLeg } from '../types/OptionTypes';
import { BookOpen } from 'lucide-react';

export default function StrategySelector() {
    const { setLegsBulk, spotPrice } = useOptions();

    const applyStrategy = (name: string) => {
        let newLegs: OptionLeg[] = [];
        const id = () => Math.random().toString(36).substr(2, 9);

        // Default assumptions based on spot price to generate visual profiles
        const atm = spotPrice;

        switch (name) {
            case 'Straddle':
                newLegs = [
                    { id: id(), type: 'Call', position: 'Long', strike: atm, premium: 6, quantity: 1 },
                    { id: id(), type: 'Put', position: 'Long', strike: atm, premium: 4, quantity: 1 }
                ];
                break;
            case 'Strangle':
                newLegs = [
                    { id: id(), type: 'Call', position: 'Short', strike: atm + 10, premium: 3, quantity: 1 },
                    { id: id(), type: 'Put', position: 'Short', strike: atm - 10, premium: 4, quantity: 1 }
                ]; // Short Strangle based on practice question 3
                break;
            case 'Bull Spread':
                newLegs = [
                    { id: id(), type: 'Put', position: 'Long', strike: atm - 5, premium: 4, quantity: 1 },
                    { id: id(), type: 'Put', position: 'Short', strike: atm, premium: 7, quantity: 1 }
                ]; // Bull Put Spread based on practice question 1
                break;
            case 'Bear Spread':
                newLegs = [
                    { id: id(), type: 'Put', position: 'Short', strike: atm - 5, premium: 4, quantity: 1 },
                    { id: id(), type: 'Put', position: 'Long', strike: atm, premium: 7, quantity: 1 }
                ]; // Bear Put Spread based on practice question 1
                break;
            case 'Butterfly Spread':
                newLegs = [
                    { id: id(), type: 'Put', position: 'Long', strike: atm - 5, premium: 3, quantity: 1 },
                    { id: id(), type: 'Put', position: 'Short', strike: atm, premium: 5, quantity: 2 },
                    { id: id(), type: 'Put', position: 'Long', strike: atm + 5, premium: 8, quantity: 1 }
                ]; // based on question 4
                break;
            case 'Protective Put':
                newLegs = [
                    { id: id(), type: 'Stock', position: 'Long', strike: atm, premium: atm, quantity: 1 },
                    { id: id(), type: 'Put', position: 'Long', strike: atm, premium: 5, quantity: 1 }
                ];
                break;
            case 'Covered Call':
                newLegs = [
                    { id: id(), type: 'Stock', position: 'Long', strike: atm, premium: atm, quantity: 1 },
                    { id: id(), type: 'Call', position: 'Short', strike: atm + 5, premium: 3, quantity: 1 }
                ];
                break;
            case 'Strip':
                newLegs = [
                    { id: id(), type: 'Call', position: 'Long', strike: atm, premium: 5, quantity: 1 },
                    { id: id(), type: 'Put', position: 'Long', strike: atm, premium: 4, quantity: 2 }
                ];
                break;
            case 'Strap':
                newLegs = [
                    { id: id(), type: 'Call', position: 'Long', strike: atm, premium: 5, quantity: 2 },
                    { id: id(), type: 'Put', position: 'Long', strike: atm, premium: 4, quantity: 1 }
                ];
                break;
            case 'Clear':
                newLegs = [];
                break;
        }

        setLegsBulk(newLegs);
    };

    const strategies = [
        { name: 'Covered Call', desc: 'Hold stock + sell call. Limited upside, slight downside protection.' },
        { name: 'Protective Put', desc: 'Hold stock + buy put. Unlimited upside, strict downside limit.' },
        { name: 'Bull Spread', desc: 'Profit from moderate rise.' },
        { name: 'Bear Spread', desc: 'Profit from moderate drop.' },
        { name: 'Straddle', desc: 'Profit from high volatility.' },
        { name: 'Strap', desc: 'Volatile, biased upwards (2 Calls, 1 Put).' },
        { name: 'Strip', desc: 'Volatile, biased downwards (1 Call, 2 Puts).' },
        { name: 'Strangle', desc: 'Profit from low volatility (Short).' },
        { name: 'Butterfly Spread', desc: 'Profit from exact target.' },
    ];

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground/70">
                <BookOpen size={16} /> <span>Educational Presets</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {strategies.map(s => (
                    <button
                        key={s.name}
                        onClick={() => applyStrategy(s.name)}
                        className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 text-foreground py-2 px-2 sm:px-3 rounded-lg transition-all text-center flex items-center justify-center h-full"
                        title={s.desc}
                    >
                        {s.name}
                    </button>
                ))}
                <button
                    onClick={() => applyStrategy('Clear')}
                    className="text-xs w-full sm:col-span-full lg:col-span-1 lg:ml-auto bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-2 px-3 rounded-lg transition-all"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}
