import getAll from '../library/tracks.js'
import knex from '../library/db.js';

// Get all tracks
export default function getAll() {
    log.debug(`Get all tracks`);
    return knex('tracks')
             .then(data => {
                return data
                })
             .catch(err => {
                return err
    })
}


// module.exports = {
//     getAll,
// }
