import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = "qg:geocode-cache";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface GeoResult {
  lat: number;
  lng: number;
  ts: number;
}

function getCache(): Record<string, GeoResult> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setCache(cache: Record<string, GeoResult>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* quota exceeded */ }
}

/**
 * Geocode an address using Nominatim via edge function.
 * Results are cached in localStorage for 7 days.
 */
export async function geocodeAddress(
  address: string,
  city?: string,
  state?: string
): Promise<{ lat: number; lng: number } | null> {
  const key = `${address}|${city || ""}|${state || ""}`.toLowerCase();
  
  const cache = getCache();
  const cached = cache[key];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return { lat: cached.lat, lng: cached.lng };
  }

  try {
    const { data, error } = await supabase.functions.invoke("geocode", {
      body: { address, city, state },
    });

    if (error || !data?.found) return null;

    // Store in cache
    cache[key] = { lat: data.lat, lng: data.lng, ts: Date.now() };
    
    // Prune old entries (keep max 500)
    const entries = Object.entries(cache);
    if (entries.length > 500) {
      entries.sort((a, b) => a[1].ts - b[1].ts);
      const pruned = Object.fromEntries(entries.slice(-400));
      setCache(pruned);
    } else {
      setCache(cache);
    }

    return { lat: data.lat, lng: data.lng };
  } catch {
    return null;
  }
}

/**
 * Reverse geocode: convert lat/lng to address using Nominatim directly.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ bairro: string; rua: string; cidade: string; estado: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "QGDigital/1.0 (contact@qgdigital.app)",
          "Accept-Language": "pt-BR",
        },
      }
    );
    const data = await res.json();
    if (!data?.address) return null;

    const addr = data.address;
    return {
      bairro: addr.suburb || addr.neighbourhood || addr.city_district || "",
      rua: [addr.road, addr.house_number].filter(Boolean).join(", "),
      cidade: addr.city || addr.town || addr.village || addr.municipality || "",
      estado: addr.state || "",
    };
  } catch {
    return null;
  }
}

/**
 * Get current GPS position from the browser.
 */
export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização não suportada neste navegador."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error("Permissão de localização negada. Ative nas configurações do navegador."));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error("Posição indisponível. Verifique o GPS."));
            break;
          case err.TIMEOUT:
            reject(new Error("Tempo esgotado ao obter localização."));
            break;
          default:
            reject(new Error("Erro ao obter localização."));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}
