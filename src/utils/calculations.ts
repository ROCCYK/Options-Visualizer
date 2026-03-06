import type { OptionLeg, ChartDataPoint } from '../types/OptionTypes';

const EPSILON = 1e-9;

const isApproximatelyZero = (value: number): boolean => Math.abs(value) < EPSILON;

const addUniqueValue = (values: number[], candidate: number) => {
    if (!Number.isFinite(candidate) || candidate < -EPSILON) {
        return;
    }

    const normalized = isApproximatelyZero(candidate) ? 0 : candidate;
    const alreadyIncluded = values.some(value => Math.abs(value - normalized) < 1e-6);

    if (!alreadyIncluded) {
        values.push(normalized);
    }
};

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
    step = 1
): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const safeStep = Math.max(step, 1);

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
        addPoint(spot);
    }

    const lastSpot = data[data.length - 1]?.spotPrice;
    if (lastSpot === undefined || Math.abs(lastSpot - maxSpot) > 1e-6) {
        addPoint(maxSpot);
    }

    return data;
};

export interface StrategyMetrics {
    maxProfit: number;
    maxLoss: number;
    breakEvens: number[];
    isMaxProfitUnlimited: boolean;
    isMaxLossUnlimited: boolean;
}

export const calculateStrategyMetrics = (legs: OptionLeg[]): StrategyMetrics => {
    if (legs.length === 0) {
        return {
            maxProfit: 0,
            maxLoss: 0,
            breakEvens: [],
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
    let leftSpot = 0;
    let leftProfit = boundaryProfits[0];
    let intervalSlope = calculateTotalSlopeAtSpot(EPSILON, legs);

    if (isApproximatelyZero(leftProfit)) {
        addUniqueValue(breakEvens, 0);
    }

    kinkSpots.forEach((rightSpot, index) => {
        if (rightSpot > leftSpot + EPSILON && Math.abs(intervalSlope) > EPSILON) {
            const root = leftSpot - (leftProfit / intervalSlope);
            if (root > leftSpot + EPSILON && root < rightSpot - EPSILON) {
                addUniqueValue(breakEvens, root);
            }
        }

        const rightProfit = boundaryProfits[index + 1];
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
    }

    if (isMaxProfitUnlimited) {
        maxProfit = Infinity;
    }

    if (isMaxLossUnlimited) {
        maxLoss = -Infinity;
    }

    return {
        maxProfit,
        maxLoss,
        breakEvens: breakEvens.sort((a, b) => a - b),
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
    const chartAnchors = [spotPrice, ...kinkSpots, ...metrics.breakEvens]
        .filter(value => Number.isFinite(value) && value >= 0);
    const maxAnchor = Math.max(...chartAnchors, 1);
    const minChartAnchor = Math.min(...chartAnchors, spotPrice);
    const maxChartAnchor = Math.max(...chartAnchors, spotPrice);
    const chartPadding = Math.max(10, Math.ceil(maxAnchor * 0.15));
    const chartHalfWidth = Math.max(
        Math.ceil(Math.max(spotPrice, 1) * 0.5),
        Math.ceil(spotPrice - Math.max(0, minChartAnchor - chartPadding)),
        Math.ceil(maxChartAnchor + chartPadding - spotPrice)
    );
    const chartMinSpot = Math.floor(spotPrice - chartHalfWidth);
    const chartMaxSpot = Math.ceil(spotPrice + chartHalfWidth);
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
