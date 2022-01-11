const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

function get() {
    return dayjs.utc().format('YYYYMMDD');
}


module.exports = {
    get
}