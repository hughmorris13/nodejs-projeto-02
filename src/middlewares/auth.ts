import { FastifyRequest, FastifyReply } from 'fastify'
import { knex } from '../database'

export async function auth(request: FastifyRequest, reply: FastifyReply) {
  // eslint-disable-next-line
  request['auth'] = null

  const session = request.cookies.session
  const user = session
    ? await knex('users').where('session_id', session).first()
    : {}

  if (!session || !user) {
    return reply.status(401).send({
      message: 'Unauthorized!',
    })
  }

  // eslint-disable-next-line
  request['auth'] = { user }
}
