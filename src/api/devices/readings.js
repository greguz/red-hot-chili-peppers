import { AuthorizationLevel } from '../../libs/enums'
import { NotFoundError } from '../../libs/errors'

const readingSchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string'
    },
    type: {
      type: 'string'
    },
    value: {
      type: 'number'
    },
    _created: {
      type: 'string',
      format: 'date-time'
    }
  }
}

async function handler(request, reply) {
  const { ObjectId } = this.mongo

  const device = await this.db.devices.findOne(
    {
      _id: new ObjectId(request.params.id),
      userId: request.userId,
      _deleted: {
        $exists: false
      }
    },
    {
      projection: {
        _id: 1
      }
    }
  )
  if (!device) {
    throw new NotFoundError('Device not found')
  }

  const { query, page, size, options } = request.paginate()

  Object.assign(query, {
    userId: request.userId,
    deviceId: device._id.toHexString()
  })

  const [count, items] = await Promise.all([
    this.db.readings.countDocuments(query),
    this.db.readings.find(query, options).toArray()
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
  url: '/:id/readings',
  handler,
  config: {
    authorizationLevel: AuthorizationLevel.USER
  },
  schema: {
    description: 'Fetch device readings',
    tags: ['device'],
    params: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-f0-9]{24}$'
        }
      },
      required: ['id']
    },
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
            items: readingSchema
          }
        }
      }
    }
  }
}
