
exports.up = function(knex) {
    return knex.schema.table('tracks', function (table) {
        table.string('title').notNullable().defaultTo("");
        table.string('artist').notNullable().defaultTo("");
     })
     .createTable('tracks_history', function (table) {
        table.increments('id');
        table.string('owner', 128).notNullable();
        table.string('bucket', 128).notNullable();
        table.string('cid', 128).notNullable();
        table.integer('play_count').unsigned().notNullable();
        table.integer('plays_remaining').unsigned().notNullable();
        table.integer('msats_per_play').unsigned().notNullable();
        table.integer('total_msats_earned').unsigned().notNullable().defaultTo(0);
        table.timestamp('deleted_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.string('title').notNullable().defaultTo("");
        table.string('artist').notNullable().defaultTo("");
      })
};

exports.down = function(knex) {
    
    return knex.schema.table('tracks', function (table) {
        table.dropColumn('title');
        table.dropColumn('artist');
     })
    
    .dropTable('tracks_history');

};
