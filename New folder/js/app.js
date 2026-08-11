/**
 * Agronomy AI - Main Application Controller (v3.1 - Regional Language Adaptation & Per-User History Sync)
 */

import { WeatherService } from './weatherService.js';
import { VisionEngine } from './visionEngine.js';
import { VoiceService } from './voiceService.js';
import { Chatbot } from './chatbot.js';
import { StorageManager } from './storage.js';
import { CameraService } from './cameraService.js';
import { CropRecommendationEngine } from './cropRecommendation.js';

class AgronomyApp {
  constructor() {
    this.weatherService = new WeatherService();
    this.visionEngine = new VisionEngine();
    this.voiceService = new VoiceService();
    this.chatbot = new Chatbot();
    this.storageManager = new StorageManager();
    this.cameraService = new CameraService();
    this.cropRecEngine = new CropRecommendationEngine();

    this.currentDiagnosis = null;
    this.currentWeatherData = null;
    this.activeTreatmentTab = 'organic';

    this.bindAuthEvents();
    this.checkSessionAndInit();
  }

  /**
   * Check active login session & initialize views
   */
  checkSessionAndInit() {
    const session = this.storageManager.getCurrentSession();
    const gatewayScreen = document.getElementById('authGatewayScreen');
    const dashboardScreen = document.getElementById('appDashboardScreen');

    if (session) {
      if (gatewayScreen) gatewayScreen.style.display = 'none';
      if (dashboardScreen) dashboardScreen.style.display = 'block';

      this.initDashboardUI();
    } else {
      if (gatewayScreen) gatewayScreen.style.display = 'flex';
      if (dashboardScreen) dashboardScreen.style.display = 'none';
    }
  }

  /**
   * Bind Auth Gateway Events
   */
  bindAuthEvents() {
    const tabSignIn = document.getElementById('tabSignIn');
    const tabRegister = document.getElementById('tabRegister');
    const formSignInBody = document.getElementById('formSignInBody');
    const formRegisterBody = document.getElementById('formRegisterBody');

    if (tabSignIn && tabRegister && formSignInBody && formRegisterBody) {
      tabSignIn.onclick = () => {
        tabSignIn.classList.add('active');
        tabRegister.classList.remove('active');
        formSignInBody.style.display = 'block';
        formRegisterBody.style.display = 'none';
      };

      tabRegister.onclick = () => {
        tabRegister.classList.add('active');
        tabSignIn.classList.remove('active');
        formRegisterBody.style.display = 'block';
        formSignInBody.style.display = 'none';
      };
    }

    const gatewaySignInBtn = document.getElementById('gatewaySignInBtn');
    if (gatewaySignInBtn) {
      gatewaySignInBtn.onclick = () => {
        const phone = document.getElementById('gatewayPhoneInput')?.value.trim() || "9876543210";
        this.performLogin(phone);
      };
    }

    const gatewayRegisterBtn = document.getElementById('gatewayRegisterBtn');
    if (gatewayRegisterBtn) {
      gatewayRegisterBtn.onclick = () => {
        const name = document.getElementById('regNameInput')?.value.trim() || "Vikram Singh";
        const phone = document.getElementById('regPhoneInput')?.value.trim() || "9811223344";
        const locationName = document.getElementById('regLocationInput')?.value.trim() || "Karnal, Haryana";
        const landSize = parseFloat(document.getElementById('regLandSizeInput')?.value) || 6.0;
        const landUnit = document.getElementById('regLandUnitInput')?.value || "Acres";
        const soilType = document.getElementById('regSoilSelect')?.value || "Alluvial Soil";
        const currentCrop = document.getElementById('regCropSelect')?.value || "Wheat";

        const extraInfo = { locationName, landSize, landUnit, soilType, currentCrop };
        this.performLogin(phone, name, extraInfo);
      };
    }

    document.querySelectorAll('.demo-farmer-chip').forEach(chip => {
      chip.onclick = () => {
        const phone = chip.getAttribute('data-phone');
        const name = chip.getAttribute('data-name');
        this.performLogin(phone, name);
      };
    });

    const headerLogoutBtn = document.getElementById('headerLogoutBtn');
    if (headerLogoutBtn) {
      headerLogoutBtn.onclick = () => {
        this.storageManager.logoutUser();
        this.voiceService.stop();
        this.currentDiagnosis = null;
        this.checkSessionAndInit();
      };
    }
  }

  performLogin(phoneOrUsername, name = "", extraInfo = {}) {
    this.storageManager.loginUser(phoneOrUsername, name, extraInfo);
    this.resetImagePreview();
    this.checkSessionAndInit();
  }

  /**
   * Initialize Dashboard UI & load User's Isolated Data
   */
  initDashboardUI() {
    // Populate Global Weather Hubs
    const locationSelect = document.getElementById('locationHubSelect');
    if (locationSelect) {
      locationSelect.innerHTML = WeatherService.GLOBAL_HUBS.map(hub => 
        `<option value="${hub.lat},${hub.lon}" data-name="${hub.name}" data-country="${hub.country}">${hub.name} (${hub.crop})</option>`
      ).join('');
    }

    // Render Logged-In User Profile Header Badge
    this.renderHeaderUserBadge();

    // Load & Render User's Isolated Farm Profile
    this.renderUserFarmProfile();

    // Bind Dashboard Events
    this.bindDashboardEvents();

    // Fetch Weather & Adapt Regional Language for User's Farm Location
    const farmProfile = this.storageManager.getUserFarmProfile();
    if (farmProfile && farmProfile.locationName) {
      this.adaptLanguageForLocation(farmProfile.locationName);
      const hub = WeatherService.GLOBAL_HUBS.find(h => farmProfile.locationName.includes(h.state) || h.name.includes(farmProfile.locationName));
      if (hub) {
        this.weatherService.currentLocation.name = hub.name;
        this.weatherService.currentLocation.country = hub.country;
        this.fetchAndUpdateWeather(hub.lat, hub.lon);
      } else {
        this.loadInitialWeather();
      }
    } else {
      this.loadInitialWeather();
    }

    // Refresh history list and badge count for current user
    this.renderHistoryList();
    this.updateHistoryBadge();
  }

  /**
   * Adapt Voice Audio Language to Location Preference
   */
  adaptLanguageForLocation(locationName) {
    const prefLang = this.storageManager.getPreferredLanguageForLocation(locationName);
    const selectEl = document.getElementById('voiceLangSelect');
    if (selectEl) {
      selectEl.value = prefLang.code;
    }
    this.voiceService.setLanguage(prefLang.code);
  }

  renderHeaderUserBadge() {
    const session = this.storageManager.getCurrentSession();
    const farm = this.storageManager.getUserFarmProfile();
    const farmerNameEl = document.getElementById('headerFarmerName');
    const farmerDetailsEl = document.getElementById('headerFarmerDetails');

    if (farmerNameEl && session) {
      farmerNameEl.textContent = session.name;
    }
    if (farmerDetailsEl && farm) {
      farmerDetailsEl.textContent = `${farm.locationName.split(',')[0]} • ${farm.landSize} ${farm.landUnit}`;
    }
  }

  renderUserFarmProfile() {
    const farm = this.storageManager.getUserFarmProfile();
    if (!farm) return;

    const locInput = document.getElementById('farmLocationInput');
    const landInput = document.getElementById('farmLandSizeInput');
    const soilInput = document.getElementById('farmSoilSelect');
    const cropInput = document.getElementById('farmCropSelect');
    const waterInput = document.getElementById('farmWaterSelect');

    if (locInput) locInput.value = farm.locationName;
    if (landInput) landInput.value = farm.landSize;
    if (soilInput) soilInput.value = farm.soilType;
    if (cropInput) cropInput.value = farm.currentCrop;
    if (waterInput) waterInput.value = farm.waterSource;

    const farmSummaryEl = document.getElementById('farmSummaryDisplay');
    if (farmSummaryEl) {
      farmSummaryEl.innerHTML = `
        <strong>${farm.currentCrop}</strong> on <strong>${farm.landSize} ${farm.landUnit}</strong> (${farm.soilType}) in <strong>${farm.locationName}</strong>
      `;
    }

    const recsContainer = document.getElementById('nextCropRecsContainer');
    if (recsContainer) {
      const recs = this.cropRecEngine.getRecommendations(farm, this.weatherService);
      recsContainer.innerHTML = recs.map(crop => `
        <div class="crop-rec-card glass-panel" style="padding:1rem; border-left:4px solid var(--primary-500);">
          <div style="display:flex; justify-between; align-items:flex-start;">
            <div>
              <span class="hero-pill" style="font-size:0.68rem; margin-bottom:0.3rem;">${crop.matchScore}% ROTATION MATCH</span>
              <h4 style="font-size:1.05rem; margin-top:0.2rem;">${crop.name}</h4>
              <div style="font-size:0.75rem; color:var(--text-muted);">${crop.category} • Season: ${crop.season}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:800; font-size:1.1rem; color:var(--primary-400);">${crop.formattedProfit} / acre</div>
              <div style="font-size:0.7rem; color:var(--text-muted);">Total Farm: ${crop.totalFarmProfit}</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.5rem; margin:0.75rem 0; background:var(--bg-surface-raised); padding:0.5rem; border-radius:8px; font-size:0.75rem;">
            <div><strong>Yield:</strong> ${crop.yieldPerAcre}</div>
            <div><strong>Water:</strong> ${crop.waterRequirement}</div>
            <div><strong>Soil Boost:</strong> ${crop.nitrogenFixation}</div>
          </div>

          <div style="font-size:0.8rem; color:var(--text-main); font-style:italic;">
            💡 <strong>Why This Crop:</strong> ${crop.agronomistReason}
          </div>
        </div>
      `).join('');
    }
  }

  bindDashboardEvents() {
    // Dropzone & File Input
    const dropzone = document.getElementById('leafDropzone');
    const fileInput = document.getElementById('leafFileInput');

    if (dropzone && fileInput) {
      dropzone.onclick = () => fileInput.click();
      dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); };
      dropzone.ondragleave = () => dropzone.classList.remove('drag-over');
      dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) this.handleImageFile(e.dataTransfer.files[0]);
      };
      fileInput.onchange = (e) => {
        if (e.target.files && e.target.files[0]) this.handleImageFile(e.target.files[0]);
      };
    }

    // Camera Snapshot Modal
    const openCamBtn = document.getElementById('openCamBtn');
    const closeCamBtn = document.getElementById('closeCamBtn');
    const captureCamBtn = document.getElementById('captureCamBtn');
    const flipCamBtn = document.getElementById('flipCamBtn');
    const cameraModal = document.getElementById('cameraModal');

    if (openCamBtn && cameraModal) {
      openCamBtn.onclick = async (e) => {
        e.stopPropagation();
        cameraModal.classList.add('active');
        const videoEl = document.getElementById('cameraVideoStream');
        try {
          await this.cameraService.startCamera(videoEl);
        } catch (err) {
          alert("Camera Error: " + err.message);
          cameraModal.classList.remove('active');
        }
      };
    }

    if (closeCamBtn && cameraModal) {
      closeCamBtn.onclick = () => {
        this.cameraService.stopCamera();
        cameraModal.classList.remove('active');
      };
    }

    if (flipCamBtn) {
      flipCamBtn.onclick = async () => {
        this.cameraService.toggleCameraFacing();
        const videoEl = document.getElementById('cameraVideoStream');
        await this.cameraService.startCamera(videoEl);
      };
    }

    if (captureCamBtn && cameraModal) {
      captureCamBtn.onclick = () => {
        const videoEl = document.getElementById('cameraVideoStream');
        const canvasEl = document.getElementById('cameraCanvas');
        const dataUrl = this.cameraService.captureSnapshot(videoEl, canvasEl);

        if (dataUrl) {
          this.cameraService.stopCamera();
          cameraModal.classList.remove('active');
          this.runDiagnosis(null, dataUrl);
        }
      };
    }

    // Preset Sample Chips
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.onclick = () => {
        const presetId = chip.getAttribute('data-preset-id');
        const imgSrc = chip.getAttribute('data-img-src');
        this.runDiagnosis(presetId, imgSrc);
      };
    });

    const resetImgBtn = document.getElementById('resetImageBtn');
    if (resetImgBtn) {
      resetImgBtn.onclick = (e) => {
        e.stopPropagation();
        this.resetImagePreview();
      };
    }

    // Location Hub Select & Search & GPS
    const locationSelect = document.getElementById('locationHubSelect');
    if (locationSelect) {
      locationSelect.onchange = (e) => {
        const [lat, lon] = e.target.value.split(',').map(Number);
        const selectedOption = e.target.options[e.target.selectedIndex];
        const locationName = selectedOption.getAttribute('data-name');
        const country = selectedOption.getAttribute('data-country');
        
        this.weatherService.currentLocation.name = locationName;
        this.weatherService.currentLocation.country = country;

        this.adaptLanguageForLocation(locationName);
        this.fetchAndUpdateWeather(lat, lon);
        this.updateFarmLocationInProfile(locationName);
      };
    }

    const gpsBtn = document.getElementById('gpsLocateBtn');
    if (gpsBtn) gpsBtn.onclick = () => this.autoDetectGPS();

    const locationSearchBtn = document.getElementById('locationSearchBtn');
    const locationSearchInput = document.getElementById('locationSearchInput');
    const searchResultsDropdown = document.getElementById('searchResultsDropdown');

    if (locationSearchBtn && locationSearchInput) {
      const doSearch = async () => {
        const query = locationSearchInput.value.trim();
        if (!query) return;
        
        const results = await this.weatherService.searchLocationByName(query);
        if (results.length > 0 && searchResultsDropdown) {
          searchResultsDropdown.innerHTML = results.map(item => `
            <div class="search-result-item" data-lat="${item.lat}" data-lon="${item.lon}" data-name="${item.name}" data-country="${item.country}">
              📍 <strong>${item.name}</strong> <span style="font-size:0.75rem; color:var(--text-muted);">${item.fullAddress}</span>
            </div>
          `).join('');
          searchResultsDropdown.style.display = 'block';

          searchResultsDropdown.querySelectorAll('.search-result-item').forEach(el => {
            el.onclick = () => {
              const lat = parseFloat(el.getAttribute('data-lat'));
              const lon = parseFloat(el.getAttribute('data-lon'));
              const name = el.getAttribute('data-name');
              const country = el.getAttribute('data-country');

              this.weatherService.currentLocation.name = name;
              this.weatherService.currentLocation.country = country;

              searchResultsDropdown.style.display = 'none';
              locationSearchInput.value = name;

              this.adaptLanguageForLocation(name);
              this.fetchAndUpdateWeather(lat, lon);
              this.updateFarmLocationInProfile(name);
            };
          });
        }
      };

      locationSearchBtn.onclick = doSearch;
      locationSearchInput.onkeypress = (e) => { if (e.key === 'Enter') doSearch(); };
    }

    // Save Farm Profile Form Button
    const saveFarmProfileBtn = document.getElementById('saveFarmProfileBtn');
    if (saveFarmProfileBtn) {
      saveFarmProfileBtn.onclick = () => {
        const farm = {
          locationName: document.getElementById('farmLocationInput')?.value || this.weatherService.currentLocation.name,
          landSize: parseFloat(document.getElementById('farmLandSizeInput')?.value) || 5.0,
          landUnit: document.getElementById('farmLandUnitInput')?.value || "Acres",
          soilType: document.getElementById('farmSoilSelect')?.value || "Black Cotton Soil",
          currentCrop: document.getElementById('farmCropSelect')?.value || "Cotton",
          waterSource: document.getElementById('farmWaterSelect')?.value || "Borewell & Drip"
        };

        this.storageManager.saveUserFarmProfile(farm);
        this.adaptLanguageForLocation(farm.locationName);
        this.renderHeaderUserBadge();
        this.renderUserFarmProfile();
        alert("Your Farm & Land Profile has been saved! Next Crop Recommendations & Regional Voice Language updated below.");
      };
    }

    // Audio & Voice Language Selector
    const playAudioBtn = document.getElementById('playAudioBtn');
    const voiceLangSelect = document.getElementById('voiceLangSelect');
    if (playAudioBtn) playAudioBtn.onclick = () => this.toggleVoiceAdvisory();
    if (voiceLangSelect) {
      voiceLangSelect.onchange = (e) => {
        this.voiceService.setLanguage(e.target.value);
        if (this.voiceService.isPlaying) this.toggleVoiceAdvisory();
      };
    }

    // Treatment Tabs
    const tabOrganic = document.getElementById('tabOrganic');
    const tabChemical = document.getElementById('tabChemical');
    if (tabOrganic && tabChemical) {
      tabOrganic.onclick = () => this.switchTreatmentTab('organic');
      tabChemical.onclick = () => this.switchTreatmentTab('chemical');
    }

    // Theme Toggle
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.onclick = () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        themeToggleBtn.querySelector('span').textContent = next === 'dark' ? 'Dark' : 'Light';
      };
    }

    // History & Chatbot
    const historyBtn = document.getElementById('historyBtn');
    const historyCloseBtn = document.getElementById('historyCloseBtn');
    const historyDrawer = document.getElementById('historyDrawer');
    if (historyBtn && historyDrawer) {
      historyBtn.onclick = () => {
        this.renderHistoryList();
        historyDrawer.classList.add('active');
      };
    }
    if (historyCloseBtn && historyDrawer) historyCloseBtn.onclick = () => historyDrawer.classList.remove('active');

    const fabChatBtn = document.getElementById('fabChatBtn');
    const chatCloseBtn = document.getElementById('chatCloseBtn');
    const chatDrawer = document.getElementById('chatDrawer');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatInput = document.getElementById('chatInput');

    if (fabChatBtn && chatDrawer) fabChatBtn.onclick = () => chatDrawer.classList.toggle('active');
    if (chatCloseBtn && chatDrawer) chatCloseBtn.onclick = () => chatDrawer.classList.remove('active');
    if (sendChatBtn && chatInput) {
      sendChatBtn.onclick = () => this.handleSendMessage();
      chatInput.onkeypress = (e) => { if (e.key === 'Enter') this.handleSendMessage(); };
    }

    document.querySelectorAll('.chat-chip').forEach(chip => {
      chip.onclick = () => {
        if (chatInput) {
          chatInput.value = chip.textContent;
          this.handleSendMessage();
        }
      };
    });

    const printReportBtn = document.getElementById('printReportBtn');
    if (printReportBtn) printReportBtn.onclick = () => window.print();
  }

  handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => this.runDiagnosis(null, e.target.result);
    reader.readAsDataURL(file);
  }

  async runDiagnosis(presetId, imgSrc) {
    const previewWrapper = document.getElementById('imagePreviewWrapper');
    const previewImg = document.getElementById('imagePreviewImg');
    const emptyState = document.getElementById('emptyStateAdvisory');
    const advisoryContent = document.getElementById('advisoryContentArea');

    if (previewWrapper && previewImg) {
      previewImg.src = imgSrc;
      previewWrapper.classList.add('active');
      previewWrapper.classList.add('scanning');
    }

    if (emptyState) emptyState.style.display = 'none';

    const diagnosis = await this.visionEngine.analyzeImage(imgSrc, presetId);
    this.currentDiagnosis = diagnosis;
    this.chatbot.setContextDiagnosis(diagnosis);

    if (previewWrapper) previewWrapper.classList.remove('scanning');

    this.renderDiagnosisResults(diagnosis);

    if (advisoryContent) advisoryContent.style.display = 'block';

    const currSaved = this.weatherService.formatCurrency(diagnosis.economicImpactUSD.financialSavingsUSD, this.weatherService.currentLocation.country);
    this.storageManager.saveScan(diagnosis, this.currentWeatherData, this.weatherService.currentLocation.name, currSaved);
    
    // Re-render user history & badge
    this.renderHistoryList();
    this.updateHistoryBadge();
  }

  renderDiagnosisResults(diagnosis) {
    const cropTitle = document.getElementById('diagCropTitle');
    const diseaseName = document.getElementById('diagDiseaseName');
    const scientificName = document.getElementById('diagScientificName');
    const severityBadge = document.getElementById('diagSeverityBadge');
    const confVal = document.getElementById('diagConfidenceVal');
    const confBar = document.getElementById('diagConfidenceBar');

    if (cropTitle) cropTitle.textContent = diagnosis.cropName;
    if (diseaseName) diseaseName.textContent = diagnosis.diseaseName;
    if (scientificName) scientificName.textContent = diagnosis.scientificName;

    if (severityBadge) {
      severityBadge.textContent = diagnosis.severity;
      severityBadge.className = `severity-tag ${diagnosis.severityClass}`;
    }

    if (confVal) confVal.textContent = `${diagnosis.confidence}%`;
    if (confBar) confBar.style.width = `${diagnosis.confidence}%`;

    this.renderTreatmentSteps(diagnosis);

    if (diagnosis.economicImpactUSD) {
      const ecoLossVal = document.getElementById('ecoLossVal');
      const ecoSavedVal = document.getElementById('ecoSavedVal');
      const ecoRoiVal = document.getElementById('ecoRoiVal');

      const country = this.weatherService.currentLocation.country;
      const formattedLoss = this.weatherService.formatCurrency(diagnosis.economicImpactUSD.estimatedLossValueUSD, country);
      const formattedSaved = this.weatherService.formatCurrency(diagnosis.economicImpactUSD.financialSavingsUSD, country);

      if (ecoLossVal) ecoLossVal.textContent = `${formattedLoss} / acre`;
      if (ecoSavedVal) ecoSavedVal.textContent = `${formattedSaved} / acre`;
      if (ecoRoiVal) ecoRoiVal.textContent = diagnosis.economicImpactUSD.netROI;
    }
  }

  renderTreatmentSteps(diagnosis) {
    const listContainer = document.getElementById('treatmentStepsList');
    if (!listContainer || !diagnosis) return;

    const steps = this.activeTreatmentTab === 'organic' ? diagnosis.organicTreatment : diagnosis.chemicalTreatment;
    listContainer.innerHTML = steps.map((step, idx) => `
      <div class="treatment-step-card">
        <div class="step-num">${idx + 1}</div>
        <div class="step-content">
          <h5>${step.title}</h5>
          <p>${step.desc}</p>
        </div>
      </div>
    `).join('');
  }

  switchTreatmentTab(tab) {
    this.activeTreatmentTab = tab;
    document.getElementById('tabOrganic')?.classList.toggle('active', tab === 'organic');
    document.getElementById('tabChemical')?.classList.toggle('active', tab === 'chemical');
    if (this.currentDiagnosis) this.renderTreatmentSteps(this.currentDiagnosis);
  }

  resetImagePreview() {
    const previewWrapper = document.getElementById('imagePreviewWrapper');
    const emptyState = document.getElementById('emptyStateAdvisory');
    const advisoryContent = document.getElementById('advisoryContentArea');

    if (previewWrapper) previewWrapper.classList.remove('active');
    if (advisoryContent) advisoryContent.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';

    this.currentDiagnosis = null;
    this.voiceService.stop();
    document.getElementById('playAudioBtn')?.classList.remove('playing');
  }

  async loadInitialWeather() {
    await this.fetchAndUpdateWeather(this.weatherService.currentLocation.lat, this.weatherService.currentLocation.lon);
  }

  async fetchAndUpdateWeather(lat, lon) {
    const weatherData = await this.weatherService.fetchLiveWeather(lat, lon);
    this.currentWeatherData = weatherData;

    document.getElementById('wTemp')?.replaceChildren(document.createTextNode(`${weatherData.temperature}°C`));
    document.getElementById('wWind')?.replaceChildren(document.createTextNode(`${weatherData.windSpeed} km/h`));
    document.getElementById('wHumidity')?.replaceChildren(document.createTextNode(`${weatherData.humidity}%`));
    document.getElementById('wRainProb')?.replaceChildren(document.createTextNode(`${weatherData.rainProbability}%`));

    const safetyBanner = document.getElementById('safetyBannerBox');
    const safetyTitle = document.getElementById('safetyStatusTitle');
    const safetyDesc = document.getElementById('safetyStatusDesc');
    const timelineContainer = document.getElementById('weatherTimelineContainer');

    if (safetyBanner && safetyTitle && safetyDesc) {
      const sa = weatherData.safetyAnalysis;
      safetyTitle.textContent = `Action Status: ${sa.overallStatus}`;
      safetyDesc.textContent = sa.recommendation;
      safetyBanner.className = `safety-header-banner ${sa.badgeClass === 'badge-safe' ? '' : (sa.badgeClass === 'badge-caution' ? 'warning' : 'danger')}`;
    }

    if (timelineContainer && weatherData.hourlyTimeline) {
      timelineContainer.innerHTML = weatherData.hourlyTimeline.map(item => `
        <div class="timeline-hour-card">
          <div class="hour-time">${item.time}</div>
          <div><span class="hour-safety-badge ${item.status === 'SAFE' ? 'badge-safe' : (item.status === 'CAUTION' ? 'badge-caution' : 'badge-unsafe')}">${item.status}</span></div>
          <div class="hour-detail">${item.temp}°C | ${item.rain}% Rain</div>
          <div class="hour-detail" style="font-size:0.65rem; margin-top:2px;">${item.wind} km/h wind</div>
        </div>
      `).join('');
    }

    if (this.currentDiagnosis) {
      this.renderDiagnosisResults(this.currentDiagnosis);
    }
  }

  autoDetectGPS() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const geoInfo = await this.weatherService.reverseGeocode(lat, lon);

        this.weatherService.currentLocation.name = geoInfo.name;
        this.weatherService.currentLocation.country = geoInfo.country;

        this.adaptLanguageForLocation(geoInfo.name);
        await this.fetchAndUpdateWeather(lat, lon);
        this.updateFarmLocationInProfile(geoInfo.name);
      },
      (err) => alert("GPS access denied or unavailable. Using default agricultural hub.")
    );
  }

  updateFarmLocationInProfile(locName) {
    const farm = this.storageManager.getUserFarmProfile();
    if (farm) {
      farm.locationName = locName;
      this.storageManager.saveUserFarmProfile(farm);
      const locInput = document.getElementById('farmLocationInput');
      if (locInput) locInput.value = locName;
      this.adaptLanguageForLocation(locName);
      this.renderUserFarmProfile();
      this.renderHeaderUserBadge();
    }
  }

  toggleVoiceAdvisory() {
    const playBtn = document.getElementById('playAudioBtn');
    if (!this.currentDiagnosis || !this.currentWeatherData) {
      alert("Please select or scan a crop leaf image first to play spoken advisory.");
      return;
    }

    if (this.voiceService.isPlaying) {
      this.voiceService.stop();
      if (playBtn) playBtn.classList.remove('playing');
    } else {
      if (playBtn) playBtn.classList.add('playing');
      this.voiceService.speakAdvisory(this.currentDiagnosis, this.currentWeatherData, () => {
        if (playBtn) playBtn.classList.remove('playing');
      });
    }
  }

  renderHistoryList() {
    const listEl = document.getElementById('historyListContainer');
    if (!listEl) return;

    const history = this.storageManager.getHistory();
    const session = this.storageManager.getCurrentSession();
    const farmerName = session ? session.name : "User";

    if (history.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:2rem;">No field scans saved for ${farmerName} yet.</div>`;
      return;
    }

    listEl.innerHTML = `
      <div style="font-size:0.75rem; color:var(--primary-400); margin-bottom:0.75rem; font-weight:bold;">
        📂 ${farmerName}'s Saved Field Scans (${history.length}):
      </div>
      ${history.map(item => `
        <div class="glass-panel" style="padding:0.85rem; margin-bottom:0.75rem;">
          <div style="display:flex; justify-between; align-items:center;">
            <strong style="font-size:0.9rem;">${item.cropName} - ${item.diseaseName}</strong>
            <span class="severity-tag ${item.severityClass}" style="font-size:0.68rem; padding:1px 5px;">${item.severity}</span>
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.3rem;">
            📅 ${item.timestamp} | 📍 ${item.location}
          </div>
          <div style="font-size:0.75rem; color:var(--primary-400); margin-top:0.3rem;">
            Saved Harvest Value: ${item.financialSaved}
          </div>
        </div>
      `).join('')}
    `;
  }

  updateHistoryBadge() {
    const badge = document.getElementById('historyBadgeCount');
    if (badge) badge.textContent = this.storageManager.getHistory().length;
  }

  async handleSendMessage() {
    const chatInput = document.getElementById('chatInput');
    const messagesBody = document.getElementById('chatMessagesBody');

    if (!chatInput || !chatInput.value.trim() || !messagesBody) return;

    const text = chatInput.value.trim();
    chatInput.value = '';

    const userBubble = document.createElement('div');
    userBubble.className = 'chat-msg user';
    userBubble.textContent = text;
    messagesBody.appendChild(userBubble);
    messagesBody.scrollTop = messagesBody.scrollHeight;

    const botReply = await this.chatbot.getResponse(text);

    const botBubble = document.createElement('div');
    botBubble.className = 'chat-msg bot';
    botBubble.textContent = botReply;
    messagesBody.appendChild(botBubble);
    messagesBody.scrollTop = messagesBody.scrollHeight;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new AgronomyApp();
});
