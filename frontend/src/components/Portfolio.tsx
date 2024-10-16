import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const Portfolio: React.FC = () => {
  const positions = [
    { type: 'Call', strike: 10, expiry: '2024-06-30', amount: 100, pnl: 250 },
    { type: 'Put', strike: 9, expiry: '2024-06-30', amount: 50, pnl: -75 },
    { type: 'Call', strike: 11, expiry: '2024-07-31', amount: 75, pnl: 120 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold gradient-text">Portfolio</h2>
      
      <div className="mui-card">
        <h3 className="text-2xl font-semibold mb-4">Your Positions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-2">Type</th>
                <th className="pb-2">Strike Price</th>
                <th className="pb-2">Expiry</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">P&L</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position, index) => (
                <tr key={index}>
                  <td className="py-2">{position.type}</td>
                  <td>{position.strike} APT</td>
                  <td>{position.expiry}</td>
                  <td>{position.amount} APT</td>
                  <td className={position.pnl > 0 ? 'text-green-400' : 'text-red-400'}>
                    {position.pnl > 0 ? <TrendingUp className="inline mr-1" /> : <TrendingDown className="inline mr-1" />}
                    {Math.abs(position.pnl)} APT
                  </td>
                  <td>
                    <button className="mui-button text-sm">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="mui-card">
          <h3 className="text-xl font-semibold mb-4">Portfolio Value</h3>
          <p className="text-3xl font-bold">1,250 APT</p>
          <p className="text-green-400 flex items-center mt-2">
            <TrendingUp className="mr-1" /> +125 APT (24h)
          </p>
        </div>

        <div className="mui-card">
          <h3 className="text-xl font-semibold mb-4">Total P&L</h3>
          <p className="text-3xl font-bold text-green-400">+295 APT</p>
          <p className="text-sm mt-2">Since inception</p>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;