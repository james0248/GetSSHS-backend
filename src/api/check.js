const
    Game = require('../game/gameManager'),
    bcrypt = require('bcrypt'),
    eventStart = new Date('Thu Mar 26 2020 00:00:00 GMT+0900'),
    eventEnd = new Date('Wed Apr 01 2020 00:00:00 GMT+0900')


let clamp = (number, low, high) => {
    return !(Number.isNaN(number) || !Number.isInteger(number) || number < low || number > high)
}

module.exports = async (ctx, next) => {
    let now = Date.now()
    if(now < eventStart || eventEnd < now) {
        ctx.error(406, 'not-event-time')
    }

    const ranking = ctx.state.collection.ranking
    let game = new Game(4)
    const {
        name,
        inputSeq,
        tileSeq,
        score,
    } = ctx.request.body
    if (
        !name || !(typeof (name) === 'string') ||
        !inputSeq || !(typeof (inputSeq) === 'string') ||
        !tileSeq || !Array.isArray(tileSeq) ||
        !score || Number.isNaN(score) || !Number.isInteger(score)
    ) {
        ctx.error(400, 'form-malformed')
    }

    let inputs = inputSeq.split('').map(dir => {
        if(parseInt(dir) === NaN || !clamp(parseInt(dir), 0, 3)) {
            ctx.error(400, 'form-malformed')
        }
        return parseInt(dir)
    })
    tileSeq.forEach(tile => {
        if(!Array.isArray(tile) || tile.length !== 2 || !clamp(tile[0], 0, 15) || !clamp(tile[1], 1, 2)) {
            ctx.error(400, 'form-malformed')
        }
    })
    if((inputs.length + 2) !== tileSeq.length) {
        ctx.error(400, 'form-malformed')
    }

    game.board.fillEmptyTile(tileSeq[0][0], tileSeq[0][1])
    game.board.fillEmptyTile(tileSeq[1][0], tileSeq[1][1])

    let res = null
    for (let i = 0; i < inputs.length; i++) {
        res = game.listen(inputs[i])
        if (!res.moved) {
            ctx.error(400, 'invalid-sequence')
        }
        if (!game.board.fillEmptyTile(tileSeq[i + 2][0], tileSeq[i + 2][1])) {
            ctx.error(400, 'invalid-sequence')
        }
    }
    if (score !== game.score) {
        ctx.error(400, 'wrong-score')
    }
    let moveable = false
    for (let i = 0; i < 4; i++) {
        moveable = moveable || game.isMoveAvailable(i)
    }
    if(moveable) {
        ctx.error(400, 'game-did-not-end')
    }

    let inputSeqHashed = await bcrypt.hash(inputSeq.trim(), process.env.SALT)
    let tileSeqHashed = await bcrypt.hash(tileSeq.toString().trim(), process.env.SALT)
    let copy = await ranking.find({
        $or: [{
            inputSeqHashed: inputSeqHashed,
            tileSeqHashed: tileSeqHashed
        }]
    }).toArray()

    if (copy.length !== 0) {
        ctx.error(400, 'exactly-same-game-exists')
    }

    let cnt = 0
    tileSeq.forEach(tile => {
        if(tile[1] === 2) {
            cnt++
        }
    })
    let ratio = cnt / tileSeq.length
    if (score > 100000 && (ratio > 0.15 || ratio < 0.05)) {
        console.log(`User ${name} showed attempt to jujak leaderboard with ratio ${ratio} and length ${tileSeq.length} cnt ${cnt}`)
        await ctx.state.collection.jujak.findOneAndUpdate({ name: name }, {
            $set: {
                name: name,
                score: score,
                inputSeqHashed: inputSeqHashed,
                tileSeqHashed: tileSeqHashed,
                tileSeq: tileSeq,
                inputSeq: inputSeq
            }
        }, { upsert: true })
        ctx.response.body = 'success-but-jujak-suspected'
        ctx.response.status = 200
        return
    }

    const rank = await ranking.findOne({ name: name })
    if (rank === null || rank.score < score) {
        await ranking.findOneAndUpdate({ name: name }, {
            $set: {
                name: name,
                score: score,
                inputSeqHashed: inputSeqHashed,
                tileSeqHashed: tileSeqHashed,
                tileSeq: tileSeq,
                inputSeq: inputSeq
            }
        }, { upsert: true })
    }

    ctx.response.body = 'success'
    ctx.response.status = 200
}
