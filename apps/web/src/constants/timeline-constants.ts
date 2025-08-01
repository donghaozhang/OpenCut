import type { TrackType } from "@/types/timeline";

// Track color definitions
export const TRACK_COLORS: Record<
  TrackType,
  { solid: string; background: string; border: string }
> = {
  media: {
    solid: "bg-blue-500",
    background: "bg-blue-500/20",
    border: "border-white/80",
  },
  text: {
    solid: "bg-[#9C4937]",
    background: "bg-[#9C4937]",
    border: "border-white/80",
  },
  audio: {
    solid: "bg-green-500",
    background: "bg-green-500/20",
    border: "border-white/80",
  },
} as const;

// Utility functions
export function getTrackColors(type: TrackType) {
  return TRACK_COLORS[type];
}

export function getTrackElementClasses(type: TrackType) {
  const colors = getTrackColors(type);
  return `${colors.background} ${colors.border}`;
}

// Track height definitions
export const TRACK_HEIGHTS: Record<TrackType, number> = {
  media: 85,
  text: 35,
  audio: 65,
} as const;

// Utility function for track heights
export function getTrackHeight(type: TrackType): number {
  return TRACK_HEIGHTS[type];
}

// Calculate cumulative height up to (but not including) a track index
export function getCumulativeHeightBefore(
  tracks: Array<{ type: TrackType }>,
  trackIndex: number
): number {
  const GAP = 4; // 4px gap between tracks (equivalent to Tailwind's gap-1)
  return tracks
    .slice(0, trackIndex)
    .reduce((sum, track) => sum + getTrackHeight(track.type) + GAP, 0);
}

// Calculate total height of all tracks
export function getTotalTracksHeight(
  tracks: Array<{ type: TrackType }>
): number {
  const GAP = 4; // 4px gap between tracks (equivalent to Tailwind's gap-1)
  const tracksHeight = tracks.reduce(
    (sum, track) => sum + getTrackHeight(track.type),
    0
  );
  const gapsHeight = Math.max(0, tracks.length - 1) * GAP; // n-1 gaps for n tracks
  return tracksHeight + gapsHeight;
}

// Other timeline constants
export const TIMELINE_CONSTANTS = {
  ELEMENT_MIN_WIDTH: 80,
  PIXELS_PER_SECOND: 80,
  TRACK_HEIGHT: 60, // Default fallback
  DEFAULT_TEXT_DURATION: 5,
  ZOOM_LEVELS: [0.25, 0.5, 1, 1.5, 2, 3, 4],
  CURSOR_OFFSET_PX: 200, // Offset for fake cursor positioning to align with red line
} as const;

// FPS presets for project settings
export const FPS_PRESETS = [
  { value: "24", label: "24 fps (Film)" },
  { value: "25", label: "25 fps (PAL)" },
  { value: "30", label: "30 fps (NTSC)" },
  { value: "60", label: "60 fps (High)" },
  { value: "120", label: "120 fps (Slow-mo)" },
] as const;

// Frame snapping utilities
export function timeToFrame(time: number, fps: number): number {
  return Math.round(time * fps);
}

export function frameToTime(frame: number, fps: number): number {
  return frame / fps;
}

export function snapTimeToFrame(time: number, fps: number): number {
  if (fps <= 0) return time; // Fallback for invalid FPS
  const frame = timeToFrame(time, fps);
  return frameToTime(frame, fps);
}

export function getFrameDuration(fps: number): number {
  return 1 / fps;
}
