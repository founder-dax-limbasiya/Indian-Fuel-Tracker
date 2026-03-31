import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { TrendingUp } from 'lucide-react';
import type { PriceTrendPoint } from '@workspace/api-client-react/src/generated/api.schemas';

interface TrendChartProps {
  city: string;
  data: PriceTrendPoint[];
  isLoading: boolean;
}

export function TrendChart({ city, data, isLoading }: TrendChartProps) {
  // Format date for the X-axis
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'MMM dd')
  }));

  const minPetrol = Math.floor(Math.min(...data.map(d => d.petrolPrice)) - 1);
  const maxPetrol = Math.ceil(Math.max(...data.map(d => d.petrolPrice)) + 1);
  
  return (
    <div className="bg-card rounded-3xl border border-border/60 card-shadow p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="font-display font-bold text-xl flex items-center text-foreground">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            30-Day Price Trend
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Historical data for {city}</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center text-sm font-semibold">
            <div className="w-3 h-3 rounded-full bg-petrol mr-2"></div> Petrol
          </div>
          <div className="flex items-center text-sm font-semibold">
            <div className="w-3 h-3 rounded-full bg-diesel mr-2"></div> Diesel
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-50/50 rounded-xl">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="formattedDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dy={10}
                minTickGap={20}
              />
              <YAxis 
                domain={[minPetrol - 5, maxPetrol]} 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                  fontWeight: 600
                }}
                itemStyle={{ fontWeight: 700 }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px', fontSize: '12px' }}
              />
              <Line 
                type="monotone" 
                dataKey="petrolPrice" 
                name="Petrol (₹)" 
                stroke="hsl(var(--petrol))" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--petrol))' }}
                animationDuration={1500}
              />
              <Line 
                type="monotone" 
                dataKey="dieselPrice" 
                name="Diesel (₹)" 
                stroke="hsl(var(--diesel))" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--diesel))' }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
