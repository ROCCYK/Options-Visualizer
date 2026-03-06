import { useState } from 'react';
import { useOptions } from '../context/OptionContext';

export default function OptionValueTable() {
    const { legs, spotPrice } = useOptions();
    const [showBreakdown, setShowBreakdown] = useState(false);

    if (legs.length === 0) return null;

    // Calculate current implied Option Value, Intrinsic Value, and Time Value for each leg
    const rowData = legs.map(leg => {
        const isCall = leg.type === 'Call';
        const isLong = leg.position === 'Long';

        // Option Value is simply the premium (current market price of the option)
        let optionValue = leg.premium;

        // Intrinsic Value calculation based on current Spot Price
        const targetStrike = leg.strike;
        let intrinsicValue = 0;

        if (isCall) {
            intrinsicValue = Math.max(0, spotPrice - targetStrike);
        } else if (leg.type === 'Put') {
            intrinsicValue = Math.max(0, targetStrike - spotPrice);
        } else {
            // For Stock, Intrinsic Value / Time value don't exactly apply in an options sense.
            // Value of stock is just Spot Price.
            optionValue = spotPrice; // Current mark-to-market value is Spot
            intrinsicValue = spotPrice;
        }

        // Time Value = Option Value - Intrinsic Value
        // Note: For OTM options, IV is 0, so TV = Option Value.
        let timeValue = Math.max(0, optionValue - intrinsicValue);
        if (leg.type === 'Stock') timeValue = 0;

        return {
            id: leg.id,
            type: leg.type,
            position: leg.position,
            strike: leg.strike,
            premium: leg.premium,
            quantity: leg.quantity,
            color: leg.color,
            isCall,
            isLong,
            optionValue,
            intrinsicValue,
            timeValue
        };
    });

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-purple-300">Option Value = IV + TV</h3>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground/70 hover:text-foreground transition-colors">
                    <input
                        type="checkbox"
                        checked={showBreakdown}
                        onChange={(e) => setShowBreakdown(e.target.checked)}
                        className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50"
                    />
                    Show breakdown
                </label>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-sm text-left border-collapse min-w-[500px]">
                    <thead className="bg-white/5 border-b border-white/10 uppercase text-xs text-foreground/60">
                        <tr>
                            <th className="px-4 py-3 whitespace-nowrap">Leg</th>
                            <th className="px-4 py-3 whitespace-nowrap">Current Spot</th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap"><span className="font-bold text-foreground">Option Value</span> (Premium)</th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap">= <span className="font-bold text-foreground">IV</span> (Intrinsic Value)</th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap">+ <span className="font-bold text-foreground">TV</span> (Time Value)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rowData.map((row, i) => (
                            <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-medium whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color || 'white' }}></div>
                                        Leg {i + 1} <span className={row.isLong ? 'text-green-400' : 'text-red-400'}>({row.isLong ? 'Buy' : 'Sell'} {row.type})</span>
                                    </div>
                                    <div className="text-[10px] text-foreground/50 ml-4">Strike: ${row.strike}</div>
                                </td>

                                <td className="px-4 py-3">
                                    <span className="font-bold">${spotPrice.toFixed(2)}</span>
                                </td>

                                <td className="px-4 py-3">
                                    <span className="font-bold text-primary">${row.optionValue.toFixed(2)}</span>
                                </td>

                                <td className="px-4 py-3 min-w-[150px]">
                                    {row.type === 'Stock' ? (
                                        <span className="font-bold text-foreground/50">N/A</span>
                                    ) : (
                                        <>
                                            <span className="font-bold text-green-300">${row.intrinsicValue.toFixed(2)}</span>
                                            {showBreakdown && (
                                                <div className="text-[10px] text-foreground/50 mt-1 whitespace-nowrap font-mono opacity-80">
                                                    {row.isCall
                                                        ? `max(0, ${spotPrice.toFixed(0)} Spot - ${row.strike} Strike)`
                                                        : `max(0, ${row.strike} Strike - ${spotPrice.toFixed(0)} Spot)`
                                                    }
                                                </div>
                                            )}
                                        </>
                                    )}
                                </td>

                                <td className="px-4 py-3 min-w-[150px]">
                                    {row.type === 'Stock' ? (
                                        <span className="font-bold text-foreground/50">N/A</span>
                                    ) : (
                                        <>
                                            <span className="font-bold text-yellow-300">${row.timeValue.toFixed(2)}</span>
                                            {showBreakdown && (
                                                <div className="text-[10px] text-foreground/50 mt-1 whitespace-nowrap font-mono opacity-80">
                                                    {row.optionValue.toFixed(2)} Opt Value - {row.intrinsicValue.toFixed(2)} IV
                                                </div>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20 text-sm text-foreground/80">
                <p><strong>Educational Note:</strong> The <strong>Option Value</strong> (or premium you pay/receive) is comprised of two parts. The <strong>Intrinsic Value (IV)</strong> is the guaranteed minimum value if you exercised the option right now. The <strong>Time Value (TV)</strong> is the extra premium the market prices in for the probability that the option moves further strictly in your favor before expiration.</p>
            </div>
        </div>
    );
}
