"use server";

import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { appendCommunityRequestId, isCommunityBackendUnavailableError } from "@/lib/api/community-service";
import { isLocalSmokeToolsEnabled, loadLocalSmokeToolsView, type LocalSmokeToolsPageView } from "./shared";

const execFileAsync = promisify(execFile);

type LocalSmokeToolsActionSuccess = {
  ok: true;
  view: LocalSmokeToolsPageView;
  message: string;
  commandOutput?: string;
};

type LocalSmokeToolsActionFailure = {
  ok: false;
  message: string;
  commandOutput?: string;
};

export type LocalSmokeToolsActionResult =
  | LocalSmokeToolsActionSuccess
  | LocalSmokeToolsActionFailure;

function workspaceRoot() {
  return path.resolve(process.cwd(), "..", "..");
}

function resetScriptPath() {
  return path.join(workspaceRoot(), "scripts", "reset-local-browser-smoke-state.ps1");
}

function mergeCommandOutput(stdout?: string, stderr?: string) {
  return [stdout?.trim(), stderr?.trim()].filter((value) => value && value.length > 0).join("\n\n").trim();
}

async function ensureResetScriptExists() {
  await access(resetScriptPath());
}

async function loadViewResult(message: string, commandOutput?: string): Promise<LocalSmokeToolsActionResult> {
  try {
    const view = await loadLocalSmokeToolsView();
    return {
      ok: true,
      view,
      message,
      commandOutput
    };
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return {
        ok: false,
        message: appendCommunityRequestId("Refreshing the smoke tools view failed because the backend is unavailable.", error),
        commandOutput
      };
    }

    return {
      ok: false,
      message: appendCommunityRequestId(
        error instanceof Error ? error.message : "Refreshing the smoke tools view failed.",
        error
      ),
      commandOutput
    };
  }
}

export async function refreshLocalSmokeToolsAction(): Promise<LocalSmokeToolsActionResult> {
  if (!isLocalSmokeToolsEnabled()) {
    return {
      ok: false,
      message: "Local smoke tools are disabled in this environment."
    };
  }

  return loadViewResult("Smoke tools view refreshed.");
}

export async function resetLocalSmokeToolsAction(): Promise<LocalSmokeToolsActionResult> {
  if (!isLocalSmokeToolsEnabled()) {
    return {
      ok: false,
      message: "Local smoke tools are disabled in this environment."
    };
  }

  if (process.platform !== "win32") {
    return {
      ok: false,
      message: "Resetting local smoke state is only supported on Windows."
    };
  }

  try {
    await ensureResetScriptExists();

    const { stdout, stderr } = await execFileAsync(
      "powershell.exe",
      ["-ExecutionPolicy", "Bypass", "-File", resetScriptPath()],
      {
        cwd: workspaceRoot(),
        maxBuffer: 1024 * 1024
      }
    );

    return loadViewResult("Local smoke state reset.", mergeCommandOutput(stdout, stderr));
  } catch (error: unknown) {
    const stdout =
      typeof error === "object" && error !== null && "stdout" in error && typeof error.stdout === "string"
        ? error.stdout
        : undefined;
    const stderr =
      typeof error === "object" && error !== null && "stderr" in error && typeof error.stderr === "string"
        ? error.stderr
        : undefined;

    return {
      ok: false,
      message: error instanceof Error ? error.message : "Resetting local smoke state failed.",
      commandOutput: mergeCommandOutput(stdout, stderr)
    };
  }
}
