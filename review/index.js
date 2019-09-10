var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');

dust.loadSource(dust.compile(require('./template.html'), 'contacts-review'));
dust.loadSource(dust.compile(require('./actions.html'), 'contacts-review-actions'));

var find = function (id, done) {
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
    find(options.id,function (err, contact) {
        if (err) {
            return done(err);
        }
        var sandbox = container.sandbox;
        dust.render('contacts-review', serand.pack(contact, container), function (err, out) {
            if (err) {
                return done(err);
            }
            sandbox.append(out);

            $('.contact-ok', sandbox).on('click', function () {
                var thiz = $(this);
                serand.emit('loader', 'start', {
                    delay: 500
                });
                utils.publish('accounts', 'contacts', contact, function (err) {
                    serand.emit('loader', 'end', {});
                    if (err) {
                        return console.error(err);
                    }
                    thiz.removeClass('text-primary').addClass('text-success')
                        .siblings('.contact-bad').addClass('hidden');

                    setTimeout(function () {
                        serand.redirect('/contacts');
                    }, 500);
                });
            });

            done(null, function () {
                $('.contacts-review', sandbox).remove();
            });
        });
    });
};
