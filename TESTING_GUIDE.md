# Keep Alive Extension Testing Guide

## 🎯 **Quick Test Steps**

### **Step 1: Load Extension**

1. Open VS Code
2. Press `F5` to run extension in development mode
3. New "Extension Development Host" window opens

### **Step 2: Verify Status Bar**

- Look for "$(pulse) Keep Alive: Inactive" in bottom status bar
- Click it to toggle (should show warning about no configuration)

### **Step 3: Test Commands**

Press `Cmd+Shift+P` and verify these commands exist:

- `Keep Alive: Configure Files and Interval`
- `Keep Alive: Start`
- `Keep Alive: Stop`
- `Keep Alive: Toggle Status`

### **Step 4: Test with Remote Files**

#### **If you have SSH access:**

1. Connect to remote server via VS Code Remote-SSH
2. Open some files from the remote server
3. Run "Keep Alive: Configure Files and Interval"
4. Select the remote files and set interval (e.g., 3 seconds)
5. Run "Keep Alive: Start"
6. Watch the status bar turn green
7. Open "Output" panel → Select "Tab Keep Alive" channel
8. You should see refresh logs every 3 seconds

#### **If you don't have remote files:**

**Create Mock Remote Files for Testing:**

1. Open VS Code
2. Press `Cmd+Shift+P` → "Developer: Reload Window"
3. In the Extension Development Host, open the integrated terminal
4. Create a test file with a non-file scheme:

```bash
# Create a test workspace
mkdir /tmp/test-keep-alive
cd /tmp/test-keep-alive
echo "Test content" > test.txt
```

5. In VS Code, open the folder: `/tmp/test-keep-alive`
6. The extension will treat any non-`file://` scheme as "remote"

### **Step 5: Verify All Features**

#### **Configuration Test:**

1. Run "Keep Alive: Configure Files and Interval"
2. Should show list of remote files
3. Select files and set interval
4. Should show success message

#### **Start/Stop Test:**

1. Run "Keep Alive: Start"
2. Status bar should turn green: "Keep Alive: Active"
3. Check Output panel for logs
4. Run "Keep Alive: Stop"
5. Status bar should return to white: "Keep Alive: Inactive"

#### **Toggle Test:**

1. Click status bar item
2. Should toggle between start/stop
3. Status should update accordingly

#### **Error Handling Test:**

1. Configure with non-existent files
2. Start the extension
3. Should show error state after 3 failed attempts
4. Status bar should turn red: "Keep Alive: Error"

### **Step 6: Check Output Logs**

1. Open View → Output
2. Select "Tab Keep Alive" from dropdown
3. Verify detailed logging:
   - Configuration events
   - Start/stop events
   - Refresh attempts
   - Error messages

## ✅ **Expected Behaviors**

### **Status Bar Indicators:**

- 🟢 Green "Active" = Working correctly
- ⚪ White "Inactive" = Stopped/not running
- 🔴 Red "Error" = Failed multiple times

### **Logging Output:**

```
[2025-01-03 20:07:45] Starting Keep Alive
[2025-01-03 20:07:45] Configured URIs: ssh://server/file.txt
[2025-01-03 20:07:48] Refreshed: ssh://server/file.txt
[2025-01-03 20:07:51] Refreshed: ssh://server/file.txt
```

### **Configuration Storage:**

- Settings are stored globally in VS Code
- Check: VS Code → Preferences → Settings → Search "Keep Alive"
- Should show configured files and interval

## 🐛 **Troubleshooting**

### **No Remote Files Available:**

- Extension only works with non-local files
- Connect to SSH, WSL, or Dev Container first
- Or use VS Code Remote extensions

### **Extension Not Loading:**

- Check VS Code Developer Console: Help → Toggle Developer Tools
- Look for any error messages
- Ensure you pressed F5 from the extension project

### **Commands Not Appearing:**

- Reload the Extension Development Host window
- Check package.json contributes.commands section
- Verify extension activated (check status bar)

### **Status Bar Not Showing:**

- Extension might not be activated
- Try running any Keep Alive command to trigger activation
- Check if status bar is hidden: View → Appearance → Status Bar

## 🧪 **Advanced Testing**

### **Memory Leak Test:**

1. Configure extension with files
2. Start/stop multiple times rapidly
3. Should not crash or show memory issues

### **Race Condition Test:**

1. Set very short interval (1 second)
2. Start extension
3. Rapidly start/stop multiple times
4. Should handle gracefully without overlap

### **Error Recovery Test:**

1. Start with valid files
2. Disconnect from remote
3. Wait for 3 failed attempts
4. Reconnect to remote
5. Restart extension - should work again

## 📊 **Success Criteria**

✅ Extension loads without errors
✅ All 4 commands appear in command palette
✅ Status bar shows and updates correctly
✅ Configuration UI works properly
✅ Start/stop functionality works
✅ Logging appears in output panel
✅ Error handling works (red status after failures)
✅ Memory management (no leaks with rapid start/stop)
✅ Race condition protection (no overlapping operations)

## 🎉 **You're Done!**

If all tests pass, your Keep Alive extension is working perfectly and ready for use!
