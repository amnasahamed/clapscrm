/** Layered z-index for overlays — higher = on top */
export const Z = {
  /** Bottom nav, FAB */
  chrome: 40,
  /** Command palette, profile dropdown */
  dropdown: 100,
  /** Bottom sheets, filters, lead detail */
  sheet: 110,
  /** Forms opened from a sheet (schedule, transfer) */
  nested: 120,
  /** Destructive confirmations — always topmost */
  confirm: 130,
} as const;
