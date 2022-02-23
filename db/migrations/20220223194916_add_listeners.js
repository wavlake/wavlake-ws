
exports.up = function(knex) {
    return knex.schema
        .createTable('listener_plays', function (table) {
            table.increments('id');
            table.unique(['cid', 'date_utc']);
            table.string('cid', 128).notNullable();
            table.string('date_utc', 128).notNullable();
            table.integer('play_count').unsigned().notNullable().defaultTo(0);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        .createTable('listener_tips', function (table) {
            table.increments('id');
            table.unique(['cid', 'date_utc']);
            table.string('cid', 128).notNullable();
            table.string('date_utc', 128).notNullable();
            table.integer('total_msats').unsigned().notNullable().defaultTo(0);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        .createTable('listeners', function (table) {
            table.increments('id');
            table.unique('listener_id');
            table.string('listener_id', 128).notNullable();
            table.integer('balance_msats').unsigned().notNullable().defaultTo(0);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        .createTable('listener_invoices', function (table) {
            table.increments('id');
            table.string('r_hash_str', 128).unique().notNullable();
            table.integer('price_msat').notNullable();
            table.boolean('settled').notNullable();
            table.string('listener_id', 128).notNullable();
            table.boolean('recharged').notNullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
         })
         .createTable('owner_payments', function (table) {
            table.increments('id');
            table.string('owner_id', 128).notNullable();
            table.string('date_utc', 128).notNullable();
            table.integer('total_msats_due').unsigned().notNullable().defaultTo(0);
            table.boolean('paid').notNullable().defaultTo(false);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
         })
         .table('invoices', function (table) {
            table.dropColumn('is_fee');
         });
};

exports.down = function(knex) {
    
    return knex.schema
        .dropTable('listener_plays')
        .dropTable('listener_tips')
        .dropTable('listener_invoices')
        .dropTable('listeners')
        .dropTable('owner_payments')
        .table('invoices', function (table) {
            table.boolean('is_fee').notNullable().defaultTo(false);
         });

};
