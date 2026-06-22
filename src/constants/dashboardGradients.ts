/** Curated from uiGradients (https://github.com/ghosh/uiGradients) — MIT community collection */

export interface DashboardGradientOption {
  id: string;
  label: string;
  colors: string[];
  source: 'uiGradients';
}

export const DASHBOARD_GRADIENTS: DashboardGradientOption[] = [
  { id: 'clouds', label: 'Clouds', colors: ['#ECE9E6', '#FFFFFF'], source: 'uiGradients' },
  { id: 'summer-breeze', label: 'Summer Breeze', colors: ['#fbed96', '#abecd6'], source: 'uiGradients' },
  { id: 'windy', label: 'Windy', colors: ['#acb6e5', '#86fde8'], source: 'uiGradients' },
  { id: 'anamnisar', label: 'Anamnisar', colors: ['#9796f0', '#fbc7d4'], source: 'uiGradients' },
  { id: 'moonrise', label: 'Moonrise', colors: ['#DAE2F8', '#D6A4A4'], source: 'uiGradients' },
  { id: 'cool-blues', label: 'Cool Blues', colors: ['#2193b0', '#6dd5ed'], source: 'uiGradients' },
  { id: 'mild', label: 'Mild', colors: ['#67B26F', '#4ca2cd'], source: 'uiGradients' },
  { id: 'limeade', label: 'Limeade', colors: ['#A1FFCE', '#FAFFD1'], source: 'uiGradients' },
  { id: 'piggy-pink', label: 'Piggy Pink', colors: ['#ee9ca7', '#ffdde1'], source: 'uiGradients' },
  { id: 'dania', label: 'Dania', colors: ['#BE93C5', '#7BC6CC'], source: 'uiGradients' },
  { id: 'peach-sea', label: 'Peach Sea', colors: ['#E6AE8C', '#A8CECF'], source: 'uiGradients' },
  { id: 'megatron', label: 'MegaTron', colors: ['#C6FFDD', '#FBD786', '#f7797d'], source: 'uiGradients' },
];

export const DEFAULT_DASHBOARD_GRADIENT_ID = DASHBOARD_GRADIENTS[0].id;

function colorStops(colors: string[]): string {
  if (colors.length === 1) return `${colors[0]} 0%, ${colors[0]} 100%`;
  return colors
    .map((color, index) => `${color} ${(index / (colors.length - 1)) * 100}%`)
    .join(', ');
}

export function getDashboardGradientCss(gradientId?: string): string {
  const match = DASHBOARD_GRADIENTS.find((gradient) => gradient.id === gradientId);
  const colors = match?.colors ?? DASHBOARD_GRADIENTS[0].colors;
  return `linear-gradient(135deg, ${colorStops(colors)})`;
}
