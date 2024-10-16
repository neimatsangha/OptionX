import React, { useState } from 'react';
import { Save } from 'lucide-react';

const Settings: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [slippage, setSlippage] = useState(0.5);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save these settings to your backend or local storage
    console.log('Settings saved:', { notifications, theme, slippage });
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold gradient-text">Settings</h2>
      
      <form onSubmit={handleSave} className="glassmorphism p-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Notifications</h3>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="form-checkbox h-5 w-5 text-gray-600 rounded-none"
            />
            <span>Enable email notifications</span>
          </label>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Theme</h3>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full bg-gray-800 rounded-none p-2"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Slippage Tolerance</h3>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-right">{slippage}%</p>
        </div>

        <button
          type="submit"
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 angular-button transition duration-300 ease-in-out flex items-center justify-center"
        >
          <Save className="mr-2" />
          Save Settings
        </button>
      </form>
    </div>
  );
};

export default Settings;