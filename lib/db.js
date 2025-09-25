const util = require('util');
const mysql = require('mysql');

module.exports = {
    makeDb: function(host, user, password, database) {
        const connection = mysql.createConnection({
            host: host,
            user: user,
            password: password,
            database: database,
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