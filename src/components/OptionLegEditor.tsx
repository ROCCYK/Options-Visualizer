import { useMemo, useState } from 'react';
import { useOptions } from '../context/useOptions';
import type { OptionLeg, OptionType, PositionType } from '../types/OptionTypes';
import { Trash2, Plus } from 'lucide-react';

const sanitizeNumberInput = (fieldKey: string, value: number): number => {
    if (fieldKey.endsWith(':quantity')) {
        return Math.max(1, value);
    }

    return Math.max(0, value);
};

export default function OptionLegEditor() {
    const { legs, addLeg, updateLeg, removeLeg, spotPrice, setSpotPrice } = useOptions();
    const [draftValues, setDraftValues] = useState<Record<string, string>>({});
    const [activeField, setActiveField] = useState<string | null>(null);

    const fieldValues = useMemo(() => {
        const next: Record<string, string> = {
            spotPrice: String(spotPrice),
        };

        for (const leg of legs) {
            next[`${leg.id}:strike`] = String(leg.strike);
            next[`${leg.id}:premium`] = String(leg.premium);
            next[`${leg.id}:quantity`] = String(leg.quantity);
        }

        return next;
    }, [legs, spotPrice]);

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

    const handleNumberChange = (fieldKey: string, rawValue: string, commit: (value: number) => void) => {
        setDraftValues(prev => ({ ...prev, [fieldKey]: rawValue }));

        if (rawValue.trim() === '') {
            return;
        }

        const parsedValue = Number(rawValue);
        if (Number.isFinite(parsedValue)) {
            commit(sanitizeNumberInput(fieldKey, parsedValue));
        }
    };

    const handleNumberBlur = (fieldKey: string) => {
        setActiveField(current => (current === fieldKey ? null : current));
        setDraftValues(prev => {
            const next = { ...prev };
            delete next[fieldKey];
            return next;
        });
    };

    const getDraftValue = (fieldKey: string, fallbackValue: number) =>
        activeField === fieldKey
            ? draftValues[fieldKey] ?? fieldValues[fieldKey] ?? String(fallbackValue)
            : fieldValues[fieldKey] ?? String(fallbackValue);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                    <label className="text-sm text-foreground/70 block mb-1">Spot Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">$</span>
                        <input
                            type="number"
                            value={getDraftValue('spotPrice', spotPrice)}
                            onFocus={() => setActiveField('spotPrice')}
                            onBlur={() => handleNumberBlur('spotPrice')}
                            onChange={(e) => handleNumberChange('spotPrice', e.target.value, setSpotPrice)}
                            min="0"
                            step="any"
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

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-6 sm:pr-2">
                            <div>
                                <label className="text-xs text-foreground/50 block mb-1">Strike</label>
                                <input
                                    type="number"
                                    value={getDraftValue(`${leg.id}:strike`, leg.strike)}
                                    disabled={leg.type === 'Stock'}
                                    onFocus={() => setActiveField(`${leg.id}:strike`)}
                                    onBlur={() => handleNumberBlur(`${leg.id}:strike`)}
                                    onChange={(e) => handleNumberChange(`${leg.id}:strike`, e.target.value, (value) => updateLeg(leg.id, { strike: value }))}
                                    min="0"
                                    step="any"
                                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1 outline-none transition-colors ${leg.type === 'Stock' ? 'opacity-30 cursor-not-allowed' : 'focus:border-primary'}`}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-foreground/50 block mb-1">{leg.type === 'Stock' ? 'Entry Price' : 'Premium'}</label>
                                <input
                                    type="number"
                                    value={getDraftValue(`${leg.id}:premium`, leg.premium)}
                                    onFocus={() => setActiveField(`${leg.id}:premium`)}
                                    onBlur={() => handleNumberBlur(`${leg.id}:premium`)}
                                    onChange={(e) => handleNumberChange(`${leg.id}:premium`, e.target.value, (value) => updateLeg(leg.id, { premium: value }))}
                                    min="0"
                                    step="any"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1 outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-foreground/50 block mb-1">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={getDraftValue(`${leg.id}:quantity`, leg.quantity)}
                                    onFocus={() => setActiveField(`${leg.id}:quantity`)}
                                    onBlur={() => handleNumberBlur(`${leg.id}:quantity`)}
                                    onChange={(e) => handleNumberChange(`${leg.id}:quantity`, e.target.value, (value) => updateLeg(leg.id, { quantity: value }))}
                                    step="any"
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
