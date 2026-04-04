'use client';

import { useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/lib/auth';
import { defaultSettings, Settings } from '@/lib/settings';
import {
  GeneralTab,
  BankTab,
  HeroTab,
  SpinTab,
  OpsTab,
  STORAGE_KEY,
  TABS,
  BUTTON_STYLES,
  type TabId,
} from './components';

export default function AdminSettings() {
  const { showToast } = useAuth();
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [opsRefresh, setOpsRefresh] = useState(0);

  const saveSettings = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    showToast('Đã lưu cài đặt!', 'success');
  }, [settings, showToast]);

  const updateSetting = useCallback((key: keyof Settings, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleOpsRefresh = useCallback(() => {
    setOpsRefresh(v => v + 1);
  }, []);

  return (
    <AdminLayout>
      <div style={{ padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8eaed' }}>⚙️ Cài Đặt Website</h1>
          <button onClick={saveSettings} style={BUTTON_STYLES.save}>
            💾 Lưu Cài Đặt
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {TABS.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              style={BUTTON_STYLES.tab(activeTab === tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ 
          background: '#1a1f35', 
          border: '1px solid rgba(99,102,241,0.2)', 
          borderRadius: 12, 
          padding: 28, 
          maxWidth: 640 
        }}>
          {activeTab === 'general' && (
            <GeneralTab settings={settings} onUpdate={updateSetting} />
          )}
          {activeTab === 'bank' && (
            <BankTab settings={settings} onUpdate={updateSetting} />
          )}
          {activeTab === 'hero' && (
            <HeroTab settings={settings} onUpdate={updateSetting} />
          )}
          {activeTab === 'spin' && (
            <SpinTab settings={settings} onUpdate={updateSetting} />
          )}
          {activeTab === 'ops' && (
            <OpsTab 
              refreshKey={opsRefresh} 
              onRefresh={handleOpsRefresh} 
              onToast={showToast} 
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
