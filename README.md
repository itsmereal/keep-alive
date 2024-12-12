# Tab Keep Alive VSCode Extension

Automatically refreshes a specified tab to maintain remote connections.

## Features

- Configurable refresh interval
- Specify target tab to keep alive
- Start/Stop commands for manual control
- Select tabs and configure interval directly from the Command Palette

## Configuration

1. Open VSCode Command Palette (CMD + Shift + P)
2. Type "Tab Rotator: Configure Tabs and Interval"
3. Configure:
   - Select tabs to rotate from the dropdown list
   - Enter the refresh interval in seconds (default: 5)

## Commands

- `Tab Rotator: Configure Tabs and Interval` - Configure which tabs to rotate and set the interval
- `Keep Alive: Start Tab Keep Alive`
- `Keep Alive: Stop Tab Keep Alive`

## Installation

1. Download from VSCode Extensions
2. Reload VSCode
3. Configure settings

## Change Log

### [0.0.2] - 2023-10-01

- Added command to configure tabs and interval directly from the Command Palette.
- Improved user experience with dropdown selection for tabs and input for interval.
- Enhanced error handling and user feedback.

### [0.0.1] - 2023-09-30

- Initial release
