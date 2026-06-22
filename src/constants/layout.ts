/** Height of fixed bottom tab bar (excluding safe area) */
export const MOBILE_NAV_HEIGHT = 64;

/** FAB sits above bottom nav + gap */
export const MOBILE_FAB_BOTTOM = `calc(${MOBILE_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 16px)`;

/** Bulk action bar above FAB */
export const MOBILE_BULK_BAR_BOTTOM = `calc(${MOBILE_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 80px)`;

/** Main content bottom padding when bottom nav is visible */
export const MOBILE_CONTENT_PB = `calc(${MOBILE_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 8px)`;
