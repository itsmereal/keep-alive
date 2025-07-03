import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  // Create a status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.text = "$(pulse) Keep Alive: Inactive";
  statusBarItem.tooltip = "Tab Keep Alive Extension";
  statusBarItem.command = "keepAlive.toggleStatus";
  statusBarItem.show();

  // Logging channel for detailed tracking
  const outputChannel = vscode.window.createOutputChannel("Tab Keep Alive");

  let rotationInterval: NodeJS.Timeout | null = null;
  let failedAttempts = 0;
  const MAX_FAILED_ATTEMPTS = 3;
  let isProcessing = false; // Prevent overlapping operations

  // Function to update status bar
  const updateStatusBar = (status: "active" | "inactive" | "error") => {
    switch (status) {
      case "active":
        statusBarItem.text = "$(pulse) Keep Alive: Active";
        statusBarItem.color = new vscode.ThemeColor("terminal.ansiGreen");
        break;
      case "inactive":
        statusBarItem.text = "$(pulse) Keep Alive: Inactive";
        statusBarItem.color = undefined;
        break;
      case "error":
        statusBarItem.text = "$(error) Keep Alive: Error";
        statusBarItem.color = new vscode.ThemeColor("terminal.ansiRed");
        break;
    }
    statusBarItem.show();
  };

  // Configure tabs command
  const configureTabsCommand = vscode.commands.registerCommand(
    "keepAlive.configure",
    async () => {
      let quickPick: vscode.QuickPick<vscode.QuickPickItem> | undefined;

      try {
        // Get all visible text editors with remote files
        const editors = vscode.window.visibleTextEditors.filter(
          (editor) => editor.document.uri.scheme !== "file"
        );

        if (editors.length === 0) {
          vscode.window.showWarningMessage(
            "No remote files found. Please open your remote files first."
          );
          return;
        }

        // Log available editors for debugging
        outputChannel.appendLine(
          `[${new Date().toLocaleString()}] Available remote editors:`
        );
        editors.forEach((editor) => {
          outputChannel.appendLine(
            `URI: ${editor.document.uri.toString()}, Scheme: ${
              editor.document.uri.scheme
            }`
          );
        });

        // Get interval input first
        const currentConfig = vscode.workspace.getConfiguration("keepAlive");
        const currentInterval = currentConfig.get<number>("interval", 5);

        const intervalInput = await vscode.window.showInputBox({
          prompt: "Enter rotation interval in seconds",
          placeHolder: `Current interval: ${currentInterval} seconds`,
          value: currentInterval.toString(),
          validateInput: (value) => {
            const num = parseInt(value);
            return isNaN(num) || num <= 0
              ? "Please enter a valid positive number"
              : null;
          },
        });

        // User cancelled interval input
        if (intervalInput === undefined) {
          return;
        }

        const interval = parseInt(intervalInput);
        if (isNaN(interval) || interval <= 0) {
          vscode.window.showErrorMessage("Invalid interval provided.");
          return;
        }

        // Get silent mode preference
        const currentSilentMode = vscode.workspace
          .getConfiguration("keepAlive")
          .get<boolean>("silentMode", true);
        const silentModeChoice = await vscode.window.showQuickPick(
          [
            {
              label: "Silent Mode (Recommended)",
              description:
                "Keep tabs alive without focusing them - no visual disruption",
              value: true,
            },
            {
              label: "Visual Mode",
              description:
                "Focus tabs when refreshing - you'll see each tab switch",
              value: false,
            },
          ],
          {
            placeHolder: `Current mode: ${
              currentSilentMode ? "Silent" : "Visual"
            }`,
            title: "Choose Keep Alive Mode",
          }
        );

        if (!silentModeChoice) {
          return; // User cancelled
        }

        // Create quick pick for selection
        quickPick = vscode.window.createQuickPick();
        quickPick.items = editors.map((editor) => ({
          label: path.basename(editor.document.fileName),
          description: editor.document.uri.toString(),
          picked: true,
        }));
        quickPick.canSelectMany = true;
        quickPick.title = "Select Remote Files to Keep Alive";

        // Set up promise to handle user interaction
        const result = await new Promise<vscode.QuickPickItem[] | undefined>(
          (resolve) => {
            quickPick!.onDidAccept(() => {
              resolve(quickPick!.selectedItems as vscode.QuickPickItem[]);
            });

            quickPick!.onDidHide(() => {
              resolve(undefined);
            });

            quickPick!.show();
          }
        );

        if (!result || result.length === 0) {
          vscode.window.showWarningMessage(
            "Please select at least one remote file."
          );
          return;
        }

        // Store the full URIs
        await vscode.workspace.getConfiguration("keepAlive").update(
          "files",
          result.map((item) => item.description),
          vscode.ConfigurationTarget.Global
        );

        await vscode.workspace
          .getConfiguration("keepAlive")
          .update("interval", interval, vscode.ConfigurationTarget.Global);

        await vscode.workspace
          .getConfiguration("keepAlive")
          .update(
            "silentMode",
            silentModeChoice.value,
            vscode.ConfigurationTarget.Global
          );

        vscode.window.showInformationMessage(
          `Keep Alive configured with ${
            result.length
          } remote files, ${interval} second interval, ${
            silentModeChoice.value ? "Silent" : "Visual"
          } mode`
        );
      } catch (error) {
        outputChannel.appendLine(
          `[${new Date().toLocaleString()}] Configuration error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        vscode.window.showErrorMessage(
          "Failed to configure remote files. Please try again."
        );
      } finally {
        // Ensure QuickPick is always disposed
        quickPick?.dispose();
      }
    }
  );

  // Start keep alive command
  const startKeepAliveCommand = vscode.commands.registerCommand(
    "keepAlive.start",
    async () => {
      try {
        // Prevent multiple simultaneous start operations
        if (isProcessing) {
          vscode.window.showWarningMessage(
            "Keep Alive operation already in progress."
          );
          return;
        }

        isProcessing = true;

        // Get configured tabs and interval
        const config = vscode.workspace.getConfiguration("keepAlive");
        const configuredUris = config.get<string[]>("files", []);
        const interval = config.get<number>("interval", 5) * 1000;
        const silentMode = config.get<boolean>("silentMode", true);

        if (configuredUris.length === 0) {
          vscode.window.showWarningMessage(
            "No remote files configured. Please configure files first."
          );
          updateStatusBar("error");
          return;
        }

        // Stop existing interval if any
        if (rotationInterval) {
          clearInterval(rotationInterval);
          rotationInterval = null;
        }

        // Reset failed attempts
        failedAttempts = 0;

        // Log start
        outputChannel.appendLine(
          `[${new Date().toLocaleString()}] Starting Keep Alive`
        );
        outputChannel.appendLine(
          `Configured URIs: ${configuredUris.join(", ")}`
        );

        // Update status
        updateStatusBar("active");

        // Start interval with debouncing
        rotationInterval = setInterval(async () => {
          // Skip if previous operation is still running
          if (isProcessing) {
            outputChannel.appendLine(
              `[${new Date().toLocaleString()}] Skipping refresh cycle - previous operation still in progress`
            );
            return;
          }

          isProcessing = true;

          try {
            for (const uriString of configuredUris) {
              try {
                // Parse the URI
                const uri = vscode.Uri.parse(uriString);

                // Find existing editor with this URI
                const editor = vscode.window.visibleTextEditors.find(
                  (e) => e.document.uri.toString() === uriString
                );

                if (silentMode) {
                  // Silent mode - just access the document without showing it
                  if (editor) {
                    // Document is already open - just access it to keep connection alive
                    const text = editor.document.getText(
                      new vscode.Range(0, 0, 0, 1)
                    );
                    outputChannel.appendLine(
                      `[${new Date().toLocaleString()}] Silent refresh: ${uriString} (${
                        text.length
                      } chars)`
                    );
                  } else {
                    // Try to open the document silently
                    const doc = await vscode.workspace.openTextDocument(uri);
                    const text = doc.getText(new vscode.Range(0, 0, 0, 1));
                    outputChannel.appendLine(
                      `[${new Date().toLocaleString()}] Silent opened: ${uriString} (${
                        text.length
                      } chars)`
                    );
                  }
                  failedAttempts = 0;
                } else {
                  // Visual mode - show the document (original behavior)
                  if (editor) {
                    // Use existing editor
                    await vscode.window.showTextDocument(editor.document, {
                      preview: false,
                      preserveFocus: true,
                      ...(editor.viewColumn && {
                        viewColumn: editor.viewColumn,
                      }),
                    });

                    outputChannel.appendLine(
                      `[${new Date().toLocaleString()}] Visual refresh: ${uriString}`
                    );
                    failedAttempts = 0;
                  } else {
                    // Try to open the document
                    const doc = await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(doc, {
                      preview: false,
                      preserveFocus: true,
                    });

                    outputChannel.appendLine(
                      `[${new Date().toLocaleString()}] Visual opened: ${uriString}`
                    );
                    failedAttempts = 0;
                  }
                }
              } catch (error) {
                failedAttempts++;
                outputChannel.appendLine(
                  `[${new Date().toLocaleString()}] Error refreshing: ${uriString}`
                );
                outputChannel.appendLine(
                  `Error details: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`
                );

                if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
                  vscode.window.showErrorMessage(
                    "Keep Alive failed multiple times. Please check your remote connection."
                  );
                  updateStatusBar("error");
                  if (rotationInterval) {
                    clearInterval(rotationInterval);
                    rotationInterval = null;
                  }
                  break;
                }
              }
            }
          } finally {
            isProcessing = false;
          }
        }, interval);

        vscode.window.showInformationMessage(
          `Keep Alive started for ${
            configuredUris.length
          } remote files, refreshing every ${interval / 1000} seconds ${
            silentMode ? "(Silent Mode)" : "(Visual Mode)"
          }`
        );
      } catch (error) {
        outputChannel.appendLine(
          `[${new Date().toLocaleString()}] Start error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        vscode.window.showErrorMessage("Failed to start Keep Alive.");
        updateStatusBar("error");
      } finally {
        isProcessing = false;
      }
    }
  );

  // Stop keep alive command
  const stopKeepAliveCommand = vscode.commands.registerCommand(
    "keepAlive.stop",
    () => {
      if (rotationInterval) {
        clearInterval(rotationInterval);
        rotationInterval = null;
        updateStatusBar("inactive");
        outputChannel.appendLine(
          `[${new Date().toLocaleString()}] Keep Alive stopped`
        );
        vscode.window.showInformationMessage("Keep Alive stopped");
      }
      isProcessing = false; // Reset processing flag
    }
  );

  // Toggle status command
  const toggleStatusCommand = vscode.commands.registerCommand(
    "keepAlive.toggleStatus",
    () => {
      if (rotationInterval) {
        vscode.commands.executeCommand("keepAlive.stop");
      } else {
        vscode.commands.executeCommand("keepAlive.start");
      }
    }
  );

  // Add to subscriptions
  context.subscriptions.push(
    statusBarItem,
    outputChannel,
    configureTabsCommand,
    startKeepAliveCommand,
    stopKeepAliveCommand,
    toggleStatusCommand
  );
}

export function deactivate() {
  // Cleanup is handled by context.subscriptions
}
