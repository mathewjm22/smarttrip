import { GoogleGenAI, Type } from "@google/genai";
import { tripSchema, TripPlan, TripAlert } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateTripPlan(
  origin: string,
  destination: string,
  stops: string[]
): Promise<tripplan> {
  const prompt = `
    I am planning a road trip.
    Origin: ${origin}
    Destination: ${destination}
    ${stops.length > 0 ? `Intermediate Stops: ${stops.join(", ")}` : ""}
    
    Please provide:
    1. The most efficient route order (Traveling Salesperson Problem), starting at Origin, visiting all stops, and ending at Destination.
    2. Weather along the route including any alerts.
    3. Current traffic issues.
    4. Recommended gas stations along the way.
    5. Detailed parking options at the destination including cost, hours, and simulated user reviews.
    6. High-level turn-by-turn driving directions, STRICTLY AVOIDING TOLLS.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: tripSchema,
      temperature: 0.2,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Failed to generate trip plan");
  
  return JSON.parse(text) as TripPlan;
}

export async function checkTripAlerts(route: string[]): Promise<tripalert[]> {
  const prompt = `
    I am currently driving along this route: ${route.join(" -> ")}.
    Generate 0 to 2 realistic real-time alerts for this route right now.
    Types can be 'weather', 'traffic', or 'closure'.
    Return an empty array if everything is clear.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "weather, traffic, or closure" },
              message: { type: Type.STRING }
            },
            required: ["type", "message"]
          }
        },
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) return [];
    
    const alerts = JSON.parse(text);
    return alerts.map((a: any) => ({
      id: Math.random().toString(36).substring(7),
      type: a.type,
      message: a.message,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error("Failed to check alerts", error);
    return [];
  }
}

export async function geocode(query: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export async function getRouteGeometry(coordinates: { lat: number; lon: number }[]): Promise<[number, number][]> {
  if (coordinates.length < 2) return [];
  
  const coordsString = coordinates.map(c => `${c.lon},${c.lat}`).join(';');
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`);
    const data = await res.json();
    
    if (data.code === 'Ok' && data.routes.length > 0) {
      // OSRM returns [lon, lat], Leaflet expects [lat, lon]
      return data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
    }
    return [];
  } catch (error) {
    console.error("Routing error:", error);
    return [];
  }
}
