class gameBoard {
    constructor(size) {
        this.size = size
        this.board = new Array(size).fill(0).map(() => new Array(size).fill({
            rank: 0,
            isMerged: false,
            isNew: false,
        }))
    }

    fillEmptyTile(position, rank) {
        let x = Math.floor(position / this.size), y = position % this.size
        let isEmpty = this.isEmpty({ x: x, y: y })
        this.setTile({ x: x, y: y }, {
            rank: rank,
            isMerged: false,
            isNew: true,
        })
        return isEmpty
    }

    isEmpty(pos) {
        return this.board[pos.x][pos.y].rank === 0
    }

    setTile(pos, tile) {
        this.board[pos.x][pos.y] = tile
    }

    getTileRank(pos) {
        return this.board[pos.x][pos.y].rank
    }

    getTile(pos) {
        return this.board[pos.x][pos.y]
    }

    print() {
        this.board.forEach(row => {
            let seq = ''
            row.forEach(t => {
                seq += (t.rank + ' ')
            })
            console.log(seq)
        })
    }
}

module.exports = gameBoard