import api from "./api";

/*
  Bell se sidebar badges ko unread counts milenge.
*/
export const NOTIFICATION_COUNTS =
  "skillselephant:notification-counts";

/*
  Read status change hone par bell/counts refresh karenge.
*/
export const NOTIFICATION_REFRESH =
  "skillselephant:notification-refresh";

/*
  Successfully loaded conversation ke purane
  notifications ko read mark karega.
*/
export async function markConversationNotificationsRead(
  link,
  through
) {
  if (
    !through ||
    window.location.pathname !== link ||
    document.visibilityState !== "visible"
  ) {
    return;
  }

  try {
    await api.patch(
      "/notifications/read-conversation",
      {
        link,
        through,
      }
    );

    window.dispatchEvent(
      new Event(NOTIFICATION_REFRESH)
    );
  } catch (error) {
    // Notification update fail ho toh chat usable rahe.
    console.error(
      "Unable to update conversation notification status:",
      error.response?.data?.message || error.message
    );
  }
}