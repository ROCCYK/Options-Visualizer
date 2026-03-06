export default function EducationPanel() {
    return (
        <div className="glass p-6 md:p-8 rounded-3xl mt-6">
            <h2 className="text-xl font-bold mb-4 text-primary">Lecture Concepts</h2>

            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <p className="font-bold text-lg mb-2 text-foreground">Option Value = IV + TV</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Intrinsic Value (IV):</strong> Difference between spot and strike (if in the money). Minimum is 0.</li>
                        <li><strong>Time Value (TV):</strong> Premium paid over the IV. Depends on Time to Expiration and Implied Volatility.</li>
                    </ul>
                </div>

                <h3 className="font-bold text-foreground mt-6 mb-2">Key Strategies from Class:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="font-bold text-purple-300">Spreads</h4>
                        <p className="text-xs mt-1">Combine buying and selling options of the same type to cap both risk and reward. (e.g. Bull Spread, Bear Spread)</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="font-bold text-purple-300">Straddle & Strangle</h4>
                        <p className="text-xs mt-1">Buy a Call and Put to profit from high volatility (Straddle uses same strike, Strangle uses different strikes).</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 md:col-span-2">
                        <h4 className="font-bold text-purple-300">Butterfly Spread</h4>
                        <p className="text-xs mt-1">Buy 1 ITM, Sell 2 ATM, Buy 1 OTM. Max profit occurs if the asset closes exactly at the middle strike.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
