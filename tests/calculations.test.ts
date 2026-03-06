import test from 'node:test';
import assert from 'node:assert/strict';
import type { OptionLeg } from '../src/types/OptionTypes.ts';
import {
    calculateCurrentTimeValue,
    calculateDisplayDomain,
    calculatePayoff,
    calculateStrategyMetrics,
    generateChartData,
} from '../src/utils/calculations.ts';

const createLeg = (overrides: Partial<OptionLeg>): OptionLeg => ({
    id: overrides.id ?? 'leg',
    type: overrides.type ?? 'Call',
    position: overrides.position ?? 'Long',
    strike: overrides.strike ?? 100,
    premium: overrides.premium ?? 5,
    quantity: overrides.quantity ?? 1,
});

test('calculatePayoff matches canonical option and stock payoffs', () => {
    assert.equal(
        calculatePayoff(90, createLeg({ type: 'Call', position: 'Long', strike: 100, premium: 5 })),
        -5
    );

    assert.equal(
        calculatePayoff(90, createLeg({ type: 'Put', position: 'Short', strike: 100, premium: 6 })),
        -4
    );

    assert.equal(
        calculatePayoff(120, createLeg({ type: 'Stock', position: 'Long', premium: 100 })),
        20
    );
});

test('calculateCurrentTimeValue uses premium minus intrinsic value', () => {
    assert.equal(
        calculateCurrentTimeValue(105, createLeg({ type: 'Call', strike: 100, premium: 7, quantity: 2 })),
        4
    );

    assert.equal(
        calculateCurrentTimeValue(95, createLeg({ type: 'Put', strike: 100, premium: 3 })),
        -2
    );

    assert.equal(
        calculateCurrentTimeValue(120, createLeg({ type: 'Stock', premium: 100 })),
        null
    );
});

test('calculateStrategyMetrics returns point break-evens for a bull call spread', () => {
    const legs = [
        createLeg({ id: 'long-call', type: 'Call', position: 'Long', strike: 100, premium: 6 }),
        createLeg({ id: 'short-call', type: 'Call', position: 'Short', strike: 110, premium: 2 }),
    ];
    const metrics = calculateStrategyMetrics(legs);

    assert.equal(metrics.maxProfit, 6);
    assert.equal(metrics.maxLoss, -4);
    assert.deepEqual(metrics.breakEvens, [104]);
    assert.deepEqual(metrics.breakEvenRanges, []);
    assert.equal(metrics.isMaxProfitUnlimited, false);
    assert.equal(metrics.isMaxLossUnlimited, false);
});

test('calculateStrategyMetrics reports all prices when profit is identically zero', () => {
    const legs = [
        createLeg({ id: 'stock', type: 'Stock', position: 'Long', premium: 100 }),
        createLeg({ id: 'put', type: 'Put', position: 'Long', strike: 100, premium: 4 }),
        createLeg({ id: 'call', type: 'Call', position: 'Short', strike: 100, premium: 4 }),
    ];
    const metrics = calculateStrategyMetrics(legs);

    assert.deepEqual(metrics.breakEvens, []);
    assert.deepEqual(metrics.breakEvenRanges, [{ start: 0, end: null }]);
    assert.equal(metrics.maxProfit, 0);
    assert.equal(metrics.maxLoss, 0);
});

test('calculateDisplayDomain never renders negative spot prices', () => {
    const domain = calculateDisplayDomain([
        createLeg({ id: 'call', type: 'Call', position: 'Long', strike: 5, premium: 1 }),
    ], 5);

    assert.equal(domain.chartMinSpot, 0);
    assert.ok(domain.chartMaxSpot >= 15);
});

test('generateChartData includes exact anchor spots', () => {
    const data = generateChartData([
        createLeg({ id: 'call', type: 'Call', position: 'Long', strike: 100, premium: 5 }),
    ], 49, 152, 1, [100.5]);

    assert.ok(data.some(row => row.spotPrice === 100.5));
});
