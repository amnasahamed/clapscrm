import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const HLS_SRC = 'https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8';

export default function LoginBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = HLS_SRC;
      void video.play().catch(() => {});
      return;
    }

    if (!Hls.isSupported()) return;

    const hls = new Hls({ enableWorker: false });
    hlsRef.current = hls;
    hls.loadSource(HLS_SRC);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      void video.play().catch(() => {});
    });

    return () => {
      hls.destroy();
      hlsRef.current = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#070b0a]" aria-hidden>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover opacity-60"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Left-to-right dark gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to right, #070b0a 0%, rgba(7, 11, 10, 0.75) 35%, transparent 70%)',
        }}
      />

      {/* Bottom-up readability gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, #070b0a 0%, rgba(7, 11, 10, 0.6) 25%, transparent 55%)',
        }}
      />

      {/* Vertical grid lines — desktop only */}
      <div className="absolute inset-0 hidden md:block pointer-events-none">
        <div className="absolute inset-y-0 left-1/4 w-px bg-white/10" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
        <div className="absolute inset-y-0 left-3/4 w-px bg-white/10" />
      </div>

      {/* Central cyan/dark-green ellipse glow */}
      <svg
        className="absolute left-1/2 top-0 -translate-x-1/2 pointer-events-none"
        width="1200"
        height="400"
        viewBox="0 0 1200 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <filter id="login-glow-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="25" />
          </filter>
          <radialGradient id="login-glow-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
            <stop offset="45%" stopColor="#0d9488" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx="600"
          cy="120"
          rx="520"
          ry="140"
          fill="url(#login-glow-gradient)"
          filter="url(#login-glow-blur)"
        />
      </svg>
    </div>
  );
}
