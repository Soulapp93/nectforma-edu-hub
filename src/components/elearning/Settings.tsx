
import React, { useState } from 'react';
import { Save, Volume2, Mic, Video, Monitor, Globe, Shield, Database } from 'lucide-react';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface PrivacySettings {
  recordingConsent: boolean;
  dataRetention: number;
  shareAnalytics: boolean;
}

interface SettingsState {
  videoQuality: string;
  audioQuality: string;
  autoRecord: boolean;
  allowScreenShare: boolean;
  chatEnabled: boolean;
  waitingRoom: boolean;
  muteOnEntry: boolean;
  maxParticipants: number;
  sessionTimeout: number;
  storageLocation: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    videoQuality: '1080p',
    audioQuality: 'high',
    autoRecord: true,
    allowScreenShare: false,
    chatEnabled: true,
    waitingRoom: true,
    muteOnEntry: true,
    maxParticipants: 50,
    sessionTimeout: 120,
    storageLocation: 'cloud',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      recordingConsent: true,
      dataRetention: 90,
      shareAnalytics: false
    }
  });

  const handleSettingChange = (key: keyof SettingsState, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNestedSettingChange = (parent: 'notifications' | 'privacy', key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // Here you would typically save to your backend
    alert('Paramètres sauvegardés avec succès !');
  };

  return (
    <div className="max-w-4xl">
      {/* Video Conference Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center mb-6">
          <Video className="h-6 w-6 text-purple-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Paramètres de vidéoconférence</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Qualité vidéo</label>
            <select 
              value={settings.videoQuality}
              onChange={(e) => handleSettingChange('videoQuality', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="720p">HD (720p)</option>
              <option value="1080p">Full HD (1080p)</option>
              <option value="4k">4K (2160p)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Qualité audio</label>
            <select 
              value={settings.audioQuality}
              onChange={(e) => handleSettingChange('audioQuality', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="standard">Standard</option>
              <option value="high">Haute qualité</option>
              <option value="studio">Qualité studio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Participants maximum</label>
            <input
              type="number"
              value={settings.maxParticipants}
              onChange={(e) => handleSettingChange('maxParticipants', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              min="1"
              max="500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timeout de session (minutes)</label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              min="30"
              max="480"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={settings.autoRecord}
              onChange={(e) => handleSettingChange('autoRecord', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 mr-3" 
            />
            <span className="text-sm text-gray-700">Activer l'enregistrement automatique</span>
          </label>

          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={settings.allowScreenShare}
              onChange={(e) => handleSettingChange('allowScreenShare', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 mr-3" 
            />
            <span className="text-sm text-gray-700">Autoriser le partage d'écran pour les participants</span>
          </label>

          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={settings.chatEnabled}
              onChange={(e) => handleSettingChange('chatEnabled', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 mr-3" 
            />
            <span className="text-sm text-gray-700">Chat activé pendant les cours</span>
          </label>

          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={settings.waitingRoom}
              onChange={(e) => handleSettingChange('waitingRoom', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 mr-3" 
            />
            <span className="text-sm text-gray-700">Salle d'attente activée</span>
          </label>

          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={settings.muteOnEntry}
              onChange={(e) => handleSettingChange('muteOnEntry', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 mr-3" 
            />
            <span className="text-sm text-gray-700">Couper le micro à l'entrée</span>
          </label>
        </div>
      </div>

      {/* Storage Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center mb-6">
          <Database className="h-6 w-6 text-purple-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Stockage des enregistrements</h3>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Emplacement de stockage</label>
          <select 
            value={settings.storageLocation}
            onChange={(e) => handleSettingChange('storageLocation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="cloud">Cloud (recommandé)</option>
            <option value="local">Stockage local</option>
            <option value="hybrid">Hybride</option>
          </select>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Espace utilisé</span>
            <span className="text-sm font-medium">2.4 GB / 10 GB</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '24%' }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Espace disponible : 7.6 GB</p>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center mb-6">
          <Globe className="h-6 w-6 text-purple-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={settings.notifications.email}
              onChange={(e) => handleNestedSettingChange('notifications', 'email', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 mr-3" 
            />
            <span className="text-sm text-gray-700">Notifications par email</span>
          </label>

          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={settings.notifications.push}
              onChange={(e) => handleNestedSettingChange('notifications', 'push', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 mr-3" 
            />
            <span className="text-sm text-gray-700">Notifications push</span>
          </label>

          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={settings.notifications.sms}
              onChange={(e) => handleNestedSettingChange('notifications', 'sms', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 mr-3" 
            />
            <span className="text-sm text-gray-700">Notifications SMS</span>
          </label>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center mb-6">
          <Shield className="h-6 w-6 text-purple-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Confidentialité et sécurité</h3>
        </div>
        
        <div className="space-y-4 mb-4">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={settings.privacy.recordingConsent}
              onChange={(e) => handleNestedSettingChange('privacy', 'recordingConsent', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 mr-3" 
            />
            <span className="text-sm text-gray-700">Demander le consentement pour les enregistrements</span>
          </label>

          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={settings.privacy.shareAnalytics}
              onChange={(e) => handleNestedSettingChange('privacy', 'shareAnalytics', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 mr-3" 
            />
            <span className="text-sm text-gray-700">Partager les données d'analyse (anonymes)</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rétention des données (jours)
          </label>
          <input
            type="number"
            value={settings.privacy.dataRetention}
            onChange={(e) => handleNestedSettingChange('privacy', 'dataRetention', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            min="30"
            max="365"
          />
          <p className="text-xs text-gray-500 mt-1">
            Durée de conservation des enregistrements et données de session
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder les paramètres
        </button>
      </div>
    </div>
  );
};

export default Settings;
