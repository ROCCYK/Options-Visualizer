import type { OptionLeg, OptionType, PositionType } from '../types/OptionTypes';

export type StrategyCategory = 'Bullish' | 'Bearish' | 'Neutral' | 'Hedging';

export interface StrategyPreset {
    id: string;
    name: string;
    category: StrategyCategory;
    description: string;
    build: (spotPrice: number) => StrategyLegTemplate[];
}

export const categoryThemeMap: Record<StrategyCategory, {
    description: string;
    badgeClassName: string;
    tabClassName: string;
    activeCardClassName: string;
}> = {
    Bullish: {
        description: 'Upside and income-first structures.',
        badgeClassName: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
        tabClassName: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
        activeCardClassName: 'border-emerald-400/30 bg-emerald-400/10 shadow-[0_0_18px_rgba(52,211,153,0.12)]',
    },
    Bearish: {
        description: 'Downside trades and short-bias setups.',
        badgeClassName: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
        tabClassName: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
        activeCardClassName: 'border-rose-400/30 bg-rose-400/10 shadow-[0_0_18px_rgba(251,113,133,0.12)]',
    },
    Neutral: {
        description: 'Range-bound and volatility-focused trades.',
        badgeClassName: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
        tabClassName: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
        activeCardClassName: 'border-amber-400/30 bg-amber-400/10 shadow-[0_0_18px_rgba(251,191,36,0.12)]',
    },
    Hedging: {
        description: 'Protection and stock-overlay structures.',
        badgeClassName: 'border-sky-400/20 bg-sky-400/10 text-sky-100',
        tabClassName: 'border-sky-400/20 bg-sky-400/10 text-sky-100',
        activeCardClassName: 'border-sky-400/30 bg-sky-400/10 shadow-[0_0_18px_rgba(56,189,248,0.12)]',
    },
};

type OptionStrategyType = Exclude<OptionType, 'Stock'>;
type StrategyLegTemplate = Omit<OptionLeg, 'id' | 'color'>;

const roundToCents = (value: number): number => Number(value.toFixed(2));

const getStrikeIncrement = (spotPrice: number): number => {
    if (spotPrice >= 200) {
        return 10;
    }

    if (spotPrice >= 100) {
        return 5;
    }

    if (spotPrice >= 40) {
        return 2;
    }

    return 1;
};

const getStructure = (spotPrice: number) => {
    const step = getStrikeIncrement(spotPrice);
    const atm = Math.max(step, Math.round(spotPrice / step) * step);
    const floor = (value: number) => Math.max(1, value);

    return {
        atm,
        step,
        up1: atm + step,
        up2: atm + (step * 2),
        up3: atm + (step * 3),
        down1: floor(atm - step),
        down2: floor(atm - (step * 2)),
        down3: floor(atm - (step * 3)),
    };
};

const estimateOptionPremium = (
    type: OptionStrategyType,
    strike: number,
    spotPrice: number,
    timeFactor = 1
): number => {
    const intrinsicValue = type === 'Call'
        ? Math.max(0, spotPrice - strike)
        : Math.max(0, strike - spotPrice);
    const distanceFromMoney = Math.abs(strike - spotPrice);
    const timeValueBase = Math.max(0.75, spotPrice * 0.04 * timeFactor);
    const timeValue = Math.max(0.5, timeValueBase - (distanceFromMoney * 0.35));

    return roundToCents(Math.max(0.35, intrinsicValue + timeValue));
};

const option = (
    position: PositionType,
    type: OptionStrategyType,
    strike: number,
    spotPrice: number,
    quantity = 1,
    timeFactor = 1,
    premiumOverride?: number
): StrategyLegTemplate => ({
    type,
    position,
    strike,
    premium: premiumOverride ?? estimateOptionPremium(type, strike, spotPrice, timeFactor),
    quantity,
});

const stock = (
    position: PositionType,
    entryPrice: number,
    quantity = 1,
    strike = entryPrice
): StrategyLegTemplate => ({
    type: 'Stock',
    position,
    strike: roundToCents(strike),
    premium: roundToCents(entryPrice),
    quantity,
});

export const categoryOrder: StrategyCategory[] = ['Bullish', 'Bearish', 'Neutral', 'Hedging'];

export const strategyPresets: StrategyPreset[] = [
    {
        id: 'long-call',
        name: 'Long Call',
        category: 'Bullish',
        description: 'Buy upside exposure with defined premium risk.',
        build: (spotPrice) => {
            const { atm } = getStructure(spotPrice);
            return [option('Long', 'Call', atm, spotPrice)];
        },
    },
    {
        id: 'covered-call',
        name: 'Covered Call',
        category: 'Bullish',
        description: 'Own shares and sell upside to generate income.',
        build: (spotPrice) => {
            const { up1 } = getStructure(spotPrice);
            return [
                stock('Long', spotPrice),
                option('Short', 'Call', up1, spotPrice),
            ];
        },
    },
    {
        id: 'short-put',
        name: 'Short Put',
        category: 'Bullish',
        description: 'Collect premium while leaning modestly bullish.',
        build: (spotPrice) => {
            const { down1 } = getStructure(spotPrice);
            return [option('Short', 'Put', down1, spotPrice)];
        },
    },
    {
        id: 'cash-secured-put',
        name: 'Cash-Secured Put',
        category: 'Bullish',
        description: 'Sell a put with cash reserved to buy shares lower.',
        build: (spotPrice) => {
            const { down1 } = getStructure(spotPrice);
            return [option('Short', 'Put', down1, spotPrice)];
        },
    },
    {
        id: 'bull-call-spread',
        name: 'Bull Call Spread',
        category: 'Bullish',
        description: 'Defined-risk upside using a long and short call.',
        build: (spotPrice) => {
            const { atm, up2 } = getStructure(spotPrice);
            return [
                option('Long', 'Call', atm, spotPrice),
                option('Short', 'Call', up2, spotPrice),
            ];
        },
    },
    {
        id: 'bull-put-spread',
        name: 'Bull Put Spread',
        category: 'Bullish',
        description: 'Credit spread that benefits if price stays firm.',
        build: (spotPrice) => {
            const { atm, down2 } = getStructure(spotPrice);
            return [
                option('Short', 'Put', atm, spotPrice),
                option('Long', 'Put', down2, spotPrice),
            ];
        },
    },
    {
        id: 'call-backspread',
        name: 'Call Backspread',
        category: 'Bullish',
        description: 'Ratio setup for a large upside breakout.',
        build: (spotPrice) => {
            const { atm, up2 } = getStructure(spotPrice);
            return [
                option('Short', 'Call', atm, spotPrice),
                option('Long', 'Call', up2, spotPrice, 2, 0.9),
            ];
        },
    },
    {
        id: 'call-ratio-spread',
        name: 'Call Ratio Spread',
        category: 'Bullish',
        description: 'Moderately bullish trade with premium collected upfront.',
        build: (spotPrice) => {
            const { atm, up2 } = getStructure(spotPrice);
            return [
                option('Long', 'Call', atm, spotPrice),
                option('Short', 'Call', up2, spotPrice, 2),
            ];
        },
    },
    {
        id: 'strap',
        name: 'Strap',
        category: 'Bullish',
        description: 'Long volatility with extra upside bias.',
        build: (spotPrice) => {
            const { atm } = getStructure(spotPrice);
            return [
                option('Long', 'Call', atm, spotPrice, 2),
                option('Long', 'Put', atm, spotPrice),
            ];
        },
    },
    {
        id: 'synthetic-long-stock',
        name: 'Synthetic Long Stock',
        category: 'Bullish',
        description: 'Replicate long shares with a long call and short put.',
        build: (spotPrice) => {
            const { atm } = getStructure(spotPrice);
            return [
                option('Long', 'Call', atm, spotPrice),
                option('Short', 'Put', atm, spotPrice),
            ];
        },
    },
    {
        id: 'long-put',
        name: 'Long Put',
        category: 'Bearish',
        description: 'Buy downside exposure with defined premium risk.',
        build: (spotPrice) => {
            const { atm } = getStructure(spotPrice);
            return [option('Long', 'Put', atm, spotPrice)];
        },
    },
    {
        id: 'short-call',
        name: 'Short Call',
        category: 'Bearish',
        description: 'Collect premium with a bearish outlook and open-ended risk.',
        build: (spotPrice) => {
            const { up1 } = getStructure(spotPrice);
            return [option('Short', 'Call', up1, spotPrice)];
        },
    },
    {
        id: 'covered-put',
        name: 'Covered Put',
        category: 'Bearish',
        description: 'Short shares and sell a put to earn income.',
        build: (spotPrice) => {
            const { down1 } = getStructure(spotPrice);
            return [
                stock('Short', spotPrice),
                option('Short', 'Put', down1, spotPrice),
            ];
        },
    },
    {
        id: 'bear-put-spread',
        name: 'Bear Put Spread',
        category: 'Bearish',
        description: 'Defined-risk downside using a long and short put.',
        build: (spotPrice) => {
            const { atm, down2 } = getStructure(spotPrice);
            return [
                option('Long', 'Put', atm, spotPrice),
                option('Short', 'Put', down2, spotPrice),
            ];
        },
    },
    {
        id: 'bear-call-spread',
        name: 'Bear Call Spread',
        category: 'Bearish',
        description: 'Credit spread that benefits if price stays capped.',
        build: (spotPrice) => {
            const { atm, up2 } = getStructure(spotPrice);
            return [
                option('Short', 'Call', atm, spotPrice),
                option('Long', 'Call', up2, spotPrice),
            ];
        },
    },
    {
        id: 'put-backspread',
        name: 'Put Backspread',
        category: 'Bearish',
        description: 'Ratio setup for a large downside break.',
        build: (spotPrice) => {
            const { atm, down2 } = getStructure(spotPrice);
            return [
                option('Short', 'Put', atm, spotPrice),
                option('Long', 'Put', down2, spotPrice, 2, 0.9),
            ];
        },
    },
    {
        id: 'put-ratio-spread',
        name: 'Put Ratio Spread',
        category: 'Bearish',
        description: 'Moderately bearish structure with extra short downside.',
        build: (spotPrice) => {
            const { atm, down2 } = getStructure(spotPrice);
            return [
                option('Long', 'Put', atm, spotPrice),
                option('Short', 'Put', down2, spotPrice, 2),
            ];
        },
    },
    {
        id: 'strip',
        name: 'Strip',
        category: 'Bearish',
        description: 'Long volatility with extra downside bias.',
        build: (spotPrice) => {
            const { atm } = getStructure(spotPrice);
            return [
                option('Long', 'Call', atm, spotPrice),
                option('Long', 'Put', atm, spotPrice, 2),
            ];
        },
    },
    {
        id: 'synthetic-short-stock',
        name: 'Synthetic Short Stock',
        category: 'Bearish',
        description: 'Replicate short shares with a long put and short call.',
        build: (spotPrice) => {
            const { atm } = getStructure(spotPrice);
            return [
                option('Long', 'Put', atm, spotPrice),
                option('Short', 'Call', atm, spotPrice),
            ];
        },
    },
    {
        id: 'bearish-risk-reversal',
        name: 'Bearish Risk Reversal',
        category: 'Bearish',
        description: 'Short an OTM call and buy an OTM put for downside.',
        build: (spotPrice) => {
            const { up1, down1 } = getStructure(spotPrice);
            return [
                option('Short', 'Call', up1, spotPrice),
                option('Long', 'Put', down1, spotPrice),
            ];
        },
    },
    {
        id: 'long-straddle',
        name: 'Long Straddle',
        category: 'Neutral',
        description: 'Long volatility when a large move is expected.',
        build: (spotPrice) => {
            const { atm } = getStructure(spotPrice);
            return [
                option('Long', 'Call', atm, spotPrice),
                option('Long', 'Put', atm, spotPrice),
            ];
        },
    },
    {
        id: 'short-straddle',
        name: 'Short Straddle',
        category: 'Neutral',
        description: 'Collect premium if price stays near the strike.',
        build: (spotPrice) => {
            const { atm } = getStructure(spotPrice);
            return [
                option('Short', 'Call', atm, spotPrice),
                option('Short', 'Put', atm, spotPrice),
            ];
        },
    },
    {
        id: 'long-strangle',
        name: 'Long Strangle',
        category: 'Neutral',
        description: 'Cheaper long-volatility setup using OTM strikes.',
        build: (spotPrice) => {
            const { up1, down1 } = getStructure(spotPrice);
            return [
                option('Long', 'Call', up1, spotPrice),
                option('Long', 'Put', down1, spotPrice),
            ];
        },
    },
    {
        id: 'short-strangle',
        name: 'Short Strangle',
        category: 'Neutral',
        description: 'Short-volatility trade with room around spot.',
        build: (spotPrice) => {
            const { up1, down1 } = getStructure(spotPrice);
            return [
                option('Short', 'Call', up1, spotPrice),
                option('Short', 'Put', down1, spotPrice),
            ];
        },
    },
    {
        id: 'iron-condor',
        name: 'Iron Condor',
        category: 'Neutral',
        description: 'Defined-risk income setup centered around spot.',
        build: (spotPrice) => {
            const { up2, up1, down1, down2 } = getStructure(spotPrice);
            return [
                option('Long', 'Put', down2, spotPrice),
                option('Short', 'Put', down1, spotPrice),
                option('Short', 'Call', up1, spotPrice),
                option('Long', 'Call', up2, spotPrice),
            ];
        },
    },
    {
        id: 'iron-butterfly',
        name: 'Iron Butterfly',
        category: 'Neutral',
        description: 'Defined-risk premium trade with a narrow sweet spot.',
        build: (spotPrice) => {
            const { atm, up2, down2 } = getStructure(spotPrice);
            return [
                option('Long', 'Put', down2, spotPrice),
                option('Short', 'Put', atm, spotPrice),
                option('Short', 'Call', atm, spotPrice),
                option('Long', 'Call', up2, spotPrice),
            ];
        },
    },
    {
        id: 'long-call-butterfly',
        name: 'Long Call Butterfly',
        category: 'Neutral',
        description: 'Target a tight range with calls and limited risk.',
        build: (spotPrice) => {
            const { down1, atm, up1 } = getStructure(spotPrice);
            return [
                option('Long', 'Call', down1, spotPrice),
                option('Short', 'Call', atm, spotPrice, 2),
                option('Long', 'Call', up1, spotPrice),
            ];
        },
    },
    {
        id: 'long-put-butterfly',
        name: 'Long Put Butterfly',
        category: 'Neutral',
        description: 'Target a tight range with puts and limited risk.',
        build: (spotPrice) => {
            const { up1, atm, down1 } = getStructure(spotPrice);
            return [
                option('Long', 'Put', up1, spotPrice),
                option('Short', 'Put', atm, spotPrice, 2),
                option('Long', 'Put', down1, spotPrice),
            ];
        },
    },
    {
        id: 'long-condor',
        name: 'Long Condor',
        category: 'Neutral',
        description: 'Wider neutral target than a butterfly with defined risk.',
        build: (spotPrice) => {
            const { down2, down1, up1, up2 } = getStructure(spotPrice);
            return [
                option('Long', 'Call', down2, spotPrice),
                option('Short', 'Call', down1, spotPrice),
                option('Short', 'Call', up1, spotPrice),
                option('Long', 'Call', up2, spotPrice),
            ];
        },
    },
    {
        id: 'box-spread',
        name: 'Box Spread',
        category: 'Neutral',
        description: 'Pair a bull call spread with a bear put spread.',
        build: (spotPrice) => {
            const { down1, up1 } = getStructure(spotPrice);
            return [
                option('Long', 'Call', down1, spotPrice),
                option('Short', 'Call', up1, spotPrice),
                option('Long', 'Put', up1, spotPrice),
                option('Short', 'Put', down1, spotPrice),
            ];
        },
    },
    {
        id: 'protective-put',
        name: 'Protective Put',
        category: 'Hedging',
        description: 'Own shares and buy a put to define the floor.',
        build: (spotPrice) => {
            const { down1 } = getStructure(spotPrice);
            return [
                stock('Long', spotPrice),
                option('Long', 'Put', down1, spotPrice),
            ];
        },
    },
    {
        id: 'married-put',
        name: 'Married Put',
        category: 'Hedging',
        description: 'Buy stock and a put together as an insured entry.',
        build: (spotPrice) => {
            const { atm } = getStructure(spotPrice);
            return [
                stock('Long', spotPrice),
                option('Long', 'Put', atm, spotPrice),
            ];
        },
    },
    {
        id: 'collar',
        name: 'Collar',
        category: 'Hedging',
        description: 'Cap upside and buy downside protection around stock.',
        build: (spotPrice) => {
            const { down1, up1 } = getStructure(spotPrice);
            return [
                stock('Long', spotPrice),
                option('Long', 'Put', down1, spotPrice),
                option('Short', 'Call', up1, spotPrice),
            ];
        },
    },
    {
        id: 'zero-cost-collar',
        name: 'Zero-Cost Collar',
        category: 'Hedging',
        description: 'Collar tuned so call credit roughly funds the put.',
        build: (spotPrice) => {
            const { down1, up1 } = getStructure(spotPrice);
            const putPremium = estimateOptionPremium('Put', down1, spotPrice);
            return [
                stock('Long', spotPrice),
                option('Long', 'Put', down1, spotPrice, 1, 1, putPremium),
                option('Short', 'Call', up1, spotPrice, 1, 1, putPremium),
            ];
        },
    },
    {
        id: 'protective-call',
        name: 'Protective Call',
        category: 'Hedging',
        description: 'Short shares and buy a call to cap upside risk.',
        build: (spotPrice) => {
            const { up1 } = getStructure(spotPrice);
            return [
                stock('Short', spotPrice),
                option('Long', 'Call', up1, spotPrice),
            ];
        },
    },
    {
        id: 'covered-strangle',
        name: 'Covered Strangle',
        category: 'Hedging',
        description: 'Long stock plus a short strangle to earn more premium.',
        build: (spotPrice) => {
            const { down1, up1 } = getStructure(spotPrice);
            return [
                stock('Long', spotPrice),
                option('Short', 'Put', down1, spotPrice),
                option('Short', 'Call', up1, spotPrice),
            ];
        },
    },
    {
        id: 'covered-straddle',
        name: 'Covered Straddle',
        category: 'Hedging',
        description: 'Long stock and sell an ATM straddle for maximum premium.',
        build: (spotPrice) => {
            const { atm } = getStructure(spotPrice);
            return [
                stock('Long', spotPrice),
                option('Short', 'Put', atm, spotPrice),
                option('Short', 'Call', atm, spotPrice),
            ];
        },
    },
    {
        id: 'fence',
        name: 'Fence',
        category: 'Hedging',
        description: 'Protected stock with extra put premium sold to help pay.',
        build: (spotPrice) => {
            const { down2, down1, up1 } = getStructure(spotPrice);
            return [
                stock('Long', spotPrice),
                option('Long', 'Put', down2, spotPrice),
                option('Short', 'Put', down1, spotPrice),
                option('Short', 'Call', up1, spotPrice),
            ];
        },
    },
    {
        id: 'stock-repair',
        name: 'Stock Repair',
        category: 'Hedging',
        description: 'Use calls to recover toward a higher stock cost basis.',
        build: (spotPrice) => {
            const { atm, up2 } = getStructure(spotPrice);
            return [
                stock('Long', spotPrice + (up2 - atm)),
                option('Long', 'Call', atm, spotPrice),
                option('Long', 'Call', atm, spotPrice),
                option('Short', 'Call', up2, spotPrice, 2),
            ];
        },
    },
    {
        id: 'conversion',
        name: 'Conversion',
        category: 'Hedging',
        description: 'Long stock plus synthetic short stock at the same strike.',
        build: (spotPrice) => {
            const { atm } = getStructure(spotPrice);
            return [
                stock('Long', spotPrice),
                option('Long', 'Put', atm, spotPrice),
                option('Short', 'Call', atm, spotPrice),
            ];
        },
    },
];

export const groupedStrategyPresets = categoryOrder.reduce<Record<StrategyCategory, StrategyPreset[]>>((groups, category) => {
    groups[category] = strategyPresets.filter(strategy => strategy.category === category);
    return groups;
}, {
    Bullish: [],
    Bearish: [],
    Neutral: [],
    Hedging: [],
});
