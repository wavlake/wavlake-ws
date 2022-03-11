
exports.up = function(knex) {
    return knex.schema.table('invoices', function (table) {
        table.boolean('forward').notNullable().defaultTo(false);
        table.string('preimage', 128);
        table.integer('fee_msat').unsigned();
     });
};

exports.down = function(knex) {
    
    return knex.schema.table('invoices', function (table) {
        table.dropColumn('forward');
        table.dropColumn('preimage');
        table.dropColumn('fee_msat');
     });
};
