module.exports = async (ctx, next) => {
    const ranking = ctx.state.collection.ranking
    const leaderBoard = await ranking.find().sort({ score: -1 }).limit(10).toArray()
    
    ctx.response.status = 200
    ctx.response.body = leaderBoard
}