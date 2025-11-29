import { useState, useEffect, useCallback } from "react";

// Transport segment between destinations
export interface TransportSegment {
  mode: string; // "flight", "train", "bus", "car", "ferry"
  durationMinutes?: number;
  estimatedCost?: number;
  notes?: string;
}

export interface ItineraryCity {
  id: string;
  cityName: string;
  countryName: string;
  numberOfNights: number;
  arrivalDate?: string;
  departureDate?: string;
  arrivalAirport?: string; // IATA code like "CDG"
  departureAirport?: string; // IATA code - may differ for open-jaw tickets
  activities?: string[];
  transportToNext?: TransportSegment; // Transport to next destination (null for last city)
}

export interface ItineraryData {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  cities: ItineraryCity[];
  totalNights: number;
  numberOfTravelers: number;
  travelSeason: string;
  // Departure information
  departureCity?: string;
  departureCountry?: string;
  departureAirport?: string; // IATA code like "SFO"
}

const ITINERARY_STORAGE_KEY = "trippirate_itinerary";

export function useItinerary() {
  const [itinerary, setItineraryState] = useState<ItineraryData | null>(() => {
    if (typeof window === "undefined") return null;
    
    const saved = sessionStorage.getItem(ITINERARY_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (itinerary) {
      sessionStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(itinerary));
    }
  }, [itinerary]);

  const setItinerary = useCallback((data: ItineraryData | null) => {
    setItineraryState(data);
    if (data) {
      sessionStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(data));
    } else {
      sessionStorage.removeItem(ITINERARY_STORAGE_KEY);
    }
  }, []);

  const updateCity = useCallback((cityId: string, updates: Partial<ItineraryCity>) => {
    setItineraryState(prev => {
      if (!prev) return prev;
      
      const updatedCities = prev.cities.map(city => 
        city.id === cityId ? { ...city, ...updates } : city
      );
      
      const totalNights = updatedCities.reduce((sum, city) => sum + city.numberOfNights, 0);
      
      return {
        ...prev,
        cities: updatedCities,
        totalNights,
      };
    });
  }, []);

  const addCity = useCallback((city: ItineraryCity) => {
    setItineraryState(prev => {
      if (!prev) return prev;
      
      const updatedCities = [...prev.cities, city];
      const totalNights = updatedCities.reduce((sum, c) => sum + c.numberOfNights, 0);
      
      return {
        ...prev,
        cities: updatedCities,
        totalNights,
      };
    });
  }, []);

  const removeCity = useCallback((cityId: string) => {
    setItineraryState(prev => {
      if (!prev) return prev;
      
      const updatedCities = prev.cities.filter(city => city.id !== cityId);
      const totalNights = updatedCities.reduce((sum, city) => sum + city.numberOfNights, 0);
      
      return {
        ...prev,
        cities: updatedCities,
        totalNights,
      };
    });
  }, []);

  const reorderCities = useCallback((startIndex: number, endIndex: number) => {
    setItineraryState(prev => {
      if (!prev) return prev;
      
      const cities = [...prev.cities];
      const [removed] = cities.splice(startIndex, 1);
      cities.splice(endIndex, 0, removed);
      
      return {
        ...prev,
        cities,
      };
    });
  }, []);

  const updateDates = useCallback((startDate: string) => {
    setItineraryState(prev => {
      if (!prev) return prev;
      
      let currentDate = new Date(startDate);
      const updatedCities = prev.cities.map(city => {
        const arrivalDate = currentDate.toISOString().split('T')[0];
        currentDate.setDate(currentDate.getDate() + city.numberOfNights);
        const departureDate = currentDate.toISOString().split('T')[0];
        
        return {
          ...city,
          arrivalDate,
          departureDate,
        };
      });
      
      const endDate = currentDate.toISOString().split('T')[0];
      
      return {
        ...prev,
        startDate,
        endDate,
        cities: updatedCities,
      };
    });
  }, []);

  // Helper function to determine season from a date
  const getSeasonFromDate = useCallback((dateStr: string): string => {
    const date = new Date(dateStr);
    const month = date.getMonth(); // 0-11
    
    // Northern hemisphere seasons
    if (month >= 2 && month <= 4) return "spring"; // Mar-May
    if (month >= 5 && month <= 7) return "summer"; // Jun-Aug
    if (month >= 8 && month <= 10) return "fall"; // Sep-Nov
    return "winter"; // Dec-Feb
  }, []);

  // Update season when start date changes
  const updateDatesAndSeason = useCallback((startDate: string) => {
    setItineraryState(prev => {
      if (!prev) return prev;
      
      let currentDate = new Date(startDate);
      const updatedCities = prev.cities.map(city => {
        const arrivalDate = currentDate.toISOString().split('T')[0];
        currentDate.setDate(currentDate.getDate() + city.numberOfNights);
        const departureDate = currentDate.toISOString().split('T')[0];
        
        return {
          ...city,
          arrivalDate,
          departureDate,
        };
      });
      
      const endDate = currentDate.toISOString().split('T')[0];
      const newSeason = getSeasonFromDate(startDate);
      
      return {
        ...prev,
        startDate,
        endDate,
        travelSeason: newSeason,
        cities: updatedCities,
      };
    });
  }, [getSeasonFromDate]);

  // Update departure information
  const updateDeparture = useCallback((departure: {
    city?: string;
    country?: string;
    airport?: string;
  }) => {
    setItineraryState(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        departureCity: departure.city ?? prev.departureCity,
        departureCountry: departure.country ?? prev.departureCountry,
        departureAirport: departure.airport ?? prev.departureAirport,
      };
    });
  }, []);

  const initializeFromTripData = useCallback((tripData: {
    tripDuration: number;
    numberOfTravelers: number;
    travelSeason: string;
    title?: string;
    departureCity?: string;
    departureCountry?: string;
    departureAirport?: string;
    selectedDestinations: Array<{
      cityName: string;
      countryName: string;
      numberOfNights: number;
      arrivalAirport?: string;
      departureAirport?: string;
      activities?: string[];
      transportToNext?: TransportSegment;
    }>;
  }) => {
    const cities: ItineraryCity[] = tripData.selectedDestinations.map((dest, index) => ({
      id: `city-${index}-${Date.now()}`,
      cityName: dest.cityName,
      countryName: dest.countryName,
      numberOfNights: dest.numberOfNights,
      arrivalAirport: dest.arrivalAirport,
      departureAirport: dest.departureAirport,
      activities: dest.activities || [],
      transportToNext: dest.transportToNext,
    }));

    const newItinerary: ItineraryData = {
      id: `itinerary-${Date.now()}`,
      title: tripData.title || (cities.length > 0 ? `Trip to ${cities.map(c => c.cityName).join(", ")}` : "My Trip"),
      cities,
      totalNights: tripData.tripDuration,
      numberOfTravelers: tripData.numberOfTravelers,
      travelSeason: tripData.travelSeason,
      departureCity: tripData.departureCity,
      departureCountry: tripData.departureCountry,
      departureAirport: tripData.departureAirport,
    };

    setItinerary(newItinerary);
    return newItinerary;
  }, [setItinerary]);

  return {
    itinerary,
    isLoading,
    setItinerary,
    updateCity,
    addCity,
    removeCity,
    reorderCities,
    updateDates,
    updateDatesAndSeason,
    updateDeparture,
    getSeasonFromDate,
    initializeFromTripData,
  };
}
