import { ExportSettings } from "@/types/export";
import { TimelineElement } from "@/types/timeline";

export interface FrameCaptureOptions {
  fps: number;
  duration: number; // in seconds
  width: number;
  height: number;
}

export interface FrameData {
  frameNumber: number;
  timestamp: number; // in seconds
  elements: TimelineElement[];
}

export class FrameCaptureService {
  private options: FrameCaptureOptions;
  private settings: ExportSettings;
  private timelineElements: TimelineElement[];

  constructor(options: FrameCaptureOptions, settings: ExportSettings, timelineElements: TimelineElement[] = []) {
    this.options = options;
    this.settings = settings;
    this.timelineElements = timelineElements;
  }

  /**
   * Calculate total number of frames for the export
   */
  getTotalFrames(): number {
    return Math.ceil(this.options.duration * this.options.fps);
  }

  /**
   * Get frame data for a specific frame number
   */
  getFrameData(frameNumber: number): FrameData {
    // Use more precise timestamp calculation to avoid floating-point errors
    const timestamp = Math.round((frameNumber / this.options.fps) * 1000) / 1000;
    
    // Get visible elements for this timestamp
    const elements = this.getVisibleElements(this.timelineElements, timestamp);
    
    return {
      frameNumber,
      timestamp,
      elements,
    };
  }

  /**
   * Generate frame iterator for export process
   */
  *generateFrames(): Generator<FrameData> {
    const totalFrames = this.getTotalFrames();
    
    for (let frameNumber = 0; frameNumber < totalFrames; frameNumber++) {
      yield this.getFrameData(frameNumber);
    }
  }

  /**
   * Extract frame from video element at specific time
   */
  async extractVideoFrame(
    videoElement: HTMLVideoElement,
    timestamp: number
  ): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        reject(new Error("Could not get 2D context"));
        return;
      }

      // Set canvas dimensions
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Seek to timestamp
      videoElement.currentTime = timestamp;

      const onSeeked = () => {
        // Draw video frame to canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Clean up event listener
        videoElement.removeEventListener("seeked", onSeeked);
        
        resolve(canvas);
      };

      const onError = () => {
        videoElement.removeEventListener("seeked", onSeeked);
        videoElement.removeEventListener("error", onError);
        reject(new Error("Failed to seek video"));
      };

      videoElement.addEventListener("seeked", onSeeked);
      videoElement.addEventListener("error", onError);
    });
  }

  /**
   * Create image element from file
   */
  async createImageElement(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = src;
    });
  }

  /**
   * Calculate element position and size based on timeline data
   */
  calculateElementBounds(
    element: TimelineElement,
    canvasWidth: number,
    canvasHeight: number
  ): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    // TODO: Implement proper position/size calculation based on element properties
    return {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
    };
  }

  /**
   * Check if element is visible at given timestamp
   */
  isElementVisible(element: TimelineElement, timestamp: number): boolean {
    const startTime = element.startTime || 0;
    
    // Calculate effective duration considering trimming
    const trimStart = element.trimStart || 0;
    const trimEnd = element.trimEnd || 0;
    const originalDuration = element.duration || 0;
    const effectiveDuration = Math.max(0, originalDuration - trimStart - trimEnd);
    
    const endTime = startTime + effectiveDuration;
    
    const isVisible = timestamp >= startTime && timestamp < endTime;
    
    
    return isVisible;
  }

  /**
   * Sort elements by layer/z-index for proper rendering order
   */
  sortElementsByLayer(elements: TimelineElement[]): TimelineElement[] {
    // For now, just return elements in their original order
    // TODO: Implement proper layer sorting when track information is available
    return elements;
  }

  /**
   * Get visible elements for a specific timestamp, sorted by render order
   */
  getVisibleElements(elements: TimelineElement[], timestamp: number): TimelineElement[] {
    const visibleElements = elements.filter(element => 
      this.isElementVisible(element, timestamp)
    );
    
    return this.sortElementsByLayer(visibleElements);
  }
}