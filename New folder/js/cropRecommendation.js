/**
 * AI Next Crop Recommendation & Land Profile Engine - Agronomy AI
 * Recommends optimal next rotation crops based on soil, location, land size, and current farming.
 */

export class CropRecommendationEngine {
  constructor() {
    this.cropKnowledgeBase = [
      {
        name: "Chickpea / Bengal Gram (Chana)",
        category: "Legume / Pulse",
        season: "Rabi (Nov - Mar)",
        idealSoils: ["Black Soil", "Alluvial Soil", "Red Loam"],
        rotationAfter: ["Paddy Rice", "Maize", "Cotton", "Wheat"],
        yieldPerAcre: "8 - 12 Quintals",
        estProfitUSDPerAcre: 650, // Converted into local currency dynamically
        waterRequirement: "Low (1-2 Irrigations)",
        nitrogenFixation: "+45 kg/ha Nitrogen",
        agronomistReason: "Excellent nitrogen-fixing legume to restore depleted soil fertility after cereal harvest. Reduces fertilizer bill by 30% for subsequent crops.",
        profitabilityRating: "High (High Mandi Demand)"
      },
      {
        name: "Mustard / Rapeseed (Sarson)",
        category: "Oilseed",
        season: "Rabi (Oct - Mar)",
        idealSoils: ["Alluvial Soil", "Sandy Soil", "Clay Soil"],
        rotationAfter: ["Paddy Rice", "Bajra / Pearl Millet", "Maize"],
        yieldPerAcre: "7 - 10 Quintals",
        estProfitUSDPerAcre: 720,
        waterRequirement: "Low to Moderate",
        nitrogenFixation: "Medium Bio-fumigant",
        agronomistReason: "Root glucosinolates act as natural bio-fumigant against soil nematodes. High edible oil market prices guarantee strong farm profit margins.",
        profitabilityRating: "Very High"
      },
      {
        name: "Groundnut / Peanut (Moongphali)",
        category: "Legume & Oilseed",
        season: "Kharif & Summer (Jun - Oct)",
        idealSoils: ["Red Loam", "Sandy Soil", "Black Soil"],
        rotationAfter: ["Wheat", "Sugarcane", "Chilli"],
        yieldPerAcre: "10 - 14 Quintals",
        estProfitUSDPerAcre: 810,
        waterRequirement: "Moderate",
        nitrogenFixation: "+50 kg/ha Nitrogen",
        agronomistReason: "Improves soil physical tilth and residual organic carbon while delivering high oilseed returns per acre.",
        profitabilityRating: "High"
      },
      {
        name: "Pigeon Pea / Arhar (Tur)",
        category: "Legume Pulse",
        season: "Kharif (Jun - Dec)",
        idealSoils: ["Black Soil", "Red Loam", "Alluvial Soil"],
        rotationAfter: ["Wheat", "Cotton", "Mustard"],
        yieldPerAcre: "6 - 9 Quintals",
        estProfitUSDPerAcre: 780,
        waterRequirement: "Low (Deep Taproot)",
        nitrogenFixation: "+60 kg/ha Nitrogen",
        agronomistReason: "Deep taproots break compact subsoil hardpans, enabling deeper water infiltration and superior drought resilience.",
        profitabilityRating: "Very High"
      },
      {
        name: "Hybrid Maize / Corn",
        category: "Cereal Grain",
        season: "Kharif & Rabi",
        idealSoils: ["Alluvial Soil", "Black Soil"],
        rotationAfter: ["Potato", "Legumes / Moong", "Vegetables"],
        yieldPerAcre: "25 - 35 Quintals",
        estProfitUSDPerAcre: 690,
        waterRequirement: "Moderate",
        nitrogenFixation: "Feeder Crop",
        agronomistReason: "High biomass yield for cattle fodder and grain sale to poultry feed industries with stable MSP prices.",
        profitabilityRating: "Medium - High"
      },
      {
        name: "Green Gram / Summer Mung Bean",
        category: "Short Duration Catch Crop",
        season: "Zaid / Summer (Mar - May)",
        idealSoils: ["Alluvial Soil", "Black Soil", "Red Loam"],
        rotationAfter: ["Wheat", "Potato", "Mustard"],
        yieldPerAcre: "4 - 6 Quintals (60 Days)",
        estProfitUSDPerAcre: 480,
        waterRequirement: "Low (60-day crop)",
        nitrogenFixation: "+35 kg/ha Nitrogen",
        agronomistReason: "Super-fast 60-day catch crop that fits between Wheat harvest and Paddy transplanting, generating bonus farm income.",
        profitabilityRating: "Quick Turnover"
      }
    ];
  }

  /**
   * Calculate top 3 recommended next crops based on farm profile
   */
  getRecommendations(profile, currencyService) {
    const { currentCrop, soilType, landSize, locationName, season } = profile;

    // Filter and score crops
    const scored = this.cropKnowledgeBase.map(crop => {
      let score = 50;

      // 1. Rotation bonus (avoiding same crop family)
      if (crop.rotationAfter.some(prev => currentCrop.toLowerCase().includes(prev.toLowerCase()))) {
        score += 30;
      }
      if (crop.name.toLowerCase().includes(currentCrop.toLowerCase())) {
        score -= 40; // Penalty for monoculture
      }

      // 2. Soil match
      if (crop.idealSoils.some(soil => soil.toLowerCase().includes(soilType.toLowerCase()))) {
        score += 20;
      }

      return {
        ...crop,
        matchScore: Math.min(99, score),
        formattedProfit: currencyService ? currencyService.formatCurrency(crop.estProfitUSDPerAcre, locationName) : `$${crop.estProfitUSDPerAcre}`,
        totalFarmProfit: currencyService ? currencyService.formatCurrency(crop.estProfitUSDPerAcre * (parseFloat(landSize) || 1), locationName) : `$${crop.estProfitUSDPerAcre * (parseFloat(landSize) || 1)}`
      };
    });

    // Sort by match score
    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored.slice(0, 3);
  }
}
