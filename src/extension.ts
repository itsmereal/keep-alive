import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  // Function to get a shortened file name
  const getShortFileName = (fullPath: string) => {
    const fileName = path.basename(fullPath);
    const directory = path.dirname(fullPath).split(path.sep).pop();
    return `${directory}/${fileName}`;
  };

  // Register command for configuring tabs
  let disposable = vscode.commands.registerCommand(
    "tabRotator.configureTabs",
    async () => {
      try {
        // Get all visible text editors
        const editors = vscode.window.visibleTextEditors;

        // If no editors are open
        if (editors.length === 0) {
          vscode.window.showWarningMessage("No open tabs to rotate.");
          return;
        }

        // Create a quick pick for tab selection
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = editors.map((editor) => ({
          label: getShortFileName(editor.document.fileName),
          description: editor.document.fileName,
          picked: true, // Default to all tabs selected
        }));
        quickPick.canSelectMany = true;
        quickPick.title = "Select Tabs to Rotate";

        // Create input box for interval with default value
        const currentConfig = vscode.workspace.getConfiguration("tabRotator");
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

        // Show the quick pick
        quickPick.show();

        // Handle selection
        quickPick.onDidAccept(() => {
          const selectedTabs = quickPick.selectedItems;

          // Parse interval, use current or default if cancelled
          const interval = intervalInput
            ? parseInt(intervalInput)
            : currentInterval;

          // Validate at least one tab is selected
          if (selectedTabs.length === 0) {
            vscode.window.showWarningMessage("Please select at least one tab.");
            return;
          }

          // Update configuration with error handling
          try {
            // Update tabs configuration
            vscode.workspace.getConfiguration("tabRotator").update(
              "tabs",
              selectedTabs.map((tab) => tab.description),
              vscode.ConfigurationTarget.Global
            );

            // Update interval configuration
            vscode.workspace
              .getConfiguration("tabRotator")
              .update("interval", interval, vscode.ConfigurationTarget.Global);

            // Provide detailed feedback
            vscode.window.showInformationMessage(
              `Tab Rotator configured: ${selectedTabs.length} tabs, ${interval} second interval`
            );
          } catch (error) {
            vscode.window.showErrorMessage(
              `Failed to update configuration: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }

          quickPick.hide();
        });

        // Handle cancellation
        quickPick.onDidHide(() => {
          quickPick.dispose();
        });
      } catch (error) {
        // Catch any unexpected errors
        vscode.window.showErrorMessage(
          `Tab Rotator configuration failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
