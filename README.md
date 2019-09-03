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

1. **MONGO_URL** - MongoDB connection string
2. **MONGO_DATABASE** - Database name to use
3. TELEGRAM_TOKEN - Telegram bot token (optional)

You can create a `.env` file inside this directory.

Then run `npm start`.

## Device

### Hardware

- [ESP8266](https://learn.adafruit.com/adafruit-feather-huzzah-esp8266)
- [ADS1115](https://learn.adafruit.com/adafruit-4-channel-adc-breakouts)
- [Capacitive soil moisture sensor](https://wiki.dfrobot.com/Capacitive_Soil_Moisture_Sensor_SKU_SEN0193)
- 2N2222
- Other sensors coming soon...

### Wiring

TODO

### Software

- [Arduino IDE](https://www.arduino.cc/en/Main/Software)
- [ESP8266 core](https://github.com/esp8266/Arduino)
- [WiFiManager](https://github.com/tzapu/WiFiManager)
- [Adafruit_ADS1015](https://github.com/adafruit/Adafruit_ADS1X15)
- [ArduinoWebSockets](https://github.com/Links2004/arduinoWebSockets)
