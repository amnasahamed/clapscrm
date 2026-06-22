import { COUNTRIES } from '../types';

export interface ParsedPhone {
  dialCode: string;
  phone: string;
  country: string;
}

export function parseStoredPhone(phone: string, fallbackCountry = 'IN'): ParsedPhone {
  const trimmed = phone.trim();
  const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

  for (const country of sortedCountries) {
    if (trimmed.startsWith(country.dialCode)) {
      return {
        dialCode: country.dialCode,
        phone: trimmed.substring(country.dialCode.length).trim(),
        country: country.isoCode,
      };
    }
  }

  const countryEntry = COUNTRIES.find((c) => c.isoCode === fallbackCountry);
  return {
    dialCode: countryEntry?.dialCode ?? '+91',
    phone: trimmed.replace(/^\+\d+\s*/, ''),
    country: fallbackCountry,
  };
}

export function formatStoredPhone(dialCode: string, phone: string): string {
  return `${dialCode} ${phone}`.trim();
}

export function getFullPhoneDigits(dialCode: string, phone: string): string {
  return (dialCode + phone).replace(/\D/g, '');
}

export function detectPhoneInput(
  val: string,
  fallback: { dialCode: string; country: string }
): ParsedPhone {
  const cleanedVal = val.trim();

  if (cleanedVal.startsWith('+')) {
    const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const country of sortedCountries) {
      if (cleanedVal.startsWith(country.dialCode)) {
        return {
          dialCode: country.dialCode,
          country: country.isoCode,
          phone: cleanedVal.substring(country.dialCode.length).trim(),
        };
      }
    }
  }

  return {
    dialCode: fallback.dialCode,
    country: fallback.country,
    phone: val,
  };
}
