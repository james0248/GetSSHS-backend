const
    Game = require('../game/gameManager'),
    bcrypt = require('bcrypt')

let clamp = (number, low, high) => {
    return !(Number.isNaN(number) || !Number.isInteger(number) || number < low || number > high)
}

module.exports = async (ctx, next) => {
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

    let isValid = true
    let inputs = inputSeq.split('').map(dir => {
        isValid = isValid && clamp(parseInt(dir), 0, 3)
        return parseInt(dir)
    })
    tileSeq.forEach(tile => {
        isValid = isValid && clamp(tile[0], 0, 15) && clamp(tile[1], 1, 2)
    })
    isValid = isValid && ((inputs.length + 2) === tileSeq.length)

    if (!isValid) {
        ctx.error(400, 'form-malformed')
    }

    game.board.fillEmptyTile(tileSeq[0][0], tileSeq[0][1])
    game.board.fillEmptyTile(tileSeq[1][0], tileSeq[1][1])

    for (let i = 0; i < inputs.length; i++) {
        let res = game.listen(inputs[i])
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

    let inputSeqHashed = await bcrypt.hash(inputSeq.trim(), await bcrypt.genSalt(10))
    let tileSeqHashed = await bcrypt.hash(tileSeq.toString().trim(), await bcrypt.genSalt(10))
    let copy = await ranking.find({
        $or: [{
            inputSeqHashed: inputSeqHashed,
            tileSeqHashed: tileSeqHashed
        }]
    }).toArray()
    if (copy.length !== 0) {
        ctx.error(400, 'exactly-same-game-exists')
    }

    const ranking = ctx.state.collection.ranking
    const rank = await ranking.findOne({ name: name })
    if (rank === null || rank.score < score) {
        await ranking.findOneAndUpdate({ name: name }, {
            $set: {
                name: name,
                score: score,
                inputSeqHashed: inputSeqHashed,
                tileSeqHashed: tileSeqHashed
            }
        }, { upsert: true })
    }

    ctx.response.body = 'success'
    ctx.response.status = 200
}