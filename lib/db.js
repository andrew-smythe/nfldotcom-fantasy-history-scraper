const util = require('util');
const mysql = require('mysql');

module.exports = {
    makeDb: function() {
        const connection = mysql.createConnection({
            host: '[host]',
            user: '[your_username]',
            password: '[your_password]',
            database: '[your_database]',
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