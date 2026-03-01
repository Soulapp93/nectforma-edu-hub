
import React from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface NotificationsData {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  systemUpdates: boolean;
  coursesReminders: boolean;
  attendanceAlerts: boolean;
}

interface NotificationsSettingsProps {
  notifications: NotificationsData;
  onNotificationsChange: (data: NotificationsData) => void;
  onSave: () => void;
}

const NotificationsSettings: React.FC<NotificationsSettingsProps> = ({
  notifications,
  onNotificationsChange,
  onSave
}) => {
  const toggleNotification = (key: keyof NotificationsData) => {
    onNotificationsChange({
      ...notifications,
      [key]: !notifications[key]
    });
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Préférences de notification</h2>
        <Button onClick={onSave} size="sm">
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder
        </Button>
      </div>

      <div className="space-y-6">
        <div className="border border-border rounded-lg p-4">
          <h3 className="font-medium text-foreground mb-4">Notifications générales</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Notifications par email</span>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={() => toggleNotification('emailNotifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Notifications SMS</span>
              <Switch
                checked={notifications.smsNotifications}
                onCheckedChange={() => toggleNotification('smsNotifications')}
              />
            </div>
          </div>
        </div>

        <div className="border border-border rounded-lg p-4">
          <h3 className="font-medium text-foreground mb-4">Notifications pédagogiques</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rappels de cours</span>
              <Switch
                checked={notifications.coursesReminders}
                onCheckedChange={() => toggleNotification('coursesReminders')}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Alertes de présence</span>
              <Switch
                checked={notifications.attendanceAlerts}
                onCheckedChange={() => toggleNotification('attendanceAlerts')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSettings;
