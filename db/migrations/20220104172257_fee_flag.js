
exports.up = function(knex) {
    return knex.schema.table('invoices', function (table) {
        table.boolean('is_fee').notNullable().defaultTo(false);
     });
};

exports.down = function(knex) {
    
    return knex.schema.table('invoices', function (table) {
        table.dropColumn('is_fee');
     });
};
