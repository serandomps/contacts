var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');

dust.loadSource(dust.compile(require('./template.html'), 'contacts-find'));

var find = function (done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('accounts:///apis/v/contacts'),
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
    find(function (err, data) {
        if (err) {
            return done(err);
        }
        var sandbox = container.sandbox;
        dust.render('contacts-find', serand.pack({
            title: options.title,
            size: 4,
            contacts: data
        }, container), function (err, out) {
            if (err) {
                return done(err);
            }
            sandbox.append(out);
            done(null, function () {
                $('.contacts-find', sandbox).remove();
            });
        });
    });
};
