import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'INR' | 'USD';
type LocationStatus = 'pending' | 'granted' | 'denied';

interface AddressData {
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

interface CurrencyContextType {
  currency: Currency;
  exchangeRate: number; // 1 USD = X INR
  isIndia: boolean;
  isLoading: boolean;
  locationStatus: LocationStatus;
  addressData: AddressData | null;
  formatPrice: (priceInINR: number, priceInUSD?: number) => string;
  getAmount: (priceInINR: number, priceInUSD?: number) => number;
  detectLocation: () => Promise<boolean>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [isIndia, setIsIndia] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('pending');
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  
  // Fixed exchange rate for simplicity and stability
  const exchangeRate = 80; // Example: 1 USD = 80 INR

  const detectLocation = async (): Promise<boolean> => {
    setIsLoading(true);
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        setLocationStatus('denied');
        setCurrency('USD');
        setIsIndia(false);
        setIsLoading(false);
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            setLocationStatus('granted');
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
              headers: { 'Accept-Language': 'en-US,en;q=0.9' }
            });
            if (!response.ok) throw new Error('Location fetch failed');
            const data = await response.json();
            
            const isInd = data.address?.country_code === 'in';
            setCurrency(isInd ? 'INR' : 'USD');
            setIsIndia(isInd);

            const streetAddress = [data.address?.house_number, data.address?.road, data.address?.suburb]
              .filter(Boolean)
              .join(', ');

            setAddressData({
              city: data.address?.city || data.address?.town || data.address?.village || '',
              state: streetAddress || data.address?.state || data.display_name || '',
              country: data.address?.country || (isInd ? 'India' : 'International'),
              postcode: data.address?.postcode || ''
            });
            resolve(isInd);
          } catch (error) {
            console.error('Location parsing error, defaulting to USD:', error);
            setCurrency('USD');
            setIsIndia(false);
            resolve(false);
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          console.warn('Geolocation denied, defaulting to USD:', error);
          setLocationStatus('denied');
          setCurrency('USD');
          setIsIndia(false);
          setIsLoading(false);
          resolve(false);
        },
        { timeout: 10000 }
      );
    });
  };

  const formatPrice = (priceInINR: number, priceInUSD?: number) => {
    if (currency === 'USD') {
      const usdVal = priceInUSD && priceInUSD > 0 ? priceInUSD : Math.ceil(priceInINR / exchangeRate);
      return `$${usdVal}`;
    }
    return `₹${priceInINR.toLocaleString('en-IN')}`;
  };

  const getAmount = (priceInINR: number, priceInUSD?: number) => {
    if (currency === 'USD') {
      return priceInUSD && priceInUSD > 0 ? priceInUSD : Math.ceil(priceInINR / exchangeRate);
    }
    return priceInINR;
  };

  return (
    <CurrencyContext.Provider value={{ currency, exchangeRate, isIndia, isLoading, locationStatus, addressData, formatPrice, getAmount, detectLocation }}>
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
