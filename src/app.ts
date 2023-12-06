import fastify from 'fastify'
import cookie from '@fastify/cookie'

import { Controllers } from './controllers/controller'

export const app = fastify()

app.get('/', async () => 'Hello World')

app.register(Controllers)
app.register(cookie)
