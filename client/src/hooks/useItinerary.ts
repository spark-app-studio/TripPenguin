import { useState, useEffect, useCallback } from "react";

export interface ItineraryCity {
  id: string;
  cityName: string;
  countryName: string;
  numberOfNights: number;
  arrivalDate?: string;
  departureDate?: string;
  activities?: string[];
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

  const initializeFromTripData = useCallback((tripData: {
    tripDuration: number;
    numberOfTravelers: number;
    travelSeason: string;
    selectedDestinations: Array<{
      cityName: string;
      countryName: string;
      numberOfNights: number;
    }>;
  }) => {
    const cities: ItineraryCity[] = tripData.selectedDestinations.map((dest, index) => ({
      id: `city-${index}-${Date.now()}`,
      cityName: dest.cityName,
      countryName: dest.countryName,
      numberOfNights: dest.numberOfNights,
      activities: [],
    }));

    const newItinerary: ItineraryData = {
      id: `itinerary-${Date.now()}`,
      title: cities.length > 0 ? `Trip to ${cities.map(c => c.cityName).join(", ")}` : "My Trip",
      cities,
      totalNights: tripData.tripDuration,
      numberOfTravelers: tripData.numberOfTravelers,
      travelSeason: tripData.travelSeason,
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
    initializeFromTripData,
  };
}
