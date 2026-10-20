import Fastify from 'fastify'
import { registerRoutes } from './generated/routes.gen'
import { schemas } from './generated/schemas.gen'

export function buildServer() {
  const app = Fastify()

  for (const schema of schemas) {
    app.addSchema(schema as Record<string, unknown>)
  }

  registerRoutes(app)

  return app
}
