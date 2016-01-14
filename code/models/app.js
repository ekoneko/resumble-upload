var Sequelize = require('sequelize');

module.exports = {
    attributes: {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: Sequelize.STRING(40),
            allowNull: false,
            comment: "站点名称"
        },
        secret: {
            type: Sequelize.STRING(16),
            allowNull: false,
            comment: "鉴权用密钥"
        }
    },
    options: {}
}