
exports.up = function(knex) {
    return knex.schema
      .createTable('tracks', function (table) {
        table.increments('id');
        table.unique(['client', 'cid']);
        table.string('client', 128).notNullable();
        table.string('cid', 128).notNullable();
        table.integer('play_count').unsigned().notNullable();
        table.integer('plays_remaining').unsigned().notNullable();
        table.integer('msats_per_play').unsigned().notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      })
      .createTable('invoices', function (table) {
        table.increments('id');
        table.string('r_hash_str', 128).unique().notNullable();
        table.integer('price_msat').notNullable();
        table.boolean('settled').notNullable();
        table.string('cid', 128).notNullable();
        table.boolean('recharged').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
     });
  };

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('tracks')
                      .dropTableIfExists('invoices')
};
