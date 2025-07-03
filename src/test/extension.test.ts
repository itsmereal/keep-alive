import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as myExtension from '../../extension';

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  test("Extension should be present", () => {
    assert.ok(vscode.extensions.getExtension("itsmereal.keep-alive"));
  });

  test("Extension should activate", async () => {
    const extension = vscode.extensions.getExtension("itsmereal.keep-alive");
    assert.ok(extension);

    if (!extension.isActive) {
      await extension.activate();
    }

    assert.strictEqual(extension.isActive, true);
  });

  test("Commands should be registered", async () => {
    const commands = await vscode.commands.getCommands(true);

    const expectedCommands = [
      "keepAlive.configure",
      "keepAlive.start",
      "keepAlive.stop",
      "keepAlive.toggleStatus",
    ];

    for (const command of expectedCommands) {
      assert.ok(
        commands.includes(command),
        `Command ${command} should be registered`
      );
    }
  });

  test("Configuration should have default values", async () => {
    const config = vscode.workspace.getConfiguration("keepAlive");

    // Clear any existing configuration first
    await config.update("files", undefined, vscode.ConfigurationTarget.Global);
    await config.update(
      "interval",
      undefined,
      vscode.ConfigurationTarget.Global
    );

    // Re-get config after clearing
    const cleanConfig = vscode.workspace.getConfiguration("keepAlive");
    const files = cleanConfig.get<string[]>("files");
    assert.strictEqual(Array.isArray(files), true);
    assert.strictEqual(files?.length ?? 0, 0);
    assert.strictEqual(cleanConfig.get("interval"), 5);
  });

  test("Configuration should accept valid values", async () => {
    const config = vscode.workspace.getConfiguration("keepAlive");

    // Test setting files array
    await config.update(
      "files",
      ["test://file1.txt", "test://file2.txt"],
      vscode.ConfigurationTarget.Global
    );

    // Re-get config after update to ensure it's fresh
    const updatedConfig = vscode.workspace.getConfiguration("keepAlive");
    const files = updatedConfig.get<string[]>("files", []);
    assert.strictEqual(files.length, 2);
    assert.strictEqual(files[0] ?? "", "test://file1.txt");

    // Test setting interval
    await updatedConfig.update(
      "interval",
      10,
      vscode.ConfigurationTarget.Global
    );
    const finalConfig = vscode.workspace.getConfiguration("keepAlive");
    assert.strictEqual(finalConfig.get("interval"), 10);

    // Reset to defaults
    await finalConfig.update("files", [], vscode.ConfigurationTarget.Global);
    await finalConfig.update("interval", 5, vscode.ConfigurationTarget.Global);
  });

  test("Extension should handle file filtering correctly", () => {
    // Mock editors with different schemes
    interface MockEditor {
      document: {
        uri: vscode.Uri;
        fileName: string;
      };
    }

    const mockEditors: MockEditor[] = [
      {
        document: {
          uri: vscode.Uri.parse("file:///local/file.txt"),
          fileName: "/local/file.txt",
        },
      },
      {
        document: {
          uri: vscode.Uri.parse("ssh://remote/file.txt"),
          fileName: "file.txt",
        },
      },
      {
        document: {
          uri: vscode.Uri.parse(
            "vscode-remote://wsl+ubuntu/home/user/file.txt"
          ),
          fileName: "file.txt",
        },
      },
    ];

    // Filter like the extension does
    const remoteEditors = mockEditors.filter(
      (editor) => editor.document.uri.scheme !== "file"
    );

    assert.strictEqual(remoteEditors.length, 2);
    assert.strictEqual(remoteEditors[0]?.document.uri.scheme, "ssh");
    assert.strictEqual(remoteEditors[1]?.document.uri.scheme, "vscode-remote");
  });

  test("Path.basename should work correctly", () => {
    const testPaths = [
      { input: "/path/to/file.txt", expected: "file.txt" },
      { input: "file.txt", expected: "file.txt" },
      { input: "/path/to/folder/", expected: "folder" },
      { input: "", expected: "" },
    ];

    for (const testCase of testPaths) {
      const result = path.basename(testCase.input);
      assert.strictEqual(
        result,
        testCase.expected,
        `path.basename('${testCase.input}') should return '${testCase.expected}' but got '${result}'`
      );
    }
  });
});
