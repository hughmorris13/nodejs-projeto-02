import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { auth } from '../middlewares/auth'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export async function MealController(app: FastifyInstance) {
  // Use global auth middleware
  app.addHook('preHandler', auth)

  /**
   * List meals
   */
  app.get('/', async (request) => {
    // eslint-disable-next-line
    const { id } = request['auth'].user
    const meals = await knex('meals').where('user_id', id).select()
    return { meals }
  })

  /**
   * Show a meal
   */
  app.get('/:id', async (request, reply) => {
    const getMealParams = z.object({
      id: z.string().uuid(),
    })
    const { id } = getMealParams.parse(request.params)
    // eslint-disable-next-line
    const { id: userId } = request['auth'].user

    const meal = await knex('meals')
      .where('id', id)
      .where('user_id', userId)
      .first()

    return meal
      ? {
          meal,
        }
      : reply.status(404).send({
          message: 'Meal not found',
        })
  })

  /**
   * Create a meal
   */
  app.post('/', async (request, reply) => {
    // eslint-disable-next-line
    const { user } = request['auth']

    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      day: z.string(),
      hour: z.string(),
      diet: z.boolean(),
    })

    const { name, description, day, hour, diet } = createMealBodySchema.parse(
      request.body,
    )

    const meal = await knex('meals')
      .insert({
        id: randomUUID(),
        user_id: user.id,
        name,
        description,
        day,
        hour,
        diet,
      })
      .returning('id')

    return reply.status(201).send({
      meal,
    })
  })

  /**
   * Update a meal
   */
  app.put('/:id', async (request, reply) => {
    // eslint-disable-next-line
    const { id: userId } = request['auth'].user

    const updateMealBodySchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      day: z.string().optional(),
      hour: z.string().optional(),
      diet: z.boolean().optional(),
    })

    const body = updateMealBodySchema.parse(request.body)

    const updateMealParamSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = updateMealParamSchema.parse(request.params)

    const meal = await knex('meals')
      .where({
        id,
        user_id: userId,
      })
      .first()

    if (!meal) {
      return reply.status(404).send({
        message: 'Meal not found',
      })
    }

    await knex('meals')
      .where({
        id,
        user_id: userId,
      })
      .update({
        ...body,
      })

    return reply.status(204).send()
  })

  /**
   * Delete a meal
   */
  app.delete('/:id', async (request, reply) => {
    // eslint-disable-next-line
    const { id: userId } = request['auth'].user

    const updateMealParamSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = updateMealParamSchema.parse(request.params)

    const meal = await knex('meals')
      .where({
        id,
        user_id: userId,
      })
      .first()

    if (!meal) {
      return reply.status(404).send({
        message: 'Meal not found',
      })
    }

    await knex('meals')
      .where({
        id,
        user_id: userId,
      })
      .delete()

    return reply.status(204).send()
  })

  app.get('/summary', async (request, reply) => {
    // eslint-disable-next-line
    const { id: userId } = request['auth'].user

    const meals = await knex('meals')
      .where('user_id', userId)
      .orderBy('hour', 'asc')
      .select()

    if (meals.length <= 0) {
      return reply.status(404).send({
        message: 'No meals found',
      })
    }

    let bestSequenceCount = 0
    let currentSequenceCount = 0

    meals.forEach(({ diet: isOnDiet }) => {
      const nextCount = currentSequenceCount + 1
      currentSequenceCount = isOnDiet ? nextCount : 0
      if (currentSequenceCount > bestSequenceCount) {
        bestSequenceCount = nextCount
      }
    })

    return {
      total: meals.length,
      onDiet: meals.filter((row) => row.diet === 1).length,
      outDiet: meals.filter((row) => row.diet === 0).length,
      bestMealSequence: bestSequenceCount,
    }
  })
}
