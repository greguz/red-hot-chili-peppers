import { AuthorizationLevel } from '../../libs/enums'

import deviceSchema from './schema'

async function handler(request, reply) {
  const collection = this.db.devices
  const { query, page, size, options } = request.paginate()

  Object.assign(query, {
    userId: request.userId,
    _deleted: {
      $exists: false
    }
  })

  const [count, items] = await Promise.all([
    collection.countDocuments(query),
    collection.find(query, options).toArray()
  ])

  reply.status(200).send({
    page,
    size,
    count,
    items
  })
}

export default {
  method: 'GET',
  url: '/',
  handler,
  config: {
    authorizationLevel: AuthorizationLevel.USER
  },
  schema: {
    description: 'Search user devices',
    tags: ['device'],
    querystring: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          minimum: 1
        },
        size: {
          type: 'integer',
          minimum: 1,
          maximum: 100
        }
      },
      additionalProperties: true
    },
    response: {
      200: {
        type: 'object',
        properties: {
          page: {
            type: 'integer'
          },
          size: {
            type: 'integer'
          },
          count: {
            type: 'integer'
          },
          items: {
            type: 'array',
            items: deviceSchema
          }
        }
      }
    }
  }
}
