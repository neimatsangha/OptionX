import React, { useState, useEffect } from 'react';
import { Calendar } from "./ui/calendar"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "../lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Filter } from 'lucide-react';
import { blackScholes } from 'black-scholes';

const Marketplace: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>();
  const [strikePrice, setStrikePrice] = useState<number | undefined>();
  const [optionPrice, setOptionPrice] = useState<number | null>(null);
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [currentAptPrice, setCurrentAptPrice] = useState<number | null>(null);
  const [historicalVolatility, setHistoricalVolatility] = useState<number | null>(null);
  const [amount, setAmount] = useState<number | undefined>();
  
  // Convert options to state variable
  const [options, setOptions] = useState<Array<{
    type: 'Call' | 'Put',
    strikePrice: number,
    currentPrice: number,
    expiry: string,
    volume: number
  }>>();

  // Sort options by expiry date (closest expiry date at the top)
  const sortedOptions = [...options].sort((a, b) => {
    const dateA = new Date(a.expiry).getTime();
    const dateB = new Date(b.expiry).getTime();
    return dateA - dateB;
  });

  const filteredOptions = sortedOptions.filter(option => option.type.toLowerCase() === optionType);

  useEffect(() => {
    // Fetch current APT price and calculate historical volatility
    const fetchAptPrice = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=aptos&vs_currencies=usd'
        );
        const data = await response.json();
        const price = data.aptos.usd;
        setCurrentAptPrice(price);
        console.log('Current APT Price:', price, 'USD');
      } catch (error) {
        console.error('Error fetching APT price:', error);
      }
    };

    const fetchVolatility = async () => {
      const prices = await fetchHistoricalPrices();
      if (prices.length > 0) {
        const dailyReturns = calculateDailyReturns(prices);
        const volatility = calculateHistoricalVolatility(dailyReturns);
        setHistoricalVolatility(volatility);
        console.log('Calculated Historical Volatility:', volatility);
      } else {
        console.error('Failed to fetch prices for volatility calculation.');
      }
    };

    fetchAptPrice();
    fetchVolatility();
  }, []);

  useEffect(() => {
    // Load TradingView widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView !== 'undefined') {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: "BINANCE:APTUSD",
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: "tradingview_chart"
        });
      }
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Calculate option price whenever inputs change
    if (strikePrice && date && currentAptPrice && historicalVolatility !== null) {
      calculateOptionPrice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strikePrice, date, optionType, currentAptPrice, historicalVolatility]);

  const fetchHistoricalPrices = async (): Promise<number[]> => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/aptos/market_chart?vs_currency=usd&days=30'
      );
      const data = await response.json();
      // data.prices is an array of [timestamp, price]
      const prices: number[] = data.prices.map((entry: [number, number]) => entry[1]);
      console.log('Historical Prices:', prices);
      return prices;
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      return [];
    }
  };

  const calculateDailyReturns = (prices: number[]): number[] => {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const dailyReturn = Math.log(prices[i] / prices[i - 1]);
      returns.push(dailyReturn);
    }
    console.log('Daily Returns:', returns);
    return returns;
  };

  const calculateHistoricalVolatility = (dailyReturns: number[]): number => {
    const n = dailyReturns.length;
    if (n === 0) return 0;

    const mean = dailyReturns.reduce((acc, val) => acc + val, 0) / n;
    const squaredDiffs = dailyReturns.map((r) => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / (n - 1);
    const dailyVolatility = Math.sqrt(variance);

    // Annualize volatility (assuming 365 days)
    const annualizedVolatility = dailyVolatility * Math.sqrt(365);

    console.log('Annualized Volatility:', annualizedVolatility);
    return annualizedVolatility;
  };

  const calculateOptionPrice = () => {
    if (!strikePrice || !date || !currentAptPrice || historicalVolatility === null) {
      return;
    }

    const S = currentAptPrice; // Current price of APT
    const K = strikePrice;     // Strike price
    const timeNow = new Date().getTime();
    const expirationTime = date.getTime();
    const T = (expirationTime - timeNow) / (1000 * 60 * 60 * 24 * 365); // Time to expiration in years

    if (T <= 0) {
      console.error('Expiration date must be in the future.');
      return;
    }

    const v = historicalVolatility; // Volatility as a decimal
    const r = 0.0453;               // Annual risk-free interest rate as a decimal
    const callPut = optionType === 'call' ? "put" : "call";     // 'call' or 'put'

    // Use the blackScholes function from the npm package
    const price = blackScholes(S, K, T, v, r, callPut);
    setOptionPrice(price);

    console.log(`Calculated Option Price: ${price.toFixed(4)} USD`);
  };

  const handleStrikePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setStrikePrice(value);
    } else {
      setStrikePrice(undefined);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setAmount(value);
    } else {
      setAmount(undefined);
    }
  };

  const handleDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
  };

  const handleMint = (e: React.FormEvent) => {
    e.preventDefault();

    if (!strikePrice || !date || !amount || optionPrice === null) {
      console.error('Please fill in all fields to mint an option.');
      return;
    }

    // Create a new option object
    const newOption = {
      type: optionType.charAt(0).toUpperCase() + optionType.slice(1) as 'Call' | 'Put',
      strikePrice: strikePrice,
      currentPrice: optionPrice, // You might want to use a different price here
      expiry: format(date, 'yyyy-MM-dd'),
      volume: amount,
    };

    console.log('Minting Option:', newOption);

    // Reset form fields if desired
    setStrikePrice(undefined);
    setAmount(undefined);
    setDate(undefined);
    setOptionPrice(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold gradient-text">Marketplace</h2>
      
      <div className="flex space-x-6">
        {/* TradingView Chart */}
        <div className="w-2/3 mui-card" style={{ height: '500px' }}>
          <h3 className="text-2xl font-semibold mb-4">Asset Chart</h3>
          <div id="tradingview_chart" style={{ height: 'calc(100% - 40px)' }}></div>
        </div>

        {/* Create Option */}
        <div className="w-1/3 mui-card" style={{ minHeight: '500px' }}>
          <h3 className="text-2xl font-semibold mb-4">Create Option</h3>
          <form className="space-y-4" onSubmit={handleMint}>
            {/* Option Type Toggle */}
            <div className="flex items-center justify-center mb-4">
              <div 
                className="relative w-full h-12 bg-gray-800 bg-opacity-50 rounded-full cursor-pointer overflow-hidden backdrop-blur-sm border border-gray-700"
                onClick={() => setOptionType(optionType === 'call' ? 'put' : 'call')}
              >
                <div 
                  className={`absolute inset-0 bg-gray-600 transition-transform duration-300 ease-in-out ${
                    optionType === 'call' ? 'translate-x-0' : 'translate-x-full'
                  }`}
                  style={{ width: '50%' }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-between px-4 font-semibold">
                  <span className={`w-1/2 text-center z-10 transition-colors duration-300 ${optionType === 'call' ? 'text-white' : 'text-gray-400'}`}>Call</span>
                  <span className={`w-1/2 text-center z-10 transition-colors duration-300 ${optionType === 'put' ? 'text-white' : 'text-gray-400'}`}>Put</span>
                </div>
              </div>
            </div>
            
            {/* Strike Price Input */}
            <div className="space-y-2">
              <Label htmlFor="strikePrice">Strike Price (USD)</Label>
              <Input 
                type="number" 
                id="strikePrice" 
                placeholder="Enter strike price" 
                min="0" 
                step="0.01"
                value={strikePrice !== undefined ? strikePrice : ''}
                onChange={handleStrikePriceChange}
                onKeyPress={(event) => {
                  if (event.key === '-' || event.key === '+') {
                    event.preventDefault();
                  }
                }}
              />
            </div>
            
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (APT)</Label>
              <Input 
                type="number" 
                id="amount" 
                placeholder="Enter amount" 
                min="0" 
                step="0.01"
                value={amount !== undefined ? amount : ''}
                onChange={handleAmountChange}
                onKeyPress={(event) => {
                  if (event.key === '-' || event.key === '+') {
                    event.preventDefault();
                  }
                }}
              />
            </div>
            
            {/* Expiration Date Picker */}
            <div className="space-y-2">
              <Label>Expiration Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateChange}
                    initialFocus
                    className="bg-background border border-input"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Display Option Price */}
            {optionPrice !== null && (
              <div className="space-y-2">
                <Label>Option Price:</Label>
                <p>{optionPrice.toFixed(4)} USD</p>
              </div>
            )}
            
            {/* Submit Button */}
            <Button type="submit" className="w-full bg-accent text-background hover:bg-accent/90 transition-colors">
              Mint
            </Button>
          </form>
        </div>
      </div>

      {/* Trade Options */}
      <div className="mui-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold">Trade Options</h3>
          <Button variant="outline" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-2">Type</th>
                <th className="pb-2">Strike Price</th>
                <th className="pb-2">Option Price</th>
                <th className="pb-2">Expiry</th>
                <th className="pb-2">Volume</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOptions.map((option, index) => (
                <tr key={index}>
                  <td className="py-2">{option.type}</td>
                  <td>{option.strikePrice} USD</td>
                  <td>{option.currentPrice.toFixed(4)} USD</td>
                  <td>{option.expiry}</td>
                  <td>{option.volume} APT</td>
                  <td>
                    <Button variant="outline" size="sm">
                      Trade
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
