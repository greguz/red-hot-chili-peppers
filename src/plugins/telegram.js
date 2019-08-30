import makePlugin from 'fastify-plugin'
import Telegram from 'telegraf/telegram'

function plugin(fastify, _options, callback) {
  const botToken = process.env.TELEGRAM_TOKEN
  if (botToken) {
    fastify.decorate('telegram', new Telegram(botToken))
  }
  callback()
}

export default makePlugin(plugin, {
  fastify: '^2.0.0',
  name: 'telegram'
})
