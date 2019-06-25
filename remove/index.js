var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var contacts = require('../findone');

dust.loadSource(dust.compile(require('./template.html'), 'contacts-remove'));

var remove = function (id, done) {
    $.ajax({
        method: 'DELETE',
        url: utils.resolve('accounts:///apis/v/contacts/' + id),
        dataType: 'json',
        success: function (data) {
            done(null, data);
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

var findOne = function (id, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('accounts:///apis/v/contacts/' + id),
        dataType: 'json',
        success: function (data) {
            done(null, data);
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    findOne(options.id, function (err, contact) {
        if (err) {
            return done(err);
        }
        dust.render('contacts-remove', serand.pack(contact, container), function (err, out) {
            if (err) {
                return done(err);
            }
            var el = sandbox.append(out);
            var id = options.id;
            $('.remove', el).on('click', function () {
                remove(id, function (err) {
                    if (err) {
                        return console.error(err);
                    }
                    serand.redirect('/contacts');
                });
            });
            contacts(ctx, serand.pack({}, {
                id: container.id,
                sandbox: $('.contacts', sandbox)
            }), contact, function (err, clean) {
                if (err) {
                    return done(err);
                }
                done(null, function () {
                    clean();
                });
            });
        });
    });
};
