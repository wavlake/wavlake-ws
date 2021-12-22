exports.seed = function(knex) {
    // Deletes ALL existing entries
    return knex('tracks').del()
      .then(function () {
        // Inserts seed entries
        return knex('tracks').insert([
          { id: 1,
            owner: 'zD3gRw2HbY0uzjqqf4DboDN5D7vm',
            bucket: 'bucketname',
            cid: '24cb571d-91f8-4715-878a-a87004b233d1.mp3', 
            play_count: 10,
            plays_remaining: 20,
            msats_per_play: 10000  },
          { id: 2,
            owner: 'zD3gRw2HbY0uzjqqf4DboDN5D7vm',
            bucket: 'bucketname',
            cid: '43d211cc-845e-4d20-9cd3-72947f86af01.mp3', 
            play_count: 10,
            plays_remaining: 2,
            msats_per_play: 5000 },
        ]);
      });
  };
  