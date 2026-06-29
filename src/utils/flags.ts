export const getCountryFlag = (countryCode: string | undefined): string => {
  if (!countryCode) return '🌐';
  const flags: Record<string, string> = {
    AE: '🇦🇪',
    SA: '🇸🇦',
    QA: '🇶🇦',
    KW: '🇰🇼',
    OM: '🇴🇲',
    BH: '🇧🇭',
    IN: '🇮🇳',
    UK: '🇬🇧',
    US: '🇺🇸',
  };
  return flags[countryCode.toUpperCase()] || '🌐';
};
