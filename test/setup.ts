import '@testing-library/jest-dom/vitest'

// Точка монтирования — как в index.html. Выполняется до всех хуков тестов,
// чтобы `await import('@/main')` в beforeAll всегда находила <div id="app">.
if (!document.getElementById('app')) {
  document.body.innerHTML = '<div id="app"></div>'
}

// Окно, которого нет в jsdom, но который использует Mantine (например, для modal)
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
