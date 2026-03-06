import { useState } from 'react';
import { useOptions } from '../context/useOptions';
import { calculateCurrentTimeValue, calculateOptionIntrinsicValue } from '../utils/calculations';

export default function OptionValueTable() {
    const { legs, spotPrice } = useOptions();
    const [showBreakdown, setShowBreakdown] = useState(false);

    if (legs.length === 0) return null;

    const rowData = legs.map(leg => {
        const isLong = leg.position === 'Long';
        const enteredValue = leg.premium * leg.quantity;
        const intrinsicValue = leg.type === 'Stock'
            ? null
            : calculateOptionIntrinsicValue(spotPrice, leg) * leg.quantity;
        const timeValue = leg.type === 'Stock'
            ? null
            : calculateCurrentTimeValue(spotPrice, leg);

        return {
            id: leg.id,
            type: leg.type,
            position: leg.position,
            strike: leg.strike,
            premium: leg.premium,
            quantity: leg.quantity,
            color: leg.color,
            isLong,
            enteredValue,
            intrinsicValue,
            timeValue,
        };
    });

    return (
        <div className="mt-8">
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center mb-4">
                <h3 className="text-lg font-bold text-purple-300">Premium vs Current Intrinsic Value</h3>
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
                            <th className="px-4 py-3 font-normal whitespace-nowrap"><span className="font-bold text-foreground">{legs.some(leg => leg.type === 'Stock') ? 'Entered Premium / Entry Price' : 'Entered Premium'}</span></th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap"><span className="font-bold text-foreground">Current IV</span> (Intrinsic Value)</th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap"><span className="font-bold text-foreground">Current TV</span> (Time Value)</th>
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
                                    <div className="text-[10px] text-foreground/50 ml-4">Strike: ${row.strike} | Qty: {row.quantity}</div>
                                </td>

                                <td className="px-4 py-3">
                                    <span className="font-bold">${spotPrice.toFixed(2)}</span>
                                </td>

                                <td className="px-4 py-3">
                                    <span className="font-bold text-primary">${row.enteredValue.toFixed(2)}</span>
                                    {showBreakdown && (
                                        <div className="text-[10px] text-foreground/50 mt-1 whitespace-nowrap font-mono opacity-80">
                                            {row.premium.toFixed(2)} x {row.quantity}
                                        </div>
                                    )}
                                </td>

                                <td className="px-4 py-3 min-w-[150px]">
                                    {row.type === 'Stock' ? (
                                        <span className="font-bold text-foreground/50">N/A</span>
                                    ) : (
                                        <>
                                            <span className="font-bold text-green-300">${row.intrinsicValue?.toFixed(2)}</span>
                                            {showBreakdown && (
                                                <div className="text-[10px] text-foreground/50 mt-1 whitespace-nowrap font-mono opacity-80">
                                                    {row.type === 'Call'
                                                        ? `max(0, ${spotPrice.toFixed(0)} Spot - ${row.strike} Strike)`
                                                        : `max(0, ${row.strike} Strike - ${spotPrice.toFixed(0)} Spot)`
                                                    }
                                                    {row.quantity > 1 ? ` x ${row.quantity}` : ''}
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
                                            <span
                                                className={`font-bold ${
                                                    (row.timeValue ?? 0) > 0
                                                        ? 'text-amber-300'
                                                        : (row.timeValue ?? 0) < 0
                                                            ? 'text-red-300'
                                                            : 'text-foreground'
                                                }`}
                                            >
                                                ${row.timeValue?.toFixed(2)}
                                            </span>
                                            {showBreakdown && (
                                                <div className="text-[10px] text-foreground/50 mt-1 whitespace-nowrap font-mono opacity-80">
                                                    {row.enteredValue.toFixed(2)} Premium - {row.intrinsicValue?.toFixed(2)} IV
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
                <p><strong>Educational Note:</strong> Current <strong>time value</strong> is shown here using the classroom formula <strong>Premium - Intrinsic Value</strong>, based on the premium entered for each leg rather than a live market option price.</p>
            </div>
        </div>
    );
}
