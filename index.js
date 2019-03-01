var utils = require('utils');
var form = require('form');
var dust = require('dust')();

dust.loadSource(dust.compile(require('./template'), 'contacts'));

var configs = function (o) {
    var oo = {
        email: {
            find: function (context, source, done) {
                done(null, $('input', source).val());
            },
            validate: function (context, data, value, done) {
                if (value && !is.email(value)) {
                    return done(null, 'Please enter a valid email address');
                }
                done(null, null, value);
            },
            update: function (context, source, error, value, done) {
                $('input', source).val(value);
                done()
            }
        },
        messenger: {
            find: function (context, source, done) {
                done(null, $('input', source).val());
            },
            validate: function (context, data, value, done) {
                done(null, null, value);
            },
            update: function (context, source, error, value, done) {
                $('input', source).val(value);
                done()
            }
        }
    };

    if (o.required) {
        oo._ = {
            validate: function (data, done) {
                var field;
                for (field in data) {
                    if (!data.hasOwnProperty(field)) {
                        continue;
                    }
                    var value = data[field];
                    if (value) {
                        return done(null, null, data);
                    }
                }
                done(null, {
                    _: 'Please specify at least one contact information'
                }, data);
            }
        };
    }

    return oo;
};

// Need to define a form and call create
module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    dust.render('contacts', {
        contacts: options.contacts,
        _: {
            container: container.id
        }
    }, function (err, out) {
        if (err) {
            return done(err);
        }
        var elem = sandbox.append(out);
        var contactsForm = form.create(container.id, elem, configs(options));
        done(null, contactsForm);
    });
};
