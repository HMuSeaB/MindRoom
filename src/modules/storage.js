function createMemoryStore(namespace) {
  const prefix = `${namespace}:`;

  return {
    async get(key) {
      const raw = window.localStorage.getItem(`${prefix}${key}`);
      if (raw === null) return null;

      try {
        return JSON.parse(raw);
      } catch (err) {
        console.warn(`Failed to parse local storage key "${key}":`, err);
        return null;
      }
    },

    async set(key, value) {
      window.localStorage.setItem(`${prefix}${key}`, JSON.stringify(value));
    }
  };
}

export function createAppStore(fileName = 'mind_room_data.bin') {
  const tauriStoreApi = window.__TAURI__?.store?.LazyStore;
  const backend = tauriStoreApi
    ? new tauriStoreApi(fileName)
    : createMemoryStore(fileName);

  if (!tauriStoreApi) {
    console.warn('Tauri store API is unavailable, falling back to localStorage.');
  }

  let pendingSave = Promise.resolve();

  async function flush() {
    if (typeof backend.save !== 'function') return;
    pendingSave = pendingSave
      .catch(() => undefined)
      .then(() => backend.save());
    return pendingSave;
  }

  return {
    async get(key, fallback = null) {
      try {
        const value = await backend.get(key);
        return value ?? fallback;
      } catch (err) {
        console.error(`Failed to load store key "${key}":`, err);
        return fallback;
      }
    },

    async set(key, value) {
      try {
        await backend.set(key, value);
        await flush();
      } catch (err) {
        console.error(`Failed to persist store key "${key}":`, err);
      }
    }
  };
}
