// Auto-generated from spec/openapi.yaml. Do not edit.
import type { FastifyInstance } from 'fastify'

export function registerRoutes(app: FastifyInstance): void {
  app.get('/availability', { schema: {"querystring":{"type":"object","properties":{"eventTypeId":{"type":"string"}},"required":["eventTypeId"]}} }, async () => {
    throw new Error('GET /availability is not implemented')
  })
  app.get('/bookings', { schema: {} }, async () => {
    throw new Error('GET /bookings is not implemented')
  })
  app.post('/bookings', { schema: {"body":{"$ref":"BookingRequest"}} }, async () => {
    throw new Error('POST /bookings is not implemented')
  })
  app.get('/event-types', { schema: {} }, async () => {
    throw new Error('GET /event-types is not implemented')
  })
  app.post('/event-types', { schema: {"body":{"$ref":"EventTypeCreate"}} }, async () => {
    throw new Error('POST /event-types is not implemented')
  })
  app.get('/event-types/:id', { schema: {"params":{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}} }, async () => {
    throw new Error('GET /event-types/{id} is not implemented')
  })
  app.patch('/event-types/:id', { schema: {"params":{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]},"body":{"$ref":"EventTypeUpdate"}} }, async () => {
    throw new Error('PATCH /event-types/{id} is not implemented')
  })
  app.delete('/event-types/:id', { schema: {"params":{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}} }, async () => {
    throw new Error('DELETE /event-types/{id} is not implemented')
  })
  app.get('/working-hours', { schema: {} }, async () => {
    throw new Error('GET /working-hours is not implemented')
  })
  app.put('/working-hours', { schema: {"body":{"$ref":"WorkingHours"}} }, async () => {
    throw new Error('PUT /working-hours is not implemented')
  })
}
