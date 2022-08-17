
exports.up = function(knex) {
    return knex.schema
      .createTable('live-invoices', function (table) {
        table.increments('id');
        table.string('recipient', 128).notNullable();
        table.string('r_hash_str', 128).unique().notNullable();
        table.integer('amount').notNullable();
        table.boolean('settled').notNullable();
        table.string('message', 255).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
     });
  };

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('live-invoices')
};
