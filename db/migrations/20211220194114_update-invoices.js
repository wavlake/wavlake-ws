
exports.up = function(knex) {
    return knex.schema
        .dropTable('invoices')
        .createTable('invoices', function (table) {
        table.increments('id');
        table.string('owner', 128).notNullable();
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
    return knex.schema
        .dropTable('invoices')
};
