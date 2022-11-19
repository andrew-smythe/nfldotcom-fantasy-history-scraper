const util = require('util');
const mysql = require('mysql');

module.exports = {
    makeDb: function() {
        const connection = mysql.createConnection({
            host: '[mysql_host]',
            user: '[mysql_user]',
            password: '[mysql_password]',
            database: '[mysql_database]',
        });

        return {
            query(sql, args) {
                return util.promisify(connection.query).call(connection, sql, args);
            },
            close() {
                return util.promisify(connection.end).call(connection);
            }
        }
    }
}