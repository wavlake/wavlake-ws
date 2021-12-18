
exports.up = function(knex) {
  return knex.schema
    .dropTable('tracks')
    .createTable('tracks', function (table) {
        table.increments('id');
        table.string('owner', 128).notNullable();
        table.string('bucket', 128).notNullable();
        table.string('cid', 128).notNullable();
        table.integer('play_count').unsigned().notNullable();
        table.integer('plays_remaining').unsigned().notNullable();
        table.integer('msats_per_play').unsigned().notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      })
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('tracks')
};
