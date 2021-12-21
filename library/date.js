const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

function get() {
    return dayjs.utc().utcOffset(-5).format('YYYYMMDD'); // Chicago DST :)
}


module.exports = {
    get
}