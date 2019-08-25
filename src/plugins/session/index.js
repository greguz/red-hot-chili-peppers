import makePlugin from 'fastify-plugin'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

import routeChangePassword from './change-password'
import routeLogin from './login'
import routeLogout from './logout'

const jwtSecret = process.env.JWT_SECRET || 'FirstbornUnicornHardcoreSoftPorn'
const bcryptSaltRounds = 10

function readToken(request) {
  if (/^Bearer ./.test(request.headers.authorization)) {
    return request.headers.authorization.substring(7)
  } else if (
    process.env.COOKIE_NAME &&
    request.cookies[process.env.COOKIE_NAME]
  ) {
    return request.cookies[process.env.COOKIE_NAME]
  } else {
    return null
  }
}

function hashPassword(password) {
  return bcrypt.hash(password, bcryptSaltRounds)
}

function comparePassword(password, hash) {
  if (process.env.PASSWORD_CHECK === 'DISABLED') {
    return Promise.resolve(true)
  } else {
    return bcrypt.compare(password, hash)
  }
}

function signToken(payload) {
  return new Promise((resolve, reject) => {
    const options = {
      // TODO
    }
    jwt.sign(payload, jwtSecret, options, (err, token) => {
      if (err) {
        reject(err)
      } else {
        resolve(token)
      }
    })
  })
}

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    const options = {
      // TODO
    }
    jwt.verify(token, jwtSecret, options, (err, payload) => {
      if (err) {
        reject(err)
      } else {
        resolve(payload)
      }
    })
  })
}

async function onRequestHook(request, reply) {
  const { ObjectId } = this.mongo
  request.userToken = readToken(request)
  request.userId = null

  if (request.userToken) {
    try {
      const userId = await this.session.verifyToken(request.userToken)
      if (userId) {
        const user = await this.db.users.findOne(
          {
            _id: new ObjectId(userId),
            sessions: request.userToken
          },
          {
            projection: {
              _id: 1
            }
          }
        )
        if (user) {
          request.userId = userId
        }
      }
    } catch (err) {
      request.logger.warn(err)
    }
  }

  const config = reply.context.config || {}
  if (config.authenticated === true && !request.userId) {
    throw new Error('Auth required')
  }
  if (config.authenticated === false && !!request.userId) {
    throw new Error('You are authenticated')
  }

  // TODO: apply authorization (config.authorizationLevel)
}

function plugin(fastify, options, callback) {
  fastify.decorate('session', {
    hashPassword,
    comparePassword,
    signToken,
    verifyToken
  })

  fastify.decorateRequest('userId', null)
  fastify.decorateRequest('userToken', null)

  fastify.addHook('onRequest', onRequestHook)

  fastify.route(routeChangePassword)
  fastify.route(routeLogin)
  fastify.route(routeLogout)

  callback()
}

export default makePlugin(plugin, {
  fastify: '^2.0.0',
  name: 'session',
  decorators: {
    fastify: ['mongo', 'db'],
    request: ['cookies']
  }
})
