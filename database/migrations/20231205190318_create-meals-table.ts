import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary()
    table.uuid('user_id').unsigned().index().references('id').inTable('users')
    table.string('name')
    table.string('description')
    table.date('day')
    table.date('hour')
    table.boolean('diet')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('meals')
}
