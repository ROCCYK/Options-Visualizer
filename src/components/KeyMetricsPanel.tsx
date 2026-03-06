import { useOptions } from '../context/OptionContext';
import { generateChartData } from '../utils/calculations';

export default function KeyMetricsPanel() {
    const { legs, spotPrice } = useOptions();

    if (legs.length === 0) return null;

    // Use a very wide data range to reliably find absolute max/min and break-evens
    const strikes = legs.map(l => l.strike || spotPrice); // fallback to spot for stock
    const minStrike = Math.min(...strikes, spotPrice) * 0.1;
    const maxStrike = Math.max(...strikes, spotPrice) * 3;

    // Generate data from near 0 to very high to evaluate tail risks
    const data = generateChartData(legs, Math.floor(minStrike), Math.ceil(maxStrike), 1);

    // Find Max Profit and Max Loss
    let maxProfit = -Infinity;
    let maxLoss = Infinity;

    // Find Break-Even spots
    const breakEvens: number[] = [];
    let prevProfit = data[0].totalProfit;

    data.forEach((row, i) => {
        if (row.totalProfit > maxProfit) maxProfit = row.totalProfit;
        if (row.totalProfit < maxLoss) maxLoss = row.totalProfit;

        // Detect sign change for Break-Even
        if (i > 0) {
            if ((prevProfit < 0 && row.totalProfit >= 0) || (prevProfit > 0 && row.totalProfit <= 0)) {
                // Approximate exact break-even via linear interpolation (or just taking the closer spot)
                // For educational purpose, the integer spot is usually close enough if step=1
                breakEvens.push(row.spotPrice);
            }
        }
        prevProfit = row.totalProfit;
    });

    // Clean up break evens if there are consecutive numbers (e.g., crossing 0 slowly)
    const uniqueBreakEvens = breakEvens.filter((val, i, arr) => {
        if (i === 0) return true;
        return val > arr[i - 1] + 1; // only keep if it's a distinct crossing point
    });

    // Determine if tails are infinite
    const lastProfit = data[data.length - 1].totalProfit;
    const firstProfit = data[0].totalProfit;
    const secondLastProfit = data[data.length - 2].totalProfit;
    const secondFirstProfit = data[1].totalProfit;

    const isUpsideInfinite = (lastProfit - secondLastProfit) > 0;
    const isDownsideInfiniteRisk = (firstProfit - secondFirstProfit) > 0; // as spot goes to 0
    const isUpsideInfiniteRisk = (lastProfit - secondLastProfit) < 0;

    const displayMaxProfit = isUpsideInfinite ? "Unlimited" : `$${maxProfit.toFixed(2)}`;
    const displayMaxLoss = (isDownsideInfiniteRisk || isUpsideInfiniteRisk) ? "Unlimited" : `$${Math.abs(maxLoss).toFixed(2)}`;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="glass p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 flex flex-col justify-center">
                <div className="text-xs text-foreground/50 font-bold uppercase tracking-wider mb-1">Max Profit</div>
                <div className={`text-xl font-bold ${isUpsideInfinite ? 'text-green-400' : 'text-primary'}`}>
                    {displayMaxProfit}
                </div>
            </div>

            <div className="glass p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 flex flex-col justify-center">
                <div className="text-xs text-foreground/50 font-bold uppercase tracking-wider mb-1">Max Risk (Loss)</div>
                <div className={`text-xl font-bold ${displayMaxLoss === 'Unlimited' ? 'text-red-500' : 'text-red-400'}`}>
                    {displayMaxLoss}
                </div>
            </div>

            <div className="glass p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 flex flex-col justify-center">
                <div className="text-xs text-foreground/50 font-bold uppercase tracking-wider mb-1">Break-Even Point(s)</div>
                <div className="text-xl font-bold text-foreground overflow-x-auto whitespace-nowrap">
                    {uniqueBreakEvens.length > 0
                        ? uniqueBreakEvens.map(bp => `$${bp.toFixed(2)}`).join(' , ')
                        : 'None'}
                </div>
            </div>
        </div>
    );
}
