import React, { useState } from 'react';
import {
  UserSettings,
  UserLocation,
  ThemeOption,
  AsrMethod,
  PrayerKey,
  PRAYER_DEFINITIONS
} from '../../types';
import { CALCULATION_METHODS } from '../../services/prayerCalculator';
import { Modal } from '../../components/Modal';

interface SettingsScreenProps {
  settings: UserSettings;
  location: UserLocation;
  allLocations: UserLocation[];
  onUpdateSettings: (newSettings: UserSettings) => Promise<void>;
  onSelectLocation: (loc: UserLocation) => Promise<void>;
  onSaveCustomLocation: (loc: UserLocation) => Promise<void>;
  onResetAllData: () => Promise<void>;
  onExportData: () => Promise<void>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  location,
  allLocations,
  onUpdateSettings,
  onSelectLocation,
  onSaveCustomLocation,
  onResetAllData,
  onExportData
}) => {
  // Modal states
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isAsrModalOpen, setIsAsrModalOpen] = useState(false);
  const [isCustomLocModalOpen, setIsCustomLocModalOpen] = useState(false);
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');

  // Custom location form state
  const [customName, setCustomName] = useState('');
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');
  const [customTz, setCustomTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Filter locations
  const filteredLocations = allLocations.filter((loc) =>
    loc.name.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  // Method details
  const activeMethod = CALCULATION_METHODS.find((m) => m.id === settings.calculationMethod) || CALCULATION_METHODS[0];

  // Adjustments handler
  const handleAdjustmentChange = async (prayer: PrayerKey, delta: number) => {
    const currentVal = settings.manualAdjustments[prayer] ?? 0;
    const newVal = currentVal + delta;
    const updated: UserSettings = {
      ...settings,
      manualAdjustments: {
        ...settings.manualAdjustments,
        [prayer]: newVal
      }
    };
    await onUpdateSettings(updated);
  };

  const handleResetAdjustments = async () => {
    const updated: UserSettings = {
      ...settings,
      manualAdjustments: {
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0
      }
    };
    await onUpdateSettings(updated);
  };

  // Theme change
  const handleThemeSelect = async (theme: ThemeOption) => {
    const updated: UserSettings = { ...settings, theme };
    await onUpdateSettings(updated);
  };

  // Device GPS handler
  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGpsLoading(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const newLoc: UserLocation = {
          id: `loc_custom_${Date.now()}`,
          name: 'Current Device Location',
          latitude: lat,
          longitude: lon,
          timeZoneId: tz,
          isCustom: true,
          createdAt: new Date().toISOString()
        };
        await onSaveCustomLocation(newLoc);
        setIsLocationModalOpen(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(err.message || 'Unable to retrieve your location.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Save custom coordinates
  const handleSaveCustomCoordForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      alert('Please enter a valid latitude between -90 and 90');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      alert('Please enter a valid longitude between -180 and 180');
      return;
    }

    const newLoc: UserLocation = {
      id: `loc_custom_${Date.now()}`,
      name: customName.trim() || `Custom (${lat}, ${lon})`,
      latitude: lat,
      longitude: lon,
      timeZoneId: customTz.trim() || 'UTC',
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    await onSaveCustomLocation(newLoc);
    setIsCustomLocModalOpen(false);
    setIsLocationModalOpen(false);
  };

  return (
    <div className="screen-content">
      <h1 className="screen-title">Settings</h1>
      <p className="screen-subtitle">Make prayer times fit your trusted method.</p>

      {/* 1. LOCATION */}
      <h2 className="settings-group-label">LOCATION</h2>
      <div className="settings-card">
        <button
          type="button"
          className="settings-row clickable"
          onClick={() => setIsLocationModalOpen(true)}
          aria-label={`Selected location: ${location.name}. Tap to change.`}
        >
          <div>
            <div className="settings-row-label">Selected location</div>
            <div className="settings-row-value">{location.name}</div>
          </div>
          <span className="settings-chevron" aria-hidden="true">›</span>
        </button>
      </div>

      {/* 2. CALCULATION */}
      <h2 className="settings-group-label">CALCULATION</h2>
      <div className="settings-card">
        <button
          type="button"
          className="settings-row clickable"
          onClick={() => setIsMethodModalOpen(true)}
          aria-label={`Calculation method: ${activeMethod.name}. Tap to change.`}
        >
          <div>
            <div className="settings-row-label">Calculation method</div>
            <div className="settings-row-value">{activeMethod.name}</div>
          </div>
          <span className="settings-chevron" aria-hidden="true">›</span>
        </button>

        <button
          type="button"
          className="settings-row clickable"
          onClick={() => setIsAsrModalOpen(true)}
          aria-label={`Asr juristic method: ${settings.asrMethod}. Tap to change.`}
        >
          <div>
            <div className="settings-row-label">Asr juristic method</div>
            <div className="settings-row-value">
              {settings.asrMethod === 'Hanafi' ? 'Hanafi (Shadow ratio 2)' : 'Standard / Shafi (Shadow ratio 1)'}
            </div>
          </div>
          <span className="settings-chevron" aria-hidden="true">›</span>
        </button>
      </div>

      {/* 3. MANUAL ADJUSTMENTS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 className="settings-group-label">MANUAL ADJUSTMENTS</h2>
        <button
          type="button"
          onClick={handleResetAdjustments}
          style={{ fontSize: '11px', color: 'var(--color-sage-soft)', cursor: 'pointer', padding: '4px' }}
        >
          Reset to zero
        </button>
      </div>
      <div className="settings-card">
        {PRAYER_DEFINITIONS.map((pDef) => {
          const adj = settings.manualAdjustments[pDef.key] ?? 0;
          const sign = adj > 0 ? '+' : '';
          return (
            <div key={pDef.key} className="adjustment-row">
              <span className="settings-row-label">{pDef.name}</span>
              <div className="adjust-stepper">
                <button
                  type="button"
                  className="adjust-btn"
                  onClick={() => handleAdjustmentChange(pDef.key, -1)}
                  aria-label={`Decrease ${pDef.name} adjustment by 1 minute`}
                >
                  −
                </button>
                <span className="adjust-value">{sign}{adj} min</span>
                <button
                  type="button"
                  className="adjust-btn"
                  onClick={() => handleAdjustmentChange(pDef.key, 1)}
                  aria-label={`Increase ${pDef.name} adjustment by 1 minute`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. APPEARANCE */}
      <h2 className="settings-group-label">APPEARANCE</h2>
      <div className="settings-card">
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Theme</div>
            <div className="settings-row-value">
              {settings.theme === 'dark' ? 'Dark (Default)' : settings.theme === 'light' ? 'Light' : 'System theme'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['dark', 'light', 'system'] as ThemeOption[]).map((thm) => (
              <button
                key={thm}
                type="button"
                className="btn-secondary"
                style={{
                  minHeight: '32px',
                  padding: '0 10px',
                  fontSize: '12px',
                  backgroundColor: settings.theme === thm ? 'var(--color-sage)' : 'var(--color-surface-raised)',
                  color: settings.theme === thm ? 'var(--color-bg)' : 'var(--color-text)'
                }}
                onClick={() => handleThemeSelect(thm)}
              >
                {thm.charAt(0).toUpperCase() + thm.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. DATA & PRIVACY */}
      <h2 className="settings-group-label">DATA & PRIVACY</h2>
      <div className="settings-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
          Miqat V1 operates 100% locally on your device. Your prayer completions and preferences are stored only inside your browser’s IndexedDB. No accounts, cloud tracking, or remote servers.
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onExportData}
            style={{ flex: 1 }}
          >
            Export JSON Backup
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => setIsResetConfirmModalOpen(true)}
            style={{ flex: 1 }}
          >
            Reset All Data
          </button>
        </div>
      </div>

      {/* MODAL: LOCATION SELECTOR */}
      <Modal
        isOpen={isLocationModalOpen}
        title="Select Location"
        onClose={() => setIsLocationModalOpen(false)}
      >
        <button
          type="button"
          className="btn-secondary"
          onClick={handleUseDeviceLocation}
          disabled={gpsLoading}
          style={{ marginBottom: '8px' }}
        >
          {gpsLoading ? 'Detecting device location...' : '📍 Use Current GPS Location'}
        </button>

        {gpsError && (
          <p style={{ color: 'var(--color-danger)', fontSize: '12px', marginBottom: '8px' }}>
            {gpsError}
          </p>
        )}

        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setIsLocationModalOpen(false);
            setIsCustomLocModalOpen(true);
          }}
          style={{ marginBottom: '12px' }}
        >
          ✏️ Enter Custom Coordinates
        </button>

        <input
          type="search"
          className="text-input"
          placeholder="Search pre-configured cities..."
          value={locationSearchQuery}
          onChange={(e) => setLocationSearchQuery(e.target.value)}
        />

        <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
          {filteredLocations.map((loc) => {
            const isSelected = loc.id === location.id;
            return (
              <button
                key={loc.id}
                type="button"
                className="settings-row clickable"
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? 'var(--color-surface-hover)' : 'transparent',
                  border: isSelected ? '1px solid var(--color-sage-soft)' : '1px solid transparent'
                }}
                onClick={async () => {
                  await onSelectLocation(loc);
                  setIsLocationModalOpen(false);
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--color-text)' }}>{loc.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {loc.latitude}°, {loc.longitude}° · {loc.timeZoneId}
                  </div>
                </div>
                {isSelected && <span style={{ color: 'var(--color-sage-soft)', fontWeight: 'bold' }}>✓</span>}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* MODAL: CUSTOM COORDINATES */}
      <Modal
        isOpen={isCustomLocModalOpen}
        title="Custom Coordinates"
        onClose={() => setIsCustomLocModalOpen(false)}
      >
        <form onSubmit={handleSaveCustomCoordForm} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
              Location Name
            </label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. My Mosque / Hometown"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
              Latitude (-90 to 90)
            </label>
            <input
              type="number"
              step="any"
              className="text-input"
              placeholder="e.g. 23.8103"
              value={customLat}
              onChange={(e) => setCustomLat(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
              Longitude (-180 to 180)
            </label>
            <input
              type="number"
              step="any"
              className="text-input"
              placeholder="e.g. 90.4125"
              value={customLon}
              onChange={(e) => setCustomLon(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
              IANA Timezone ID
            </label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Asia/Dhaka or America/New_York"
              value={customTz}
              onChange={(e) => setCustomTz(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button type="submit" className="btn-primary">
              Save & Use Location
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsCustomLocModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CALCULATION METHOD */}
      <Modal
        isOpen={isMethodModalOpen}
        title="Calculation Method"
        onClose={() => setIsMethodModalOpen(false)}
      >
        <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {CALCULATION_METHODS.map((m) => {
            const isSelected = settings.calculationMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                className="settings-row clickable"
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? 'var(--color-surface-hover)' : 'transparent',
                  border: isSelected ? '1px solid var(--color-sage-soft)' : '1px solid transparent'
                }}
                onClick={async () => {
                  const updated: UserSettings = { ...settings, calculationMethod: m.id };
                  await onUpdateSettings(updated);
                  setIsMethodModalOpen(false);
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--color-text)' }}>{m.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{m.description}</div>
                </div>
                {isSelected && <span style={{ color: 'var(--color-sage-soft)', fontWeight: 'bold' }}>✓</span>}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* MODAL: ASR JURISTIC METHOD */}
      <Modal
        isOpen={isAsrModalOpen}
        title="Asr Juristic Method"
        onClose={() => setIsAsrModalOpen(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(['Hanafi', 'Standard'] as AsrMethod[]).map((method) => {
            const isSelected = settings.asrMethod === method;
            return (
              <button
                key={method}
                type="button"
                className="settings-row clickable"
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? 'var(--color-surface-hover)' : 'transparent',
                  border: isSelected ? '1px solid var(--color-sage-soft)' : '1px solid transparent'
                }}
                onClick={async () => {
                  const updated: UserSettings = { ...settings, asrMethod: method };
                  await onUpdateSettings(updated);
                  setIsAsrModalOpen(false);
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--color-text)' }}>
                    {method === 'Hanafi' ? 'Hanafi' : 'Standard (Shafi, Maliki, Hanbali)'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {method === 'Hanafi'
                      ? 'Asr starts when shadow reaches twice the object length. Standard in Bangladesh, Pakistan, India.'
                      : 'Asr starts when shadow equals the object length.'}
                  </div>
                </div>
                {isSelected && <span style={{ color: 'var(--color-sage-soft)', fontWeight: 'bold' }}>✓</span>}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* MODAL: CONFIRM RESET */}
      <Modal
        isOpen={isResetConfirmModalOpen}
        title="Reset All Data?"
        onClose={() => setIsResetConfirmModalOpen(false)}
      >
        <p style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.5', marginBottom: '16px' }}>
          This will permanently delete all your locally saved prayer logs, manual minute adjustments, and custom locations from this browser, returning everything to default.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-danger"
            onClick={async () => {
              await onResetAllData();
              setIsResetConfirmModalOpen(false);
            }}
          >
            Confirm & Reset Everything
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsResetConfirmModalOpen(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};
