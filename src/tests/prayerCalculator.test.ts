import { describe, it, expect } from 'vitest';
import {
  calculateDailySchedule,
  getNextPrayerInfo,
  formatCountdown,
  formatPrayerTime,
  getLocalDateString
} from '../services/prayerCalculator';
import { UserLocation, ManualAdjustments } from '../types';

describe('Prayer Calculator Service', () => {
  const dhakaLocation: UserLocation = {
    id: 'loc_dhaka',
    name: 'Dhaka, Bangladesh',
    latitude: 23.8103,
    longitude: 90.4125,
    timeZoneId: 'Asia/Dhaka',
    createdAt: '2026-01-01T00:00:00Z'
  };

  const zeroAdjustments: ManualAdjustments = {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0
  };

  it('calculates all five daily prayers in chronological order for Dhaka', () => {
    const localDate = '2026-10-10';
    const schedule = calculateDailySchedule(
      localDate,
      dhakaLocation,
      'Karachi',
      'Hanafi',
      zeroAdjustments
    );

    expect(schedule.times.fajr).toBeDefined();
    expect(schedule.times.dhuhr).toBeDefined();
    expect(schedule.times.asr).toBeDefined();
    expect(schedule.times.maghrib).toBeDefined();
    expect(schedule.times.isha).toBeDefined();

    const fajrTime = new Date(schedule.times.fajr.effectiveTime).getTime();
    const dhuhrTime = new Date(schedule.times.dhuhr.effectiveTime).getTime();
    const asrTime = new Date(schedule.times.asr.effectiveTime).getTime();
    const maghribTime = new Date(schedule.times.maghrib.effectiveTime).getTime();
    const ishaTime = new Date(schedule.times.isha.effectiveTime).getTime();

    expect(fajrTime).toBeLessThan(dhuhrTime);
    expect(dhuhrTime).toBeLessThan(asrTime);
    expect(asrTime).toBeLessThan(maghribTime);
    expect(maghribTime).toBeLessThan(ishaTime);
  });

  it('validates Hanafi vs Standard (Shafi) Asr calculation for Dhaka', () => {
    const localDate = '2026-10-10';
    const hanafiSchedule = calculateDailySchedule(
      localDate,
      dhakaLocation,
      'Karachi',
      'Hanafi',
      zeroAdjustments
    );
    const standardSchedule = calculateDailySchedule(
      localDate,
      dhakaLocation,
      'Karachi',
      'Standard',
      zeroAdjustments
    );

    const hanafiAsr = new Date(hanafiSchedule.times.asr.effectiveTime).getTime();
    const standardAsr = new Date(standardSchedule.times.asr.effectiveTime).getTime();

    // In Hanafi juristic method (shadow 2), Asr begins later than Standard (shadow 1)
    expect(hanafiAsr).toBeGreaterThan(standardAsr);

    const formattedHanafi = formatPrayerTime(hanafiSchedule.times.asr.effectiveTime, 'Asia/Dhaka');
    const formattedStandard = formatPrayerTime(standardSchedule.times.asr.effectiveTime, 'Asia/Dhaka');

    expect(formattedHanafi).toMatch(/3:59 PM|4:00 PM/);
    expect(formattedStandard).toMatch(/3:06 PM|3:07 PM/);
  });

  it('preserves baseTime while updating effectiveTime when manual adjustments are applied', () => {
    const localDate = '2026-10-10';
    const adjustments: ManualAdjustments = {
      fajr: 5,
      dhuhr: -2,
      asr: 0,
      maghrib: 3,
      isha: -4
    };

    const schedule = calculateDailySchedule(
      localDate,
      dhakaLocation,
      'Karachi',
      'Hanafi',
      adjustments
    );

    // Fajr +5 minutes
    const fajrBase = new Date(schedule.times.fajr.baseTime).getTime();
    const fajrEffective = new Date(schedule.times.fajr.effectiveTime).getTime();
    expect(fajrEffective - fajrBase).toBe(5 * 60 * 1000);
    expect(schedule.times.fajr.adjustmentMinutes).toBe(5);

    // Dhuhr -2 minutes
    const dhuhrBase = new Date(schedule.times.dhuhr.baseTime).getTime();
    const dhuhrEffective = new Date(schedule.times.dhuhr.effectiveTime).getTime();
    expect(dhuhrEffective - dhuhrBase).toBe(-2 * 60 * 1000);
    expect(schedule.times.dhuhr.adjustmentMinutes).toBe(-2);
  });

  it('determines the next prayer correctly between Dhuhr and Asr', () => {
    const today = '2026-10-10';
    const schedule = calculateDailySchedule(today, dhakaLocation, 'Karachi', 'Hanafi', zeroAdjustments);
    const tomorrowSchedule = calculateDailySchedule('2026-10-11', dhakaLocation, 'Karachi', 'Hanafi', zeroAdjustments);

    // Simulated time: 2:00 PM local Dhaka (08:00 UTC)
    const simulatedNow = new Date('2026-10-10T08:00:00.000Z');

    const nextInfo = getNextPrayerInfo(schedule, tomorrowSchedule, simulatedNow, 'Asia/Dhaka');
    expect(nextInfo.key).toBe('asr');
    expect(nextInfo.name).toBe('Asr');
    expect(nextInfo.isNextDay).toBe(false);
    expect(nextInfo.diffMs).toBeGreaterThan(0);
  });

  it('determines next prayer is tomorrow Fajr when all prayers today have passed', () => {
    const today = '2026-10-10';
    const schedule = calculateDailySchedule(today, dhakaLocation, 'Karachi', 'Hanafi', zeroAdjustments);
    const tomorrowSchedule = calculateDailySchedule('2026-10-11', dhakaLocation, 'Karachi', 'Hanafi', zeroAdjustments);

    // Simulated time: 10:00 PM local Dhaka (16:00 UTC, after Isha at ~12:52 UTC)
    const simulatedNow = new Date('2026-10-10T16:00:00.000Z');

    const nextInfo = getNextPrayerInfo(schedule, tomorrowSchedule, simulatedNow, 'Asia/Dhaka');
    expect(nextInfo.key).toBe('fajr');
    expect(nextInfo.name).toBe('Fajr');
    expect(nextInfo.isNextDay).toBe(true);
    expect(nextInfo.diffMs).toBeGreaterThan(0);
  });

  it('formats countdown with tabular HH:MM:SS format and never yields negative values', () => {
    expect(formatCountdown(1, 24, 18)).toBe('01:24:18');
    expect(formatCountdown(0, 5, 9)).toBe('00:05:09');
    expect(formatCountdown(0, 0, 0)).toBe('00:00:00');
  });

  it('formats local date string correctly for different timezones', () => {
    const utcDate = new Date('2026-10-10T19:30:00.000Z');
    // At 19:30 UTC on Oct 10, in Dhaka (+6) it is 01:30 AM Oct 11!
    const dhakaDate = getLocalDateString(utcDate, 'Asia/Dhaka');
    expect(dhakaDate).toBe('2026-10-11');

    // In New York (-4), it is 15:30 Oct 10!
    const nyDate = getLocalDateString(utcDate, 'America/New_York');
    expect(nyDate).toBe('2026-10-10');
  });

  it('calculates sunrise and sunset times without mixing them into the five prayers', () => {
    const localDate = '2026-10-11';
    const schedule = calculateDailySchedule(
      localDate,
      dhakaLocation,
      'Karachi',
      'Hanafi',
      zeroAdjustments
    );

    expect(schedule.sunrise).toBeDefined();
    expect(schedule.sunset).toBeDefined();

    const formattedSunrise = formatPrayerTime(schedule.sunrise!, 'Asia/Dhaka');
    const formattedSunset = formatPrayerTime(schedule.sunset!, 'Asia/Dhaka');

    expect(formattedSunrise).toMatch(/5:54 AM|5:55 AM/);
    expect(formattedSunset).toMatch(/5:36 PM|5:37 PM/);

    // Sunrise should occur after Fajr and before Dhuhr
    const fajrMs = new Date(schedule.times.fajr.effectiveTime).getTime();
    const sunriseMs = new Date(schedule.sunrise!).getTime();
    const dhuhrMs = new Date(schedule.times.dhuhr.effectiveTime).getTime();

    expect(sunriseMs).toBeGreaterThan(fajrMs);
    expect(sunriseMs).toBeLessThan(dhuhrMs);
  });
});
