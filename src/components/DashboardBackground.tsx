import { getDashboardGradientCss } from '../constants/dashboardGradients';
import { getDashboardImageSrc, resolveDashboardImageId } from '../constants/dashboardImages';
import { getDashboardVideoSrc } from '../constants/dashboardVideos';

const POSTER_SRC = getDashboardImageSrc('aurora');

interface DashboardBackgroundProps {
  mode: 'video' | 'gradient' | 'image' | 'static';
  videoId?: string;
  gradientId?: string;
  imageId?: string;
}

export default function DashboardBackground({ mode, videoId, gradientId, imageId }: DashboardBackgroundProps) {
  if (mode === 'static') {
    return <div className="fixed inset-0 z-0 bg-brand-bg" aria-hidden />;
  }

  if (mode === 'gradient') {
    return (
      <div
        className="fixed inset-0 z-0"
        style={{ background: getDashboardGradientCss(gradientId) }}
        aria-hidden
      />
    );
  }

  if (mode === 'image') {
    const imageSrc = getDashboardImageSrc(resolveDashboardImageId(imageId));

    return (
      <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <img
          key={imageSrc}
          src={imageSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        />
        <div className="absolute inset-0 bg-white/20 pointer-events-none" />
      </div>
    );
  }

  const videoSrc = getDashboardVideoSrc(videoId);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <video
        key={videoSrc}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        src={videoSrc}
        poster={POSTER_SRC}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disableRemotePlayback
        {...({ 'webkit-playsinline': 'true', 'x5-playsinline': 'true' } as Record<string, string>)}
      />
      <div className="absolute inset-0 bg-white/10 pointer-events-none" />
    </div>
  );
}
