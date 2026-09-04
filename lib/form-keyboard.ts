import type { KeyboardEvent } from 'react';

/** Enter is a focus shortcut, never a shortcut for saving or deleting. */
export function handleFieldEnter(event: KeyboardEvent<HTMLDivElement>) {
  const target = event.target as HTMLInputElement;
  if (
    event.key !== 'Enter' ||
    event.defaultPrevented ||
    event.nativeEvent.isComposing ||
    event.repeat ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    target.tagName !== 'INPUT' ||
    !['text', 'email', 'tel', 'url', 'search', 'number'].includes(
      target.type,
    ) ||
    target.hasAttribute('list') ||
    !event.currentTarget.contains(target)
  )
    return;

  // Datalists, calendars, textareas and buttons keep their native keyboard behavior.
  const controls = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'input, textarea, select, button.choice, button.audio, button.add-employee, button.add-training-call, button.next',
    ),
  ).filter(
    (control) =>
      !control.matches(':disabled, [aria-disabled="true"], [type="hidden"]') &&
      !control.closest('[hidden], [inert]') &&
      control.getClientRects().length > 0,
  );
  const index = controls.indexOf(target);
  const next = index >= 0 ? controls[index + 1] : undefined;
  if (next) {
    event.preventDefault();
    next.focus();
  }
}
