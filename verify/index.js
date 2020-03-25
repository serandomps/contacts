var dust = require('dust')();
var form = require('form');
var utils = require('utils');
var serand = require('serand');
var captcha = require('captcha');
var Contact = require('../service');

dust.loadSource(dust.compile(require('./template.html'), 'model-contacts-verify'));

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
            serand.blocks('checkboxes', 'create', $('.phone', vform.elem), {value: value}, function (err, context) {
                if (err) {
                    return done(err);
                }
                context.phone = value;
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
            serand.blocks('checkboxes', 'create', $('.email', vform.elem), {value: value}, function (err, context) {
                if (err) {
                    return done(err);
                }
                context.email = value;
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
                    $('.verify', vform.elem).removeAttr('disabled');
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
                _: 'Please specify at least one contact to verify.'
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
                        'X-Action': 'verify'
                    },
                    contentType: 'application/json',
                    data: JSON.stringify({
                        email: data.email,
                        phone: data.phone
                    }),
                    dataType: 'json',
                    success: function () {
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
    contact._.parent = container.parent;
    if (contact.email) {
        contact._.emails = [{
            label: contact.email,
            value: contact.email
        }];
    }
    if (contact.phone) {
        contact._.phones = [{
            label: contact.phone,
            value: contact.phone
        }];
    }
    dust.render('model-contacts-verify', serand.pack(contact, container, 'model-contacts'), function (err, out) {
        if (err) {
            return done(err);
        }
        var elem = sandbox.append(out);
        var verificationForm = form.create(container.id, elem, configs);
        ctx.form = verificationForm;
        verificationForm.render(ctx, contact, function (err) {
            if (err) {
                return done(err);
            }
            if (container.parent) {
                done(null, {
                    create: function (created) {
                        create(verificationForm, contact, function (err, errors, data) {
                            if (err) {
                                return created(err);
                            }
                            if (errors) {
                                return created(null, errors)
                            }
                            created(null, null, data);
                        });
                    },
                    form: verificationForm,
                    clean: function () {
                        $('.model-contacts-verify', sandbox).remove();
                    }
                });
                return;
            }
            sandbox.on('click', '.verify', function (e) {
                utils.loading();
                create(verificationForm, contact, function (err, errors, data) {
                    utils.loaded();
                    if (err) {
                        return console.error(err);
                    }
                    if (errors) {
                        return;
                    }
                    var query = {
                        location: options.location || '/contacts'
                    };
                    if (data.email) {
                        query.email = data.email;
                    }
                    if (data.phone) {
                        query.phone = data.phone;
                    }
                    serand.redirect(utils.query('/contacts/' + contact.id + '/confirm', query));
                });
            });
            sandbox.on('click', '.cancel', function (e) {
                serand.redirect(options.location ? utils.query(options.location, {aborted: true}) : '/contacts');
            });
            done(null, {
                form: verificationForm,
                clean: function () {
                    $('.model-contacts-verify', sandbox).remove();
                }
            });
        });
    });
};

module.exports = function (ctx, container, options, done) {
    options = options || {};
    if (options.canceled) {
        return serand.redirect(options.location ? utils.query(options.location, {canceled: true}) : '/contacts');
    }
    Contact.findOne(options, function (err, contact) {
        if (err) {
            return done(err);
        }
        if (!contact) {
            return serand.redirect(options.location || '/contacts');
        }
        var verified = contact._ && contact._.verified || {};
        if ((!contact.email || verified.email) && (!contact.phone || verified.phone)) {
            return serand.redirect(utils.query('/contacts/' + contact.id + '/review', {
                location: options.location || '/contacts'
            }));
        }
        render(ctx, container, options, contact, done);
    });
};



