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

import { DEFAULT_HERO_VIDEO_PRESETS, DEFAULT_HERO_IMAGE_PRESETS } from '../data/heroMediaPresets';

export function listHeroVideoPresets(): HeroVideoPreset[] {
  const list = readList<HeroVideoPreset>('edusmart_hero_video_presets_v1');
  return list.length > 0 ? list : DEFAULT_HERO_VIDEO_PRESETS;
}

export function listHeroImagePresets(): HeroImagePreset[] {
  const list = readList<HeroImagePreset>('edusmart_hero_image_presets_v1');
  return list.length > 0 ? list : DEFAULT_HERO_IMAGE_PRESETS;
}
