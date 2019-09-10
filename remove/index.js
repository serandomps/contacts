var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var Contact = require('../service');

dust.loadSource(dust.compile(require('./template'), 'contacts-remove'));

module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    Contact.findOne({id: options.id}, function (err, contact) {
        if (err) return done(err);
        dust.render('contacts-remove', serand.pack(contact, container), function (err, out) {
            if (err) {
                return done(err);
            }
            var el = sandbox.append(out);
            $('.remove', el).on('click', function () {
                Contact.remove(contact, function (err) {
                    if (err) {
                        return console.error(err);
                    }
                    serand.redirect('/contacts');
                });
            });
            done(null, function () {
                $('.contacts-remove', sandbox).remove();
            });
        });
    });
};
