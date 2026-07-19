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
  formatPrice: (priceInINR: number) => string;
  getAmount: (priceInINR: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('INR'); // Default to INR while loading
  const [isIndia, setIsIndia] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('pending');
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  
  // Fixed exchange rate for simplicity and stability
  const exchangeRate = 80; // Example: 1 USD = 80 INR

  useEffect(() => {
    const detectLocation = () => {
      if (!('geolocation' in navigator)) {
        setLocationStatus('denied');
        setIsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            setLocationStatus('granted');
            const { latitude, longitude } = position.coords;
            
            // Reverse Geocode using Nominatim (OpenStreetMap) to get full street-level address
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
              headers: {
                'Accept-Language': 'en-US,en;q=0.9'
              }
            });
            if (!response.ok) throw new Error('Location fetch failed');
            const data = await response.json();
            
            const isInd = data.address?.country_code === 'in';
            setCurrency(isInd ? 'INR' : 'USD');
            setIsIndia(isInd);

            // Construct full street address
            const streetAddress = [data.address?.house_number, data.address?.road, data.address?.suburb]
              .filter(Boolean)
              .join(', ');

            setAddressData({
              city: data.address?.city || data.address?.town || data.address?.village || '',
              state: streetAddress || data.address?.state || data.display_name || '', // Use state as the address field
              country: data.address?.country || '',
              postcode: data.address?.postcode || ''
            });
          } catch (error) {
            console.error('Failed to parse location, defaulting to INR', error);
            setCurrency('INR');
            setIsIndia(true);
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          console.warn('Geolocation denied or failed:', error);
          setLocationStatus('denied');
          setIsLoading(false);
        }
      );
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
    <CurrencyContext.Provider value={{ currency, exchangeRate, isIndia, isLoading, locationStatus, addressData, formatPrice, getAmount }}>
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
