import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

export async function tryRequestPermission() {
  let permissionGranted = await isPermissionGranted();

  // If not we need to request it
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === "granted";
  }
  return permissionGranted;
}

export async function notification(
  option: Parameters<typeof sendNotification>[0]
) {
  const permissionGranted = await tryRequestPermission();

  // Once permission has been granted we can send the notification
  if (permissionGranted) {
    sendNotification(option);
  }
}
