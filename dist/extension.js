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
  const getShortFileName = (fullPath) => {
    const fileName = path.basename(fullPath);
    const directory = path.dirname(fullPath).split(path.sep).pop();
    return `${directory}/${fileName}`;
  };
  let disposable = vscode.commands.registerCommand(
    "tabRotator.configureTabs",
    async () => {
      try {
        const editors = vscode.window.visibleTextEditors;
        if (editors.length === 0) {
          vscode.window.showWarningMessage("No open tabs to rotate.");
          return;
        }
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = editors.map((editor) => ({
          label: getShortFileName(editor.document.fileName),
          description: editor.document.fileName,
          picked: true
          // Default to all tabs selected
        }));
        quickPick.canSelectMany = true;
        quickPick.title = "Select Tabs to Rotate";
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
            vscode.window.showWarningMessage("Please select at least one tab.");
            return;
          }
          try {
            vscode.workspace.getConfiguration("tabRotator").update(
              "tabs",
              selectedTabs.map((tab) => tab.description),
              vscode.ConfigurationTarget.Global
            );
            vscode.workspace.getConfiguration("tabRotator").update("interval", interval, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(
              `Tab Rotator configured: ${selectedTabs.length} tabs, ${interval} second interval`
            );
          } catch (error) {
            vscode.window.showErrorMessage(
              `Failed to update configuration: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
          quickPick.hide();
        });
        quickPick.onDidHide(() => {
          quickPick.dispose();
        });
      } catch (error) {
        vscode.window.showErrorMessage(
          `Tab Rotator configuration failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  );
  context.subscriptions.push(disposable);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
