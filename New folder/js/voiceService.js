/**
 * Multilingual Voice & Audio Advisory Service - Agronomy AI
 * Automatically adapts speech synthesis to regional farm location preferences.
 */

export class VoiceService {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.selectedLang = "hi-IN"; // Default regional for India

    this.translations = {
      "en-US": {
        intro: "Agronomy AI Advisory Report.",
        diseasePrefix: "Diagnosis:",
        severityPrefix: "Severity level is",
        treatmentIntro: "Recommended treatment:",
        weatherIntro: "Weather spray window:"
      },
      "hi-IN": {
        intro: "एग्रीशील्ड एआई कृषि सलाह रिपोर्ट।",
        diseasePrefix: "फसल निदान:",
        severityPrefix: "गंभीरता का स्तर है",
        treatmentIntro: "अनुशंसित उपचार:",
        weatherIntro: "मौसम और छिड़काव की स्थिति:"
      },
      "mr-IN": {
        intro: "ॲग्रीशील्ड एआय पीक सल्ला अहवाल.",
        diseasePrefix: "पिकाचे निदान:",
        severityPrefix: "गंभीरतेची पातळी आहे",
        treatmentIntro: "शिफारस केलेले उपचार:",
        weatherIntro: "हवामान आणि फवारणीची वेळ:"
      },
      "pa-IN": {
        intro: "ਐਗਰੀਸ਼ੀਲਡ ਏਆਈ ਫਸਲ ਸਲਾਹ ਰਿਪੋਰਟ।",
        diseasePrefix: "ਫਸਲ ਦੀ ਬਿਮਾਰੀ:",
        severityPrefix: "ਗੰਭੀਰਤਾ ਦਾ ਪੱਧਰ ਹੈ",
        treatmentIntro: "ਸਿਫਾਰਸ਼ ਕੀਤਾ ਇਲਾਜ:",
        weatherIntro: "ਮੌਸਮ ਅਤੇ ਸਪਰੇਅ ਦਾ ਸਮਾਂ:"
      },
      "te-IN": {
        intro: "అగ్రిషీల్డ్ AI పంట సలహా నివేదిక.",
        diseasePrefix: "పంట వ్యాధి నిర్ధారణ:",
        severityPrefix: "తీవ్రత స్థాయి",
        treatmentIntro: "సిఫార్సు చేసిన చికిత్స:",
        weatherIntro: "వాతావరణ స్ప్రే సమయం:"
      },
      "ta-IN": {
        intro: "அக்ரிஷீல்ட் AI பயிர் ஆலோசனை அறிக்கை.",
        diseasePrefix: "பயிர் நோய் கண்டறிதல்:",
        severityPrefix: "பாதிப்பின் அளவு",
        treatmentIntro: "பரிந்துரைக்கப்பட்ட சிகிச்சை:",
        weatherIntro: "தெளிப்புக்கான வானிலை நேரம்:"
      },
      "bn-IN": {
        intro: "এগ্রিশিল্ড এআই ফসল পরামর্শ রিপোর্ট।",
        diseasePrefix: "ফসল রোগ নির্ণয়:",
        severityPrefix: "গভীরতার মাত্রা হলো",
        treatmentIntro: "সুপারিশকৃত চিকিৎসা:",
        weatherIntro: "আবহাওয়া ও স্প্রে করার সময়:"
      },
      "gu-IN": {
        intro: "એગ્રીશીલ્ડ AI પાક સલાહ રિપોર્ટ.",
        diseasePrefix: "પાક નિદાન:",
        severityPrefix: "ગંભીરતાનું સ્તર છે",
        treatmentIntro: "ભલામણ કરેલ સારવાર:",
        weatherIntro: "હવામાન અને છંટકાવનો સમય:"
      },
      "es-ES": {
        intro: "Informe de Asesoría Agrícola Agronomy AI.",
        diseasePrefix: "Diagnóstico:",
        severityPrefix: "El nivel de gravedad es",
        treatmentIntro: "Tratamiento recomendado:",
        weatherIntro: "Ventana de aplicación según el clima:"
      },
      "sw-KE": {
        intro: "Ripoti ya Ushauri wa Kilimo ya Agronomy AI.",
        diseasePrefix: "Utambuzi wa Ugonjwa:",
        severityPrefix: "Kiwango cha hatari ni",
        treatmentIntro: "Tiba inayopendekezwa:",
        weatherIntro: "Wakati salama wa kunyunyizia dawa:"
      },
      "fr-FR": {
        intro: "Rapport de Conseil Agronomique Agronomy AI.",
        diseasePrefix: "Diagnostic de la culture:",
        severityPrefix: "Le niveau de sévérité est",
        treatmentIntro: "Traitement recommandé:",
        weatherIntro: "Fenêtre météo d'application:"
      }
    };
  }

  setLanguage(langCode) {
    this.selectedLang = langCode;
  }

  /**
   * Speak diagnosis & safety advisory
   */
  speakAdvisory(diagnosisData, weatherData, onEndCallback) {
    if (!this.synth) {
      alert("Speech synthesis is not supported on this browser.");
      return;
    }

    this.stop();

    const tr = this.translations[this.selectedLang] || this.translations["hi-IN"] || this.translations["en-US"];
    
    // Build spoken message text
    const textToSpeak = `${tr.intro} ${tr.diseasePrefix} ${diagnosisData.cropName}, ${diagnosisData.diseaseName}. ${tr.severityPrefix} ${diagnosisData.severity}. ${tr.treatmentIntro} ${diagnosisData.organicTreatment[0].title}. ${tr.weatherIntro} ${weatherData.safetyAnalysis.recommendation}`;

    this.currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
    this.currentUtterance.lang = this.selectedLang;
    this.currentUtterance.rate = 0.92; // Clear rural broadcast pace
    this.currentUtterance.pitch = 1.0;

    this.currentUtterance.onend = () => {
      this.isPlaying = false;
      if (onEndCallback) onEndCallback();
    };

    this.currentUtterance.onerror = (e) => {
      console.warn("Speech synthesis notice:", e);
      this.isPlaying = false;
      if (onEndCallback) onEndCallback();
    };

    this.synth.speak(this.currentUtterance);
    this.isPlaying = true;
  }

  togglePause() {
    if (!this.synth) return;
    if (this.synth.paused) {
      this.synth.resume();
      this.isPlaying = true;
    } else if (this.synth.speaking) {
      this.synth.pause();
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.synth && (this.synth.speaking || this.synth.paused)) {
      this.synth.cancel();
      this.isPlaying = false;
    }
  }
}
