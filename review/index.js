var dust = require('dust')();
var form = require('form');
var utils = require('utils');
var serand = require('serand');
var captcha = require('captcha');
var Contact = require('../service');

dust.loadSource(dust.compile(require('./template.html'), 'model-contacts-review'));
dust.loadSource(dust.compile(require('./editing.html'), 'model-contacts-review-editing'));
dust.loadSource(dust.compile(require('./unpublished.html'), 'model-contacts-review-unpublished'));

var configs = {
    phone: {
        find: function (context, source, done) {
            serand.blocks('checkboxes', 'find', source, function (err, values) {
                if (err) {
                    return done(err);
                }
                done(null, values[0]);
            });
        },
        render: function (ctx, vform, data, value, done) {
            serand.blocks('checkboxes', 'create', $('.phone', vform.elem), {}, function (err, context) {
                if (err) {
                    return done(err);
                }
                context.phone = data.phone;
                done(null, context);
            });
        }
    },
    email: {
        find: function (context, source, done) {
            serand.blocks('checkboxes', 'find', source, function (err, values) {
                if (err) {
                    return done(err);
                }
                done(null, values[0]);
            });
        },
        render: function (ctx, vform, data, value, done) {
            serand.blocks('checkboxes', 'create', $('.email', vform.elem), {}, function (err, context) {
                if (err) {
                    return done(err);
                }
                context.email = data.email;
                done(null, context);
            });
        }
    },
    captcha: {
        find: function (context, source, done) {
            serand.blocks('captcha', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, value);
            });
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please check above to make sure you are not a robot.');
            }
            done(null, null, value);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.captcha', vform.elem);
            serand.blocks('captcha', 'create', el, {
                success: function () {
                    $('.review', vform.elem).removeAttr('disabled');
                }
            }, done);
        }
    },
    _: {
        validate: function (data, done) {
            var field;
            for (field in data) {
                if (!data.hasOwnProperty(field)) {
                    continue;
                }
                if (field === 'captcha') {
                    continue;
                }
                var value = data[field];
                if (value) {
                    return done(null, null, data);
                }
            }
            done(null, {
                _: 'Please specify at least one contact to review.'
            }, data);
        }
    }
};

var create = function (verificationForm, contact, done) {
    verificationForm.find(function (err, data) {
        if (err) {
            return done(err);
        }
        verificationForm.validate(data, function (err, errors, data) {
            if (err) {
                return done(err);
            }
            verificationForm.update(errors, data, function (err) {
                if (err) {
                    return done(err);
                }
                if (errors) {
                    return done(null, errors);
                }
                $.ajax({
                    method: 'POST',
                    url: utils.resolve('accounts:///apis/v/contacts/' + contact.id),
                    headers: {
                        'X-Action': 'review'
                    },
                    contentType: 'application/json',
                    data: JSON.stringify({
                        email: data.email,
                        phone: data.phone
                    }),
                    dataType: 'json',
                    success: function (data) {
                        done(null, null, data);
                    },
                    error: function (xhr, status, err) {
                        done(err || status || xhr);
                    }
                });
            });
        });
    });
};

var render = function (ctx, container, options, contact, done) {
    var sandbox = container.sandbox;
    var verified = contact._ && contact._.verified || {};
    if (contact.status === 'published' || contact.status === 'reviewing') {
        return serand.redirect(options.location || '/contacts');
    }
    var end = function (err) {
        if (err) {
            return done(err);
        }
        done(null, function () {
            $('.model-contacts-review', sandbox).remove();
        });
    };
    if (contact.status === 'unpublished') {
        dust.render('model-contacts-review-unpublished', serand.pack(contact, container, 'model-contacts'), function (err, out) {
            if (err) {
                return done(err);
            }
            sandbox.append(out);
            sandbox.on('click', '.confirm', function () {
                utils.transit('accounts', 'contacts', contact.id, 'publish', function (err) {
                    if (err) {
                        return console.error(err);
                    }
                });
            });
            end();
        });
        return;
    }
    if (contact.status === 'editing') {
        if ((contact.email && !verified.email) || (contact.phone && !verified.phone)) {
            if (options.aborted) {
                return serand.redirect(options.location ? utils.query(options.location, {aborted: true}) : '/contacts');
            }
            return serand.redirect('/contacts/' + contact.id + '/verify', {
                location: utils.url()
            });
        }
        dust.render('model-contacts-review-editing', serand.pack(contact, container, 'model-contacts'), function (err, out) {
            if (err) {
                return done(err);
            }
            sandbox.append(out);
            sandbox.on('click', '.confirm', function () {
                utils.transit('accounts', 'contacts', contact.id, 'review', function (err) {
                    if (err) {
                        return console.error(err);
                    }
                    serand.redirect(options.location || '/contacts');
                });
            });
            sandbox.on('click', '.cancel', function (e) {
                serand.redirect(options.location ? utils.query(options.location, {aborted: true}) : '/contacts');
            });
            end();
        });
        return;
    }
    done(new Error('Unsupported state: ' + contact.status));
};

module.exports = function (ctx, container, options, done) {
    options = options || {};
    Contact.findOne(options, function (err, contact) {
        if (err) {
            return done(err);
        }
        render(ctx, container, options, contact, done);
    });
};



