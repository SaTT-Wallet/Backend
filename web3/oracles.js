exports.limitStats = (typeSN, stats, ratios, abos, limit = '') => {
    if (!limit) {
        var limits = ratios[4]
        limit = limits[parseInt(typeSN) - 1]
    }
    if (limit > 0) {
        limit = parseFloat(limit)
        var max = Math.ceil((limit * parseFloat(abos)) / 100)
        if (+stats.views > max) {
            stats.views = max
        }
        if (+stats.likes > max) {
            stats.likes = max
        }
        if (+stats.shares > max) {
            stats.shares = max
        }
    }

    return stats
}
