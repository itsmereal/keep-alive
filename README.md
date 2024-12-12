# Tab Keep Alive VSCode Extension

Automatically refreshes a specified tab to maintain remote connections.

## Features

- Configurable refresh interval
- Specify remote files to keep alive
- Start/Stop commands for manual control
- Status bar indicator with active/inactive/error states
- Detailed logging through output channel
- Error handling with automatic stop after multiple failures

## Configuration

1. Open VSCode Command Palette (CMD + Shift + P)
2. Type "Keep Alive: Configure Files and Interval"
3. Configure:
   - Select remote files to keep alive from the dropdown list
   - Enter the refresh interval in seconds (default: 5)

## Commands

- `Keep Alive: Configure Files and Interval` - Configure which remote files to keep alive and set the interval
- `Keep Alive: Start` - Start the keep-alive process
- `Keep Alive: Stop` - Stop the keep-alive process
- `Keep Alive: Toggle Status` - Toggle between start and stop states

## Status Bar

The extension provides a status bar item that shows:

- Active state (green) - Keep-alive is running
- Inactive state - Keep-alive is stopped
- Error state (red) - Issues detected during operation

## Installation

1. Download from VSCode Extensions
2. Reload VSCode
3. Configure remote files and interval using the Command Palette

## Requirements

- VSCode version 1.85.0 or higher
- Active remote files (SSH, WSL, Dev Containers, etc.)

## Change Log

### [0.0.2] - 2023-10-01

- Added status bar indicator with active/inactive/error states
- Improved error handling with automatic stop after 3 failed attempts
- Added detailed logging through output channel
- Enhanced remote file detection and handling
- Added toggle status command
- Improved user feedback and error messages

### [0.0.1] - 2023-09-30

- Initial release
