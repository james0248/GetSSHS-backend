const
    { HttpError } = require('koa'),
    Router = require('koa-router'),
    KoaBody = require('koa-body'),
    api = new Router()

api.use(KoaBody())
api.use(async (ctx, next) => {
    ctx.body = {}
    ctx.error = (code, error) => {
        ctx.body.status = false
        ctx.body.error = error
        ctx.throw(code, JSON.stringify(ctx.body))
    }
    try {
        await next()
    } catch (e) {
        if (!(e instanceof HttpError)) { throw e }
        ctx.status = e.status
    }
})
api.post('/check', require('./check'))
api.get('/ranking', require('./ranking'))

module.exports = api