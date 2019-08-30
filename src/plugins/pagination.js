import makePlugin from 'fastify-plugin'
import MongoQS from 'mongo-querystring'

function parseSort(value) {
  const fields = value ? value.split(',') : []

  return fields.reduce((acc, field) => {
    let order = 1

    if (/:a$/.test(field)) {
      field = field.substring(0, field.length - 2)
    } else if (/:d$/.test(field)) {
      field = field.substring(0, field.length - 2)
      order = -1
    }

    return {
      ...acc,
      [field]: order
    }
  }, {})
}

function parseProjection(value) {
  const fields = value ? value.split(',') : []
  return fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {})
}

function buildHook() {
  const qs = new MongoQS({
    blacklist: {
      page: 1,
      size: 1,
      fields: 1,
      sort: 1
    }
  })

  return (request, _reply, callback) => {
    request.paginate = () => {
      const page = request.query.page || 1
      const size = request.query.size || 50

      return {
        query: qs.parse(request.query),
        options: {
          limit: size,
          skip: size * (page - 1),
          projection: parseProjection(request.query.fields),
          sort: parseSort(request.query.sort)
        },
        page,
        size
      }
    }
    callback()
  }
}

function plugin(fastify, _options, callback) {
  fastify.decorateRequest('paginate', null)
  fastify.addHook('preHandler', buildHook())

  callback()
}

export default makePlugin(plugin, {
  fastify: '^2.0.0',
  name: 'pagination'
})
