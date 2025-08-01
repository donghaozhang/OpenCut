"use client";

import { useRef, useState, useEffect } from "react";
import { useTimelineStore } from "@/stores/timeline-store";
import { useMediaStore } from "@/stores/media-store";
import { toast } from "sonner";
import { TimelineElement } from "./timeline-element";
import {
  TimelineTrack,
  sortTracksByOrder,
  ensureMainTrack,
  getMainTrack,
  canElementGoOnTrack,
} from "@/types/timeline";
import { usePlaybackStore } from "@/stores/playback-store";
import type {
  TimelineElement as TimelineElementType,
  DragData,
  SnapPoint,
} from "@/types/timeline";
import {
  snapTimeToFrame,
  TIMELINE_CONSTANTS,
} from "@/constants/timeline-constants";
import { useProjectStore } from "@/stores/project-store";
import { useTimelineSnapping } from "@/hooks/use-timeline-snapping";

export function TimelineTrackContent({
  track,
  zoomLevel,
  onSnapPointChange, // SAFE: Optional prop
  isSnappingEnabled = false, // SAFE: Defaults to false
}: {
  track: TimelineTrack;
  zoomLevel: number;
} & { 
  onSnapPointChange?: (snapPoint: SnapPoint | null) => void;
  isSnappingEnabled?: boolean;
}) {
  // SAFE: Feature detection
  const useEnhancedSnapping = isSnappingEnabled && typeof onSnapPointChange === 'function';
  const { mediaItems } = useMediaStore();
  const {
    tracks,
    moveElementToTrack,
    updateElementStartTime,
    addElementToTrack,
    selectedElements,
    selectElement,
    dragState,
    startDrag: startDragAction,
    updateDragTime,
    endDrag: endDragAction,
    clearSelectedElements,
    insertTrackAt,
  } = useTimelineStore();

  // SAFE: Initialize snapping hook conditionally
  const snappingHook = useEnhancedSnapping ? useTimelineSnapping({
    tracks,
    zoomLevel,
    enabled: isSnappingEnabled,
    onSnapPointChange,
  }) : null;

  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [dropPosition, setDropPosition] = useState<number | null>(null);
  const [wouldOverlap, setWouldOverlap] = useState(false);
  const dragCounterRef = useRef(0);
  const [mouseDownLocation, setMouseDownLocation] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Set up mouse event listeners for drag
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;

      // On first mouse move during drag, ensure the element is selected
      if (dragState.elementId && dragState.trackId) {
        const isSelected = selectedElements.some(
          (c) =>
            c.trackId === dragState.trackId &&
            c.elementId === dragState.elementId
        );

        if (!isSelected) {
          // Select this element (replacing other selections) since we're dragging it
          selectElement(dragState.trackId, dragState.elementId, false);
        }
      }

      const timelineRect = timelineRef.current.getBoundingClientRect();
      const mouseX = e.clientX - timelineRect.left;
      const mouseTime = Math.max(
        0,
        mouseX / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel)
      );
      const adjustedTime = Math.max(0, mouseTime - dragState.clickOffsetTime);
      // SAFE: Preserve existing behavior by default
      const projectStore = useProjectStore.getState();
      const projectFps = projectStore.activeProject?.fps || 30;
      const snappedTime = useEnhancedSnapping && snappingHook 
        ? snappingHook.getSnapTime(adjustedTime).snappedTime
        : snapTimeToFrame(adjustedTime, projectFps); // Existing behavior

      updateDragTime(snappedTime);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragState.elementId || !dragState.trackId) return;

      // If this track initiated the drag, we should handle the mouse up regardless of where it occurs
      const isTrackThatStartedDrag = dragState.trackId === track.id;

      const timelineRect = timelineRef.current?.getBoundingClientRect();
      if (!timelineRect) {
        if (isTrackThatStartedDrag) {
          updateElementStartTime(
            track.id,
            dragState.elementId,
            dragState.currentTime
          );
          endDragAction();
        }
        return;
      }

      const isMouseOverThisTrack =
        e.clientY >= timelineRect.top && e.clientY <= timelineRect.bottom;

      if (!isMouseOverThisTrack && !isTrackThatStartedDrag) return;

      const finalTime = dragState.currentTime;

      if (isMouseOverThisTrack) {
        const sourceTrack = tracks.find((t) => t.id === dragState.trackId);
        const movingElement = sourceTrack?.elements.find(
          (c) => c.id === dragState.elementId
        );

        if (movingElement) {
          const movingElementDuration =
            movingElement.duration -
            movingElement.trimStart -
            movingElement.trimEnd;
          const movingElementEnd = finalTime + movingElementDuration;

          const targetTrack = tracks.find((t) => t.id === track.id);
          const hasOverlap = targetTrack?.elements.some((existingElement) => {
            if (
              dragState.trackId === track.id &&
              existingElement.id === dragState.elementId
            ) {
              return false;
            }
            const existingStart = existingElement.startTime;
            const existingEnd =
              existingElement.startTime +
              (existingElement.duration -
                existingElement.trimStart -
                existingElement.trimEnd);
            const ADJACENCY_TOLERANCE = 0.001;
            return finalTime < existingEnd - ADJACENCY_TOLERANCE && movingElementEnd > existingStart + ADJACENCY_TOLERANCE;
          });

          if (!hasOverlap) {
            if (dragState.trackId === track.id) {
              updateElementStartTime(track.id, dragState.elementId, finalTime);
            } else {
              moveElementToTrack(
                dragState.trackId,
                track.id,
                dragState.elementId
              );
              requestAnimationFrame(() => {
                updateElementStartTime(
                  track.id,
                  dragState.elementId!,
                  finalTime
                );
              });
            }
          }
        }
      } else if (isTrackThatStartedDrag) {
        // Mouse is not over this track, but this track started the drag
        // This means user released over ruler/outside - update position within same track
        const sourceTrack = tracks.find((t) => t.id === dragState.trackId);
        const movingElement = sourceTrack?.elements.find(
          (c) => c.id === dragState.elementId
        );

        if (movingElement) {
          const movingElementDuration =
            movingElement.duration -
            movingElement.trimStart -
            movingElement.trimEnd;
          const movingElementEnd = finalTime + movingElementDuration;

          const hasOverlap = track.elements.some((existingElement) => {
            if (existingElement.id === dragState.elementId) {
              return false;
            }
            const existingStart = existingElement.startTime;
            const existingEnd =
              existingElement.startTime +
              (existingElement.duration -
                existingElement.trimStart -
                existingElement.trimEnd);
            const ADJACENCY_TOLERANCE = 0.001;
            return finalTime < existingEnd - ADJACENCY_TOLERANCE && movingElementEnd > existingStart + ADJACENCY_TOLERANCE;
          });

          if (!hasOverlap) {
            updateElementStartTime(track.id, dragState.elementId, finalTime);
          }
        }
      }

      if (isTrackThatStartedDrag) {
        endDragAction();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    dragState.isDragging,
    dragState.clickOffsetTime,
    dragState.elementId,
    dragState.trackId,
    dragState.currentTime,
    zoomLevel,
    tracks,
    track.id,
    updateDragTime,
    updateElementStartTime,
    moveElementToTrack,
    endDragAction,
    selectedElements,
    selectElement,
  ]);

  const handleElementMouseDown = (
    e: React.MouseEvent,
    element: TimelineElementType
  ) => {
    setMouseDownLocation({ x: e.clientX, y: e.clientY });

    // Detect right-click (button 2) and handle selection without starting drag
    const isRightClick = e.button === 2;
    const isMultiSelect = e.metaKey || e.ctrlKey || e.shiftKey;

    if (isRightClick) {
      // Handle right-click selection
      const isSelected = selectedElements.some(
        (c) => c.trackId === track.id && c.elementId === element.id
      );

      // If element is not selected, select it (keep other selections if multi-select)
      if (!isSelected) {
        selectElement(track.id, element.id, isMultiSelect);
      }
      // If element is already selected, keep it selected

      // Don't start drag action for right-clicks
      return;
    }

    // Handle multi-selection for left-click with modifiers
    if (isMultiSelect) {
      selectElement(track.id, element.id, true);
    }

    // Calculate the offset from the left edge of the element to where the user clicked
    const elementElement = e.currentTarget as HTMLElement;
    const elementRect = elementElement.getBoundingClientRect();
    const clickOffsetX = e.clientX - elementRect.left;
    const clickOffsetTime =
      clickOffsetX / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel);

    console.log('🖱️ DRAG DEBUG: Starting drag action for element:', {
      elementId: element.id,
      trackId: track.id,
      elementName: element.name,
      startTime: element.startTime,
      clickX: e.clientX,
      clickOffsetTime
    });
    
    startDragAction(
      element.id,
      track.id,
      e.clientX,
      element.startTime,
      clickOffsetTime
    );
  };

  const handleElementClick = (
    e: React.MouseEvent,
    element: TimelineElementType
  ) => {
    e.stopPropagation();

    // Check if mouse moved significantly
    if (mouseDownLocation) {
      const deltaX = Math.abs(e.clientX - mouseDownLocation.x);
      const deltaY = Math.abs(e.clientY - mouseDownLocation.y);
      // If it moved more than a few pixels, consider it a drag and not a click.
      if (deltaX > 5 || deltaY > 5) {
        setMouseDownLocation(null); // Reset for next interaction
        return;
      }
    }

    // Skip selection logic for multi-selection (handled in mousedown)
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      return;
    }

    // Handle single selection
    const isSelected = selectedElements.some(
      (c) => c.trackId === track.id && c.elementId === element.id
    );

    if (!isSelected) {
      // If element is not selected, select it (replacing other selections)
      selectElement(track.id, element.id, false);
    }
    // If element is already selected, keep it selected (do nothing)
  };

  const handleTrackDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    // Handle both timeline elements and media items
    const hasTimelineElement = e.dataTransfer.types.includes(
      "application/x-timeline-element"
    );
    const hasMediaItem = e.dataTransfer.types.includes(
      "application/x-media-item"
    );

    if (!hasTimelineElement && !hasMediaItem) return;

    // Calculate drop position for overlap checking
    const trackContainer = e.currentTarget.querySelector(
      ".track-elements-container"
    ) as HTMLElement;
    let dropTime = 0;
    if (trackContainer) {
      const rect = trackContainer.getBoundingClientRect();
      const mouseX = Math.max(0, e.clientX - rect.left);
      dropTime = mouseX / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel);
    }

    // Check for potential overlaps and show appropriate feedback
    let wouldOverlap = false;

    if (hasMediaItem) {
      try {
        const mediaItemData = e.dataTransfer.getData(
          "application/x-media-item"
        );
        if (mediaItemData) {
          const dragData: DragData = JSON.parse(mediaItemData);

          if (dragData.type === "text") {
            // Text elements have default duration of 5 seconds
            const newElementDuration = 5;
            const projectStore = useProjectStore.getState();
            const projectFps = projectStore.activeProject?.fps || 30;
            const snappedTime = useEnhancedSnapping && snappingHook 
              ? snappingHook.getSnapTime(dropTime).snappedTime
              : snapTimeToFrame(dropTime, projectFps);
            const newElementEnd = snappedTime + newElementDuration;

            wouldOverlap = track.elements.some((existingElement) => {
              const existingStart = existingElement.startTime;
              const existingEnd =
                existingElement.startTime +
                (existingElement.duration -
                  existingElement.trimStart -
                  existingElement.trimEnd);
              const ADJACENCY_TOLERANCE = 0.001; // Small tolerance for floating-point precision
              return snappedTime < existingEnd - ADJACENCY_TOLERANCE && newElementEnd > existingStart + ADJACENCY_TOLERANCE;
            });
          } else {
            // Media elements
            const mediaItem = mediaItems.find(
              (item) => item.id === dragData.id
            );
            if (mediaItem) {
              const newElementDuration = mediaItem.duration || 5;
              const projectStore = useProjectStore.getState();
              const projectFps = projectStore.activeProject?.fps || 30;
              const snappedTime = snapTimeToFrame(dropTime, projectFps);
              const newElementEnd = snappedTime + newElementDuration;

              wouldOverlap = track.elements.some((existingElement) => {
                const existingStart = existingElement.startTime;
                const existingEnd =
                  existingElement.startTime +
                  (existingElement.duration -
                    existingElement.trimStart -
                    existingElement.trimEnd);
                const ADJACENCY_TOLERANCE = 0.001;
                return (
                  snappedTime < existingEnd - ADJACENCY_TOLERANCE && newElementEnd > existingStart + ADJACENCY_TOLERANCE
                );
              });
            }
          }
        }
      } catch (error) {
        // Continue with default behavior
      }
    } else if (hasTimelineElement) {
      try {
        const timelineElementData = e.dataTransfer.getData(
          "application/x-timeline-element"
        );
        if (timelineElementData) {
          const { elementId, trackId: fromTrackId } =
            JSON.parse(timelineElementData);
          const sourceTrack = tracks.find(
            (t: TimelineTrack) => t.id === fromTrackId
          );
          const movingElement = sourceTrack?.elements.find(
            (c: any) => c.id === elementId
          );

          if (movingElement) {
            const movingElementDuration =
              movingElement.duration -
              movingElement.trimStart -
              movingElement.trimEnd;
            const projectStore = useProjectStore.getState();
            const projectFps = projectStore.activeProject?.fps || 30;
            const snappedTime = snapTimeToFrame(dropTime, projectFps);
            const movingElementEnd = snappedTime + movingElementDuration;

            wouldOverlap = track.elements.some((existingElement) => {
              if (fromTrackId === track.id && existingElement.id === elementId)
                return false;

              const existingStart = existingElement.startTime;
              const existingEnd =
                existingElement.startTime +
                (existingElement.duration -
                  existingElement.trimStart -
                  existingElement.trimEnd);
              const ADJACENCY_TOLERANCE = 0.001;
              return (
                snappedTime < existingEnd - ADJACENCY_TOLERANCE && movingElementEnd > existingStart + ADJACENCY_TOLERANCE
              );
            });
          }
        }
      } catch (error) {
        // Continue with default behavior
      }
    }

    if (wouldOverlap) {
      e.dataTransfer.dropEffect = "none";
      setWouldOverlap(true);
      const projectStore = useProjectStore.getState();
      const projectFps = projectStore.activeProject?.fps || 30;
      setDropPosition(snapTimeToFrame(dropTime, projectFps));
      return;
    }

    e.dataTransfer.dropEffect = hasTimelineElement ? "move" : "copy";
    setWouldOverlap(false);
    const projectStore = useProjectStore.getState();
    const projectFps = projectStore.activeProject?.fps || 30;
    setDropPosition(snapTimeToFrame(dropTime, projectFps));
  };

  const handleTrackDragEnter = (e: React.DragEvent) => {
    e.preventDefault();

    const hasTimelineElement = e.dataTransfer.types.includes(
      "application/x-timeline-element"
    );
    const hasMediaItem = e.dataTransfer.types.includes(
      "application/x-media-item"
    );

    if (!hasTimelineElement && !hasMediaItem) return;

    dragCounterRef.current++;
    setIsDropping(true);
  };

  const handleTrackDragLeave = (e: React.DragEvent) => {
    e.preventDefault();

    const hasTimelineElement = e.dataTransfer.types.includes(
      "application/x-timeline-element"
    );
    const hasMediaItem = e.dataTransfer.types.includes(
      "application/x-media-item"
    );

    if (!hasTimelineElement && !hasMediaItem) return;

    dragCounterRef.current--;

    if (dragCounterRef.current === 0) {
      setIsDropping(false);
      setWouldOverlap(false);
      setDropPosition(null);
    }
  };

  const handleTrackDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Reset all drag states
    dragCounterRef.current = 0;
    setIsDropping(false);
    setWouldOverlap(false);

    const hasTimelineElement = e.dataTransfer.types.includes(
      "application/x-timeline-element"
    );
    const hasMediaItem = e.dataTransfer.types.includes(
      "application/x-media-item"
    );

    if (!hasTimelineElement && !hasMediaItem) return;

    const trackContainer = e.currentTarget.querySelector(
      ".track-elements-container"
    ) as HTMLElement;
    if (!trackContainer) return;

    const rect = trackContainer.getBoundingClientRect();
    const mouseX = Math.max(0, e.clientX - rect.left);
    const mouseY = e.clientY - rect.top; // Get Y position relative to this track
    const newStartTime =
      mouseX / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel);
    const projectStore = useProjectStore.getState();
    const projectFps = projectStore.activeProject?.fps || 30;
    const snappedTime = snapTimeToFrame(newStartTime, projectFps);

    // Calculate drop position relative to tracks
    const currentTrackIndex = tracks.findIndex((t) => t.id === track.id);

    // Determine drop zone within the track (top 20px, middle 20px, bottom 20px)
    let dropPosition: "above" | "on" | "below";
    if (mouseY < 20) {
      dropPosition = "above";
    } else if (mouseY > 40) {
      dropPosition = "below";
    } else {
      dropPosition = "on";
    }

    try {
      if (hasTimelineElement) {
        // Handle timeline element movement
        const timelineElementData = e.dataTransfer.getData(
          "application/x-timeline-element"
        );
        if (!timelineElementData) return;

        const {
          elementId,
          trackId: fromTrackId,
          clickOffsetTime = 0,
        } = JSON.parse(timelineElementData);

        // Find the element being moved
        const sourceTrack = tracks.find(
          (t: TimelineTrack) => t.id === fromTrackId
        );
        const movingElement = sourceTrack?.elements.find(
          (c: TimelineElementType) => c.id === elementId
        );

        if (!movingElement) {
          toast.error("Element not found");
          return;
        }

        // Adjust position based on where user clicked on the element
        const adjustedStartTime = snappedTime - clickOffsetTime;
        const finalStartTime = Math.max(
          0,
          snapTimeToFrame(adjustedStartTime, projectFps)
        );

        // Check for overlaps with existing elements (excluding the moving element itself)
        const movingElementDuration =
          movingElement.duration -
          movingElement.trimStart -
          movingElement.trimEnd;
        const movingElementEnd = finalStartTime + movingElementDuration;

        const hasOverlap = track.elements.some((existingElement) => {
          // Skip the element being moved if it's on the same track
          if (fromTrackId === track.id && existingElement.id === elementId)
            return false;

          const existingStart = existingElement.startTime;
          const existingEnd =
            existingElement.startTime +
            (existingElement.duration -
              existingElement.trimStart -
              existingElement.trimEnd);

          // Check if elements overlap (allow exact adjacency)
          const ADJACENCY_TOLERANCE = 0.001; // Small tolerance for floating-point precision
          const wouldOverlap = finalStartTime < existingEnd - ADJACENCY_TOLERANCE && 
            movingElementEnd > existingStart + ADJACENCY_TOLERANCE;
          
          // Calculate actual gap between videos
          const gapBetweenVideos = Math.abs(finalStartTime - existingEnd);
          const gapInMilliseconds = gapBetweenVideos * 1000;
          
          console.log('🎬 VIDEO GAP ANALYSIS:', {
            video1End: existingEnd,
            video2Start: finalStartTime,
            actualGap: gapBetweenVideos,
            gapInMs: gapInMilliseconds,
            toleranceMs: ADJACENCY_TOLERANCE * 1000,
            wouldOverlap,
            elementNames: `${existingElement.name} -> Moving element`
          });
          
          return wouldOverlap;
        });

        if (hasOverlap) {
          toast.error(
            "Cannot move element here - it would overlap with existing elements"
          );
          return;
        }

        if (fromTrackId === track.id) {
          // Moving within same track
          updateElementStartTime(track.id, elementId, finalStartTime);
        } else {
          // Moving to different track
          moveElementToTrack(fromTrackId, track.id, elementId);
          requestAnimationFrame(() => {
            updateElementStartTime(track.id, elementId, finalStartTime);
          });
        }
      } else if (hasMediaItem) {
        // Handle media item drop
        const mediaItemData = e.dataTransfer.getData(
          "application/x-media-item"
        );
        if (!mediaItemData) return;

        const dragData: DragData = JSON.parse(mediaItemData);

        if (dragData.type === "text") {
          let targetTrackId = track.id;
          let targetTrack = track;

          // Handle position-aware track creation for text
          if (track.type !== "text" || dropPosition !== "on") {
            // Text tracks should go above the main track
            const mainTrack = getMainTrack(tracks);
            let insertIndex: number;

            if (dropPosition === "above") {
              insertIndex = currentTrackIndex;
            } else if (dropPosition === "below") {
              insertIndex = currentTrackIndex + 1;
            } else {
              // dropPosition === "on" but track is not text type
              // Insert above main track if main track exists, otherwise at top
              if (mainTrack) {
                const mainTrackIndex = tracks.findIndex(
                  (t) => t.id === mainTrack.id
                );
                insertIndex = mainTrackIndex;
              } else {
                insertIndex = 0; // Top of timeline
              }
            }

            targetTrackId = insertTrackAt("text", insertIndex);
            // Get the updated tracks array after creating the new track
            const updatedTracks = useTimelineStore.getState().tracks;
            const newTargetTrack = updatedTracks.find(
              (t) => t.id === targetTrackId
            );
            if (!newTargetTrack) return;
            targetTrack = newTargetTrack;
          }

          // Check for overlaps with existing elements in target track
          const newElementDuration = 5; // Default text duration
          const newElementEnd = snappedTime + newElementDuration;

          const hasOverlap = targetTrack.elements.some((existingElement) => {
            const existingStart = existingElement.startTime;
            const existingEnd =
              existingElement.startTime +
              (existingElement.duration -
                existingElement.trimStart -
                existingElement.trimEnd);

            // Check if elements overlap (allow exact adjacency)
            const ADJACENCY_TOLERANCE = 0.001;
            return snappedTime < existingEnd - ADJACENCY_TOLERANCE && newElementEnd > existingStart + ADJACENCY_TOLERANCE;
          });

          if (hasOverlap) {
            toast.error(
              "Cannot place element here - it would overlap with existing elements"
            );
            return;
          }

          addElementToTrack(targetTrackId, {
            type: "text",
            name: dragData.name || "Text",
            content: dragData.content || "Default Text",
            duration: TIMELINE_CONSTANTS.DEFAULT_TEXT_DURATION,
            startTime: snappedTime,
            trimStart: 0,
            trimEnd: 0,
            fontSize: 48,
            fontFamily: "Arial",
            color: "#ffffff",
            backgroundColor: "transparent",
            textAlign: "center",
            fontWeight: "normal",
            fontStyle: "normal",
            textDecoration: "none",
            x: 0,
            y: 0,
            rotation: 0,
            opacity: 1,
          });
        } else {
          // Handle media items
          const mediaItem = mediaItems.find((item) => item.id === dragData.id);

          if (!mediaItem) {
            toast.error("Media item not found");
            return;
          }

          let targetTrackId = track.id;

          // Check if track type is compatible
          const isVideoOrImage =
            dragData.type === "video" || dragData.type === "image";
          const isAudio = dragData.type === "audio";
          const isCompatible = isVideoOrImage
            ? canElementGoOnTrack("media", track.type)
            : isAudio
              ? canElementGoOnTrack("media", track.type)
              : false;

          let targetTrack = tracks.find((t) => t.id === targetTrackId);

          // Handle position-aware track creation for media elements
          if (!isCompatible || dropPosition !== "on") {
            const needsNewTrack = !isCompatible || dropPosition !== "on";

            if (needsNewTrack) {
              if (isVideoOrImage) {
                // For video/image, check if we need a main track or additional media track
                const mainTrack = getMainTrack(tracks);

                if (!mainTrack) {
                  // No main track exists, create it
                  const updatedTracks = ensureMainTrack(tracks);
                  const newMainTrack = getMainTrack(updatedTracks);
                  if (newMainTrack && newMainTrack.elements.length === 0) {
                    targetTrackId = newMainTrack.id;
                    targetTrack = newMainTrack;
                  } else {
                    // Main track was created but somehow has elements, create new media track
                    const mainTrackIndex = updatedTracks.findIndex(
                      (t) => t.id === newMainTrack?.id
                    );
                    targetTrackId = insertTrackAt("media", mainTrackIndex);
                    const updatedTracksAfterInsert =
                      useTimelineStore.getState().tracks;
                    const newTargetTrack = updatedTracksAfterInsert.find(
                      (t) => t.id === targetTrackId
                    );
                    if (!newTargetTrack) return;
                    targetTrack = newTargetTrack;
                  }
                } else if (
                  mainTrack.elements.length === 0 &&
                  dropPosition === "on"
                ) {
                  // Main track exists and is empty, use it
                  targetTrackId = mainTrack.id;
                  targetTrack = mainTrack;
                } else {
                  // Create new media track above main track
                  const mainTrackIndex = tracks.findIndex(
                    (t) => t.id === mainTrack.id
                  );
                  let insertIndex: number;

                  if (dropPosition === "above") {
                    insertIndex = currentTrackIndex;
                  } else if (dropPosition === "below") {
                    insertIndex = currentTrackIndex + 1;
                  } else {
                    // Insert above main track
                    insertIndex = mainTrackIndex;
                  }

                  targetTrackId = insertTrackAt("media", insertIndex);
                  const updatedTracks = useTimelineStore.getState().tracks;
                  const newTargetTrack = updatedTracks.find(
                    (t) => t.id === targetTrackId
                  );
                  if (!newTargetTrack) return;
                  targetTrack = newTargetTrack;
                }
              } else if (isAudio) {
                // Audio tracks go at the bottom
                const mainTrack = getMainTrack(tracks);
                let insertIndex: number;

                if (dropPosition === "above") {
                  insertIndex = currentTrackIndex;
                } else if (dropPosition === "below") {
                  insertIndex = currentTrackIndex + 1;
                } else {
                  // Insert after main track (bottom area)
                  if (mainTrack) {
                    const mainTrackIndex = tracks.findIndex(
                      (t) => t.id === mainTrack.id
                    );
                    insertIndex = mainTrackIndex + 1;
                  } else {
                    insertIndex = tracks.length; // Bottom of timeline
                  }
                }

                targetTrackId = insertTrackAt("audio", insertIndex);
                const updatedTracks = useTimelineStore.getState().tracks;
                const newTargetTrack = updatedTracks.find(
                  (t) => t.id === targetTrackId
                );
                if (!newTargetTrack) return;
                targetTrack = newTargetTrack;
              }
            }
          }

          if (!targetTrack) return;

          // Check for overlaps with existing elements in target track
          const newElementDuration = mediaItem.duration || 5;
          const newElementEnd = snappedTime + newElementDuration;

          const hasOverlap = targetTrack.elements.some((existingElement) => {
            const existingStart = existingElement.startTime;
            const existingEnd =
              existingElement.startTime +
              (existingElement.duration -
                existingElement.trimStart -
                existingElement.trimEnd);

            // Check if elements overlap (allow exact adjacency)
            const ADJACENCY_TOLERANCE = 0.001;
            return snappedTime < existingEnd - ADJACENCY_TOLERANCE && newElementEnd > existingStart + ADJACENCY_TOLERANCE;
          });

          if (hasOverlap) {
            toast.error(
              "Cannot place element here - it would overlap with existing elements"
            );
            return;
          }

          addElementToTrack(targetTrackId, {
            type: "media",
            mediaId: mediaItem.id,
            name: mediaItem.name,
            duration: mediaItem.duration || 5,
            startTime: snappedTime,
            trimStart: 0,
            trimEnd: 0,
          });
        }
      }
    } catch (error) {
      console.error("Error handling drop:", error);
      toast.error("Failed to add media to track");
    }
  };

  return (
    <div
      className="w-full h-full hover:bg-muted/20"
      onClick={(e) => {
        // If clicking empty area (not on an element), deselect all elements
        if (!(e.target as HTMLElement).closest(".timeline-element")) {
          clearSelectedElements();
        }
      }}
      onDragOver={handleTrackDragOver}
      onDragEnter={handleTrackDragEnter}
      onDragLeave={handleTrackDragLeave}
      onDrop={handleTrackDrop}
    >
      <div
        ref={timelineRef}
        className="h-full relative track-elements-container min-w-full min-h-[85px]"
      >
        {track.elements.length === 0 ? (
          <div
            className={`h-full w-full rounded-sm border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground transition-colors ${
              isDropping
                ? wouldOverlap
                  ? "border-red-500 bg-red-500/10 text-red-600"
                  : "border-blue-500 bg-blue-500/10 text-blue-600"
                : "border-muted/30"
            }`}
          >
            {isDropping
              ? wouldOverlap
                ? "Cannot drop - would overlap"
                : "Drop element here"
              : ""}
          </div>
        ) : (
          <>
            {track.elements.map((element) => {
              const isSelected = selectedElements.some(
                (c) => c.trackId === track.id && c.elementId === element.id
              );

              const handleElementSplit = () => {
                const { currentTime } = usePlaybackStore();
                const { splitElement } = useTimelineStore();
                const splitTime = currentTime;
                const effectiveStart = element.startTime;
                const effectiveEnd =
                  element.startTime +
                  (element.duration - element.trimStart - element.trimEnd);

                if (splitTime > effectiveStart && splitTime < effectiveEnd) {
                  const secondElementId = splitElement(
                    track.id,
                    element.id,
                    splitTime
                  );
                  if (!secondElementId) {
                    toast.error("Failed to split element");
                  }
                } else {
                  toast.error("Playhead must be within element to split");
                }
              };

              const handleElementDuplicate = () => {
                const { addElementToTrack } = useTimelineStore.getState();
                const { id, ...elementWithoutId } = element;
                addElementToTrack(track.id, {
                  ...elementWithoutId,
                  name: element.name + " (copy)",
                  startTime:
                    element.startTime +
                    (element.duration - element.trimStart - element.trimEnd) +
                    0.1,
                });
              };

              const handleElementDelete = () => {
                const { removeElementFromTrack } = useTimelineStore.getState();
                removeElementFromTrack(track.id, element.id);
              };

              return (
                <TimelineElement
                  key={element.id}
                  element={element}
                  track={track}
                  zoomLevel={zoomLevel}
                  isSelected={isSelected}
                  onElementMouseDown={handleElementMouseDown}
                  onElementClick={handleElementClick}
                  // SAFE: Pass snapping props when enhanced mode is enabled
                  {...(useEnhancedSnapping ? {
                    isSnapping: false, // Will be set by snapping logic
                    onSnapChange: (snapping: boolean) => {
                      // Handle element snapping state change
                      if (onSnapPointChange) {
                        onSnapPointChange(snapping ? null : null); // Will be implemented with real snapping logic
                      }
                    }
                  } : {})}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
