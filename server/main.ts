// Точка входа dev-бэкенда: `npm run server`.
// Поднимает in-memory Fastify на PORT (по умолчанию 8080 — как в .env.example)
// под префиксом /api.
import { buildServer } from './index'

const port = Number(process.env.PORT ?? 8080)

buildServer()
  .listen({ port, host: '127.0.0.1' })
  .then((url) => {
    console.log(`API server listening on ${url}/api`)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
