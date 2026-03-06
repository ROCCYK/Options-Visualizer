# Options Visualizer

Interactive React app for building option strategies, visualizing expiration payoff, and reviewing core options concepts in a classroom-friendly format.

## Overview

Options Visualizer lets you:

- build custom multi-leg option and stock positions
- load from 40 preset strategies across bullish, bearish, neutral, and hedging categories
- inspect total PnL and individual leg payoff on an interactive chart
- review max profit, max loss, and break-even levels
- study detailed payoff tables and premium vs intrinsic/time value breakdowns

This project is designed for learning and visualization. It does not use live market data, option chains, or production pricing models.

## Features

- Interactive strategy builder with manual leg editing
- Support for `Call`, `Put`, and `Stock` legs
- Long and short positions with adjustable strike, premium, and quantity
- 40 educational strategy presets grouped by market outlook
- Payoff chart with total PnL plus per-leg overlays
- Key metrics panel for:
  - max profit
  - max loss
  - break-even points or ranges
- Payoff table with optional step-by-step math
- Intrinsic value and time value table based on entered premiums
- Educational panel summarizing core concepts and common structures
- Unit tests for the main calculation engine

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Node test runner

## Project Structure

```text
src/
  components/
    ChartVisualizer.tsx
    EducationPanel.tsx
    KeyMetricsPanel.tsx
    OptionLegEditor.tsx
    OptionValueTable.tsx
    PayoffTable.tsx
    StrategySelector.tsx
  context/
    OptionContext.tsx
  types/
    OptionTypes.ts
  utils/
    calculations.ts
    strategyPresets.ts
tests/
  calculations.test.ts
```

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open the local Vite URL shown in the terminal, usually `http://localhost:5173`.

## Available Scripts

```bash
npm run dev      # start the development server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # run ESLint
npm run test     # run calculation tests
```

## How It Works

1. Set the current spot price.
2. Choose a preset strategy or add legs manually.
3. Adjust strikes, premiums, positions, and quantities.
4. Review the payoff chart and per-leg contribution lines.
5. Check max profit, max loss, and break-even outputs.
6. Use the tables to inspect expiration PnL and value decomposition.

## Strategy Presets

The app includes 40 presets split into four categories:

- Bullish
- Bearish
- Neutral
- Hedging

Examples include:

- Long Call
- Bull Call Spread
- Bear Put Spread
- Long Straddle
- Iron Condor
- Protective Put
- Collar
- Covered Call

## Calculation Notes

- Profit/loss is based on expiration payoff.
- Stock legs treat `premium` as entry price.
- The premium/intrinsic/time value table uses the premium entered by the user.
- Time value is shown with the educational formula `Premium - Intrinsic Value`.
- No live implied volatility, Greeks, early exercise, assignment, commissions, or slippage are modeled.

## Testing

The test suite currently covers the calculation layer, including:

- canonical option and stock payoff behavior
- time value calculations
- break-even and max profit/loss logic
- chart domain behavior
- chart anchor point generation

Run:

```bash
npm run test
```

## Notes

- This is an educational visualization tool, not financial advice.
- Preset premiums are estimated to create representative strategy shapes.
- The package name in `package.json` is still `temp-app` and can be renamed if you want a cleaner published package identity.

