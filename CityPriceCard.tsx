import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus, MapPin } from 'lucide-react';
import type { CityFuelPrice } from '@workspace/api-client-react/src/generated/api.schemas';
import { cn } from './AdPlaceholder';

interface CityPriceCardProps {
  data: CityFuelPrice;
  onClick: (city: string) => void;
  isSelected: boolean;
}

export function CityPriceCard({ data, onClick, isSelected }: CityPriceCardProps) {
  const getChangeIndicator = (change: number) => {
    if (change > 0) return <span className="flex items-center text-destructive font-medium text-xs"><ArrowUpRight className="w-3 h-3 mr-0.5" />₹{change.toFixed(2)}</span>;
    if (change < 0) return <span className="flex items-center text-success font-medium text-xs"><ArrowDownRight className="w-3 h-3 mr-0.5" />₹{Math.abs(change).toFixed(2)}</span>;
    return <span className="flex items-center text-muted-foreground font-medium text-xs"><Minus className="w-3 h-3 mr-0.5" />No change</span>;
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(data.city)}
      className={cn(
        "bg-card rounded-2xl p-5 cursor-pointer card-shadow border transition-colors duration-200 relative overflow-hidden",
        isSelected ? "border-primary ring-1 ring-primary/20" : "border-border/60 hover:border-border"
      )}
    >
      {isSelected && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent -mr-8 -mt-8 rounded-full blur-xl" />
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-lg text-foreground flex items-center">
            {data.city}
          </h3>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <MapPin className="w-3 h-3 mr-1" />
            {data.state}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50/50 dark:bg-orange-950/20 rounded-xl p-3 border border-orange-100 dark:border-orange-900/30">
          <div className="text-xs font-semibold text-petrol mb-1 uppercase tracking-wider">Petrol</div>
          <div className="text-xl font-bold text-foreground mb-1">₹{data.petrolPrice.toFixed(2)}</div>
          {getChangeIndicator(data.petrolChange)}
        </div>
        
        <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30">
          <div className="text-xs font-semibold text-diesel mb-1 uppercase tracking-wider">Diesel</div>
          <div className="text-xl font-bold text-foreground mb-1">₹{data.dieselPrice.toFixed(2)}</div>
          {getChangeIndicator(data.dieselChange)}
        </div>
      </div>
    </motion.div>
  );
}
