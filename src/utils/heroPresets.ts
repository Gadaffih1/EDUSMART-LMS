export interface HeroVideoPreset {
  id: string;
  label: string;
  durationLabel: string;
  durationSeconds: number;
  url: string;
  poster: string;
  category: string;
  description: string;
}

export interface HeroImagePreset {
  id: string;
  label: string;
  url: string;
  description: string;
}

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listHeroVideoPresets(): HeroVideoPreset[] {
  return readList<HeroVideoPreset>('edusmart_hero_video_presets_v1');
}

export function listHeroImagePresets(): HeroImagePreset[] {
  return readList<HeroImagePreset>('edusmart_hero_image_presets_v1');
}
