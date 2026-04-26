import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { getDateSettings, saveDateSettings } from "@/lib/utils/date";
import type { TimeFormat } from "@/lib/utils/date";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  const [timezone, setTimezone] = useState(7);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24h');

  useEffect(() => {
    const settings = getDateSettings();
    setTimezone(settings.timezoneOffset);
    setTimeFormat(settings.format);
  }, []);

  const handleTimezoneChange = (val: string) => {
    const offset = parseInt(val);
    setTimezone(offset);
    saveDateSettings({ timezoneOffset: offset, format: timeFormat });
  };

  const handleFormatChange = (val: TimeFormat) => {
    setTimeFormat(val);
    saveDateSettings({ timezoneOffset: timezone, format: val });
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure LLM Farm preferences</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive alerts when agents go offline</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Refresh</Label>
              <p className="text-xs text-muted-foreground">Refresh dashboard data every 30s</p>
            </div>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Time & Locale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Timezone (GMT Offset)</Label>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                value={timezone} 
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="w-24"
              />
              <span className="text-xs text-muted-foreground">
                Currently: GMT {timezone >= 0 ? `+${timezone}` : timezone}
              </span>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label>Time Format</Label>
            <Select value={timeFormat} onValueChange={handleFormatChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Base URL: <code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">http://localhost:8000</code></p>
          <p>Status: <span className="text-emerald-400">Connected</span></p>
          <p className="text-xs">Configure backend URL in environment variables</p>
        </CardContent>
      </Card>
    </div>
  );
}
