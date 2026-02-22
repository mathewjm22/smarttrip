import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Plus, Trash2, Loader2, CloudRain, Car, Fuel, ParkingCircle, Map as MapIcon, ListOrdered, Star, AlertTriangle, X, Play } from 'lucide-react';
import { Location, TripPlan, TripAlert } from './types';
import { generateTripPlan, geocode, getRouteGeometry, checkTripAlerts } from './services/tripService';
import MapView from './components/MapView';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState<{ id: string; value: string }[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [tripPlan, setTripPlan] = useState<tripplan |="" null="">(null);
  const [markers, setMarkers] = useState<{ lat: number; lon: number; label: string }[]>([]);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'details' | 'directions'>('map');

  const [isTripActive, setIsTripActive] = useState(false);
  const [alerts, setAlerts] = useState<tripalert[]>([]);

  const addStop = () => {
    setStops([...stops, { id: Math.random().toString(36).substring(7), value: '' }]);
  };

  const updateStop = (id: string, value: string) => {
    setStops(stops.map(s => s.id === id ? { ...s, value } : s));
  };

  const removeStop = (id: string) => {
    setStops(stops.filter(s => s.id !== id));
  };

  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) {
      setError('Origin and Destination are required.');
      return;
    }

    setLoading(true);
    setError('');
    setTripPlan(null);
    setMarkers([]);
    setRouteGeometry([]);
    setIsTripActive(false);
    setAlerts([]);

    try {
      const stopValues = stops.map(s => s.value).filter(v => v.trim() !== '');
      
      // 1. Get Trip Plan from Gemini
      const plan = await generateTripPlan(origin, destination, stopValues);
      setTripPlan(plan);

      // 2. Geocode all locations in the optimized order
      const geocodedLocations = [];
      for (const locName of plan.optimizedOrder) {
        const geo = await geocode(locName);
        if (geo) {
          geocodedLocations.push({ lat: geo.lat, lon: geo.lon, label: locName });
        }
      }
      setMarkers(geocodedLocations);

      // 3. Get Route Geometry from OSRM
      if (geocodedLocations.length >= 2) {
        const geometry = await getRouteGeometry(geocodedLocations);
        setRouteGeometry(geometry);
      }
      
      setActiveTab('map');
    } catch (err: any) {
      setError(err.message || 'An error occurred while planning the trip.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTripActive && tripPlan) {
      // Check for alerts every 30 seconds
      interval = setInterval(async () => {
        const newAlerts = await checkTripAlerts(tripPlan.optimizedOrder);
        if (newAlerts.length > 0) {
          setAlerts(prev => {
            const combined = [...newAlerts, ...prev];
            // Keep only the latest 5 alerts
            return combined.slice(0, 5);
          });
        }
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [isTripActive, tripPlan]);

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div classname="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row">
      {/* Sidebar / Form Area */}
      <div classname="w-full md:w-[400px] lg:w-[450px] bg-white shadow-xl z-10 flex flex-col h-auto md:h-screen overflow-y-auto">
        <div classname="p-6 bg-indigo-600 text-white">
          <h1 classname="text-2xl font-bold flex items-center gap-2">
            <navigation classname="w-6 h-6"/>
            Smart Trip Planner
          </h1>
          <p classname="text-indigo-100 text-sm mt-1">Toll-free routing, weather, and traffic insights.</p>
        </div>

        <div classname="p-6 flex-grow">
          <form onsubmit="{handlePlanTrip}" classname="space-y-4">
            <div>
              <label classname="block text-sm font-medium text-slate-700 mb-1">Origin</label>
              <div classname="relative">
                <mappin classname="absolute left-3 top-3 w-5 h-5 text-slate-400"/>
                <input type="text" value="{origin}" onchange="{(e)" ==""> setOrigin(e.target.value)}
                  placeholder="e.g., New York, NY"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <animatepresence>
              {stops.map((stop, index) => (
                <motion.div key="{stop.id}" initial="{{" opacity:="" 0,="" height:="" 0="" }}="" animate="{{" opacity:="" 1,="" height:="" 'auto'="" }}="" exit="{{" opacity:="" 0,="" height:="" 0="" }}="" classname="relative">
                  <label classname="block text-sm font-medium text-slate-700 mb-1">Stop {index + 1}</label>
                  <div classname="flex gap-2">
                    <input type="text" value="{stop.value}" onchange="{(e)" ==""> updateStop(stop.id, e.target.value)}
                      placeholder="e.g., Philadelphia, PA"
                      className="flex-grow px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                    <button type="button" onclick="{()" ==""> removeStop(stop.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <trash2 classname="w-5 h-5"/>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button type="button" onclick="{addStop}" classname="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors py-2">
              <plus classname="w-4 h-4"/> Add Stop
            </button>

            <div>
              <label classname="block text-sm font-medium text-slate-700 mb-1">Destination</label>
              <div classname="relative">
                <mappin classname="absolute left-3 top-3 w-5 h-5 text-slate-400"/>
                <input type="text" value="{destination}" onchange="{(e)" ==""> setDestination(e.target.value)}
                  placeholder="e.g., Washington, DC"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div classname="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <button type="submit" disabled="{loading}" classname="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 mt-6 shadow-md">
              {loading ? <loader2 classname="w-5 h-5 animate-spin"/> : <navigation classname="w-5 h-5"/>}
              {loading ? 'Planning Trip...' : 'Plan Trip'}
            </button>
            
            {tripPlan && !isTripActive && (
              <button type="button" onclick="{()" ==""> setIsTripActive(true)}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2 mt-2 shadow-md"
              >
                <play classname="w-5 h-5"/>
                Start Trip (Enable Live Alerts)
              </button>
            )}
            
            {isTripActive && (
              <div classname="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <div classname="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <p classname="text-sm font-medium text-emerald-800">Trip active. Monitoring for real-time alerts...</p>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div classname="flex-1 flex flex-col h-[60vh] md:h-screen bg-slate-100 relative">
        
        {/* Floating Alerts Area */}
        <div classname="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-4 pointer-events-none flex flex-col gap-2">
          <animatepresence>
            {alerts.map(alert => (
              <motion.div key="{alert.id}" initial="{{" opacity:="" 0,="" y:="" -20,="" scale:="" 0.95="" }}="" animate="{{" opacity:="" 1,="" y:="" 0,="" scale:="" 1="" }}="" exit="{{" opacity:="" 0,="" scale:="" 0.95,="" transition:="" {="" duration:="" 0.2="" }="" }}="" classname="{`pointer-events-auto" p-4="" rounded-xl="" shadow-lg="" border-l-4="" flex="" gap-3="" items-start="" ${="" alert.type="==" 'weather'="" ?="" 'bg-blue-50="" border-blue-500="" text-blue-900'="" :="" alert.type="==" 'traffic'="" ?="" 'bg-amber-50="" border-amber-500="" text-amber-900'="" :="" 'bg-red-50="" border-red-500="" text-red-900'="" }`}="">
                <alerttriangle classname="{`w-5" h-5="" flex-shrink-0="" ${="" alert.type="==" 'weather'="" ?="" 'text-blue-500'="" :="" alert.type="==" 'traffic'="" ?="" 'text-amber-500'="" :="" 'text-red-500'="" }`}=""/>
                <div classname="flex-1">
                  <p classname="text-sm font-medium capitalize mb-0.5">{alert.type} Alert</p>
                  <p classname="text-sm opacity-90">{alert.message}</p>
                </div>
                <button onclick="{()" ==""> dismissAlert(alert.id)}
                  className="p-1 hover:bg-black/5 rounded-md transition-colors"
                >
                  <x classname="w-4 h-4"/>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {tripPlan ? (
          <>
            {/* Mobile Tabs */}
            <div classname="md:hidden flex bg-white border-b border-slate-200 shadow-sm z-20">
              <button onclick="{()" ==""> setActiveTab('map')}
                className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 ${activeTab === 'map' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
              >
                <mapicon classname="w-4 h-4"/> Map
              </button>
              <button onclick="{()" ==""> setActiveTab('details')}
                className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 ${activeTab === 'details' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
              >
                <listordered classname="w-4 h-4"/> Details
              </button>
              <button onclick="{()" ==""> setActiveTab('directions')}
                className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 ${activeTab === 'directions' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
              >
                <navigation classname="w-4 h-4"/> Directions
              </button>
            </div>

            <div classname="flex-1 relative flex overflow-hidden">
              {/* Map View */}
              <div classname="{`absolute" inset-0="" md:relative="" md:flex-1="" md:block="" ${activetab="==" 'map'="" ?="" 'block'="" :="" 'hidden'}`}="">
                <mapview markers="{markers}" routegeometry="{routeGeometry}"/>
              </div>

              {/* Details Panel (Desktop: Right side, Mobile: Tab content) */}
              <div classname="{`absolute" inset-0="" md:relative="" md:w-[400px]="" bg-white="" border-l="" border-slate-200="" overflow-y-auto="" z-10="" ${activetab="" !="=" 'map'="" ?="" 'block'="" :="" 'hidden="" md:block'}`}="">
                
                {/* Desktop Tabs (only show Details/Directions) */}
                <div classname="hidden md:flex bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
                  <button onclick="{()" ==""> setActiveTab('details')}
                    className={`flex-1 py-3 text-sm font-medium ${activeTab !== 'directions' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    Trip Details
                  </button>
                  <button onclick="{()" ==""> setActiveTab('directions')}
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'directions' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    Directions
                  </button>
                </div>

                <div classname="p-6 pb-20 md:pb-6">
                  {activeTab !== 'directions' ? (
                    <div classname="space-y-8">
                      <section>
                        <h3 classname="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <listordered classname="w-5 h-5 text-indigo-500"/>
                          Optimized Route
                        </h3>
                        <div classname="relative pl-4 border-l-2 border-indigo-200 space-y-4">
                          {tripPlan.optimizedOrder.map((loc, idx) => (
                            <div key="{idx}" classname="relative">
                              <div classname="absolute -left-[21px] top-1 w-3 h-3 bg-white border-2 border-indigo-500 rounded-full"></div>
                              <p classname="font-medium text-slate-800">{loc}</p>
                              {idx === 0 && <span classname="text-xs text-slate-500">Start</span>}
                              {idx === tripPlan.optimizedOrder.length - 1 && <span classname="text-xs text-slate-500">Destination</span>}
                            </div>
                          ))}
                        </div>
                      </section>

                      <section classname="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h3 classname="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <cloudrain classname="w-5 h-5 text-blue-600"/>
                          Weather & Alerts
                        </h3>
                        <p classname="text-sm text-blue-800 leading-relaxed">{tripPlan.weather}</p>
                      </section>

                      <section classname="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <h3 classname="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                          <car classname="w-5 h-5 text-amber-600"/>
                          Traffic Conditions
                        </h3>
                        <p classname="text-sm text-amber-800 leading-relaxed">{tripPlan.traffic}</p>
                      </section>

                      <section>
                        <h3 classname="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <fuel classname="w-5 h-5 text-slate-600"/>
                          Gas Stations
                        </h3>
                        <ul classname="list-disc pl-5 text-sm text-slate-700 space-y-1">
                          {tripPlan.gasStations.map((gas, idx) => (
                            <li key="{idx}">{gas}</li>
                          ))}
                        </ul>
                      </section>

                      <section>
                        <h3 classname="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                          <parkingcircle classname="w-5 h-5 text-emerald-600"/>
                          Parking at Destination
                        </h3>
                        <div classname="space-y-4">
                          {tripPlan.parking.map((park, idx) => (
                            <div key="{idx}" classname="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                              <div classname="flex justify-between items-start mb-2">
                                <h4 classname="font-medium text-slate-900">{park.name}</h4>
                                <div classname="flex items-center gap-1 text-amber-500">
                                  <star classname="w-4 h-4 fill-current"/>
                                  <span classname="text-sm font-medium text-slate-700">{park.rating}</span>
                                </div>
                              </div>
                              <div classname="grid grid-cols-2 gap-2 mb-3 text-sm">
                                <div classname="bg-slate-50 p-2 rounded-lg">
                                  <span classname="block text-xs text-slate-500 mb-0.5">Est. Cost</span>
                                  <span classname="font-medium text-slate-800">{park.estimatedCost}</span>
                                </div>
                                <div classname="bg-slate-50 p-2 rounded-lg">
                                  <span classname="block text-xs text-slate-500 mb-0.5">Hours</span>
                                  <span classname="font-medium text-slate-800">{park.operatingHours}</span>
                                </div>
                              </div>
                              <div classname="space-y-2">
                                <span classname="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Reviews</span>
                                {park.reviews.map((rev, rIdx) => (
                                  <p key="{rIdx}" classname="text-sm text-slate-600 italic bg-slate-50 p-2 rounded border-l-2 border-slate-300">"{rev}"</p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : (
                    <div classname="space-y-6">
                      <div classname="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6">
                        <p classname="text-sm text-indigo-800 font-medium flex items-center gap-2">
                          <navigation classname="w-4 h-4"/>
                          Toll-free route selected
                        </p>
                      </div>
                      <div classname="space-y-4">
                        {tripPlan.directions.map((dir, idx) => (
                          <div key="{idx}" classname="flex gap-3 text-sm text-slate-700 border-b border-slate-100 pb-3 last:border-0">
                            <div classname="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 font-medium text-xs">
                              {idx + 1}
                            </div>
                            <p classname="pt-0.5 leading-relaxed">{dir}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div classname="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <mapicon classname="w-16 h-16 mb-4 text-slate-300"/>
            <h2 classname="text-xl font-medium text-slate-600 mb-2">Ready to hit the road?</h2>
            <p classname="max-w-md">Enter your origin, destination, and any stops along the way to generate a comprehensive trip plan.</p>
          </div>
        )}
      </div>
    </div>
  );
}

