const
    dotenv = require('dotenv'),
    path = require('path'),
    Koa = require('koa'),
    middleware = require('./middleware'),
    session = require('koa-session'),
    cors = require('@koa/cors')

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = new Koa()
const api = require('./api')
const PORT = process.env.PORT || 8000

app.keys = [process.env.KEY]

app.use(middleware);
app.use(cors({ origin: "https://james0248.github.io/GetSSHS/" }))
app.use(session(app))
app.use(api.routes())
app.use(api.allowedMethods())

const server = app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))

module.exports = server
