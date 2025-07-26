"use client";

import { useState } from "react";
import { Save, Bell, Shield, Database, Mail } from "lucide-react";
import { Button } from "@web42-ai/ui/button";
import { Card } from "@web42-ai/ui/card";
import { Input } from "@web42-ai/ui/input";
import { Label } from "@web42-ai/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@web42-ai/ui/select";
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormDescription,
} from "@web42-ai/ui/form";

interface Settings {
  general: {
    siteName: string;
    siteUrl: string;
    supportEmail: string;
    timezone: string;
  };
  notifications: {
    emailNotifications: boolean;
    systemAlerts: boolean;
    maintenanceMode: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordPolicy: string;
    twoFactorAuth: boolean;
  };
  database: {
    backupFrequency: string;
    retentionDays: number;
    autoCleanup: boolean;
  };
}

// Mock settings data
// Constants for styles to avoid duplication
const TOGGLE_BUTTON_BASE = "relative inline-flex h-6 w-11 items-center rounded-full transition-colors";
const TOGGLE_SWITCH_BASE = "inline-block h-4 w-4 transform rounded-full bg-white transition-transform";
const TOGGLE_ACTIVE_BG = "bg-blue-600";
const TOGGLE_INACTIVE_BG = "bg-gray-200";
const TOGGLE_WARNING_BG = "bg-orange-600";
const TOGGLE_ACTIVE_POS = "translate-x-6";
const TOGGLE_INACTIVE_POS = "translate-x-1";

const mockSettings: Settings = {
  general: {
    siteName: "Web42 AI Platform",
    siteUrl: "https://web42.ai",
    supportEmail: "support@web42.ai",
    timezone: "UTC",
  },
  notifications: {
    emailNotifications: true,
    systemAlerts: true,
    maintenanceMode: false,
  },
  security: {
    sessionTimeout: 30,
    passwordPolicy: "strong",
    twoFactorAuth: true,
  },
  database: {
    backupFrequency: "daily",
    retentionDays: 30,
    autoCleanup: true,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(mockSettings);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      alert("Settings saved successfully!");
    }, 1000);
  };

  const updateSetting = (section: keyof Settings, key: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        // eslint-disable-next-line security/detect-object-injection -- Safe: section is type-checked as keyof Settings
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const tabs = [
    { id: "general", label: "General", icon: Mail },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "database", label: "Database", icon: Database },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure system settings and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <tab.icon className="mr-3 h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "general" && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                General Settings
              </h3>
              <Form>
                <div className="space-y-6">
                  <FormField>
                    <FormLabel htmlFor="siteName">Site Name</FormLabel>
                    <FormControl>
                      <Input
                        id="siteName"
                        value={settings.general.siteName}
                        onChange={(e) =>
                          updateSetting("general", "siteName", e.target.value)
                        }
                      />
                    </FormControl>
                  </FormField>

                  <FormField>
                    <FormLabel htmlFor="siteUrl">Site URL</FormLabel>
                    <FormControl>
                      <Input
                        id="siteUrl"
                        value={settings.general.siteUrl}
                        onChange={(e) =>
                          updateSetting("general", "siteUrl", e.target.value)
                        }
                      />
                    </FormControl>
                  </FormField>

                  <FormField>
                    <FormLabel htmlFor="supportEmail">Support Email</FormLabel>
                    <FormControl>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={settings.general.supportEmail}
                        onChange={(e) =>
                          updateSetting("general", "supportEmail", e.target.value)
                        }
                      />
                    </FormControl>
                  </FormField>

                  <FormField>
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <Select
                        value={settings.general.timezone}
                        onValueChange={(value) =>
                          updateSetting("general", "timezone", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">
                            Eastern Time
                          </SelectItem>
                          <SelectItem value="America/Los_Angeles">
                            Pacific Time
                          </SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormField>
                </div>
              </Form>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Notification Settings
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive email notifications for important events
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSetting(
                        "notifications",
                        "emailNotifications",
                        !settings.notifications.emailNotifications
                      )
                    }
                    className={`${TOGGLE_BUTTON_BASE} ${
                      settings.notifications.emailNotifications
                        ? TOGGLE_ACTIVE_BG
                        : TOGGLE_INACTIVE_BG
                    }`}
                  >
                    <span
                      className={`${TOGGLE_SWITCH_BASE} ${
                        settings.notifications.emailNotifications
                          ? TOGGLE_ACTIVE_POS
                          : TOGGLE_INACTIVE_POS
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      System Alerts
                    </Label>
                    <p className="text-sm text-gray-500">
                      Get notified about system issues and updates
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSetting(
                        "notifications",
                        "systemAlerts",
                        !settings.notifications.systemAlerts
                      )
                    }
                    className={`${TOGGLE_BUTTON_BASE} ${
                      settings.notifications.systemAlerts
                        ? TOGGLE_ACTIVE_BG
                        : TOGGLE_INACTIVE_BG
                    }`}
                  >
                    <span
                      className={`${TOGGLE_SWITCH_BASE} ${
                        settings.notifications.systemAlerts
                          ? TOGGLE_ACTIVE_POS
                          : TOGGLE_INACTIVE_POS
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      Maintenance Mode
                    </Label>
                    <p className="text-sm text-gray-500">
                      Enable maintenance mode for system updates
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSetting(
                        "notifications",
                        "maintenanceMode",
                        !settings.notifications.maintenanceMode
                      )
                    }
                    className={`${TOGGLE_BUTTON_BASE} ${
                      settings.notifications.maintenanceMode
                        ? TOGGLE_WARNING_BG
                        : TOGGLE_INACTIVE_BG
                    }`}
                  >
                    <span
                      className={`${TOGGLE_SWITCH_BASE} ${
                        settings.notifications.maintenanceMode
                          ? TOGGLE_ACTIVE_POS
                          : TOGGLE_INACTIVE_POS
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Security Settings
              </h3>
              <Form>
                <div className="space-y-6">
                  <FormField>
                    <FormLabel htmlFor="sessionTimeout">
                      Session Timeout (minutes)
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) =>
                          updateSetting(
                            "security",
                            "sessionTimeout",
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Users will be logged out after this period of inactivity
                    </FormDescription>
                  </FormField>

                  <FormField>
                    <FormLabel>Password Policy</FormLabel>
                    <FormControl>
                      <Select
                        value={settings.security.passwordPolicy}
                        onValueChange={(value) =>
                          updateSetting("security", "passwordPolicy", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic (8+ characters)</SelectItem>
                          <SelectItem value="strong">
                            Strong (8+ chars, mixed case, numbers)
                          </SelectItem>
                          <SelectItem value="very-strong">
                            Very Strong (12+ chars, mixed case, numbers, symbols)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormField>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        Two-Factor Authentication
                      </Label>
                      <p className="text-sm text-gray-500">
                        Require 2FA for all admin accounts
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        updateSetting(
                          "security",
                          "twoFactorAuth",
                          !settings.security.twoFactorAuth
                        )
                      }
                      className={`${TOGGLE_BUTTON_BASE} ${
                        settings.security.twoFactorAuth
                          ? TOGGLE_ACTIVE_BG
                          : TOGGLE_INACTIVE_BG
                      }`}
                    >
                      <span
                        className={`${TOGGLE_SWITCH_BASE} ${
                          settings.security.twoFactorAuth
                            ? TOGGLE_ACTIVE_POS
                            : TOGGLE_INACTIVE_POS
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </Form>
            </Card>
          )}

          {activeTab === "database" && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Database Settings
              </h3>
              <Form>
                <div className="space-y-6">
                  <FormField>
                    <FormLabel>Backup Frequency</FormLabel>
                    <FormControl>
                      <Select
                        value={settings.database.backupFrequency}
                        onValueChange={(value) =>
                          updateSetting("database", "backupFrequency", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormField>

                  <FormField>
                    <FormLabel htmlFor="retentionDays">
                      Backup Retention (days)
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="retentionDays"
                        type="number"
                        value={settings.database.retentionDays}
                        onChange={(e) =>
                          updateSetting(
                            "database",
                            "retentionDays",
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Number of days to keep backup files
                    </FormDescription>
                  </FormField>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        Auto Cleanup
                      </Label>
                      <p className="text-sm text-gray-500">
                        Automatically remove old backups and logs
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        updateSetting(
                          "database",
                          "autoCleanup",
                          !settings.database.autoCleanup
                        )
                      }
                      className={`${TOGGLE_BUTTON_BASE} ${
                        settings.database.autoCleanup
                          ? TOGGLE_ACTIVE_BG
                          : TOGGLE_INACTIVE_BG
                      }`}
                    >
                      <span
                        className={`${TOGGLE_SWITCH_BASE} ${
                          settings.database.autoCleanup
                            ? TOGGLE_ACTIVE_POS
                            : TOGGLE_INACTIVE_POS
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </Form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}