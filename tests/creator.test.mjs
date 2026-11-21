import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('el juego incluye la sección del creador con glifos y sin emojis', () => {
  const html = read('../index.html');

  assert.match(html, /id="creator-btn"/);
  assert.match(html, /id="start-creator-btn"/);
  assert.match(html, /id="creator-panel"/);
  assert.match(html, /id="creator-close-btn"/);
  assert.match(html, /Jorge Galdamez/);
  assert.doesNotMatch(html, /🫓|🟢|🏛️|🌋|🇸🇻|😀|🎮|👤/);
});

test('la documentación acredita a Jorge Galdamez como creador', () => {
  ['../README.md', '../NOTAS_DE_DISENO.md', '../CIPITIO_GDD.md'].forEach((file) => {
    assert.match(read(file), /Jorge Galdamez/, `${file} no menciona al creador`);
  });
});

test('los estilos del panel son toon y no introducen degradados ni desenfoques', () => {
  const css = read('../src/style.css');
  const section = css.slice(css.indexOf('/* ── Sección del creador'), css.indexOf('/* ── Pantalla de inicio'));

  assert.ok(section.length > 0);
  assert.match(section, /clip-path: polygon\(/);
  assert.match(section, /z-index: 120/);
  assert.doesNotMatch(section, /linear-gradient|radial-gradient|backdrop-filter|blur\(/i);
});
