import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Marketplace from './components/Marketplace';
import Portfolio from './components/Portfolio';

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Function to connect to the Petra wallet
  const connectWallet = async () => {
    if ('aptos' in window) {
      try {
        const response = await window.aptos.connect();
        setIsWalletConnected(true);
        setWalletAddress(response.address);
        console.log('Connected account:', response.address);
      } catch (error: any) {
        if (error.code === 4001) {
          // User rejected the connection request
          console.log('User rejected the connection request');
        } else {
          console.error('Error connecting to Petra wallet:', error);
        }
      }
    } else {
      alert('Please install the Petra wallet extension.');
    }
  };

  // Function to disconnect the wallet
  const disconnectWallet = async () => {
    if ('aptos' in window) {
      try {
        await window.aptos.disconnect();
        setIsWalletConnected(false);
        setWalletAddress(null);
        console.log('Wallet disconnected');
      } catch (error) {
        console.error('Error disconnecting from Petra wallet:', error);
      }
    }
  };

  // Check if the wallet is already connected on component mount
  useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      if ('aptos' in window) {
        const isConnected = await window.aptos.isConnected();
        if (isConnected) {
          const account = await window.aptos.account();
          setIsWalletConnected(true);
          setWalletAddress(account.address);
          console.log('Wallet is already connected:', account.address);
        }
      } else {
        console.log('Petra wallet not installed');
      }
    };
    checkIfWalletIsConnected();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <nav className="bg-black p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold gradient-text">OptionX</h1>
            <div className="flex items-center space-x-6">
              <Link to="/" className="hover:text-accent">Dashboard</Link>
              <Link to="/marketplace" className="hover:text-accent">Marketplace</Link>
              <Link to="/portfolio" className="hover:text-accent">Portfolio</Link>
              <button
                onClick={isWalletConnected ? disconnectWallet : connectWallet}
                className="px-4 py-2 border-4 border-white rounded-full hover:bg-white hover:text-black transition-colors"
              >
                {isWalletConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </nav>

        <main className="container mx-auto mt-8 p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/portfolio" element={<Portfolio />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
