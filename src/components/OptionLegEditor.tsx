import { useOptions } from '../context/OptionContext';
import type { OptionLeg, OptionType, PositionType } from '../types/OptionTypes';
import { Trash2, Plus } from 'lucide-react';

export default function OptionLegEditor() {
    const { legs, addLeg, updateLeg, removeLeg, spotPrice, setSpotPrice } = useOptions();

    const handleAddLeg = () => {
        const newLeg: OptionLeg = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'Call',
            position: 'Long',
            strike: spotPrice,
            premium: 5,
            quantity: 1
        };
        addLeg(newLeg);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                    <label className="text-sm text-foreground/70 block mb-1">Spot Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">$</span>
                        <input
                            type="number"
                            value={spotPrice}
                            onChange={(e) => setSpotPrice(Number(e.target.value))}
                            className="w-32 bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 outline-none focus:border-primary transition-colors"
                        />
                    </div>
                </div>
                <button
                    onClick={handleAddLeg}
                    className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-xl transition-all font-medium"
                >
                    <Plus size={18} />
                    Add Leg
                </button>
            </div>

            <div className="space-y-4">
                {legs.map(leg => (
                    <div key={leg.id} className="glass p-4 rounded-2xl relative group transition-all hover:bg-white/10 border-l-4" style={{ borderLeftColor: leg.color || '#fff' }}>
                        <button
                            onClick={() => removeLeg(leg.id)}
                            className="absolute right-3 top-3 text-red-400 opacity-50 hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 pr-8">
                            <select
                                value={leg.position}
                                onChange={(e) => updateLeg(leg.id, { position: e.target.value as PositionType })}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary"
                            >
                                <option value="Long" className="bg-background">Buy (Long)</option>
                                <option value="Short" className="bg-background">Sell (Short)</option>
                            </select>

                            <select
                                value={leg.type}
                                onChange={(e) => updateLeg(leg.id, { type: e.target.value as OptionType })}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary"
                            >
                                <option value="Call" className="bg-background">Call</option>
                                <option value="Put" className="bg-background">Put</option>
                                <option value="Stock" className="bg-background">Underlying Stock</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-2">
                            <div>
                                <label className="text-xs text-foreground/50 block mb-1">Strike</label>
                                <input
                                    type="number"
                                    value={leg.strike}
                                    disabled={leg.type === 'Stock'}
                                    onChange={(e) => updateLeg(leg.id, { strike: Number(e.target.value) })}
                                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1 outline-none transition-colors ${leg.type === 'Stock' ? 'opacity-30 cursor-not-allowed' : 'focus:border-primary'}`}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-foreground/50 block mb-1">{leg.type === 'Stock' ? 'Entry Price' : 'Premium'}</label>
                                <input
                                    type="number"
                                    value={leg.premium}
                                    onChange={(e) => updateLeg(leg.id, { premium: Number(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1 outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-foreground/50 block mb-1">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={leg.quantity}
                                    onChange={(e) => updateLeg(leg.id, { quantity: Number(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1 outline-none focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="mt-3 text-xs flex items-center gap-2 font-medium">
                            <span className={leg.position === 'Long' ? 'text-blue-400' : 'text-orange-400'}>
                                {leg.position === 'Long' ? 'Debit' : 'Credit'}: ${(leg.premium * leg.quantity).toFixed(2)}
                            </span>
                        </div>
                    </div>
                ))}
                {legs.length === 0 && (
                    <div className="text-center text-foreground/40 py-8 border border-dashed border-white/10 rounded-2xl">
                        No active legs
                    </div>
                )}
            </div>
        </div>
    );
}
