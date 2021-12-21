
exports.up = function(knex) {
    return knex.schema.table('owners', function (table) {
        table.dropColumn('fee_interval');
     })
     .table('fees', function (table) {
        table.integer('paid').unsigned().notNullable().defaultTo(0).alter();
     });
};

exports.down = function(knex) {
    
    return knex.schema.table('owners', function (table) {
        table.integer('fee_interval').unsigned().notNullable().defaultTo(0);
     })
     .table('fees', function (table) {
        table.boolean('paid').notNullable().defaultTo(false).alter();
     });
};
