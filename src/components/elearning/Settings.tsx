
import React, { useState } from 'react';
import { Save, Volume2, Mic, Video, Monitor, Globe, Shield, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

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
    toast({
      title: "Paramètres sauvegardés",
      description: "Vos paramètres ont été mis à jour avec succès.",
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Video Conference Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Paramètres de vidéoconférence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="videoQuality">Qualité vidéo</Label>
              <Select 
                value={settings.videoQuality}
                onValueChange={(value) => handleSettingChange('videoQuality', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">HD (720p)</SelectItem>
                  <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                  <SelectItem value="4k">4K (2160p)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audioQuality">Qualité audio</Label>
              <Select 
                value={settings.audioQuality}
                onValueChange={(value) => handleSettingChange('audioQuality', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">Haute qualité</SelectItem>
                  <SelectItem value="studio">Qualité studio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Participants maximum</Label>
              <Input
                type="number"
                value={settings.maxParticipants}
                onChange={(e) => handleSettingChange('maxParticipants', parseInt(e.target.value))}
                min="1"
                max="500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Timeout de session (minutes)</Label>
              <Input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                min="30"
                max="480"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="autoRecord"
                checked={settings.autoRecord}
                onCheckedChange={(checked) => handleSettingChange('autoRecord', checked)}
              />
              <Label htmlFor="autoRecord">Activer l'enregistrement automatique</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="allowScreenShare"
                checked={settings.allowScreenShare}
                onCheckedChange={(checked) => handleSettingChange('allowScreenShare', checked)}
              />
              <Label htmlFor="allowScreenShare">Autoriser le partage d'écran pour les participants</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="chatEnabled"
                checked={settings.chatEnabled}
                onCheckedChange={(checked) => handleSettingChange('chatEnabled', checked)}
              />
              <Label htmlFor="chatEnabled">Chat activé pendant les cours</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="waitingRoom"
                checked={settings.waitingRoom}
                onCheckedChange={(checked) => handleSettingChange('waitingRoom', checked)}
              />
              <Label htmlFor="waitingRoom">Salle d'attente activée</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="muteOnEntry"
                checked={settings.muteOnEntry}
                onCheckedChange={(checked) => handleSettingChange('muteOnEntry', checked)}
              />
              <Label htmlFor="muteOnEntry">Couper le micro à l'entrée</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Stockage des enregistrements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storageLocation">Emplacement de stockage</Label>
            <Select 
              value={settings.storageLocation}
              onValueChange={(value) => handleSettingChange('storageLocation', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cloud">Cloud (recommandé)</SelectItem>
                <SelectItem value="local">Stockage local</SelectItem>
                <SelectItem value="hybrid">Hybride</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Espace utilisé</span>
                <span className="text-sm font-medium">2.4 GB / 10 GB</span>
              </div>
              <Progress value={24} className="mb-2" />
              <p className="text-xs text-muted-foreground">Espace disponible : 7.6 GB</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="emailNotifications"
              checked={settings.notifications.email}
              onCheckedChange={(checked) => handleNestedSettingChange('notifications', 'email', checked)}
            />
            <Label htmlFor="emailNotifications">Notifications par email</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="pushNotifications"
              checked={settings.notifications.push}
              onCheckedChange={(checked) => handleNestedSettingChange('notifications', 'push', checked)}
            />
            <Label htmlFor="pushNotifications">Notifications push</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="smsNotifications"
              checked={settings.notifications.sms}
              onCheckedChange={(checked) => handleNestedSettingChange('notifications', 'sms', checked)}
            />
            <Label htmlFor="smsNotifications">Notifications SMS</Label>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Confidentialité et sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="recordingConsent"
              checked={settings.privacy.recordingConsent}
              onCheckedChange={(checked) => handleNestedSettingChange('privacy', 'recordingConsent', checked)}
            />
            <Label htmlFor="recordingConsent">Demander le consentement pour les enregistrements</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="shareAnalytics"
              checked={settings.privacy.shareAnalytics}
              onCheckedChange={(checked) => handleNestedSettingChange('privacy', 'shareAnalytics', checked)}
            />
            <Label htmlFor="shareAnalytics">Partager les données d'analyse (anonymes)</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataRetention">Rétention des données (jours)</Label>
            <Input
              type="number"
              value={settings.privacy.dataRetention}
              onChange={(e) => handleNestedSettingChange('privacy', 'dataRetention', parseInt(e.target.value))}
              min="30"
              max="365"
            />
            <p className="text-xs text-muted-foreground">
              Durée de conservation des enregistrements et données de session
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center">
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder les paramètres
        </Button>
      </div>
    </div>
  );
};

export default Settings;
