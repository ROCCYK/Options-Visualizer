import { OptionProvider } from './context/OptionContext';
import ChartVisualizer from './components/ChartVisualizer';
import OptionLegEditor from './components/OptionLegEditor';
import StrategySelector from './components/StrategySelector';
import PayoffTable from './components/PayoffTable';
import OptionValueTable from './components/OptionValueTable';
import EducationPanel from './components/EducationPanel';

function App() {
  return (
    <OptionProvider>
      <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        <header className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Options Visualizer</h1>
            <p className="text-lg text-foreground/70">Master Options Strategies visually.</p>
          </div>
        </header>

        <main className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-2/3 space-y-6 lg:order-1 order-2">
            <div className="glass p-4 md:p-8 rounded-3xl min-h-[500px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  Profit Profile
                </h2>
                <div className="flex gap-4 text-sm font-medium">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div> Total PnL</div>
                </div>
              </div>
              <div className="flex-1 bg-background/30 rounded-2xl border border-white/5">
                <ChartVisualizer />
              </div>
              <PayoffTable />
              <div className="mt-12 border-t border-white/10 pt-8">
                <OptionValueTable />
              </div>
            </div>

            <EducationPanel />
          </div>

          <div className="w-full lg:w-1/3 space-y-6 lg:sticky lg:top-8 lg:order-2 order-1">
            <div className="glass p-4 md:p-6 rounded-3xl">
              <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                Strategy Builder
              </h2>
              <StrategySelector />
              <OptionLegEditor />
            </div>
          </div>
        </main>
      </div>
    </OptionProvider>
  );
}

export default App;
