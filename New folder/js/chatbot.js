/**
 * AgriChat AI - Conversational Agronomist Chatbot
 */

export class Chatbot {
  constructor() {
    this.history = [];
    this.currentDiagnosis = null;
  }

  setContextDiagnosis(diagnosis) {
    this.currentDiagnosis = diagnosis;
  }

  /**
   * Process user query and return expert agronomic response
   */
  async getResponse(userMessage) {
    // Add to local history
    this.history.push({ sender: 'user', text: userMessage });

    // Simulate AI thinking time (600ms)
    await new Promise(resolve => setTimeout(resolve, 600));

    const msg = userMessage.toLowerCase();
    let reply = "";

    if (msg.includes("dosage") || msg.includes("dilute") || msg.includes("how much")) {
      if (this.currentDiagnosis) {
        reply = `For ${this.currentDiagnosis.diseaseName}, standard mixing ratio is 2.5 grams of wettable powder per 1 liter of clean water (or 500g per 200L tank per acre). Always mix thoroughly before pouring into sprayer tank.`;
      } else {
        reply = "Standard chemical spray dilution is 2g to 2.5g per liter of water. Organic bio-fungicides like Bacillus subtilis require 5g per liter. Always test on a single plant first!";
      }
    } else if (msg.includes("water") || msg.includes("irrigation") || msg.includes("rain")) {
      reply = "During a fungal outbreak, suspend overhead sprinkler irrigation immediately to avoid spreading spores across leaves! Switch to drip or furrow irrigation early in the morning.";
    } else if (msg.includes("organic") || msg.includes("natural") || msg.includes("neem")) {
      reply = "Organic control: Spray Neem oil (10,000 ppm) at 5ml/liter with 1ml liquid soap as emulsifier. Spray during dusk when beneficial pollinators (bees) are inactive.";
    } else if (msg.includes("fertilizer") || msg.includes("npk") || msg.includes("nitrogen")) {
      reply = "Hold back high-nitrogen urea top-dressing while leaves are diseased, as soft lush growth attracts more fungal spores and pests. Apply Potash (MOP) to harden crop leaf cell walls.";
    } else if (msg.includes("prevent") || msg.includes("next season") || msg.includes("rotation")) {
      reply = "To prevent recurrences next season: 1) Practice 3-year crop rotation with non-host legumes or mustard. 2) Solarize soil using transparent plastic sheets during peak summer. 3) Treat seeds with Trichoderma viride @ 10g/kg seed.";
    } else {
      reply = `Thank you for your question regarding crop health. Regarding ${this.currentDiagnosis ? this.currentDiagnosis.cropName : 'your field conditions'}, our recommended action is to maintain good canopy ventilation, inspect leaf undersides twice weekly, and adhere closely to the weather action safety window!`;
    }

    this.history.push({ sender: 'bot', text: reply });
    return reply;
  }
}
