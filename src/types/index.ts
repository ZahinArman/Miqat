export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerDefinition {
  key: PrayerKey;
  name: string;
  arabicName: string;
}

export const PRAYER_DEFINITIONS: PrayerDefinition[] = [
  { key: 'fajr', name: 'Fajr', arabicName: 'الفجر' },
  { key: 'dhuhr', name: 'Dhuhr', arabicName: 'الظهر' },
  { key: 'asr', name: 'Asr', arabicName: 'العصر' },
  { key: 'maghrib', name: 'Maghrib', arabicName: 'المغرب' },
  { key: 'isha', name: 'Isha', arabicName: 'العشاء' }
];

export type ThemeOption = 'dark' | 'light' | 'system';
export type AsrMethod = 'Standard' | 'Hanafi';

export interface UserLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timeZoneId: string;
  isCustom?: boolean;
  createdAt: string;
}

export interface ManualAdjustments {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface UserSettings {
  id: string;
  theme: ThemeOption;
  locationId: string;
  calculationMethod: string;
  asrMethod: AsrMethod;
  manualAdjustments: ManualAdjustments;
  updatedAt: string;
}

export interface PrayerTimeItem {
  id: string;
  scheduleId: string;
  prayer: PrayerKey;
  baseTime: string; // ISO 8601 string
  adjustmentMinutes: number;
  effectiveTime: string; // ISO 8601 string
}

export interface DailySchedule {
  id: string;
  localDate: string; // YYYY-MM-DD
  locationId: string;
  calculationMethod: string;
  asrMethod: AsrMethod;
  generatedAt: string;
  times: Record<PrayerKey, PrayerTimeItem>;
}

export interface PrayerLog {
  id: string; // localDate_prayer
  localDate: string; // YYYY-MM-DD
  prayer: PrayerKey;
  completed: boolean;
  completedAt: string | null; // ISO string
}

export interface NextPrayerInfo {
  key: PrayerKey;
  name: string;
  effectiveDate: Date;
  timeString: string;
  diffMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  progressPercent: number; // 0 to 100 within current prayer window
  isNextDay?: boolean;
}

export type ActiveScreen = 'home' | 'history' | 'settings';
