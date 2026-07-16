import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'INR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  exchangeRate: number; // 1 USD = X INR
  isIndia: boolean;
  isLoading: boolean;
  formatPrice: (priceInINR: number) => string;
  getAmount: (priceInINR: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('INR'); // Default to INR while loading
  const [isIndia, setIsIndia] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Fixed exchange rate for simplicity and stability
  const exchangeRate = 80; // Example: 1 USD = 80 INR

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Location fetch failed');
        const data = await response.json();
        
        if (data.country_code === 'IN') {
          setCurrency('INR');
          setIsIndia(true);
        } else {
          setCurrency('USD');
          setIsIndia(false);
        }
      } catch (error) {
        console.error('Failed to detect location, defaulting to INR', error);
        setCurrency('INR');
        setIsIndia(true);
      } finally {
        setIsLoading(false);
      }
    };

    detectLocation();
  }, []);

  const formatPrice = (priceInINR: number) => {
    if (currency === 'USD') {
      const priceInUSD = Math.ceil(priceInINR / exchangeRate);
      return `$${priceInUSD}`;
    }
    return `₹${priceInINR.toLocaleString('en-IN')}`;
  };

  const getAmount = (priceInINR: number) => {
    if (currency === 'USD') {
      return Math.ceil(priceInINR / exchangeRate);
    }
    return priceInINR;
  }

  return (
    <CurrencyContext.Provider value={{ currency, exchangeRate, isIndia, isLoading, formatPrice, getAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
