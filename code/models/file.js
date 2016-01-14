var Sequelize = require('sequelize');

module.exports = {
    attributes: {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        appid: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
        },
        file: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: "文件识别标识"
        },
        filemd5: {
            type: Sequelize.STRING(32),
            defaultValue: '',
            allowNull: false,
            comment: "文件md5"
        },
        filesize: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            comment: "文件实际大小"
        },
        uploadsize: {
            type: Sequelize.INTEGER.UNSIGNED,
            defaultValue: 0,
            allowNull: false,
            comment: "文件已上传大小"
        },
        path: {
            type: Sequelize.STRING(50),
            allowNull: false,
            comment: "相对物理地址"
        },
        comment: {
            type: Sequelize.STRING(140),
            defaultValue: '',
            allowNull: false,
            comment: "备注"
        }
    },
    options: {
        indexes: [
            {fields: ['appid']},
            {fields: ['filemd5', 'filesize']}
        ]
    }
}