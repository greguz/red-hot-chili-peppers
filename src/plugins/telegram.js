import makePlugin from 'fastify-plugin'
import Telegram from 'telegraf/telegram'

function plugin(fastify, _options, callback) {
  if (process.env.TELEGRAM_TOKEN) {
    fastify.decorate('telegram', new Telegram(process.env.TELEGRAM_TOKEN))
  }
  callback()
}

export default makePlugin(plugin, {
  fastify: '^2.0.0',
  name: 'telegram'
})
