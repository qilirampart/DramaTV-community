"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PREVIEW_START_EVENT = "interactive-video-preview:start";

type PreviewStartEventDetail = {
  group: string;
  instanceId: string;
};

type InteractiveVideoPreviewOptions = {
  enabled: boolean;
  loadOnViewport?: boolean;
  unloadDelayMs?: number;
  previewGroup?: string;
  previewStartDelayMs?: number;
  rootMargin?: string;
};

type MediaContainerElement = HTMLElement | null;
let previewInstanceCounter = 0;

export function useInteractiveVideoPreview({
  enabled,
  loadOnViewport = true,
  unloadDelayMs,
  previewGroup,
  previewStartDelayMs = 0,
  rootMargin = "160px 0px"
}: InteractiveVideoPreviewOptions) {
  const mediaRef = useRef<MediaContainerElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewStartTimerRef = useRef<number | null>(null);
  const unloadTimerRef = useRef<number | null>(null);
  const previewInstanceIdRef = useRef<string | null>(null);
  const hasPreviewStartedRef = useRef(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(!enabled);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  if (!previewInstanceIdRef.current) {
    previewInstanceCounter += 1;
    previewInstanceIdRef.current = `preview-${previewInstanceCounter}`;
  }

  const clearPreviewStartTimer = useCallback(() => {
    if (previewStartTimerRef.current) {
      window.clearTimeout(previewStartTimerRef.current);
      previewStartTimerRef.current = null;
    }
  }, []);

  const clearUnloadTimer = useCallback(() => {
    if (unloadTimerRef.current) {
      window.clearTimeout(unloadTimerRef.current);
      unloadTimerRef.current = null;
    }
  }, []);

  const resetVideoPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      hasPreviewStartedRef.current = false;
      return;
    }

    video.pause();

    if (hasPreviewStartedRef.current) {
      try {
        video.currentTime = 0;
      } catch {}
    }

    hasPreviewStartedRef.current = false;
  }, []);

  useEffect(() => {
    clearPreviewStartTimer();
    clearUnloadTimer();
    resetVideoPlayback();

    setShouldLoadVideo(!enabled);
    setIsPreviewActive(false);
    setIsVideoReady(false);
  }, [clearPreviewStartTimer, clearUnloadTimer, enabled, resetVideoPlayback]);

  useEffect(() => {
    return () => {
      clearPreviewStartTimer();
      clearUnloadTimer();
    };
  }, [clearPreviewStartTimer, clearUnloadTimer]);

  useEffect(() => {
    if (!enabled || !loadOnViewport || shouldLoadVideo) {
      return;
    }

    const element = mediaRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setShouldLoadVideo(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) {
          return;
        }

        setShouldLoadVideo(true);
        observer.disconnect();
      },
      {
        rootMargin
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, loadOnViewport, rootMargin, shouldLoadVideo]);

  useEffect(() => {
    if (!enabled || !shouldLoadVideo) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    const handleLoadedData = () => {
      setIsVideoReady(true);
    };

    const handleEmptied = () => {
      setIsVideoReady(false);
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setIsVideoReady(true);
    }

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplay", handleLoadedData);
    video.addEventListener("emptied", handleEmptied);

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleLoadedData);
      video.removeEventListener("emptied", handleEmptied);
    };
  }, [shouldLoadVideo]);

  useEffect(() => {
    if (!shouldLoadVideo) {
      setIsVideoReady(false);
    }
  }, [shouldLoadVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (isPreviewActive) {
      video.muted = true;
      hasPreviewStartedRef.current = true;
      void video.play().catch(() => {});
      return;
    }

    resetVideoPlayback();
  }, [enabled, isPreviewActive, resetVideoPlayback, shouldLoadVideo]);

  const notifyPreviewStart = useCallback(() => {
    if (!previewGroup || typeof window === "undefined" || !previewInstanceIdRef.current) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent<PreviewStartEventDetail>(PREVIEW_START_EVENT, {
        detail: {
          group: previewGroup,
          instanceId: previewInstanceIdRef.current
        }
      })
    );
  }, [previewGroup]);

  const activatePreview = useCallback(() => {
    if (!enabled) {
      return;
    }

    clearPreviewStartTimer();
    clearUnloadTimer();
    setShouldLoadVideo(true);
    setIsPreviewActive(true);
    notifyPreviewStart();
  }, [clearPreviewStartTimer, clearUnloadTimer, enabled, notifyPreviewStart]);

  const stopPreview = useCallback(
    (immediateUnload: boolean) => {
      if (!enabled) {
        return;
      }

      clearPreviewStartTimer();
      setIsPreviewActive(false);

      if (!shouldLoadVideo) {
        clearUnloadTimer();
        return;
      }

      if (immediateUnload || !unloadDelayMs) {
        clearUnloadTimer();
        resetVideoPlayback();
        setShouldLoadVideo(false);
        return;
      }

      clearUnloadTimer();
      unloadTimerRef.current = window.setTimeout(() => {
        resetVideoPlayback();
        setShouldLoadVideo(false);
        unloadTimerRef.current = null;
      }, unloadDelayMs);
    },
    [
      clearPreviewStartTimer,
      clearUnloadTimer,
      enabled,
      resetVideoPlayback,
      shouldLoadVideo,
      unloadDelayMs
    ]
  );

  useEffect(() => {
    if (!enabled || !previewGroup || typeof window === "undefined") {
      return;
    }

    const handleExternalPreviewStart = (event: Event) => {
      const detail = (event as CustomEvent<PreviewStartEventDetail>).detail;
      if (!detail || detail.group !== previewGroup || detail.instanceId === previewInstanceIdRef.current) {
        return;
      }

      stopPreview(true);
    };

    window.addEventListener(PREVIEW_START_EVENT, handleExternalPreviewStart as EventListener);
    return () => window.removeEventListener(PREVIEW_START_EVENT, handleExternalPreviewStart as EventListener);
  }, [enabled, previewGroup, stopPreview]);

  const handlePreviewStart = useCallback(() => {
    if (!enabled) {
      return;
    }

    clearUnloadTimer();

    if (shouldLoadVideo || previewStartDelayMs <= 0) {
      activatePreview();
      return;
    }

    clearPreviewStartTimer();
    previewStartTimerRef.current = window.setTimeout(() => {
      previewStartTimerRef.current = null;
      activatePreview();
    }, previewStartDelayMs);
  }, [
    activatePreview,
    clearPreviewStartTimer,
    clearUnloadTimer,
    enabled,
    previewStartDelayMs,
    shouldLoadVideo
  ]);

  const handlePreviewImmediateStart = useCallback(() => {
    if (!enabled) {
      return;
    }

    activatePreview();
  }, [activatePreview, enabled]);

  const handlePreviewStop = useCallback(() => {
    stopPreview(false);
  }, [stopPreview]);

  return {
    mediaRef,
    videoRef,
    isVideoReady,
    shouldLoadVideo,
    handlePreviewImmediateStart,
    handlePreviewStart,
    handlePreviewStop
  };
}
