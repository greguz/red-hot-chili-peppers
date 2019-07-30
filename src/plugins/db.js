import makePlugin from 'fastify-plugin'
import { ObjectId } from 'mongodb'
import _ from 'lodash'

function parseFilter(filter) {
  return ObjectId.isValid(filter) ? { _id: new ObjectId(filter) } : filter
}

function applyMutators(mutators, doc) {
  if (typeof mutators === 'function') {
    mutators = [mutators]
  }
  return mutators.reduce(
    (acc, mutator) => acc.then(mutator),
    Promise.resolve(doc)
  )
}

function noUndef(value) {
  return value === undefined ? null : value
}

function buildUpdateQuery(oldDoc, newDoc) {
  const keys = _.uniq(Object.keys(oldDoc).concat(Object.keys(newDoc)))

  const query = keys.reduce((query, key) => {
    const oldValue = noUndef(oldDoc[key])
    const newValue = noUndef(newDoc[key])

    if (oldValue !== newValue) {
      if (newValue === null) {
        _.set(query, ['$unset', key], '')
      } else {
        _.set(query, ['$set', key], newValue)
      }
    }

    return query
  }, {})

  _.set(query, ['$set', '_updated'], new Date())

  return query
}

async function mapMethod(collection, oldDoc, mutators, options) {
  const newDoc = await applyMutators(mutators, oldDoc)

  await collection.updateOne(
    { _id: oldDoc._id },
    buildUpdateQuery(oldDoc, newDoc),
    options
  )

  return newDoc
}

async function createMethod(collection, data, options) {
  const _id = new ObjectId()
  const gen = _id.getTimestamp()

  const { ops } = await collection.insertOne(
    {
      ...data,
      _id,
      _created: gen,
      _updated: gen
    },
    options
  )

  return ops[0]
}

async function readMethod(collection, filter, options = {}) {
  const doc = await collection.findOne(parseFilter(filter), options)
  if (doc) {
    return doc
  } else if (options.relax === true) {
    return null
  } else {
    throw new Error('Document not found')
  }
}

async function updateMethod(collection, filter, mutators, options) {
  const doc = await readMethod(collection, filter, options)
  if (doc) {
    return mapMethod(collection, doc, mutators, options)
  } else {
    return doc
  }
}

async function deleteMethod(collection, filter, options) {
  const doc = await readMethod(collection, filter, options)
  if (doc) {
    await collection.deleteOne({ _id: doc._id }, options)
  }
  return doc
}

function wrapCollection(db, collectionName) {
  const collection = db.collection(collectionName)

  return {
    collection,
    create: data => createMethod(collection, data),
    read: filter => readMethod(collection, filter),
    update: (filter, mutators) => updateMethod(collection, filter, mutators),
    delete: filter => deleteMethod(collection, filter),
    map: (doc, mutators) => mapMethod(collection, doc, mutators)
  }
}

function plugin(fastify, options, callback) {
  const { db } = fastify.mongo
  if (!db) {
    throw new Error('Database instance is missing')
  }

  fastify.decorate('db', {
    devices: wrapCollection(db, 'devices'),
    users: wrapCollection(db, 'users')
  })

  callback()
}

export default makePlugin(plugin, {
  fastify: '^2.0.0',
  name: 'db',
  decorators: {
    fastify: ['mongo']
  }
})
