"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var path = __toESM(require("path"));
function activate(context) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.text = "$(pulse) Keep Alive: Inactive";
  statusBarItem.tooltip = "Tab Keep Alive Extension";
  statusBarItem.command = "keepAlive.toggleStatus";
  statusBarItem.show();
  const outputChannel = vscode.window.createOutputChannel("Tab Keep Alive");
  let rotationInterval = null;
  let failedAttempts = 0;
  const MAX_FAILED_ATTEMPTS = 3;
  const updateStatusBar = (status) => {
    switch (status) {
      case "active":
        statusBarItem.text = "$(pulse) Keep Alive: Active";
        statusBarItem.color = new vscode.ThemeColor("terminal.ansiGreen");
        break;
      case "inactive":
        statusBarItem.text = "$(pulse) Keep Alive: Inactive";
        statusBarItem.color = void 0;
        break;
      case "error":
        statusBarItem.text = "$(error) Keep Alive: Error";
        statusBarItem.color = new vscode.ThemeColor("terminal.ansiRed");
        break;
    }
    statusBarItem.show();
  };
  const configureTabsCommand = vscode.commands.registerCommand(
    "tabRotator.configureTabs",
    async () => {
      try {
        const editors = vscode.window.visibleTextEditors.filter(
          (editor) => editor.document.uri.scheme !== "file"
        );
        if (editors.length === 0) {
          vscode.window.showWarningMessage(
            "No remote files found. Please open your remote files first."
          );
          return;
        }
        outputChannel.appendLine(
          `[${(/* @__PURE__ */ new Date()).toLocaleString()}] Available remote editors:`
        );
        editors.forEach((editor) => {
          outputChannel.appendLine(
            `URI: ${editor.document.uri.toString()}, Scheme: ${editor.document.uri.scheme}`
          );
        });
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = editors.map((editor) => ({
          label: path.basename(editor.document.fileName),
          description: editor.document.uri.toString(),
          picked: true
        }));
        quickPick.canSelectMany = true;
        quickPick.title = "Select Remote Files to Keep Alive";
        const currentConfig = vscode.workspace.getConfiguration("tabRotator");
        const currentInterval = currentConfig.get("interval", 5);
        const intervalInput = await vscode.window.showInputBox({
          prompt: "Enter rotation interval in seconds",
          placeHolder: `Current interval: ${currentInterval} seconds`,
          value: currentInterval.toString(),
          validateInput: (value) => {
            const num = parseInt(value);
            return isNaN(num) || num <= 0 ? "Please enter a valid positive number" : null;
          }
        });
        quickPick.show();
        quickPick.onDidAccept(() => {
          const selectedTabs = quickPick.selectedItems;
          const interval = intervalInput ? parseInt(intervalInput) : currentInterval;
          if (selectedTabs.length === 0) {
            vscode.window.showWarningMessage(
              "Please select at least one remote file."
            );
            return;
          }
          vscode.workspace.getConfiguration("tabRotator").update(
            "tabs",
            selectedTabs.map((item) => item.description),
            // Store full URI
            vscode.ConfigurationTarget.Global
          );
          vscode.workspace.getConfiguration("tabRotator").update("interval", interval, vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage(
            `Keep Alive configured with ${selectedTabs.length} remote files and ${interval} second interval`
          );
          quickPick.hide();
        });
      } catch (error) {
        outputChannel.appendLine(
          `[${(/* @__PURE__ */ new Date()).toLocaleString()}] Configuration error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        vscode.window.showErrorMessage(
          "Failed to configure remote files. Please try again."
        );
      }
    }
  );
  const startKeepAliveCommand = vscode.commands.registerCommand(
    "keepAlive.start",
    async () => {
      try {
        const config = vscode.workspace.getConfiguration("tabRotator");
        const configuredUris = config.get("tabs", []);
        const interval = config.get("interval", 5) * 1e3;
        if (configuredUris.length === 0) {
          vscode.window.showWarningMessage(
            "No remote files configured. Please configure files first."
          );
          updateStatusBar("error");
          return;
        }
        if (rotationInterval) {
          clearInterval(rotationInterval);
        }
        failedAttempts = 0;
        outputChannel.appendLine(
          `[${(/* @__PURE__ */ new Date()).toLocaleString()}] Starting Keep Alive`
        );
        outputChannel.appendLine(
          `Configured URIs: ${configuredUris.join(", ")}`
        );
        updateStatusBar("active");
        rotationInterval = setInterval(async () => {
          for (const uriString of configuredUris) {
            try {
              const uri = vscode.Uri.parse(uriString);
              const editor = vscode.window.visibleTextEditors.find(
                (e) => e.document.uri.toString() === uriString
              );
              if (editor) {
                await vscode.window.showTextDocument(editor.document, {
                  preview: false,
                  preserveFocus: true,
                  viewColumn: editor.viewColumn
                });
                outputChannel.appendLine(
                  `[${(/* @__PURE__ */ new Date()).toLocaleString()}] Refreshed: ${uriString}`
                );
                failedAttempts = 0;
              } else {
                const doc = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(doc, {
                  preview: false,
                  preserveFocus: true
                });
              }
            } catch (error) {
              failedAttempts++;
              outputChannel.appendLine(
                `[${(/* @__PURE__ */ new Date()).toLocaleString()}] Error refreshing: ${uriString}`
              );
              outputChannel.appendLine(
                `Error details: ${error instanceof Error ? error.message : "Unknown error"}`
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
        }, interval);
        vscode.window.showInformationMessage(
          `Keep Alive started for ${configuredUris.length} remote files, refreshing every ${interval / 1e3} seconds`
        );
      } catch (error) {
        outputChannel.appendLine(
          `[${(/* @__PURE__ */ new Date()).toLocaleString()}] Start error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        vscode.window.showErrorMessage("Failed to start Keep Alive.");
        updateStatusBar("error");
      }
    }
  );
  const stopKeepAliveCommand = vscode.commands.registerCommand(
    "keepAlive.stop",
    () => {
      if (rotationInterval) {
        clearInterval(rotationInterval);
        rotationInterval = null;
        updateStatusBar("inactive");
        outputChannel.appendLine(
          `[${(/* @__PURE__ */ new Date()).toLocaleString()}] Keep Alive stopped`
        );
        vscode.window.showInformationMessage("Keep Alive stopped");
      }
    }
  );
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
  context.subscriptions.push(
    statusBarItem,
    outputChannel,
    configureTabsCommand,
    startKeepAliveCommand,
    stopKeepAliveCommand,
    toggleStatusCommand
  );
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
