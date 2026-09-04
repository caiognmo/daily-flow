import assert from 'node:assert/strict';
import test from 'node:test';
import { shareSavedDaily } from '../lib/share-saved-daily.ts';

function popup(events) {
  return {
    closed: false,
    close() {
      events.push('close');
      this.closed = true;
    },
    location: {
      replace(url) {
        events.push(['navigate', url]);
      },
    },
  };
}

for (const mode of ['link', 'text']) {
  test(`${mode}: reserves a tab but only shares after the server confirms saving`, async () => {
    const events = [];
    let confirm;
    const result = shareSavedDaily({
      openWindow: () => {
        events.push('open');
        return popup(events);
      },
      save: () => {
        events.push('saving');
        return new Promise((resolve) => {
          confirm = resolve;
        });
      },
      getText: (id) =>
        mode === 'link'
          ? `*Resumo / SigeDaily — Ponto Verde (Iturama - MG)*\nhttps://app.sigedaily.workers.dev/?r=${id}`
          : '*Cliente:* Ponto Verde (Iturama - MG)\n*Plano:* PDV',
      onFallback: () => assert.fail('No fallback expected'),
    });
    assert.deepEqual(events, ['open', 'saving']);
    confirm('saved-id');
    assert.equal(await result, true);
    assert.equal(events[2][0], 'navigate');
    const url = new URL(events[2][1]);
    assert.equal(url.origin, 'https://wa.me');
    assert.match(url.searchParams.get('text'), /Ponto Verde \(Iturama - MG\)/);
    if (mode === 'link')
      assert.match(url.searchParams.get('text'), /\?r=saved-id/);
    else assert.match(url.searchParams.get('text'), /\*Plano:\* PDV/);
  });

  test(`${mode}: failure to save closes the tab and prevents sharing`, async () => {
    const events = [];
    const result = await shareSavedDaily({
      openWindow: () => popup(events),
      save: async () => null,
      getText: () =>
        assert.fail('Must not construct a message for an unsaved daily'),
      onFallback: () =>
        assert.fail('Must not offer a link after a failed save'),
    });
    assert.equal(result, false);
    assert.deepEqual(events, ['close']);
  });
}

test('blocked popup still saves, then offers the explicit WhatsApp link', async () => {
  const events = [];
  await shareSavedDaily({
    openWindow: () => null,
    save: async () => {
      events.push('saved');
      return 'saved-id';
    },
    getText: () => 'Daily confirmada',
    onFallback: (url) => events.push(['fallback', url]),
  });
  assert.equal(events[0], 'saved');
  assert.equal(events[1][0], 'fallback');
  assert.equal(
    new URL(events[1][1]).searchParams.get('text'),
    'Daily confirmada',
  );
});

test('network rejection closes the reserved tab without sharing', async () => {
  const events = [];
  await assert.rejects(
    shareSavedDaily({
      openWindow: () => popup(events),
      save: async () => {
        throw new Error('offline');
      },
      getText: () => assert.fail('Must not share'),
      onFallback: () => assert.fail('Must not share'),
    }),
    /offline/,
  );
  assert.deepEqual(events, ['close']);
});
