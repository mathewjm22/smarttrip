import { Type } from "@google/genai";

export interface Location {
  id: string;
  query: string;
  lat?: number;
  lon?: number;
  displayName?: string;
}

export interface ParkingLocation {
  name: string;
  estimatedCost: string;
  operatingHours: string;
  rating: number;
  reviews: string[];
}

export interface TripPlan {
  optimizedOrder: string[];
  weather: string;
  traffic: string;
  gasStations: string[];
  parking: ParkingLocation[];
  directions: string[];
}

export interface TripAlert {
  id: string;
  type: 'weather' | 'traffic' | 'closure';
  message: string;
  timestamp: number;
}

export const tripSchema = {
  type: Type.OBJECT,
  properties: {
    optimizedOrder: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "The optimized order of locations to visit, starting with the origin, then the intermediate stops in the most efficient order, ending with the destination. Use the exact names provided.",
    },
    weather: {
      type: Type.STRING,
      description: "Weather forecast and any alerts along the route.",
    },
    traffic: {
      type: Type.STRING,
      description: "Current traffic conditions and potential issues along the route.",
    },
    gasStations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Recommended gas stations or rest stops along the way.",
    },
    parking: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          estimatedCost: { type: Type.STRING },
          operatingHours: { type: Type.STRING },
          rating: { type: Type.NUMBER, description: "Rating out of 5" },
          reviews: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A couple of short user reviews" }
        },
        required: ["name", "estimatedCost", "operatingHours", "rating", "reviews"]
      },
      description: "Parking recommendations at the final destination with details.",
    },
    directions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "High-level turn-by-turn driving directions avoiding tolls.",
    },
  },
  required: ["optimizedOrder", "weather", "traffic", "gasStations", "parking", "directions"],
};

