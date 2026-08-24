import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function hasDesktopWindowControls() {
  return isTauri();
}

export async function minimizeDesktopWindow() {
  await getCurrentWindow().minimize();
}

export async function toggleDesktopWindowMaximized() {
  await getCurrentWindow().toggleMaximize();
}

export async function closeDesktopWindow() {
  await getCurrentWindow().close();
}
