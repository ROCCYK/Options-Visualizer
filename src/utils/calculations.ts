import type { OptionLeg, ChartDataPoint } from '../types/OptionTypes';

const EPSILON = 1e-9;
const UNIQUENESS_EPSILON = 1e-6;

const isApproximatelyZero = (value: number): boolean => Math.abs(value) < EPSILON;

const normalizeNonNegative = (value: number): number => (isApproximatelyZero(value) ? 0 : value);

const addUniqueValue = (values: number[], candidate: number) => {
    if (!Number.isFinite(candidate) || candidate < -EPSILON) {
        return;
    }

    const normalized = normalizeNonNegative(candidate);
    const alreadyIncluded = values.some(value => Math.abs(value - normalized) < UNIQUENESS_EPSILON);

    if (!alreadyIncluded) {
        values.push(normalized);
    }
};

const addUniqueRange = (
    ranges: BreakEvenRange[],
    start: number,
    end: number | null
) => {
    if (!Number.isFinite(start) || start < -EPSILON) {
        return;
    }

    if (end !== null && (!Number.isFinite(end) || end < start - EPSILON)) {
        return;
    }

    const normalizedStart = normalizeNonNegative(start);
    const normalizedEnd = end === null ? null : normalizeNonNegative(end);
    const lastRange = ranges[ranges.length - 1];

    if (!lastRange) {
        ranges.push({ start: normalizedStart, end: normalizedEnd });
        return;
    }

    const lastEnd = lastRange.end === null ? Infinity : lastRange.end;
    const currentEnd = normalizedEnd === null ? Infinity : normalizedEnd;

    if (normalizedStart <= lastEnd + UNIQUENESS_EPSILON) {
        lastRange.start = Math.min(lastRange.start, normalizedStart);
        lastRange.end = Number.isFinite(Math.max(lastEnd, currentEnd))
            ? Math.max(lastEnd, currentEnd)
            : null;
        return;
    }

    ranges.push({ start: normalizedStart, end: normalizedEnd });
};

const isPointInsideRanges = (point: number, ranges: BreakEvenRange[]): boolean =>
    ranges.some(({ start, end }) => point > start - UNIQUENESS_EPSILON && (end === null || point < end + UNIQUENESS_EPSILON));

const getUniqueKinkSpots = (legs: OptionLeg[]): number[] =>
    Array.from(
        new Set(
            legs
                .filter(leg => leg.type !== 'Stock')
                .map(leg => Math.max(0, leg.strike))
        )
    ).sort((a, b) => a - b);

const calculateSlopeAtSpot = (spot: number, leg: OptionLeg): number => {
    if (leg.type === 'Stock') {
        return leg.position === 'Long' ? leg.quantity : -leg.quantity;
    }

    if (leg.type === 'Call') {
        if (spot > leg.strike) {
            return leg.position === 'Long' ? leg.quantity : -leg.quantity;
        }

        return 0;
    }

    if (spot < leg.strike) {
        return leg.position === 'Long' ? -leg.quantity : leg.quantity;
    }

    return 0;
};

const calculateTotalSlopeAtSpot = (spot: number, legs: OptionLeg[]): number =>
    legs.reduce((total, leg) => total + calculateSlopeAtSpot(spot, leg), 0);

export const calculateOptionIntrinsicValue = (spot: number, leg: OptionLeg): number => {
    if (leg.type === 'Call') {
        return Math.max(0, spot - leg.strike);
    }

    if (leg.type === 'Put') {
        return Math.max(0, leg.strike - spot);
    }

    return 0;
};

export const calculateCurrentTimeValue = (spot: number, leg: OptionLeg): number | null => {
    if (leg.type === 'Stock') {
        return null;
    }

    const premium = leg.premium * leg.quantity;
    const intrinsicValue = calculateOptionIntrinsicValue(spot, leg) * leg.quantity;

    return premium - intrinsicValue;
};

export const calculateGrossLegValueAtExpiration = (spot: number, leg: OptionLeg): number => {
    if (leg.type === 'Stock') {
        return spot * leg.quantity;
    }

    return calculateOptionIntrinsicValue(spot, leg) * leg.quantity;
};

export const calculateEntryCost = (leg: OptionLeg): number => leg.premium * leg.quantity;

export const calculatePayoff = (spot: number, leg: OptionLeg): number => {
    const isStock = leg.type === 'Stock';
    const isLong = leg.position === 'Long';

    if (isStock) {
        // For stock, "premium" acts as the entry price (cost).
        const value = isLong ? (spot - leg.premium) : (leg.premium - spot);
        return value * leg.quantity;
    }

    const payoff = calculateGrossLegValueAtExpiration(spot, leg);
    const cost = calculateEntryCost(leg);

    // Profit = Payoff - Initial Cost (if long), Cost - Payoff (if short)
    const profit = isLong ? (payoff - cost) : (cost - payoff);

    return profit;
};

export const calculateTotalProfit = (spot: number, legs: OptionLeg[]): number =>
    legs.reduce((total, leg) => total + calculatePayoff(spot, leg), 0);

export const generateChartData = (
    legs: OptionLeg[],
    minSpot: number,
    maxSpot: number,
    step = 1,
    anchorSpots: number[] = []
): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const safeStep = Math.max(step, 1);
    const sampledSpots: number[] = [];

    const addPoint = (spot: number) => {
        const point: ChartDataPoint = {
            spotPrice: spot,
            totalProfit: 0,
        };

        let totalProfit = 0;
        legs.forEach(leg => {
            const legProfit = calculatePayoff(spot, leg);
            point[leg.id] = legProfit;
            totalProfit += legProfit;
        });

        point.totalProfit = totalProfit;
        data.push(point);
    };

    for (let spot = minSpot; spot <= maxSpot; spot += safeStep) {
        addUniqueValue(sampledSpots, spot);
    }

    const lastSpot = sampledSpots[sampledSpots.length - 1];
    if (lastSpot === undefined || Math.abs(lastSpot - maxSpot) > 1e-6) {
        addUniqueValue(sampledSpots, maxSpot);
    }

    anchorSpots.forEach(anchorSpot => {
        if (anchorSpot >= minSpot - EPSILON && anchorSpot <= maxSpot + EPSILON) {
            addUniqueValue(sampledSpots, anchorSpot);
        }
    });

    sampledSpots.sort((a, b) => a - b).forEach(addPoint);

    return data;
};

export interface BreakEvenRange {
    start: number;
    end: number | null;
}

export interface StrategyMetrics {
    maxProfit: number;
    maxLoss: number;
    breakEvens: number[];
    breakEvenRanges: BreakEvenRange[];
    isMaxProfitUnlimited: boolean;
    isMaxLossUnlimited: boolean;
}

export const calculateStrategyMetrics = (legs: OptionLeg[]): StrategyMetrics => {
    if (legs.length === 0) {
        return {
            maxProfit: 0,
            maxLoss: 0,
            breakEvens: [],
            breakEvenRanges: [],
            isMaxProfitUnlimited: false,
            isMaxLossUnlimited: false,
        };
    }

    const kinkSpots = getUniqueKinkSpots(legs).filter(spot => spot > 0);
    const boundarySpots = [0, ...kinkSpots];
    const boundaryProfits = boundarySpots.map(spot => calculateTotalProfit(spot, legs));

    let maxProfit = Math.max(...boundaryProfits);
    let maxLoss = Math.min(...boundaryProfits);

    const breakEvens: number[] = [];
    const breakEvenRanges: BreakEvenRange[] = [];
    let leftSpot = 0;
    let leftProfit = boundaryProfits[0];
    let intervalSlope = calculateTotalSlopeAtSpot(EPSILON, legs);

    if (isApproximatelyZero(leftProfit)) {
        addUniqueValue(breakEvens, 0);
    }

    kinkSpots.forEach((rightSpot, index) => {
        const rightProfit = boundaryProfits[index + 1];

        if (rightSpot > leftSpot + EPSILON && Math.abs(intervalSlope) > EPSILON) {
            const root = leftSpot - (leftProfit / intervalSlope);
            if (root > leftSpot + EPSILON && root < rightSpot - EPSILON) {
                addUniqueValue(breakEvens, root);
            }
        } else if (
            rightSpot > leftSpot + EPSILON &&
            isApproximatelyZero(leftProfit) &&
            isApproximatelyZero(rightProfit)
        ) {
            addUniqueRange(breakEvenRanges, leftSpot, rightSpot);
        }

        if (isApproximatelyZero(rightProfit)) {
            addUniqueValue(breakEvens, rightSpot);
        }

        leftSpot = rightSpot;
        leftProfit = rightProfit;
        intervalSlope = calculateTotalSlopeAtSpot(rightSpot + EPSILON, legs);
    });

    const upperTailSlope = intervalSlope;
    const isMaxProfitUnlimited = upperTailSlope > EPSILON;
    const isMaxLossUnlimited = upperTailSlope < -EPSILON;

    if (Math.abs(upperTailSlope) > EPSILON) {
        const root = leftSpot - (leftProfit / upperTailSlope);
        if (root > leftSpot + EPSILON) {
            addUniqueValue(breakEvens, root);
        }
    } else if (isApproximatelyZero(leftProfit)) {
        addUniqueRange(breakEvenRanges, leftSpot, null);
    }

    if (isMaxProfitUnlimited) {
        maxProfit = Infinity;
    }

    if (isMaxLossUnlimited) {
        maxLoss = -Infinity;
    }

    const filteredBreakEvens = breakEvens.filter(point => !isPointInsideRanges(point, breakEvenRanges));

    return {
        maxProfit,
        maxLoss,
        breakEvens: filteredBreakEvens.sort((a, b) => a - b),
        breakEvenRanges,
        isMaxProfitUnlimited,
        isMaxLossUnlimited,
    };
};

export interface DisplayDomain {
    chartMinSpot: number;
    chartMaxSpot: number;
    chartStep: number;
}

export const calculateDisplayDomain = (legs: OptionLeg[], spotPrice: number): DisplayDomain => {
    const metrics = calculateStrategyMetrics(legs);
    const kinkSpots = getUniqueKinkSpots(legs);
    const normalizedSpotPrice = Math.max(0, spotPrice);
    const breakEvenRangeAnchors = metrics.breakEvenRanges.flatMap(range =>
        range.end === null ? [range.start] : [range.start, range.end]
    );
    const chartAnchors = [normalizedSpotPrice, ...kinkSpots, ...metrics.breakEvens, ...breakEvenRangeAnchors]
        .filter(value => Number.isFinite(value) && value >= 0);
    const maxAnchor = Math.max(...chartAnchors, 1);
    const minChartAnchor = Math.min(...chartAnchors, normalizedSpotPrice);
    const maxChartAnchor = Math.max(...chartAnchors, normalizedSpotPrice);
    const chartPadding = Math.max(10, Math.ceil(maxAnchor * 0.15));
    const chartHalfWidth = Math.max(
        Math.ceil(Math.max(normalizedSpotPrice, 1) * 0.5),
        Math.ceil(normalizedSpotPrice - Math.max(0, minChartAnchor - chartPadding)),
        Math.ceil(maxChartAnchor + chartPadding - normalizedSpotPrice)
    );
    const chartMinSpot = Math.max(0, Math.floor(normalizedSpotPrice - chartHalfWidth));
    const chartMaxSpot = Math.ceil(normalizedSpotPrice + chartHalfWidth);
    const chartWidth = Math.max(1, chartMaxSpot - chartMinSpot);

    return {
        chartMinSpot,
        chartMaxSpot,
        chartStep: Math.max(1, Math.ceil(chartWidth / 240)),
    };
};

// Simplified Black-Scholes estimate for educational purposes (IV + TV)
// Option Value = Intrinsic Value + Time Value
// For expiration PnL, Time Value = 0, so Option Value = Intrinsic Value.
// The educational visualizer could use this if the user wants to see "Today" vs "Expiration" curves.
