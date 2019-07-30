import axios from 'axios'

export async function sendMessage(text) {
  const token = process.env.TELEGRAM_TOKEN
  const chat = process.env.TELEGRAM_CHAT

  if (token && chat) {
    await axios.request({
      method: 'GET',
      url: `https://api.telegram.org/bot${token}/sendMessage`,
      params: {
        chat_id: chat,
        text
      }
    })
  } else {
    console.log(text)
  }
}
