// eslint-disbale-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      session_id: string
      username: string
      created_at: string
    }
    meals: {
      id: string
      user_id: string
      name: string
      description: string
      day: string
      hour: string
      diet: boolean
    }
  }
}
