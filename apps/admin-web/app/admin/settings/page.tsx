"use client";

import { showSuccess } from "@/lib/utils/toast";
import { Button } from "@web42-ai/ui/button";
import { Card } from "@web42-ai/ui/card";
import { Form } from "@web42-ai/ui/form";
import { FormInput } from "@web42-ai/ui/input";
import { Label } from "@web42-ai/ui/label";
import { FormSelect } from "@web42-ai/ui/select";
import { Bell, Database, Mail, Save, Shield } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface GeneralSettings {
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  timezone: string;
}

interface SecuritySettings {
  sessionTimeout: number;
  passwordPolicy: string;
  twoFactorAuth: boolean;
}

interface DatabaseSettings {
  backupFrequency: string;
  retentionDays: number;
  autoCleanup: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  systemAlerts: boolean;
  maintenanceMode: boolean;
}

// Constants for styles to avoid duplication
const TOGGLE_BUTTON_BASE =
  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors";
const TOGGLE_SWITCH_BASE =
  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform";
const TOGGLE_ACTIVE_BG = "bg-blue-600";
const TOGGLE_INACTIVE_BG = "bg-gray-200";
const TOGGLE_WARNING_BG = "bg-orange-600";
const TOGGLE_ACTIVE_POS = "translate-x-6";
const TOGGLE_INACTIVE_POS = "translate-x-1";

// Select options
const timezoneOptions = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "Europe/London", label: "London" },
];

const passwordPolicyOptions = [
  { value: "basic", label: "Basic (8+ characters)" },
  { value: "strong", label: "Strong (8+ chars, mixed case, numbers)" },
  {
    value: "very-strong",
    label: "Very Strong (12+ chars, mixed case, numbers, symbols)",
  },
];

const backupFrequencyOptions = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      emailNotifications: true,
      systemAlerts: true,
      maintenanceMode: false,
    });
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [autoCleanup, setAutoCleanup] = useState(true);

  // Form instances for each section
  const generalForm = useForm<GeneralSettings>({
    defaultValues: {
      siteName: "Web42 AI Platform",
      siteUrl: "https://web42.ai",
      supportEmail: "support@web42.ai",
      timezone: "UTC",
    },
  });

  const securityForm = useForm<SecuritySettings>({
    defaultValues: {
      sessionTimeout: 30,
      passwordPolicy: "strong",
      twoFactorAuth: true,
    },
  });

  const databaseForm = useForm<DatabaseSettings>({
    defaultValues: {
      backupFrequency: "daily",
      retentionDays: 30,
      autoCleanup: true,
    },
  });

  const handleSave = async () => {
    setSaving(true);

    // Collect all form data
    const allSettings = {
      general: generalForm.getValues(),
      security: {
        ...securityForm.getValues(),
        twoFactorAuth,
      },
      database: {
        ...databaseForm.getValues(),
        autoCleanup,
      },
      notifications: notificationSettings,
    };

    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      showSuccess("Settings saved successfully!");
      console.log("Saved settings:", allSettings);
    }, 1000);
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
              <Form {...generalForm}>
                <form className="space-y-6">
                  <FormInput<GeneralSettings>
                    name="siteName"
                    label="Site Name"
                    rules={{ required: "Site name is required" }}
                  />

                  <FormInput<GeneralSettings>
                    name="siteUrl"
                    label="Site URL"
                    rules={{
                      required: "Site URL is required",
                      pattern: {
                        value: /^https?:\/\/.+/,
                        message: "Please enter a valid URL",
                      },
                    }}
                  />

                  <FormInput<GeneralSettings>
                    name="supportEmail"
                    label="Support Email"
                    type="email"
                    rules={{
                      required: "Support email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Please enter a valid email address",
                      },
                    }}
                  />

                  <FormSelect<GeneralSettings>
                    name="timezone"
                    label="Timezone"
                    options={timezoneOptions}
                    rules={{ required: "Timezone is required" }}
                  />
                </form>
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
                      setNotificationSettings((prev) => ({
                        ...prev,
                        emailNotifications: !prev.emailNotifications,
                      }))
                    }
                    className={`${TOGGLE_BUTTON_BASE} ${
                      notificationSettings.emailNotifications
                        ? TOGGLE_ACTIVE_BG
                        : TOGGLE_INACTIVE_BG
                    }`}
                  >
                    <span
                      className={`${TOGGLE_SWITCH_BASE} ${
                        notificationSettings.emailNotifications
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
                      setNotificationSettings((prev) => ({
                        ...prev,
                        systemAlerts: !prev.systemAlerts,
                      }))
                    }
                    className={`${TOGGLE_BUTTON_BASE} ${
                      notificationSettings.systemAlerts
                        ? TOGGLE_ACTIVE_BG
                        : TOGGLE_INACTIVE_BG
                    }`}
                  >
                    <span
                      className={`${TOGGLE_SWITCH_BASE} ${
                        notificationSettings.systemAlerts
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
                      setNotificationSettings((prev) => ({
                        ...prev,
                        maintenanceMode: !prev.maintenanceMode,
                      }))
                    }
                    className={`${TOGGLE_BUTTON_BASE} ${
                      notificationSettings.maintenanceMode
                        ? TOGGLE_WARNING_BG
                        : TOGGLE_INACTIVE_BG
                    }`}
                  >
                    <span
                      className={`${TOGGLE_SWITCH_BASE} ${
                        notificationSettings.maintenanceMode
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
              <Form {...securityForm}>
                <form className="space-y-6">
                  <FormInput<SecuritySettings>
                    name="sessionTimeout"
                    label="Session Timeout (minutes)"
                    type="number"
                    rules={{
                      required: "Session timeout is required",
                      min: {
                        value: 5,
                        message: "Minimum timeout is 5 minutes",
                      },
                      max: {
                        value: 120,
                        message: "Maximum timeout is 120 minutes",
                      },
                    }}
                    description="Users will be logged out after this period of inactivity"
                  />

                  <FormSelect<SecuritySettings>
                    name="passwordPolicy"
                    label="Password Policy"
                    options={passwordPolicyOptions}
                    rules={{ required: "Password policy is required" }}
                  />

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
                      onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                      className={`${TOGGLE_BUTTON_BASE} ${
                        twoFactorAuth ? TOGGLE_ACTIVE_BG : TOGGLE_INACTIVE_BG
                      }`}
                    >
                      <span
                        className={`${TOGGLE_SWITCH_BASE} ${
                          twoFactorAuth
                            ? TOGGLE_ACTIVE_POS
                            : TOGGLE_INACTIVE_POS
                        }`}
                      />
                    </button>
                  </div>
                </form>
              </Form>
            </Card>
          )}

          {activeTab === "database" && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Database Settings
              </h3>
              <Form {...databaseForm}>
                <form className="space-y-6">
                  <FormSelect<DatabaseSettings>
                    name="backupFrequency"
                    label="Backup Frequency"
                    options={backupFrequencyOptions}
                    rules={{ required: "Backup frequency is required" }}
                  />

                  <FormInput<DatabaseSettings>
                    name="retentionDays"
                    label="Backup Retention (days)"
                    type="number"
                    rules={{
                      required: "Retention days is required",
                      min: {
                        value: 1,
                        message: "Minimum retention is 1 day",
                      },
                      max: {
                        value: 365,
                        message: "Maximum retention is 365 days",
                      },
                    }}
                    description="Number of days to keep backup files"
                  />

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
                      onClick={() => setAutoCleanup(!autoCleanup)}
                      className={`${TOGGLE_BUTTON_BASE} ${
                        autoCleanup ? TOGGLE_ACTIVE_BG : TOGGLE_INACTIVE_BG
                      }`}
                    >
                      <span
                        className={`${TOGGLE_SWITCH_BASE} ${
                          autoCleanup ? TOGGLE_ACTIVE_POS : TOGGLE_INACTIVE_POS
                        }`}
                      />
                    </button>
                  </div>
                </form>
              </Form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
