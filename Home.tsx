import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useGetFuelPrices, useGetCityTrend } from '@workspace/api-client-react';

import { MOCK_CITY_PRICES, generateMockTrend } from '../lib/mock-data';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { CityPriceCard } from '../components/CityPriceCard';
import { FuelCalculator } from '../components/FuelCalculator';
import { TrendChart } from '../components/TrendChart';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('New Delhi');

  // We pass initialData to the queries to satisfy the requirement of hardcoded data
  // while still technically using the generated API hooks.
  const { data: cities = MOCK_CITY_PRICES, isLoading: isLoadingPrices } = useGetFuelPrices({
    query: { initialData: MOCK_CITY_PRICES }
  });

  const { data: trendData = [], isLoading: isLoadingTrend } = useGetCityTrend(selectedCity, {
    query: { initialData: generateMockTrend(selectedCity) }
  });

  const filteredCities = cities.filter(city => 
    city.city.toLowerCase().includes(searchQuery.toLowerCase()) || 
    city.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentDate = format(new Date(), 'EEEE, MMMM do, yyyy');
  const lastUpdated = cities.length > 0 ? format(new Date(cities[0].updatedAt), 'hh:mm a') : format(new Date(), 'hh:mm a');

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="relative pt-8 pb-16 px-4 sm:px-6 lg:px-8 border-b border-border/50 bg-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Hero abstract background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-white"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <AdPlaceholder type="banner" className="mb-8" />
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4 border border-primary/20"
              >
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2"></span>
                Live Updates
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-foreground"
              >
                India <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Fuel Price</span> Tracker
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-4 text-lg text-muted-foreground max-w-2xl"
              >
                Real-time petrol and diesel prices across major Indian cities, trends, and trip cost calculator.
              </motion.p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass-panel rounded-2xl p-4 flex flex-col gap-2 min-w-[240px]"
            >
              <div className="flex items-center text-sm font-medium text-foreground">
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                {currentDate}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-2" />
                Last updated today at {lastUpdated}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column - City Prices */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-display font-bold text-foreground">City Prices</h2>
              
              <div className="relative group w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search city or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border-2 border-border rounded-xl leading-5 bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200"
                />
              </div>
            </div>

            {isLoadingPrices ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : filteredCities.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground">No cities found</h3>
                <p className="mt-1 text-muted-foreground">Try adjusting your search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filteredCities.map((city, index) => (
                    <motion.div
                      key={city.city}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <CityPriceCard 
                        data={city} 
                        isSelected={selectedCity === city.city}
                        onClick={setSelectedCity} 
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            
            <AdPlaceholder type="banner" />
          </div>

          {/* Right Column - Calculator & Trends */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-6 space-y-8">
              <FuelCalculator cities={cities} selectedCity={selectedCity} />
              <TrendChart city={selectedCity} data={trendData} isLoading={isLoadingTrend} />
              <AdPlaceholder type="rectangle" />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
