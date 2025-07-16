import React, { useState, useEffect, useMemo } from 'react';

// --- Helper Components ---

const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

// --- Main Application ---

export default function App() {
    const [tokens, setTokens] = useState([]);
    const [prices, setPrices] = useState({});
    const [fromToken, setFromToken] = useState(null);
    const [toToken, setToToken] = useState(null);
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [isFromModalOpen, setIsFromModalOpen] = useState(false);
    const [isToModalOpen, setIsToModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isWalletConnected, setIsWalletConnected] = useState(false);

    useEffect(() => {
        const fetchTokenData = async () => {
            try {
                // Fetch prices and create a map for quick lookups
                const pricesResponse = await fetch('https://interview.switcheo.com/prices.json');
                const pricesData = await pricesResponse.json();
                const pricesMap = pricesData.reduce((acc, token) => {
                    acc[token.currency] = token.price;
                    return acc;
                }, {});
                setPrices(pricesMap);

                // Create a Set of currencies that have prices
                const pricedCurrencies = new Set(pricesData.map(p => p.currency));
              
                const allCurrencies = [...new Set(pricesData.map(p => p.currency))];
                const tokenList = allCurrencies
                    .filter(currency => pricedCurrencies.has(currency)) 
                    .map(currency => ({
                        currency: currency,
                        icon: `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${currency}.svg`
                    }));

                setTokens(tokenList);
            } catch (err) {
                console.error("Failed to fetch token data:", err);
                setError("Could not load token data. Please try again later.");
            }
        };

        fetchTokenData();
    }, []);

    // --- Memoized Calculations ---
    const exchangeRate = useMemo(() => {
        if (!fromToken || !toToken || !prices[fromToken.currency] || !prices[toToken.currency]) {
            return null;
        }
        return prices[fromToken.currency] / prices[toToken.currency];
    }, [fromToken, toToken, prices]);

    // --- Event Handlers ---
    const handleFromAmountChange = (e) => {
        const amount = e.target.value;
        if (amount === '' || /^[0-9]*\.?[0-9]*$/.test(amount)) {
            setFromAmount(amount);
            if (exchangeRate && amount) {
                setToAmount((parseFloat(amount) * exchangeRate).toFixed(6));
            } else {
                setToAmount('');
            }
            setError('');
        }
    };

    const handleToAmountChange = (e) => {
        const amount = e.target.value;
        if (amount === '' || /^[0-9]*\.?[0-9]*$/.test(amount)) {
            setToAmount(amount);
            if (exchangeRate && amount) {
                setFromAmount((parseFloat(amount) / exchangeRate).toFixed(6));
            } else {
                setFromAmount('');
            }
            setError('');
        }
    };

    const handleSelectToken = (token, type) => {
        if (type === 'from') {
            if (toToken && token.currency === toToken.currency) {
                setToToken(fromToken);
            }
            setFromToken(token);
            setIsFromModalOpen(false);
        } else {
            if (fromToken && token.currency === fromToken.currency) {
                setFromToken(toToken);
            }
            setToToken(token);
            setIsToModalOpen(false);
        }
        setFromAmount('');
        setToAmount('');
        setError('');
    };

    const swapTokens = () => {
        setFromToken(toToken);
        setToToken(fromToken);
        setFromAmount(toAmount);
        setToAmount(fromAmount);
    };

    const handleSwapSubmit = () => {
        if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
            setError("Please select tokens and enter a valid amount.");
            return;
        }
        setError('');
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setFromAmount('');
            setToAmount('');
        }, 2000);
    };
    
    const handleConnectWallet = () => {     
        setIsWalletConnected(!isWalletConnected);
    }

    const TokenModal = ({ isOpen, onClose, onSelect, currentSelection }) => {
        if (!isOpen) return null;

        const filteredTokens = tokens.filter(token =>
            token.currency.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                <div className="bg-gray-800 rounded-2xl w-full max-w-md flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-white">Select a token</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <Icon path="M6 18L18 6M6 6l12 12" />
                        </button>
                    </div>
                    <div className="p-4">
                        <input
                            type="text"
                            placeholder="Search name or paste address"
                            className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex-grow overflow-y-auto p-4">
                        {filteredTokens.length > 0 ? (
                            filteredTokens.map(token => (
                                <button
                                    key={token.currency}
                                    className={`w-full flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 ${currentSelection?.currency === token.currency ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => onSelect(token)}
                                    disabled={currentSelection?.currency === token.currency}
                                >
                                    <img src={token.icon} alt={token.currency} className="w-8 h-8 mr-4 rounded-full bg-gray-700" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/40x40/1F2937/FFFFFF?text=?' }}/>
                                    <span className="text-white font-medium">{token.currency}</span>
                                </button>
                            ))
                        ) : (
                            <p className="text-gray-400 text-center py-4">No tokens found.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const CurrencyInput = ({ label, amount, onAmountChange, token, onTokenSelect, otherToken }) => (
        <div className="bg-gray-800 p-4 rounded-2xl">
            <p className="text-sm text-gray-400 mb-2">{label}</p>
            <div className="flex justify-between items-center">
                <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.0"
                    className="bg-transparent text-3xl font-mono text-white w-full outline-none"
                    value={amount}
                    onChange={onAmountChange}
                />
                <button
                    onClick={onTokenSelect}
                    className="flex items-center bg-gray-900 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-full transition-colors duration-200"
                >
                    {token ? (
                        <>
                            <img src={token.icon} alt={token.currency} className="w-6 h-6 mr-2 rounded-full" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/24x24/1F2937/FFFFFF?text=?' }}/>
                            {token.currency}
                        </>
                    ) : (
                        "Select Token"
                    )}
                    <Icon path="M19.5 8.25l-7.5 7.5-7.5-7.5" className="w-4 h-4 ml-2" />
                </button>
            </div>
            {token && prices[token.currency] && amount && (
                 <p className="text-sm text-gray-400 mt-1">
                    ~${(parseFloat(amount) * prices[token.currency]).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            )}
        </div>
    );

    const submitButtonText = () => {
        if (!isWalletConnected) return "Connect Wallet";
        if (!fromToken || !toToken) return "Select a token";
        if (isLoading) return "Swapping...";
        return "Swap";
    };

    return (
        <div className="bg-black min-h-screen flex flex-col items-center justify-center font-sans text-white p-4">
            <nav className="absolute top-0 left-0 right-0 p-4 flex justify-end">
                <button 
                    onClick={handleConnectWallet}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300"
                >
                    {isWalletConnected ? 'Wallet Connected' : 'Connect Wallet'}
                </button>
            </nav>
            
            <div className="w-full max-w-md mx-auto">
                <div className="bg-gray-900 p-4 rounded-2xl shadow-lg relative">
                    <h1 className="text-xl font-semibold mb-4 text-center">Currency Swap</h1>
                    
                    <div className="space-y-2">
                        <CurrencyInput
                            label="Amount to send"
                            amount={fromAmount}
                            onAmountChange={handleFromAmountChange}
                            token={fromToken}
                            onTokenSelect={() => setIsFromModalOpen(true)}
                            otherToken={toToken}
                        />
                        
                        <div className="flex justify-center items-center my-[-10px] z-10">
                            <button
                                onClick={swapTokens}
                                className="bg-gray-700 p-2 rounded-full text-gray-300 hover:bg-gray-600 hover:rotate-180 transition-transform duration-300"
                            >
                                <Icon path="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V4.5" className="w-5 h-5" />
                            </button>
                        </div>

                        <CurrencyInput
                            label="Amount to receive"
                            amount={toAmount}
                            onAmountChange={handleToAmountChange}
                            token={toToken}
                            onTokenSelect={() => setIsToModalOpen(true)}
                            otherToken={fromToken}
                        />
                    </div>
                    
                    {exchangeRate && (
                        <div className="text-center text-gray-400 my-4">
                            1 {fromToken.currency} ≈ {exchangeRate.toFixed(4)} {toToken.currency}
                        </div>
                    )}

                    {error && <p className="text-red-500 text-center mt-4">{error}</p>}

                    <button
                        onClick={handleSwapSubmit}
                        disabled={isLoading || !fromToken || !toToken || !isWalletConnected}
                        className="w-full mt-4 bg-pink-600 text-white font-bold py-3 px-4 rounded-2xl text-lg hover:bg-pink-700 transition-colors duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading && (
                             <Icon path="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.696a8.25 8.25 0 00-11.667 0l-3.181 3.183" className="animate-spin w-5 h-5 mr-3" />
                        )}
                        {submitButtonText()}
                    </button>
                </div>
            </div>

            <TokenModal
                isOpen={isFromModalOpen}
                onClose={() => setIsFromModalOpen(false)}
                onSelect={(token) => handleSelectToken(token, 'from')}
                currentSelection={toToken}
            />
            <TokenModal
                isOpen={isToModalOpen}
                onClose={() => setIsToModalOpen(false)}
                onSelect={(token) => handleSelectToken(token, 'to')}
                currentSelection={fromToken}
            />
        </div>
    );
}
