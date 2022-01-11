
exports.up = function(knex) {
    return knex.schema.table('owners', function (table) {
        table.renameColumn('user_id', 'owner_id');
    });
};

exports.down = function(knex) {
    return knex.schema.table('owners', function (table) {
        table.renameColumn('owner_id', 'user_id');
    });
};
