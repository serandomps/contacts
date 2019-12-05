var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var Contact = require('../service');

dust.loadSource(dust.compile(require('./template.html'), 'model-contacts-find'));

module.exports = function (ctx, container, options, done) {
    Contact.find({
        query: {
            user: ctx.token && ctx.token.user.id
        }
    }, function (err, data) {
        if (err) {
            return done(err);
        }
        var sandbox = container.sandbox;
        dust.render('model-contacts-find', serand.pack({
            title: options.title,
            size: 6,
            contacts: data
        }, container), function (err, out) {
            if (err) {
                return done(err);
            }
            sandbox.append(out);
            done(null, function () {
                $('.model-contacts-find', sandbox).remove();
            });
        });
    });
};
