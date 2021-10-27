const apiKeys = require('../../.keys/api_keys.json')

exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('tracks').del()
    .then(function () {
      // Inserts seed entries
      return knex('tracks').insert([
        { id: 1,
          client: apiKeys['clients']['wavlake']['pubkey'],
          cid: 'QmatwgkRD6NxLKb5kjgfAGVJnTKyYJgSWEhToX4PJTah6D', 
          play_count: 10,
          plays_remaining: 100,
          msats_per_play: 100000  },
        { id: 2,
          client: apiKeys['clients']['wavlake']['pubkey'],
          cid: 'QmVtg153myuo393pL4vyUj89vKAc7GfzfhSwp4euK5JHmP', 
          play_count: 10,
          plays_remaining: 2,
          msats_per_play: 50000 },
      ]);
    });
};
