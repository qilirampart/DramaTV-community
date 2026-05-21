"use client";

import { useEffect, useRef } from "react";
import styles from "./RouteVideoLoading.module.css";

type RouteVideoLoadingProps = {
  activeNav?: "home" | "featured" | "community";
  label?: string;
  useVideo?: boolean;
  videoActive?: boolean;
};

const TRANSITION_VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_120549_0cd82c36-56b3-4dd9-b190-069cfc3a623f.mp4";

const NAV_ITEMS: Array<{ id: "home" | "featured" | "community"; label: string }> = [
  { id: "home", label: "Home" },
  { id: "featured", label: "Featured" },
  { id: "community", label: "Community" }
];

function DramaTvMark() {
  return <img alt="" aria-hidden="true" className={styles.brandMark} draggable="false" height="64" src="/favicon.png" width="64" />;
}

export function RouteVideoLoading({
  activeNav = "home",
  label = "Loading next page",
  useVideo = true,
  videoActive = true
}: RouteVideoLoadingProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!useVideo) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (videoActive) {
      video.muted = true;
      void video.play().catch(() => {});
      return;
    }

    video.pause();

    try {
      video.currentTime = 0;
    } catch {}
  }, [useVideo, videoActive]);

  return (
    <div aria-busy="true" aria-live="polite" aria-label={label} className={styles.stage} role="status">
      {useVideo ? (
        <video
          ref={videoRef}
          autoPlay={videoActive}
          className={styles.video}
          data-route-transition-video="true"
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src={TRANSITION_VIDEO_SRC} type="video/mp4" />
        </video>
      ) : (
        <div className={styles.still} />
      )}

      <div className={styles.scrim} />
      <div className={styles.blur} />
      <div className={styles.noise} />

      <header className={styles.topbar}>
        <div className={styles.brand}>
          <DramaTvMark />
          <span className={styles.wordmark}>Drama TV</span>
        </div>

        <nav aria-label="Loading navigation preview" className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <span
              className={`${styles.navItem}${item.id === activeNav ? ` ${styles.navItemActive}` : ""}`}
              key={item.id}
            >
              {item.label}
            </span>
          ))}
        </nav>

        <span className={styles.loadingChip}>Loading</span>
      </header>

      <div className={styles.copy}>
        <span className={styles.kicker}>DramaTV Community</span>
        <strong className={styles.title}>{label}</strong>
        <span className={styles.subtitle}>Preparing the next view without stacking extra media work.</span>

        <span aria-hidden="true" className={styles.dots}>
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  );
}
