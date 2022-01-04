exports.up = function(knex) {
    return knex.schema.table('plays', function (table) {
        table.renameColumn('date_utc', 'date_chi');
     });
};

exports.down = function(knex) {
    
    return knex.schema.table('plays', function (table) {
        table.renameColumn('date_chi', 'date_utc');
     });
};
