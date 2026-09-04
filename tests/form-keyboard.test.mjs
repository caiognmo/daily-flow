import assert from 'node:assert/strict';
import test from 'node:test';
import { handleFieldEnter } from '../lib/form-keyboard.ts';

function control(options = {}) {
  return {
    tagName: 'INPUT',
    type: 'text',
    focused: false,
    hasAttribute: (_name) => false,
    matches: (_selector) => false,
    closest: (_selector) => null,
    getClientRects: () => [{}],
    focus() {
      this.focused = true;
    },
    click() {
      assert.fail('Enter must never activate an action automatically');
    },
    ...options,
  };
}

function press(target, controls = [target], options = {}) {
  const event = {
    key: 'Enter',
    target,
    defaultPrevented: false,
    repeat: false,
    nativeEvent: { isComposing: false },
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    currentTarget: { contains: () => true, querySelectorAll: () => controls },
    preventDefault() {
      this.defaultPrevented = true;
    },
    ...options,
  };
  handleFieldEnter(event);
  return event;
}

test('Enter moves from employee name to role without activating anything', () => {
  const name = control(),
    role = control();
  assert.equal(press(name, [name, role]).defaultPrevented, true);
  assert.equal(role.focused, true);
});

test('Enter focuses the next action but does not add/save/submit it', () => {
  const field = control(),
    next = control({ tagName: 'BUTTON' });
  press(field, [field, next]);
  assert.equal(next.focused, true);
});

test('hidden and disabled fields are skipped', () => {
  const field = control();
  const hidden = control({ getClientRects: () => [] });
  const disabled = control({ matches: () => true });
  const collapsed = control({ closest: () => ({ hidden: true }) });
  const next = control();
  press(field, [field, hidden, disabled, collapsed, next]);
  assert.equal(next.focused, true);
  for (const skipped of [hidden, disabled, collapsed])
    assert.equal(skipped.focused, false);
});

test('textarea, datalist, calendar, buttons and selection controls retain keyboard behavior', () => {
  for (const options of [
    { tagName: 'TEXTAREA' },
    { tagName: 'SELECT' },
    { tagName: 'BUTTON' },
    { type: 'date' },
    { type: 'checkbox' },
    { type: 'file' },
    { hasAttribute: (name) => name === 'list' },
  ]) {
    const field = control(options),
      next = control();
    assert.equal(press(field, [field, next]).defaultPrevented, false);
    assert.equal(next.focused, false);
  }
});

test('IME, modified keys, repeats, Tab and already handled keys are not intercepted', () => {
  for (const options of [
    { nativeEvent: { isComposing: true } },
    { repeat: true },
    { altKey: true },
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { key: 'Tab' },
    { key: 'Escape' },
    { defaultPrevented: true },
  ]) {
    const field = control(),
      next = control();
    press(field, [field, next], options);
    assert.equal(next.focused, false);
  }
});

test('a portal outside the form and the last field do not change focus', () => {
  const field = control(),
    next = control();
  const event = press(field, [field, next], {
    currentTarget: {
      contains: () => false,
      querySelectorAll: () => [field, next],
    },
  });
  assert.equal(next.focused, false);
  assert.equal(event.defaultPrevented, false);
  assert.equal(press(field).defaultPrevented, false);
});
