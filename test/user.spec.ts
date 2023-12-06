import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

describe('Routes test', () => {
  // Open the server before all tests
  beforeAll(async () => {
    await app.ready()
  })

  // Close the server after all tests
  afterAll(async () => {
    await app.close()
  })

  // Run migration before each tests
  beforeEach(async () => {
    execSync('npm run knex --  migrate:rollback --all')
    execSync('npm run knex --  migrate:latest')
  })

  /**
   * - Create a new user test
   */
  it('should be able to create a new user', async () => {
    await request(app.server)
      .post('/user')
      .send({
        username: 'New User',
      })
      .expect(201)
  })

  /**
   * - Show your own user test
   */
  it('should be able to show your own user', async () => {
    const userCreateResponse = await request(app.server).post('/user').send({
      username: 'New User',
    })
    const cookie = userCreateResponse.get('Set-Cookie')

    const userShowResponse = await request(app.server)
      .get('/user')
      .set('Cookie', cookie)
      .send()

    expect(userShowResponse.body.user).toEqual(
      expect.objectContaining({
        username: 'New User',
      }),
    )
  })

  /**
   * - Dont show other user test
   */
  it('should not be able to show other user', async () => {
    const userCreateResonse: any[] = []

    userCreateResonse.push(
      await request(app.server).post('/user').send({
        username: 'User 1',
      }),
    )

    userCreateResonse.push(
      await request(app.server).post('/user').send({
        username: 'User 2',
      }),
    )

    const cookie = userCreateResonse[1].get('Set-Cookie')

    const userShowResponse = await request(app.server)
      .get('/user')
      .set('Cookie', cookie)
      .send()

    expect(userShowResponse.body.user).toEqual(
      expect.not.objectContaining({
        username: 'User 1',
      }),
    )
  })

  /**
   * - Create a meal test
   */
  it('should be able to create a meal', async () => {
    const userCreateResponse = await request(app.server).post('/user').send({
      username: 'Test User',
    })
    const cookie = userCreateResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Breakfast',
        description: 'My first meal of the day',
        day: '01/01/2024',
        hour: '08:00:00',
        diet: true,
      })
      .expect(201)
  })

  /**
   * - Show a meal test
   */
  it('should be able to show a meal', async () => {
    const userCreateResponse = await request(app.server).post('/user').send({
      username: 'Test User',
    })
    const cookie = userCreateResponse.get('Set-Cookie')

    const mealCreateResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Breakfast',
        description: 'My first meal of the day',
        day: '01/01/2024',
        hour: '08:00:00',
        diet: true,
      })

    const mealShowResponse = await request(app.server)
      .get(`/meals/${mealCreateResponse.body.meal[0].id}`)
      .set('Cookie', cookie)
      .send()

    expect(mealShowResponse.body.meal).toEqual(
      expect.objectContaining({
        name: 'Breakfast',
        description: 'My first meal of the day',
        day: '01/01/2024',
        hour: '08:00:00',
        diet: 1,
      }),
    )
  })

  /**
   * - List all meals test
   */
  it('should be abel to list all meals', async () => {
    const userCreateResponse = await request(app.server).post('/user').send({
      username: 'Test User',
    })
    const cookie = userCreateResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Breakfast',
      description: 'My first meal of the day',
      day: '01/01/2024',
      hour: '08:00:00',
      diet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Lunch',
      description: 'My second meal of the day',
      day: '01/01/2024',
      hour: '15:00:00',
      diet: false,
    })

    const mealShowResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .send()

    expect(mealShowResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'Breakfast',
        description: 'My first meal of the day',
        day: '01/01/2024',
        hour: '08:00:00',
        diet: 1,
      }),
      expect.objectContaining({
        name: 'Lunch',
        description: 'My second meal of the day',
        day: '01/01/2024',
        hour: '15:00:00',
        diet: 0,
      }),
    ])
  })

  /**
   * - Update a meal test
   */
  it('should be able to update a meal', async () => {
    const userCreateResponse = await request(app.server).post('/user').send({
      username: 'Test User',
    })
    const cookie = userCreateResponse.get('Set-Cookie')

    const mealCreateResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Lunch',
        description: 'My second meal of the day',
        day: '01/01/2024',
        hour: '15:00:00',
        diet: false,
      })

    await request(app.server)
      .put(`/meals/${mealCreateResponse.body.meal[0].id}`)
      .set('Cookie', cookie)
      .send({
        name: 'Breakfast',
        description: 'My second meal of the day',
        day: '01/01/2024',
        hour: '08:00:00',
        diet: true,
      })
      .expect(204)

    const mealShowResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .send()

    expect(mealShowResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'Breakfast',
        description: 'My second meal of the day',
        day: '01/01/2024',
        hour: '08:00:00',
        diet: 1,
      }),
    ])
  })

  it('should be able to delete a meal', async () => {
    const userCreateResponse = await request(app.server).post('/user').send({
      username: 'Test User',
    })
    const cookie = userCreateResponse.get('Set-Cookie')

    const mealCreateResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Lunch',
        description: 'My second meal of the day',
        day: '01/01/2024',
        hour: '15:00:00',
        diet: false,
      })

    await request(app.server)
      .delete(`/meals/${mealCreateResponse.body.meal[0].id}`)
      .set('Cookie', cookie)
      .send({
        name: 'Breakfast',
        description: 'My second meal of the day',
        day: '01/01/2024',
        hour: '08:00:00',
        diet: true,
      })
      .expect(204)

    const mealShowResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .send()

    expect(mealShowResponse.body.meals).toEqual([])
  })

  /**
   * - Handle other user`s meals test
   */
  it('should not be able to edit other user`s meals', async () => {
    // Create 2 users
    const userCreateResonse: Array<any> = []
    const cookies: Array<string> = []

    userCreateResonse.push(
      await request(app.server).post('/user').send({
        username: 'User 1',
      }),
    )
    cookies.push(userCreateResonse[0].get('Set-Cookie'))

    userCreateResonse.push(
      await request(app.server).post('/user').send({
        username: 'User 2',
      }),
    )
    cookies.push(userCreateResonse[1].get('Set-Cookie'))

    // Testing list
    const createMealResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookies[0])
      .send({
        name: 'Breakfast',
        description: 'My first meal of the day',
        day: '01/01/2024',
        hour: '08:00:00',
        diet: true,
      })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies[1])
      .send()

    expect(listMealsResponse.body.meals).toEqual([])

    // Testing show
    await request(app.server)
      .get(`/meals/${createMealResponse.body.meal[0].id}`)
      .set('Cookie', cookies[1])
      .send()
      .expect(404)

    // Testing update
    await request(app.server)
      .put(`/meals/${createMealResponse.body.meal[0].id}`)
      .set('Cookie', cookies[1])
      .send({
        name: 'Breakfast',
        description: 'My second meal of the day',
        day: '01/01/2024',
        hour: '08:00:00',
        diet: true,
      })
      .expect(404)

    // Testing delete
    await request(app.server)
      .delete(`/meals/${createMealResponse.body.meal[0].id}`)
      .set('Cookie', cookies[1])
      .send()
      .expect(404)
  })

  it('should be able to show the metrics', async () => {
    const userCreateResponse = await request(app.server).post('/user').send({
      username: 'Test User',
    })
    const cookie = userCreateResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Meal1',
      description: '',
      day: '01/01/2024',
      hour: '08:00:00',
      diet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Meal2',
      description: '',
      day: '01/01/2024',
      hour: '09:00:00',
      diet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Meal3',
      description: '',
      day: '01/01/2024',
      hour: '10:00:00',
      diet: false,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Meal4',
      description: '',
      day: '01/01/2024',
      hour: '11:30:00',
      diet: false,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Meal5',
      description: '',
      day: '01/01/2024',
      hour: '12:30:00',
      diet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Meal6',
      description: '',
      day: '01/01/2024',
      hour: '13:30:00',
      diet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Meal7',
      description: '',
      day: '01/01/2024',
      hour: '14:30:00',
      diet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Meal8',
      description: '',
      day: '01/01/2024',
      hour: '15:30:00',
      diet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Meal9',
      description: '',
      day: '01/01/2024',
      hour: '16:30:00',
      diet: false,
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Meal10',
      description: '',
      day: '01/01/2024',
      hour: '17:30:00',
      diet: false,
    })

    const metricsResponse = await request(app.server)
      .get('/meals/summary')
      .set('Cookie', cookie)
      .send()

    expect(metricsResponse.body).toEqual({
      total: 10,
      onDiet: 6,
      outDiet: 4,
      bestMealSequence: 4,
    })
  })
})
