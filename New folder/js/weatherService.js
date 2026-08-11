/**
 * Weather & Geolocation Service Module - Agronomy AI
 * Integrates with Open-Meteo REST API, OpenStreetMap Nominatim Geocoding & Local Country Currency Engine.
 */

export class WeatherService {
  constructor() {
    this.currentLocation = {
      lat: 30.9010, // Default Punjab, India
      lon: 75.8573,
      name: "Ludhiana, Punjab",
      state: "Punjab",
      country: "India"
    };
  }

  // Pre-configured Indian & Global Agricultural Hubs
  static GLOBAL_HUBS = [
    // --- INDIA AGRICULTURAL HUBS ---
    { name: "Ludhiana, Punjab", state: "Punjab", lat: 30.9010, lon: 75.8573, country: "India", crop: "Wheat & Paddy Rice" },
    { name: "Karnal, Haryana", state: "Haryana", lat: 29.6857, lon: 76.9905, country: "India", crop: "Basmati Rice & Wheat" },
    { name: "Nashik, Maharashtra", state: "Maharashtra", lat: 19.9975, lon: 73.7898, country: "India", crop: "Onions, Grapes & Cotton" },
    { name: "Guntur, Andhra Pradesh", state: "Andhra Pradesh", lat: 16.3067, lon: 80.4365, country: "India", crop: "Red Chilli & Cotton" },
    { name: "Varanasi, Uttar Pradesh", state: "Uttar Pradesh", lat: 25.3176, lon: 82.9739, country: "India", crop: "Sugarcane & Rice" },
    { name: "Warangal, Telangana", state: "Telangana", lat: 17.9689, lon: 79.5941, country: "India", crop: "Cotton & Paddy" },
    { name: "Thanjavur, Tamil Nadu", state: "Tamil Nadu", lat: 10.7870, lon: 79.1378, country: "India", crop: "Delta Rice Bowl" },
    { name: "Mandya, Karnataka", state: "Karnataka", lat: 12.5218, lon: 76.8951, country: "India", crop: "Sugarcane & Paddy" },
    { name: "Bardhaman, West Bengal", state: "West Bengal", lat: 23.2324, lon: 87.8615, country: "India", crop: "Aman Rice & Potato" },
    { name: "Anand, Gujarat", state: "Gujarat", lat: 22.5645, lon: 72.9289, country: "India", crop: "Cotton, Tobacco & Castor" },
    { name: "Indore, Madhya Pradesh", state: "Madhya Pradesh", lat: 22.7196, lon: 75.8577, country: "India", crop: "Soybean & Wheat" },
    { name: "Kota, Rajasthan", state: "Rajasthan", lat: 25.2138, lon: 75.8648, country: "India", crop: "Mustard & Coriander" },
    { name: "Patna, Bihar", state: "Bihar", lat: 25.5941, lon: 85.1376, country: "India", crop: "Maize & Winter Wheat" },
    { name: "Shimla, Himachal Pradesh", state: "Himachal Pradesh", lat: 31.1048, lon: 77.1734, country: "India", crop: "Apples & Horticulture" },

    // --- GLOBAL AGRICULTURAL HUBS ---
    { name: "Iowa Corn Belt (USA)", state: "Iowa", lat: 41.8780, lon: -93.0977, country: "USA", crop: "Maize & Soybean" },
    { name: "Nairobi Agro Rift (Kenya)", state: "Rift Valley", lat: -1.2921, lon: 36.8219, country: "Kenya", crop: "Maize & Tea" },
    { name: "São Paulo Farm District (Brazil)", state: "São Paulo", lat: -23.5505, lon: -46.6333, country: "Brazil", crop: "Coffee & Sugarcane" },
    { name: "Central Valley CA (USA)", state: "California", lat: 36.7783, lon: -119.4179, country: "USA", crop: "Almonds & Vegetables" },
    { name: "Mekong Delta (Vietnam)", state: "Can Tho", lat: 10.0452, lon: 105.7469, country: "Vietnam", crop: "Paddy Rice" }
  ];

  /**
   * Determine currency formatting details based on country or location name
   */
  getCurrencyInfo(countryOrLocation = this.currentLocation.country) {
    const loc = countryOrLocation.toLowerCase();
    if (loc.includes("india") || loc.includes("punjab") || loc.includes("maharashtra") || loc.includes("karnataka") || loc.includes("haryana") || loc.includes("pradesh") || loc.includes("bengal") || loc.includes("gujarat") || loc.includes("rajasthan") || loc.includes("bihar") || loc.includes("tamil")) {
      return { symbol: "₹", code: "INR", rate: 83.0 }; // USD to INR rate
    } else if (loc.includes("kenya")) {
      return { symbol: "KSh", code: "KES", rate: 130.0 };
    } else if (loc.includes("brazil")) {
      return { symbol: "R$", code: "BRL", rate: 5.5 };
    } else if (loc.includes("vietnam")) {
      return { symbol: "₫", code: "VND", rate: 25000.0 };
    } else if (loc.includes("europe") || loc.includes("france")) {
      return { symbol: "€", code: "EUR", rate: 0.92 };
    } else {
      return { symbol: "$", code: "USD", rate: 1.0 };
    }
  }

  /**
   * Format USD amount into local currency string
   */
  formatCurrency(usdAmount, country = this.currentLocation.country) {
    const curr = this.getCurrencyInfo(country);
    const converted = Math.round(usdAmount * curr.rate);
    
    // Format with commas based on locale
    const formattedNum = new Intl.NumberFormat(curr.code === 'INR' ? 'en-IN' : 'en-US').format(converted);
    return `${curr.symbol}${formattedNum}`;
  }

  /**
   * Reverse Geocode lat/lon to location city/state using OpenStreetMap Nominatim
   */
  async reverseGeocode(lat, lon) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'AgronomyAI/2.0' } });
      if (!res.ok) throw new Error("Reverse geocode failed");
      const data = await res.json();
      
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.district || addr.county || addr.state_district || "Field Location";
      const state = addr.state || "";
      const country = addr.country || "India";

      return {
        name: state ? `${city}, ${state}` : city,
        state,
        country
      };
    } catch (e) {
      console.warn("Reverse geocoding fallback:", e.message);
      return { name: "Custom GPS Location", state: "", country: "India" };
    }
  }

  /**
   * Search location by manual query name (e.g. "Nashik, Maharashtra" or "Karnal")
   */
  async searchLocationByName(query) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
      const res = await fetch(url, { headers: { 'User-Agent': 'AgronomyAI/2.0' } });
      if (!res.ok) throw new Error("Location search failed");
      const data = await res.json();
      if (!data || data.length === 0) throw new Error("No location found");

      return data.map(item => ({
        name: item.display_name.split(',').slice(0, 2).join(','),
        fullAddress: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        country: item.display_name.includes("India") ? "India" : "Global"
      }));
    } catch (e) {
      console.warn("Search location error:", e.message);
      return [];
    }
  }

  /**
   * Fetch live weather data from Open-Meteo REST API
   */
  async fetchLiveWeather(lat = this.currentLocation.lat, lon = this.currentLocation.lon) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,precipitation_probability,windspeed_10m&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Weather API request failed");
      const data = await response.json();
      
      const current = data.current_weather;
      const hourly = data.hourly;
      
      return {
        temperature: Math.round(current.temperature),
        windSpeed: Math.round(current.windspeed),
        weatherCode: current.weathercode,
        humidity: hourly.relativehumidity_2m ? hourly.relativehumidity_2m[0] : 65,
        rainProbability: hourly.precipitation_probability ? hourly.precipitation_probability[0] : 10,
        hourlyTimeline: this.processHourlyTimeline(hourly),
        safetyAnalysis: this.calculateActionSafetyWindow(hourly)
      };
    } catch (err) {
      console.warn("Using offline fallback weather data:", err.message);
      return this.getMockWeatherData();
    }
  }

  processHourlyTimeline(hourly) {
    if (!hourly || !hourly.time) return this.getMockWeatherData().hourlyTimeline;

    const timeline = [];
    const nowIndex = 0;
    for (let i = nowIndex; i < Math.min(nowIndex + 24, hourly.time.length); i++) {
      const date = new Date(hourly.time[i]);
      const hourStr = date.getHours().toString().padStart(2, '0') + ":00";
      const temp = Math.round(hourly.temperature_2m[i]);
      const rain = hourly.precipitation_probability ? hourly.precipitation_probability[i] : 10;
      const wind = Math.round(hourly.windspeed_10m[i]);

      let status = "SAFE";
      let reason = "Ideal spray window";

      if (rain > 35) {
        status = "UNSAFE";
        reason = `Rain risk ${rain}% (wash-off risk)`;
      } else if (wind > 20) {
        status = "UNSAFE";
        reason = `High wind ${wind} km/h (spray drift)`;
      } else if (temp > 34) {
        status = "CAUTION";
        reason = `High temp ${temp}°C (evaporation)`;
      } else if (rain > 15 || wind > 14) {
        status = "CAUTION";
        reason = "Moderate wind/rain risk";
      }

      timeline.push({ time: hourStr, temp, rain, wind, status, reason });
    }

    return timeline;
  }

  calculateActionSafetyWindow(hourly) {
    const timeline = this.processHourlyTimeline(hourly);
    const safeHours = timeline.filter(t => t.status === "SAFE");
    
    if (safeHours.length >= 4) {
      const firstSafe = safeHours[0].time;
      const lastSafe = safeHours[Math.min(3, safeHours.length - 1)].time;
      return {
        overallStatus: "OPTIMAL",
        badgeClass: "badge-safe",
        recommendation: `Safe to spray today between ${firstSafe} and ${lastSafe}. Low rain (<20%) & calm winds.`,
        bestWindow: `${firstSafe} - ${lastSafe}`
      };
    } else if (safeHours.length > 0) {
      return {
        overallStatus: "CAUTION",
        badgeClass: "badge-caution",
        recommendation: `Narrow safety window available around ${safeHours[0].time}. Monitor sudden rain clouds.`,
        bestWindow: safeHours[0].time
      };
    } else {
      return {
        overallStatus: "UNSAFE",
        badgeClass: "badge-unsafe",
        recommendation: "DO NOT SPRAY TODAY. High rain probability & gusty winds will wash away treatments.",
        bestWindow: "Postpone 24h"
      };
    }
  }

  getMockWeatherData() {
    return {
      temperature: 28,
      windSpeed: 11,
      humidity: 68,
      rainProbability: 12,
      weatherCode: 1,
      hourlyTimeline: [
        { time: "07:00", temp: 24, rain: 5, wind: 8, status: "SAFE", reason: "Cool temp & low wind" },
        { time: "09:00", temp: 27, rain: 10, wind: 10, status: "SAFE", reason: "Ideal spray conditions" },
        { time: "11:00", temp: 30, rain: 15, wind: 12, status: "SAFE", reason: "Good absorption" },
        { time: "13:00", temp: 33, rain: 20, wind: 15, status: "CAUTION", reason: "High heat evaporation" },
        { time: "15:00", temp: 32, rain: 45, wind: 22, status: "UNSAFE", reason: "Rain shower wash-off risk" },
        { time: "17:00", temp: 29, rain: 40, wind: 18, status: "UNSAFE", reason: "Moist foliage & drift" },
        { time: "19:00", temp: 26, rain: 15, wind: 9, status: "SAFE", reason: "Calm evening window" }
      ],
      safetyAnalysis: {
        overallStatus: "OPTIMAL",
        badgeClass: "badge-safe",
        recommendation: "Safe to spray today between 07:00 and 11:00 AM. Rain expected in late afternoon.",
        bestWindow: "07:00 AM - 11:00 AM"
      }
    };
  }
}
