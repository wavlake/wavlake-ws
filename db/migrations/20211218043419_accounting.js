
exports.up = function(knex) {
    return knex.schema
      .createTable('plays', function (table) {
        table.increments('id');
        table.unique(['cid', 'date_utc']);
        table.string('cid', 128).notNullable();
        table.string('date_utc', 128).notNullable();
        table.integer('play_count').unsigned().notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      })
      .createTable('tips', function (table) {
        table.increments('id');
        table.unique(['cid', 'date_utc']);
        table.string('cid', 128).notNullable();
        table.string('date_utc', 128).notNullable();
        table.integer('total_msats').unsigned().notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
     })
     .createTable('owners', function (table) {
        table.increments('id');
        table.string('salt', 128).notNullable();
        table.string('user_id', 128).notNullable();
        table.string('server_type', 128).notNullable();
        table.text('config').notNullable();
        table.integer('fee_interval').unsigned().notNullable().defaultTo(0);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
     })
     .createTable('fees', function (table) {
        table.increments('id');
        table.string('owner', 128).notNullable();
        table.integer('fee_interval').unsigned().notNullable();
        table.boolean('due').notNullable();
        table.boolean('paid').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
     });
  };

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('plays')
                      .dropTableIfExists('tips')
                      .dropTableIfExists('owners')
                      .dropTableIfExists('fees')
};
