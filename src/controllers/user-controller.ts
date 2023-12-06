import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { randomUUID } from 'crypto'

export async function UserController(app: FastifyInstance) {
  app.get('/', { preHandler: [auth] }, async (request) => {
    return {
      // eslint-disable-next-line
      ...request['auth'],
    }
  })

  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      username: z.string(),
    })

    const { username } = createUserBodySchema.parse(request.body)
    const sessionId = randomUUID()

    const user = await knex('users')
      .insert({
        id: randomUUID(),
        username,
        session_id: sessionId,
      })
      .returning('id')

    reply.cookie('session', sessionId, {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dia
    })

    return reply.status(201).send({
      user,
    })
  })
}
