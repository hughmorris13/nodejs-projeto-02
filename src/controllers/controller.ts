import { FastifyInstance } from 'fastify'
import { UserController } from './user-controller'
import { MealController } from './meal-controller'

export async function Controllers(app: FastifyInstance) {
  app.register(UserController, {
    prefix: 'user',
  })

  app.register(MealController, {
    prefix: 'meals',
  })
}
