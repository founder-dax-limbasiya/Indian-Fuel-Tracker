import React, { useState } from 'react';
import { Calculator, Route, Droplet, Gauge } from 'lucide-react';
import type { CityFuelPrice } from '@workspace/api-client-react/src/generated/api.schemas';
import { cn } from './AdPlaceholder';

interface FuelCalculatorProps {
  cities: CityFuelPrice[];
  selectedCity: string;
}

export function FuelCalculator({ cities, selectedCity }: FuelCalculatorProps) {
  const [distance, setDistance] = useState<string>('100');
  const [mileage, setMileage] = useState<string>('15');
  const [fuelType, setFuelType] = useState<'petrol' | 'diesel'>('petrol');
  const [city, setCity] = useState<string>(selectedCity);

  // Update internal city if prop changes
  React.useEffect(() => {
    setCity(selectedCity);
  }, [selectedCity]);

  const cityData = cities.find(c => c.city === city) || cities[0];
  const price = fuelType === 'petrol' ? cityData?.petrolPrice || 0 : cityData?.dieselPrice || 0;
  
  const distNum = parseFloat(distance) || 0;
  const milNum = parseFloat(mileage) || 0;
  
  const fuelNeeded = milNum > 0 ? distNum / milNum : 0;
  const totalCost = fuelNeeded * price;

  return (
    <div className="bg-card rounded-3xl border border-border/60 card-shadow overflow-hidden">
      <div className="p-6 border-b border-border/50 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="font-display font-bold text-xl flex items-center text-foreground">
          <Calculator className="w-5 h-5 mr-2 text-primary" />
          Trip Cost Calculator
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Calculate your total fuel expenses</p>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center">
              <Route className="w-4 h-4 mr-1.5 text-muted-foreground" />
              Distance (km)
            </label>
            <input 
              type="number" 
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
              placeholder="e.g. 150"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center">
              <Gauge className="w-4 h-4 mr-1.5 text-muted-foreground" />
              Mileage (km/L)
            </label>
            <input 
              type="number" 
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
              placeholder="e.g. 15"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Fuel Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFuelType('petrol')}
              className={cn(
                "px-4 py-2.5 rounded-xl font-semibold border-2 transition-all flex items-center justify-center",
                fuelType === 'petrol' 
                  ? "bg-petrol/10 border-petrol text-petrol" 
                  : "bg-background border-border text-muted-foreground hover:border-petrol/50"
              )}
            >
              <Droplet className="w-4 h-4 mr-2" />
              Petrol
            </button>
            <button
              onClick={() => setFuelType('diesel')}
              className={cn(
                "px-4 py-2.5 rounded-xl font-semibold border-2 transition-all flex items-center justify-center",
                fuelType === 'diesel' 
                  ? "bg-diesel/10 border-diesel text-diesel" 
                  : "bg-background border-border text-muted-foreground hover:border-diesel/50"
              )}
            >
              <Droplet className="w-4 h-4 mr-2" />
              Diesel
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">City</label>
          <select 
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
          >
            {cities.map(c => (
              <option key={c.city} value={c.city}>{c.city} (₹{fuelType === 'petrol' ? c.petrolPrice : c.dieselPrice}/L)</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-900 p-6 text-white">
        <div className="flex justify-between items-end mb-2">
          <span className="text-slate-400 font-medium text-sm">Fuel Required</span>
          <span className="font-bold text-lg">{fuelNeeded.toFixed(1)} Litres</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-slate-400 font-medium text-sm">Estimated Cost</span>
          <span className="font-display font-bold text-4xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
            ₹{totalCost.toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
}
