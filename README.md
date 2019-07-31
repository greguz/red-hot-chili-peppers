# red-hot-chili-peppers

An overcomplicated method to grow some chili peppers

## Server

### Application stack

- MongoDB
- [Node.js](https://nodejs.org/)
- [fastify](https://www.fastify.io/)
- [ws](https://github.com/websockets/ws)

### Run

You have to provide some env variables:

0. **MONGO_URI** - MongoDB connection string
1. **MONGO_DB** - DB to use
1. TELEGRAM_TOKEN - Telegram bot token (optional)
1. TELEGRAM_CHAT - Telegram chat ID (optional)

You can create a `.env` file inside this directory.

Then run `npm start`.

## Device

### Hardware

- [ESP8266](https://learn.adafruit.com/adafruit-feather-huzzah-esp8266)
- [ADS1115](https://learn.adafruit.com/adafruit-4-channel-adc-breakouts)
- [Capacitive soil moisture sensor](https://wiki.dfrobot.com/Capacitive_Soil_Moisture_Sensor_SKU_SEN0193)
- Other sensors coming soon...

### Wiring

TODO

### Software

- [Arduino IDE](https://www.arduino.cc/en/Main/Software)
- [ESP8266 core](https://github.com/esp8266/Arduino)
- [WiFiManager](https://github.com/tzapu/WiFiManager)
- [Adafruit_ADS1015](https://github.com/adafruit/Adafruit_ADS1X15)
- [ArduinoWebSockets](https://github.com/Links2004/arduinoWebSockets)
