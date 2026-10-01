if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: { search: '', href: 'http://localhost/' },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}
