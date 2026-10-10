import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActiveScreen,
  UserSettings,
  UserLocation,
  DailySchedule,
  PrayerLog,
  PrayerKey,
  NextPrayerInfo,
  ThemeOption
} from '../types';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredLocation,
  getAllStoredLocations,
  saveStoredLocation,
  clearAllLocalData,
  exportAllLocalData
} from '../services/storage/db';
import {
  loadDayData,
  recordPrayerCompletion
} from '../services/scheduleService';
import {
  getLocalDateString,
  getNextPrayerInfo
} from '../services/prayerCalculator';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { HomeScreen } from '../features/home/HomeScreen';
import { HistoryScreen } from '../features/history/HistoryScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import '../styles/global.css';
import '../styles/components.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [allLocations, setAllLocations] = useState<UserLocation[]>([]);
  const [todayLocalDate, setTodayLocalDate] = useState<string>('');
  const [schedule, setSchedule] = useState<DailySchedule | null>(null);
  const [tomorrowSchedule, setTomorrowSchedule] = useState<DailySchedule | null>(null);
  const [logs, setLogs] = useState<Record<PrayerKey, PrayerLog>>({} as Record<PrayerKey, PrayerLog>);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Apply theme to document
  useEffect(() => {
    if (settings?.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings?.theme]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA install prompt capture
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const pEvent = e as BeforeInstallPromptEvent;
      deferredPromptRef.current = pEvent;
      setInstallPrompt(pEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Initial load
  const reloadData = useCallback(async () => {
    try {
      const storedSettings = await getStoredSettings();
      const storedLoc = await getStoredLocation(storedSettings.locationId);
      const locList = await getAllStoredLocations();

      if (!storedLoc) return;

      const localDate = getLocalDateString(new Date(), storedLoc.timeZoneId);
      const dayData = await loadDayData(localDate, storedLoc, storedSettings);

      setSettings(storedSettings);
      setLocation(storedLoc);
      setAllLocations(locList);
      setTodayLocalDate(localDate);
      setSchedule(dayData.schedule);
      setTomorrowSchedule(dayData.tomorrowSchedule);
      setLogs(dayData.logs);
      setNextPrayer(dayData.nextPrayer);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Foreground countdown timer (1s tick) & midnight rollover check
  useEffect(() => {
    if (!schedule || !tomorrowSchedule || !location) return;

    const timer = setInterval(() => {
      const now = new Date();
      // Check if midnight date transition occurred
      const currentLocDate = getLocalDateString(now, location.timeZoneId);
      if (currentLocDate !== todayLocalDate) {
        setTodayLocalDate(currentLocDate);
        reloadData();
        return;
      }

      // Live tick next prayer
      const updated = getNextPrayerInfo(schedule, tomorrowSchedule, now, location.timeZoneId);
      setNextPrayer(updated);
    }, 1000);

    return () => clearInterval(timer);
  }, [schedule, tomorrowSchedule, location, todayLocalDate, reloadData]);

  // Handle toggling prayer completion for today
  const handleTogglePrayer = async (prayer: PrayerKey) => {
    if (!todayLocalDate || !logs) return;
    const currentCompleted = logs[prayer]?.completed ?? false;
    const updated = await recordPrayerCompletion(todayLocalDate, prayer, !currentCompleted);

    setLogs((prev) => ({
      ...prev,
      [prayer]: updated
    }));
  };

  // Update Settings
  const handleUpdateSettings = async (newSettings: UserSettings) => {
    await saveStoredSettings(newSettings);
    setSettings(newSettings);
    if (location && todayLocalDate) {
      const dayData = await loadDayData(todayLocalDate, location, newSettings);
      setSchedule(dayData.schedule);
      setTomorrowSchedule(dayData.tomorrowSchedule);
      setNextPrayer(dayData.nextPrayer);
    }
  };

  // Select Location
  const handleSelectLocation = async (newLoc: UserLocation) => {
    if (!settings) return;
    const updatedSettings: UserSettings = {
      ...settings,
      locationId: newLoc.id
    };
    await saveStoredSettings(updatedSettings);
    setSettings(updatedSettings);
    setLocation(newLoc);

    const newLocalDate = getLocalDateString(new Date(), newLoc.timeZoneId);
    setTodayLocalDate(newLocalDate);

    const dayData = await loadDayData(newLocalDate, newLoc, updatedSettings);
    setSchedule(dayData.schedule);
    setTomorrowSchedule(dayData.tomorrowSchedule);
    setLogs(dayData.logs);
    setNextPrayer(dayData.nextPrayer);
  };

  // Save Custom Location
  const handleSaveCustomLocation = async (customLoc: UserLocation) => {
    await saveStoredLocation(customLoc);
    const locList = await getAllStoredLocations();
    setAllLocations(locList);
    await handleSelectLocation(customLoc);
  };

  // Reset Data
  const handleResetAllData = async () => {
    await clearAllLocalData();
    await reloadData();
  };

  // Export Data
  const handleExportData = async () => {
    const jsonStr = await exportAllLocalData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `miqat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Cycle Theme
  const handleCycleTheme = async () => {
    if (!settings) return;
    const nextTheme: ThemeOption =
      settings.theme === 'dark' ? 'light' : settings.theme === 'light' ? 'system' : 'dark';
    await handleUpdateSettings({ ...settings, theme: nextTheme });
  };

  // PWA Install prompt trigger
  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  if (isLoading || !settings || !location) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center' }}>
        <div style={{ color: 'var(--color-sage-soft)', fontSize: '15px', letterSpacing: '1px' }}>
          Loading Miqat...
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-container">
        {/* Offline notification banner if offline */}
        {isOffline && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--color-surface-raised)',
              borderBottom: '1px solid var(--color-border)',
              color: 'var(--color-warning)',
              fontSize: '11px',
              textAlign: 'center',
              fontWeight: 500
            }}
          >
            Offline mode · Using cached schedules and local storage
          </div>
        )}

        {/* Polite PWA Install Banner */}
        {installPrompt && (
          <div
            style={{
              padding: '10px 16px',
              margin: '8px 16px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--color-text)' }}>
              Install Miqat for quick home-screen access
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ minHeight: '30px', padding: '0 12px', fontSize: '11px', width: 'auto' }}
              onClick={handleInstallClick}
            >
              Install
            </button>
          </div>
        )}

        {/* Global Brand Header */}
        <div style={{ padding: '20px 20px 0 20px' }}>
          <Header theme={settings.theme} onCycleTheme={handleCycleTheme} />
        </div>

        {/* Screen Routing */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeScreen === 'home' && (
            <HomeScreen
              schedule={schedule}
              nextPrayer={nextPrayer}
              logs={logs}
              location={location}
              localDate={todayLocalDate}
              onTogglePrayer={handleTogglePrayer}
              onNavigateToSettings={() => setActiveScreen('settings')}
            />
          )}

          {activeScreen === 'history' && (
            <HistoryScreen
              location={location}
              settings={settings}
              todayLocalDate={todayLocalDate}
              onNavigateToHome={() => setActiveScreen('home')}
            />
          )}

          {activeScreen === 'settings' && (
            <SettingsScreen
              settings={settings}
              location={location}
              allLocations={allLocations}
              onUpdateSettings={handleUpdateSettings}
              onSelectLocation={handleSelectLocation}
              onSaveCustomLocation={handleSaveCustomLocation}
              onResetAllData={handleResetAllData}
              onExportData={handleExportData}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeScreen={activeScreen}
          onSelectScreen={(scr) => setActiveScreen(scr)}
        />
      </div>
    </div>
  );
};
export default App;
