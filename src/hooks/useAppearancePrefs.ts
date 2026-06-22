import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_DASHBOARD_GRADIENT_ID } from '../constants/dashboardGradients';
import { DEFAULT_DASHBOARD_IMAGE_ID } from '../constants/dashboardImages';
import { DEFAULT_DASHBOARD_VIDEO_ID } from '../constants/dashboardVideos';
import {
  AppearancePrefs,
  DashboardBackgroundMode,
  loadAppearancePrefs,
  saveAppearancePrefs,
} from '../utils/appearancePrefs';

const FALLBACK_PREFS: AppearancePrefs = {
  dashboardBackground: 'video',
  dashboardVideoId: DEFAULT_DASHBOARD_VIDEO_ID,
  dashboardGradientId: DEFAULT_DASHBOARD_GRADIENT_ID,
  dashboardImageId: DEFAULT_DASHBOARD_IMAGE_ID,
};

export function useAppearancePrefs() {
  const { currentUser } = useAuth();
  const staffName = currentUser?.name ?? '';

  const [prefs, setPrefs] = useState<AppearancePrefs>(() =>
    staffName ? loadAppearancePrefs(staffName) : FALLBACK_PREFS
  );

  useEffect(() => {
    if (staffName) {
      setPrefs(loadAppearancePrefs(staffName));
    }
  }, [staffName]);

  useEffect(() => {
    const handleChange = () => {
      if (staffName) {
        setPrefs(loadAppearancePrefs(staffName));
      }
    };
    window.addEventListener('appearance-prefs-changed', handleChange);
    return () => window.removeEventListener('appearance-prefs-changed', handleChange);
  }, [staffName]);

  const setDashboardBackground = useCallback(
    (mode: DashboardBackgroundMode) => {
      if (!staffName) return;
      const next: AppearancePrefs = {
        ...prefs,
        dashboardBackground: mode,
        dashboardVideoId: prefs.dashboardVideoId || DEFAULT_DASHBOARD_VIDEO_ID,
        dashboardGradientId: prefs.dashboardGradientId || DEFAULT_DASHBOARD_GRADIENT_ID,
        dashboardImageId: prefs.dashboardImageId || DEFAULT_DASHBOARD_IMAGE_ID,
      };
      saveAppearancePrefs(staffName, next);
      setPrefs(next);
    },
    [staffName, prefs]
  );

  const setDashboardVideo = useCallback(
    (videoId: string) => {
      if (!staffName) return;
      const next: AppearancePrefs = {
        ...prefs,
        dashboardBackground: 'video',
        dashboardVideoId: videoId,
      };
      saveAppearancePrefs(staffName, next);
      setPrefs(next);
    },
    [staffName, prefs]
  );

  const setDashboardGradient = useCallback(
    (gradientId: string) => {
      if (!staffName) return;
      const next: AppearancePrefs = {
        ...prefs,
        dashboardBackground: 'gradient',
        dashboardGradientId: gradientId,
      };
      saveAppearancePrefs(staffName, next);
      setPrefs(next);
    },
    [staffName, prefs]
  );

  const setDashboardImage = useCallback(
    (imageId: string) => {
      if (!staffName) return;
      const next: AppearancePrefs = {
        ...prefs,
        dashboardBackground: 'image',
        dashboardImageId: imageId,
      };
      saveAppearancePrefs(staffName, next);
      setPrefs(next);
    },
    [staffName, prefs]
  );

  return { ...prefs, setDashboardBackground, setDashboardVideo, setDashboardGradient, setDashboardImage };
}
