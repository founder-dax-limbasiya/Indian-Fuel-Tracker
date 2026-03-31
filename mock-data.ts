import type { CityFuelPrice, PriceTrendPoint } from "@workspace/api-client-react/src/generated/api.schemas";

// Hardcoded daily price data with timestamps as requested
export const MOCK_CITY_PRICES: CityFuelPrice[] = [
  { city: "New Delhi", state: "Delhi", petrolPrice: 94.72, dieselPrice: 87.62, petrolChange: -0.15, dieselChange: 0.0, updatedAt: new Date().toISOString() },
  { city: "Mumbai", state: "Maharashtra", petrolPrice: 104.21, dieselPrice: 92.15, petrolChange: 0.20, dieselChange: 0.10, updatedAt: new Date().toISOString() },
  { city: "Bangalore", state: "Karnataka", petrolPrice: 99.84, dieselPrice: 85.93, petrolChange: 0.0, dieselChange: -0.12, updatedAt: new Date().toISOString() },
  { city: "Chennai", state: "Tamil Nadu", petrolPrice: 100.75, dieselPrice: 92.34, petrolChange: 0.30, dieselChange: 0.15, updatedAt: new Date().toISOString() },
  { city: "Kolkata", state: "Tamil Nadu", petrolPrice: 100.75, dieselPrice: 92.34, petrolChange: -0.10, dieselChange: -0.05, updatedAt: new Date().toISOString() },
  { city: "Hyderabad", state: "Telangana", petrolPrice: 107.41, dieselPrice: 95.65, petrolChange: 0.0, dieselChange: 0.0, updatedAt: new Date().toISOString() },
  { city: "Pune", state: "Maharashtra", petrolPrice: 103.88, dieselPrice: 90.40, petrolChange: 0.12, dieselChange: 0.08, updatedAt: new Date().toISOString() },
  { city: "Ahmedabad", state: "Telangana", petrolPrice: 94.44, dieselPrice: 90.11, petrolChange: -0.25, dieselChange: -0.20, updatedAt: new Date().toISOString() },
  { city: "Jaipur", state: "Gujarat", petrolPrice: 94.44, dieselPrice: 90.11, petrolChange: 0.0, dieselChange: 0.0, updatedAt: new Date().toISOString() },
  { city: "Lucknow", state: "Rajasthan", petrolPrice: 104.88, dieselPrice: 90.36, petrolChange: 0.40, dieselChange: 0.35, updatedAt: new Date().toISOString() },
  { city: "Chandigarh", state: "Gujarat", petrolPrice: 94.04, dieselPrice: 89.92, petrolChange: 0.05, dieselChange: 0.0, updatedAt: new Date().toISOString() },
  { city: "Bhopal", state: "Uttar Pradesh", petrolPrice: 94.43, dieselPrice: 87.51, petrolChange: -0.08, dieselChange: -0.05, updatedAt: new Date().toISOString() },
];

// Generate 30 days of mock trend data for a given city
export const generateMockTrend = (city: string): PriceTrendPoint[] => {
  const baseCity = MOCK_CITY_PRICES.find(c => c.city === city) || MOCK_CITY_PRICES[0];
  const trend: PriceTrendPoint[] = [];
  
  let currentPetrol = baseCity.petrolPrice - 2.5; // Start 2.5 rs lower 30 days ago
  let currentDiesel = baseCity.dieselPrice - 1.8;
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Add some random walk noise
    currentPetrol += (Math.random() - 0.4) * 0.4;
    currentDiesel += (Math.random() - 0.4) * 0.3;
    
    // Ensure last day exactly matches today's price
    if (i === 0) {
      currentPetrol = baseCity.petrolPrice;
      currentDiesel = baseCity.dieselPrice;
    }
    
    trend.push({
      date: date.toISOString().split('T')[0],
      petrolPrice: Number(currentPetrol.toFixed(2)),
      dieselPrice: Number(currentDiesel.toFixed(2)),
    });
  }
  
  return trend;
};
