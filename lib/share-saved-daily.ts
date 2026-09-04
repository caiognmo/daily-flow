type ShareWindow = {
  closed: boolean;
  close: () => void;
  location: { replace: (url: string) => void };
};

/** Reserve the tab during the click, but never share before persistence succeeds. */
export async function shareSavedDaily({
  save,
  getText,
  openWindow,
  onFallback,
}: {
  save: () => Promise<string | null>;
  getText: (reportId: string) => string;
  openWindow: () => ShareWindow | null;
  onFallback: (url: string) => void;
}) {
  let target: ShareWindow | null = null;
  try {
    target = openWindow();
  } catch {
    // A blocked popup must not prevent the daily from being saved.
  }
  try {
    const reportId = await save();
    if (!reportId) {
      target?.close();
      return false;
    }
    const url = `https://wa.me/?text=${encodeURIComponent(getText(reportId))}`;
    if (target && !target.closed) {
      try {
        target.location.replace(url);
        return true;
      } catch {
        // The user can use the explicit link if the reserved tab cannot navigate.
      }
    }
    target?.close();
    onFallback(url);
    return true;
  } catch (error) {
    target?.close();
    throw error;
  }
}
