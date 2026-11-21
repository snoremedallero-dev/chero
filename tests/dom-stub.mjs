/** Mínimo DOM falso para probar lógica sin navegador ni WebGL. */

class FakeClassList {
  constructor() { this.items = new Set(); }
  add(...names) { names.forEach((n) => this.items.add(n)); }
  remove(...names) { names.forEach((n) => this.items.delete(n)); }
  contains(name) { return this.items.has(name); }
  toggle(name, force) {
    const shouldAdd = force === undefined ? !this.items.has(name) : Boolean(force);
    if (shouldAdd) this.items.add(name);
    else this.items.delete(name);
    return shouldAdd;
  }
}

function createContext() {
  const store = {};
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return (...args) => {
        if (prop === 'createRadialGradient' || prop === 'createLinearGradient') {
          return { addColorStop() {} };
        }
        if (prop === 'measureText') return { width: 10 };
        return undefined;
      };
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    }
  });
}

export function createElement(tag = 'div') {
  return {
    tagName: tag.toUpperCase(),
    width: 0,
    height: 0,
    style: {},
    dataset: {},
    classList: new FakeClassList(),
    textContent: '',
    innerHTML: '',
    className: '',
    attributes: {},
    addEventListener() {},
    appendChild() {},
    getContext: () => createContext(),
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return this.attributes[name] ?? null; },
    querySelector: () => null,
    querySelectorAll: () => []
  };
}

export function installDomStub({ ids = {}, selectors = {} } = {}) {
  globalThis.document = {
    createElement,
    body: { appendChild() {} },
    getElementById: (id) => ids[id] || null,
    querySelector: (selector) => selectors[selector] || null,
    querySelectorAll: () => []
  };

  globalThis.window = {
    addEventListener() {},
    innerWidth: 1280,
    innerHeight: 720
  };

  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key)
  };

  return { storage };
}
