import { DEFAULT_DASHBOARD_GRADIENT_ID, DASHBOARD_GRADIENTS } from '../constants/dashboardGradients';
import { DEFAULT_DASHBOARD_IMAGE_ID, resolveDashboardImageId } from '../constants/dashboardImages';
import { DEFAULT_DASHBOARD_VIDEO_ID, DASHBOARD_VIDEOS } from '../constants/dashboardVideos';

export type DashboardBackgroundMode = 'video' | 'gradient' | 'image' | 'static';

export interface AppearancePrefs {
  dashboardBackground: DashboardBackgroundMode;
  dashboardVideoId: string;
  dashboardGradientId: string;
  dashboardImageId: string;
}

const APPEARANCE_PREFS_KEY = 'edumanage_appearance_prefs';
const DEFAULT_PREFS: AppearancePrefs = {
  dashboardBackground: 'video',
  dashboardVideoId: DEFAULT_DASHBOARD_VIDEO_ID,
  dashboardGradientId: DEFAULT_DASHBOARD_GRADIENT_ID,
  dashboardImageId: DEFAULT_DASHBOARD_IMAGE_ID,
};

function normalizeVideoId(videoId?: string): string {
  if (videoId && DASHBOARD_VIDEOS.some((video) => video.id === videoId)) {
    return videoId;
  }
  return DEFAULT_DASHBOARD_VIDEO_ID;
}

function normalizeGradientId(gradientId?: string): string {
  if (gradientId && DASHBOARD_GRADIENTS.some((gradient) => gradient.id === gradientId)) {
    return gradientId;
  }
  return DEFAULT_DASHBOARD_GRADIENT_ID;
}

function normalizeImageId(imageId?: string): string {
  return resolveDashboardImageId(imageId);
}

export function loadAppearancePrefs(staffName: string): AppearancePrefs {
  try {
    const stored = localStorage.getItem(APPEARANCE_PREFS_KEY);
    if (stored) {
      const all = JSON.parse(stored) as Record<string, Partial<AppearancePrefs>>;
      const userPrefs = all[staffName];
      if (userPrefs?.dashboardBackground) {
        return {
          dashboardBackground: userPrefs.dashboardBackground,
          dashboardVideoId: normalizeVideoId(userPrefs.dashboardVideoId),
          dashboardGradientId: normalizeGradientId(userPrefs.dashboardGradientId),
          dashboardImageId: normalizeImageId(userPrefs.dashboardImageId),
        };
      }
    }
  } catch { /* ignore corrupt data */ }
  return DEFAULT_PREFS;
}

export function saveAppearancePrefs(staffName: string, prefs: AppearancePrefs) {
  try {
    const stored = localStorage.getItem(APPEARANCE_PREFS_KEY);
    const all = stored ? (JSON.parse(stored) as Record<string, AppearancePrefs>) : {};
    all[staffName] = prefs;
    localStorage.setItem(APPEARANCE_PREFS_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('appearance-prefs-changed'));
  } catch { /* ignore quota errors */ }
}
