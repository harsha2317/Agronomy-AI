/**
 * Camera Service - Agronomy AI
 * Provides live camera snapshot capabilities for mobile & desktop field devices.
 */

export class CameraService {
  constructor() {
    this.mediaStream = null;
    this.facingMode = 'environment'; // Default rear camera for field leaf photo
  }

  /**
   * Start video stream into video element
   */
  async startCamera(videoElement) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera API is not supported on this browser/device.");
    }

    this.stopCamera();

    const constraints = {
      video: {
        facingMode: this.facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.mediaStream;
      await videoElement.play();
      return true;
    } catch (err) {
      console.warn("Camera access failed with environment facing, fallback to default video:", err.message);
      // Fallback constraints
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoElement.srcObject = this.mediaStream;
      await videoElement.play();
      return true;
    }
  }

  /**
   * Switch between front & rear cameras
   */
  toggleCameraFacing() {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
  }

  /**
   * Capture single photo frame from video stream to DataURL
   */
  captureSnapshot(videoElement, canvasElement) {
    if (!videoElement || !canvasElement) return null;

    const width = videoElement.videoWidth || 640;
    const height = videoElement.videoHeight || 480;

    canvasElement.width = width;
    canvasElement.height = height;

    const ctx = canvasElement.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, width, height);

    return canvasElement.toDataURL('image/jpeg', 0.92);
  }

  /**
   * Stop all camera tracks
   */
  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }
}
