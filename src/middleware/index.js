const
    { MongoClient } = require('mongodb'),
    dotenv = require('dotenv')
dotenv.config()

let client = null;
(async () => {
    client = await MongoClient.connect(process.env.MONGO_URI, {
        useUnifiedTopology: true
    })
    console.log('DB connection established!')
})();

const getDB = async (ctx, next) => {
    ctx.state.client = client
    ctx.state.db = client.db('GetSSHS')
    ctx.state.collection = {}
    ctx.state.collection.ranking = ctx.state.db.collection('event')
    ctx.state.collection.jujak = ctx.state.db.collection('jujak')
    await next()
}

module.exports = getDB