module.exports = async (ctx, next) => {
    const ranking = ctx.state.collection.ranking
    const leaderBoard = await ranking.find().sort({ score: -1 }).limit(10).toArray()
    let scores = leaderBoard.map(info => {
        let newInfo = {
            name: info.name,
            score: info.score,
        }
        return newInfo
    })
    
    ctx.response.status = 200
    ctx.response.body = scores
}