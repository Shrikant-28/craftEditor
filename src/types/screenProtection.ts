export interface MeetingAppConfig {
  id: string;
  name: string;
  processNames: string[];
  enabled: boolean;
  isCustom?: boolean;
  category?: 'meeting' | 'recording' | 'browser' | 'custom';
}

export interface ScreenProtectionSettings {
  enabled: boolean;
  mode: 'always' | 'smart';
  apps: MeetingAppConfig[];
}

export const DEFAULT_MEETING_APPS: MeetingAppConfig[] = [
  {
    id: 'zoom',
    name: 'Zoom Meetings',
    processNames: ['zoom.exe', 'zoomgov.exe', 'zoom'],
    enabled: true,
    category: 'meeting',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    processNames: ['ms-teams.exe', 'teams.exe', 'teams'],
    enabled: true,
    category: 'meeting',
  },
  {
    id: 'zoho-meeting',
    name: 'Zoho Meeting',
    processNames: ['zohomeeting.exe', 'zoho meeting.exe', 'zohomeetingclient.exe', 'zoho-meeting.exe', 'zohomeeting'],
    enabled: true,
    category: 'meeting',
  },
  {
    id: 'google-meet-browsers',
    name: 'Google Meet / WebRTC Browsers',
    processNames: ['chrome.exe', 'msedge.exe', 'firefox.exe', 'brave.exe'],
    enabled: false,
    category: 'browser',
  },
  {
    id: 'webex',
    name: 'Cisco Webex',
    processNames: ['ciscocollabhost.exe', 'webex.exe', 'atmgr.exe', 'webex'],
    enabled: true,
    category: 'meeting',
  },
  {
    id: 'slack',
    name: 'Slack Huddles & Calls',
    processNames: ['slack.exe', 'slack'],
    enabled: true,
    category: 'meeting',
  },
  {
    id: 'discord',
    name: 'Discord Screen Share',
    processNames: ['discord.exe', 'discord'],
    enabled: true,
    category: 'meeting',
  },
  {
    id: 'skype',
    name: 'Skype',
    processNames: ['skype.exe', 'skype'],
    enabled: true,
    category: 'meeting',
  },
  {
    id: 'anydesk',
    name: 'AnyDesk Remote',
    processNames: ['anydesk.exe', 'anydesk'],
    enabled: true,
    category: 'recording',
  },
  {
    id: 'teamviewer',
    name: 'TeamViewer',
    processNames: ['teamviewer.exe', 'teamviewer'],
    enabled: true,
    category: 'recording',
  },
  {
    id: 'obs-capture',
    name: 'OBS Studio & Screen Recorders',
    processNames: ['obs64.exe', 'obs32.exe', 'snippingtool.exe', 'screenclippinghost.exe'],
    enabled: true,
    category: 'recording',
  },
];

export const DEFAULT_SCREEN_PROTECTION_SETTINGS: ScreenProtectionSettings = {
  enabled: true,
  mode: 'always',
  apps: DEFAULT_MEETING_APPS,
};
