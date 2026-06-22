/** Curated from Unsplash (https://unsplash.com) — free to use via Unsplash CDN */

export interface DashboardImageOption {
  id: string;
  label: string;
  photoId: string;
  source: 'unsplash';
}

export const DASHBOARD_IMAGES: DashboardImageOption[] = [
  { id: 'aurora', label: 'Aurora', photoId: 'photo-1557683316-973673baf926', source: 'unsplash' },
  { id: 'mesh', label: 'Color Mesh', photoId: 'photo-1579546929518-9e396f3cc809', source: 'unsplash' },
  { id: 'purple-flow', label: 'Purple Flow', photoId: 'photo-1557682250-33bd709cbe85', source: 'unsplash' },
  { id: 'pastel-shapes', label: 'Pastel Shapes', photoId: 'photo-1618005182384-a83a8bd57fbe', source: 'unsplash' },
  { id: 'neon-gradient', label: 'Neon Gradient', photoId: 'photo-1620641788421-7a1c342ea42e', source: 'unsplash' },
  { id: 'alpine', label: 'Alpine', photoId: 'photo-1519681393784-d120267933ba', source: 'unsplash' },
  { id: 'green-bokeh', label: 'Green Bokeh', photoId: 'photo-1501594907352-04cda38ebc29', source: 'unsplash' },
  { id: 'workspace', label: 'Light Workspace', photoId: 'photo-1497366216548-37526070297c', source: 'unsplash' },
  { id: 'blue-glow', label: 'Blue Glow', photoId: 'photo-1550684848-fac1c5b4e853', source: 'unsplash' },
  { id: 'green-hills', label: 'Green Hills', photoId: 'photo-1501854140801-50d01698950b', source: 'unsplash' },
  { id: 'misty-peaks', label: 'Misty Peaks', photoId: 'photo-1506905925346-21bda4d32df4', source: 'unsplash' },
  { id: 'still-lake', label: 'Still Lake', photoId: 'photo-1439066615861-d1af74d74000', source: 'unsplash' },
];

export const DEFAULT_DASHBOARD_IMAGE_ID = DASHBOARD_IMAGES[0].id;

function buildUnsplashUrl(photoId: string, width: number, quality = 80): string {
  return `https://images.unsplash.com/${photoId}?w=${width}&q=${quality}&auto=format&fit=crop`;
}

export function getDashboardImageSrc(imageId?: string, width = 1920): string {
  const match = DASHBOARD_IMAGES.find((image) => image.id === imageId);
  const photoId = match?.photoId ?? DASHBOARD_IMAGES[0].photoId;
  return buildUnsplashUrl(photoId, width);
}

export function getDashboardImageThumb(imageId: string, width = 320): string {
  return getDashboardImageSrc(imageId, width);
}

/** Maps legacy saved image ids to current ids after photo replacements. */
const LEGACY_IMAGE_IDS: Record<string, string> = {
  'soft-waves': 'purple-flow',
  'pink-mist': 'neon-gradient',
  'blue-haze': 'blue-glow',
  sand: 'green-hills',
  clouds: 'misty-peaks',
  paper: 'still-lake',
};

export function resolveDashboardImageId(imageId?: string): string {
  if (!imageId) return DEFAULT_DASHBOARD_IMAGE_ID;
  if (DASHBOARD_IMAGES.some((image) => image.id === imageId)) return imageId;
  return LEGACY_IMAGE_IDS[imageId] ?? DEFAULT_DASHBOARD_IMAGE_ID;
}
