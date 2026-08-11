/**
 * Multi-Tenant Storage & Authentication Manager - Agronomy AI
 * Enforces strictly isolated user data (scans, farm land profiles) per user account & regional language preference.
 */

export class StorageManager {
  constructor() {
    this.SESSION_KEY = "agronomy_active_session_v3";
    this.USERS_DB_KEY = "agronomy_all_users_v3";
  }

  /**
   * Regional Language Preference Mapping based on Location
   */
  getPreferredLanguageForLocation(locationName = "") {
    const loc = locationName.toLowerCase();
    
    if (loc.includes("punjab") || loc.includes("ludhiana") || loc.includes("amritsar")) {
      return { code: "pa-IN", name: "Punjabi (ਪੰਜਾਬੀ)" };
    } else if (loc.includes("maharashtra") || loc.includes("nashik") || loc.includes("pune")) {
      return { code: "mr-IN", name: "Marathi (मराठी)" };
    } else if (loc.includes("andhra") || loc.includes("telangana") || loc.includes("guntur") || loc.includes("warangal")) {
      return { code: "te-IN", name: "Telugu (తెలుగు)" };
    } else if (loc.includes("tamil") || loc.includes("thanjavur") || loc.includes("chennai")) {
      return { code: "ta-IN", name: "Tamil (தமிழ்)" };
    } else if (loc.includes("bengal") || loc.includes("bardhaman") || loc.includes("kolkata")) {
      return { code: "bn-IN", name: "Bengali (বাংলা)" };
    } else if (loc.includes("gujarat") || loc.includes("anand")) {
      return { code: "gu-IN", name: "Gujarati (ગુજરાતી)" };
    } else if (loc.includes("uttar") || loc.includes("haryana") || loc.includes("bihar") || loc.includes("madhya") || loc.includes("rajasthan") || loc.includes("varanasi") || loc.includes("karnal") || loc.includes("patna") || loc.includes("indore") || loc.includes("kota") || loc.includes("shimla") || loc.includes("india")) {
      return { code: "hi-IN", name: "Hindi (हिंदी)" };
    } else if (loc.includes("kenya") || loc.includes("nairobi")) {
      return { code: "sw-KE", name: "Swahili (Kiswahili)" };
    } else if (loc.includes("brazil") || loc.includes("são paulo")) {
      return { code: "es-ES", name: "Spanish (Español)" };
    } else if (loc.includes("france")) {
      return { code: "fr-FR", name: "French (Français)" };
    } else {
      return { code: "en-US", name: "English (US)" };
    }
  }

  getAllUsers() {
    try {
      const data = localStorage.getItem(this.USERS_DB_KEY);
      return data ? JSON.parse(data) : this.getDefaultDemoUsers();
    } catch (e) {
      return this.getDefaultDemoUsers();
    }
  }

  getDefaultDemoUsers() {
    return [
      {
        id: "user_ramesh",
        phone: "9876543210",
        name: "Ramesh Patel",
        state: "Maharashtra",
        locationName: "Nashik, Maharashtra",
        landSize: 5.0,
        landUnit: "Acres",
        soilType: "Black Cotton Soil",
        currentCrop: "Cotton",
        preferredLang: "mr-IN",
        waterSource: "Borewell & Drip"
      },
      {
        id: "user_sunita",
        phone: "9812345678",
        name: "Sunita Devi",
        state: "Punjab",
        locationName: "Ludhiana, Punjab",
        landSize: 12.5,
        landUnit: "Acres",
        soilType: "Alluvial Soil",
        currentCrop: "Wheat & Paddy",
        preferredLang: "pa-IN",
        waterSource: "Canal Irrigation"
      },
      {
        id: "user_ankit",
        phone: "9988776655",
        name: "Ankit Sharma",
        state: "Uttar Pradesh",
        locationName: "Varanasi, Uttar Pradesh",
        landSize: 8.0,
        landUnit: "Acres",
        soilType: "Clay Soil",
        currentCrop: "Sugarcane",
        preferredLang: "hi-IN",
        waterSource: "Canal & Borewell"
      }
    ];
  }

  saveAllUsers(users) {
    try {
      localStorage.setItem(this.USERS_DB_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn("Failed to save users DB:", e);
    }
  }

  getCurrentSession() {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;
      return JSON.parse(sessionData);
    } catch (e) {
      return null;
    }
  }

  loginUser(phoneOrUsername, name = "", extraInfo = {}) {
    const cleanId = (phoneOrUsername || "guest").toLowerCase().replace(/[^a-z0-9]/g, '');
    const userId = `user_${cleanId}`;

    const allUsers = this.getAllUsers();
    let user = allUsers.find(u => u.id === userId || u.phone === phoneOrUsername);

    if (!user) {
      const loc = extraInfo.locationName || "Nashik, Maharashtra";
      const prefLang = this.getPreferredLanguageForLocation(loc).code;

      user = {
        id: userId,
        phone: phoneOrUsername,
        name: name || `Farmer ${phoneOrUsername.slice(-4)}`,
        state: extraInfo.state || "Maharashtra",
        locationName: loc,
        landSize: extraInfo.landSize || 5.0,
        landUnit: extraInfo.landUnit || "Acres",
        soilType: extraInfo.soilType || "Black Cotton Soil",
        currentCrop: extraInfo.currentCrop || "Cotton",
        preferredLang: prefLang,
        waterSource: extraInfo.waterSource || "Borewell & Drip"
      };
      allUsers.push(user);
      this.saveAllUsers(allUsers);
    }

    const session = {
      userId: user.id,
      name: user.name,
      phone: user.phone,
      loginTime: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn("Failed to save session:", e);
    }

    // Seed default history for demo users if empty
    this.seedUserHistoryIfEmpty(user);

    return user;
  }

  seedUserHistoryIfEmpty(user) {
    const key = `agronomy_history_${user.id}`;
    if (!localStorage.getItem(key)) {
      let defaultHistory = [];
      if (user.id === "user_ramesh") {
        defaultHistory = [{
          id: "scan_r1",
          timestamp: "Aug 10, 2026, 09:30 AM",
          cropName: "Cotton (Gossypium hirsutum)",
          diseaseName: "Cotton Leaf Curl Virus",
          severity: "CRITICAL",
          severityClass: "severity-critical",
          confidence: 95,
          location: "Nashik, Maharashtra",
          weatherTemp: "29°C",
          safetyWindow: "07:00 - 11:00 AM",
          financialSaved: "₹98,500 / acre"
        }];
      } else if (user.id === "user_sunita") {
        defaultHistory = [{
          id: "scan_s1",
          timestamp: "Aug 09, 2026, 04:15 PM",
          cropName: "Paddy Rice (Oryza sativa)",
          diseaseName: "Bacterial Leaf Blight",
          severity: "MODERATE",
          severityClass: "severity-moderate",
          confidence: 91,
          location: "Ludhiana, Punjab",
          weatherTemp: "31°C",
          safetyWindow: "06:00 - 10:00 AM",
          financialSaved: "₹55,700 / acre"
        }];
      } else if (user.id === "user_ankit") {
        defaultHistory = [{
          id: "scan_a1",
          timestamp: "Aug 08, 2026, 11:00 AM",
          cropName: "Sugarcane (Saccharum officinarum)",
          diseaseName: "Sugarcane Red Rot Fungus",
          severity: "CRITICAL",
          severityClass: "severity-critical",
          confidence: 93,
          location: "Varanasi, Uttar Pradesh",
          weatherTemp: "33°C",
          safetyWindow: "07:30 - 10:30 AM",
          financialSaved: "₹1,10,500 / acre"
        }];
      }
      try {
        localStorage.setItem(key, JSON.stringify(defaultHistory));
      } catch (e) {}
    }
  }

  logoutUser() {
    try {
      localStorage.removeItem(this.SESSION_KEY);
    } catch (e) {
      console.warn("Failed to clear session:", e);
    }
  }

  // --- PER-USER ISOLATED FARM PROFILE ---
  getUserFarmProfile() {
    const session = this.getCurrentSession();
    if (!session) return null;

    const allUsers = this.getAllUsers();
    const user = allUsers.find(u => u.id === session.userId);
    if (user) {
      return {
        locationName: user.locationName || "Nashik, Maharashtra",
        landSize: user.landSize || 5.0,
        landUnit: user.landUnit || "Acres",
        soilType: user.soilType || "Black Cotton Soil",
        currentCrop: user.currentCrop || "Cotton",
        preferredLang: user.preferredLang || this.getPreferredLanguageForLocation(user.locationName).code,
        waterSource: user.waterSource || "Borewell & Drip"
      };
    }
    return null;
  }

  saveUserFarmProfile(farmProfile) {
    const session = this.getCurrentSession();
    if (!session) return;

    const allUsers = this.getAllUsers();
    const userIndex = allUsers.findIndex(u => u.id === session.userId);
    if (userIndex !== -1) {
      allUsers[userIndex] = {
        ...allUsers[userIndex],
        ...farmProfile
      };
      this.saveAllUsers(allUsers);
    }
  }

  // --- PER-USER ISOLATED FIELD SCAN HISTORY ---
  getUserHistoryKey() {
    const session = this.getCurrentSession();
    return session ? `agronomy_history_${session.userId}` : "agronomy_history_guest";
  }

  getHistory() {
    const session = this.getCurrentSession();
    if (!session) return [];

    try {
      const key = `agronomy_history_${session.userId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveScan(diagnosisData, weatherData, locationName, currencyFormattedSavings = "") {
    const session = this.getCurrentSession();
    if (!session) return null;

    const history = this.getHistory();
    const newRecord = {
      id: "scan_" + Date.now(),
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      cropName: diagnosisData.cropName,
      diseaseName: diagnosisData.diseaseName,
      severity: diagnosisData.severity,
      severityClass: diagnosisData.severityClass,
      confidence: diagnosisData.confidence,
      location: locationName,
      weatherTemp: weatherData ? `${weatherData.temperature}°C` : "N/A",
      safetyWindow: weatherData ? weatherData.safetyAnalysis.bestWindow : "N/A",
      financialSaved: currencyFormattedSavings || (diagnosisData.economicImpactUSD ? `$${diagnosisData.economicImpactUSD.financialSavingsUSD}` : "N/A")
    };

    history.unshift(newRecord);
    if (history.length > 30) history.pop();

    try {
      localStorage.setItem(this.getUserHistoryKey(), JSON.stringify(history));
    } catch (e) {
      console.warn("Failed saving user scan:", e);
    }
    return newRecord;
  }

  deleteScan(id) {
    let history = this.getHistory();
    history = history.filter(item => item.id !== id);
    try {
      localStorage.setItem(this.getUserHistoryKey(), JSON.stringify(history));
    } catch (e) {
      console.warn("Failed to update user scan history:", e);
    }
    return history;
  }
}
