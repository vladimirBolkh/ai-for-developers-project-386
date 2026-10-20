import Fastify from 'fastify'
import { createHandlers } from './handlers'
import { registerRoutes } from './generated/routes.gen'
import { schemas } from './generated/schemas.gen'
import { createStore } from './store'

export function buildServer() {
  const app = Fastify()

  for (const schema of schemas) {
    app.addSchema(schema as Record<string, unknown>)
  }

  // API разворачивается под /api — так его ожидает клиент (baseUrl '/api') и
  // на это рассчитан dev-прокси Vite (пересылает /api/* без переписывания пути).
  app.register(
    async (scope) => {
      registerRoutes(scope, createHandlers(createStore()))
    },
    { prefix: '/api' },
  )

  return app
}
