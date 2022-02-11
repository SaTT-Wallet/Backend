module.exports = async function (app) {
    var handlebars = require('handlebars')

    const path = require('path')
    const i18n = require('i18n')
    const cookieParser = require('cookie-parser')
    app.use(cookieParser())
    var i18nManager = {}

    i18nManager.configureTranslation = (lang) => {
        app.use(i18n.init)

        i18n.configure({
            locales: ['fr', 'en'],
            directory: path.join(__dirname, '../public/locales'),
            defaultLocale: lang,
            queryParameter: 'lang',
            cookiename: 'language',
        })
        handlebars.registerHelper('__', function () {
            return i18n.__.apply(this, arguments)
        })
        handlebars.registerHelper('__n', function () {
            return i18n.__n.apply(this, arguments)
        })
    }

    app.i18n = i18nManager
    return app
}

//push test
