export async function fetchClientIp(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      return data.ip || 'Unknown';
    }
  } catch { /* offline or blocked */ }
  return 'Unknown';
}
