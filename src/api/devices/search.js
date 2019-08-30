import MongoQS from 'mongo-querystring'

import { AuthorizationLevel } from '../../libs/enums'

import deviceSchema from './schema'

async function handler(request, reply) {
  const collection = this.db.devices

  const page = request.query.page || 1
  const size = request.query.size || 50
  const fields = request.query.fields ? request.query.fields.split(',') : []

  // TODO: move away
  const qs = new MongoQS({
    blacklist: {
      page: 1,
      size: 1,
      fields: 1
    }
  })

  const query = {
    $and: [{ userId: '5d29eba70bbe38516bcf3784' }, qs.parse(request.query)]
  }

  const options = {
    limit: size,
    skip: size * (page - 1),
    projection: fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {})
  }

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
        },
        fields: {
          type: 'string'
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