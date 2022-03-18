
exports.up = function(knex) {
    return knex.schema.table('tracks', function (table) {
        table.integer('total_msats_fees').unsigned().defaultTo(0);
     })
     .table('tracks_history', function (table) {
        table.integer('total_msats_fees').unsigned().defaultTo(0);
     });
};

exports.down = function(knex) {
    
    return knex.schema.table('tracks', function (table) {
        table.dropColumn('total_msats_fees');
     })
     .table('tracks_history', function (table) {
        table.dropColumn('total_msats_fees');
     });

};
