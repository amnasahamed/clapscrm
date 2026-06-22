export interface DashboardVideoOption {
  id: string;
  label: string;
  src: string;
}

export const DASHBOARD_VIDEOS: DashboardVideoOption[] = [
  {
    id: '9e9d7f84',
    label: 'Gradient 1',
    src: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4',
  },
  {
    id: '8a9ccda6',
    label: 'Gradient 2',
    src: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4',
  },
  {
    id: 'f2ca2a28',
    label: 'Gradient 3',
    src: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4',
  },
  {
    id: '283f3553',
    label: 'Gradient 4',
    src: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4',
  },
  {
    id: 'c4e32401',
    label: 'Gradient 5',
    src: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4',
  },
  {
    id: 'bcdaa3b4',
    label: 'Gradient 6',
    src: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4',
  },
];

export const DEFAULT_DASHBOARD_VIDEO_ID = DASHBOARD_VIDEOS[0].id;

export function getDashboardVideoSrc(videoId?: string): string {
  const match = DASHBOARD_VIDEOS.find((video) => video.id === videoId);
  return match?.src ?? DASHBOARD_VIDEOS[0].src;
}
