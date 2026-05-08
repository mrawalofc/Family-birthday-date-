import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, CloudSnow, Wind, Thermometer, MapPin, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  icon: React.ReactNode;
}

export const Weather: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="text-yellow-400" size={16} />;
    if (code >= 1 && code <= 3) return <Cloud className="text-blue-200" size={16} />;
    if (code >= 45 && code <= 48) return <Wind className="text-gray-300" size={16} />;
    if (code >= 51 && code <= 67) return <CloudRain className="text-blue-400" size={16} />;
    if (code >= 71 && code <= 77) return <CloudSnow className="text-white" size={16} />;
    if (code >= 80 && code <= 82) return <CloudRain className="text-blue-500" size={16} />;
    if (code >= 95) return <CloudLightning className="text-purple-400" size={16} />;
    return <Cloud className="text-gray-400" size={16} />;
  };

  const getConditionText = (code: number) => {
    const conditions: Record<number, { bn: string, en: string }> = {
      0: { bn: 'পরিষ্কার আকাশ', en: 'Clear Sky' },
      1: { bn: 'প্রধানত পরিষ্কার', en: 'Mainly Clear' },
      2: { bn: 'আংশিক মেঘলা', en: 'Partly Cloudy' },
      3: { bn: 'মেঘলা', en: 'Overcast' },
      45: { bn: 'কুয়াশা', en: 'Fog' },
      48: { bn: 'তুষারপাত কুয়াশা', en: 'Depositing Rime Fog' },
      51: { bn: 'হালকা গুড়ি গুড়ি বৃষ্টি', en: 'Light Drizzle' },
      61: { bn: 'হালকা বৃষ্টি', en: 'Slight Rain' },
      80: { bn: 'বৃষ্টির ঝাপ্টা', en: 'Rain Showers' },
      95: { bn: 'বজ্রঝড়', en: 'Thunderstorm' },
    };
    
    const entry = conditions[code] || { bn: 'মেঘলা', en: 'Cloudy' };
    return lang === 'bn' ? entry.bn : entry.en;
  };

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await response.json();
        
        if (data.current_weather) {
          const { temperature, weathercode } = data.current_weather;
          setWeather({
            temp: temperature,
            condition: getConditionText(weathercode),
            location: 'Nearby', // We don't get city name from open-meteo without another call
            icon: getWeatherIcon(weathercode)
          });
        }
      } catch (err) {
        setError('Failed to load weather');
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Default to a romantic location or just show error
          setError('Location access denied');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation not supported');
      setLoading(false);
    }
  }, [lang]);

  if (loading) return null;
  if (error || !weather) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-[74px] left-4 z-[40] group"
    >
      <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-2 flex items-center gap-3 shadow-lg hover:bg-black/30 transition-all cursor-default overflow-hidden relative">
        <div className="absolute -top-6 -right-6 w-12 h-12 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-all" />
        
        <div className="flex items-center gap-2">
          <div className="bg-white/5 p-1 rounded-lg">
            {weather.icon}
          </div>
          <div>
            <div className="flex items-center gap-1 leading-none">
              <span className="text-white font-black text-xs tracking-tight">{weather.temp}°C</span>
              <Heart size={8} className="text-pink-400 fill-pink-400 animate-pulse" />
            </div>
            <p className="text-white/40 text-[6px] font-black uppercase tracking-[0.1em] mt-0.5">{weather.condition}</p>
          </div>
        </div>
        
        <div className="h-4 w-px bg-white/10 mx-1" />

        <div className="flex items-center gap-1 text-white/20 text-[6px] font-black uppercase tracking-widest px-1">
          <MapPin size={6} />
          {lang === 'bn' ? 'আবহাওয়া' : 'Weather'}
        </div>
      </div>
    </motion.div>
  );
};
