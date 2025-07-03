# Tab Keep Alive VSCode Extension

Automatically refreshes a specified tab to maintain remote connections.

## Features

- **Silent Mode (Default)** - Keep tabs alive without focusing them (no visual disruption)
- **Visual Mode** - Optional mode to see tabs switching during refresh
- Configurable refresh interval with connection-specific recommendations
- Specify remote files to keep alive from visible editors
- Start/Stop commands for manual control
- Status bar indicator with active/inactive/error states
- Detailed logging through output channel
- Error handling with automatic stop after multiple failures
- Race condition protection and memory leak prevention
- Comprehensive test coverage
- Perfect for SSH, WSL, Dev Containers, and Remote Tunnels

## Configuration

### Quick Setup (Recommended)

1. Open VSCode Command Palette (CMD + Shift + P)
2. Type "Keep Alive: Configure Files and Interval"
3. Configure:
   - **Interval**: Enter refresh interval in seconds (10+ recommended for remote connections)
   - **Mode**: Choose "Silent Mode (Recommended)" or "Visual Mode"
   - **Files**: Select remote files to keep alive from the dropdown list

### Manual Configuration

You can also configure through VSCode settings:

```json
{
  "keepAlive.interval": 10, // Refresh interval in seconds
  "keepAlive.silentMode": true, // Enable Silent Mode (recommended)
  "keepAlive.files": [] // Auto-configured remote file URIs
}
```

### Recommended Settings by Connection Type

| Connection Type | Interval | Silent Mode |
| --------------- | -------- | ----------- |
| SSH Remote      | 60-90s   | ✅ Enable   |
| WSL             | 30-45s   | ✅ Enable   |
| Dev Container   | 45-60s   | ✅ Enable   |
| Remote Tunnel   | 90-120s  | ✅ Enable   |

## Commands

- `Keep Alive: Configure Files and Interval` - Configure which remote files to keep alive and set the interval
- `Keep Alive: Start` - Start the keep-alive process
- `Keep Alive: Stop` - Stop the keep-alive process
- `Keep Alive: Toggle Status` - Toggle between start and stop states

## Silent Mode vs Visual Mode

### Silent Mode (Default - Recommended)

- ✅ **No visual disruption** - tabs stay unfocused during refresh
- ✅ **Uninterrupted workflow** - continue coding/reading without distraction
- ✅ **Background operation** - works invisibly to keep connections alive
- ✅ **Perfect for productivity** - no tab switching every few seconds

### Visual Mode (Original Behavior)

- ⚠️ **Visible tab switching** - you'll see each tab focus during refresh
- ⚠️ **Workflow interruption** - current focus changes every refresh cycle
- ✅ **Visual confirmation** - you can see the extension working
- ⚠️ **Only recommended** if you need to see refresh activity

## Status Bar

The extension provides a status bar item that shows:

- **Active state (green)** - Keep-alive is running (shows "Silent Mode" or "Visual Mode")
- **Inactive state** - Keep-alive is stopped
- **Error state (red)** - Issues detected during operation

Click the status bar item to toggle between start/stop states.

## Quick Start

1. **Connect to your remote environment** (SSH, WSL, Dev Container, etc.)
2. **Open some remote files** you want to keep alive
3. **Configure Keep Alive**: `Cmd+Shift+P` → `Keep Alive: Configure Files and Interval`
   - Set interval to 10+ seconds for stable connections
   - Choose "Silent Mode (Recommended)"
   - Select your remote files
4. **Start Keep Alive**: Click the status bar item or use Command Palette
5. **Work uninterrupted** - your remote connection stays alive in the background!

## Installation

1. Download from VSCode Extensions
2. Reload VSCode
3. Configure remote files and interval using the Command Palette

## Requirements

- VSCode version 1.85.0 or higher
- Active remote files (SSH, WSL, Dev Containers, etc.)

## Development

### Building

```bash
npm run compile
```

### Testing

```bash
npm test
```

### Linting

```bash
npx eslint src/**/*.ts
```

### Type Checking

```bash
npx tsc --noEmit
```

## Change Log

### [0.0.3] - 2025-01-03

- **NEW: Silent Mode (Default)** - Keep tabs alive without focusing them for uninterrupted workflow
- **NEW: Visual Mode** - Optional mode to see tab switching during refresh
- **NEW: Mode Selection** - Choose Silent or Visual mode during configuration
- **IMPROVED: Configuration UI** - Enhanced setup wizard with mode selection
- **IMPROVED: Status Messages** - Shows current mode (Silent/Visual) in notifications
- **IMPROVED: Logging** - Separate log messages for Silent vs Visual refreshes
- **IMPROVED: User Experience** - No more disruptive tab switching by default
- Perfect for remote development workflows (SSH, WSL, Dev Containers)

### [0.0.2] - 2025-01-03

- Added status bar indicator with active/inactive/error states
- Improved error handling with automatic stop after 3 failed attempts
- Added detailed logging through output channel
- Enhanced remote file detection and handling
- Added toggle status command
- Improved user feedback and error messages
- Fixed QuickPick disposal memory leaks
- Added race condition protection
- Enhanced TypeScript strict mode compliance
- Added comprehensive test suite
- Updated security dependencies
- Improved code quality and error handling

### [0.0.1] - 2023-09-30

- Initial release
