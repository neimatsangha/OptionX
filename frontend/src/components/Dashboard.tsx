import React from 'react';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold gradient-text">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="mui-card">
          <h3 className="text-xl font-semibold mb-2 flex items-center">
            <Sparkles className="mr-2" /> Total Value Locked
          </h3>
          <p className="text-3xl font-bold">$1,234,567</p>
          <p className="text-green-400 flex items-center mt-2">
            <TrendingUp className="mr-1" /> +5.67% (24h)
          </p>
        </div>

        <div className="mui-card">
          <h3 className="text-xl font-semibold mb-2">Active Options</h3>
          <p className="text-3xl font-bold">42</p>
          <p className="text-blue-400 flex items-center mt-2">
            <TrendingUp className="mr-1" /> +3 (24h)
          </p>
        </div>

        <div className="mui-card">
          <h3 className="text-xl font-semibold mb-2">Trading Volume</h3>
          <p className="text-3xl font-bold">$789,012</p>
          <p className="text-red-400 flex items-center mt-2">
            <TrendingDown className="mr-1" /> -2.34% (24h)
          </p>
        </div>
      </div>

      <div className="mui-card">
        <h3 className="text-2xl font-semibold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-2">Type</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2">Call Option Minted</td>
                <td>100 APT</td>
                <td className="text-green-400">Completed</td>
                <td>2 mins ago</td>
              </tr>
              <tr>
                <td className="py-2">Put Option Sold</td>
                <td>50 APT</td>
                <td className="text-yellow-400">Pending</td>
                <td>5 mins ago</td>
              </tr>
              <tr>
                <td className="py-2">Call Option Exercised</td>
                <td>75 APT</td>
                <td className="text-green-400">Completed</td>
                <td>10 mins ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;