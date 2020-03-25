var dust = require('dust')();
var form = require('form');
var utils = require('utils');
var serand = require('serand');
var captcha = require('captcha');
var Contact = require('../service');

dust.loadSource(dust.compile(require('./template.html'), 'model-contacts-confirm'));

var configs = {
    phone: {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, done);
        },
        validate: function (context, data, value, done) {
            if (!context.phone) {
                return done();
            }
            if (!value) {
                return done(null, 'Please specify code received via your phone');
            }
            done(null, null, value);
        },
        render: function (ctx, vform, data, value, done) {
            serand.blocks('text', 'create', $('.phone', vform.elem), {}, function (err, context) {
                if (err) {
                    return done(err);
                }
                context.phone = data._.phone;
                done(null, context);
            });
        }
    },
    email: {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, done);
        },
        validate: function (context, data, value, done) {
            if (!context.email) {
                return done();
            }
            if (!value) {
                return done(null, 'Please specify code received via your email');
            }
            done(null, null, value);
        },
        render: function (ctx, vform, data, value, done) {
            serand.blocks('text', 'create', $('.email', vform.elem), {}, function (err, context) {
                if (err) {
                    return done(err);
                }
                context.email = data._.email;
                done(null, context);
            });
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
                        'X-Action': 'confirm'
                    },
                    contentType: 'application/json',
                    data: JSON.stringify(data),
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
    if (options.phone) {
        contact._.phone = true;
    }
    if (options.email) {
        contact._.email = true;
    }
    dust.render('model-contacts-confirm', serand.pack(contact, container, 'model-contacts'), function (err, out) {
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
                        $('.model-contacts-confirm', sandbox).remove();
                    }
                });
                return;
            }
            sandbox.on('click', '.confirm', function (e) {
                utils.loading();
                create(verificationForm, contact, function (err, errors) {
                    utils.loaded();
                    if (err) {
                        return console.error(err);
                    }
                    if (errors) {
                        return;
                    }
                    serand.redirect(utils.query('/contacts/' + contact.id + '/review', {
                        location: options.location || '/contacts'
                    }));
                });
            });
            sandbox.on('click', '.cancel', function (e) {
                serand.redirect(options.location || '/contacts');
            });
            done(null, {
                form: verificationForm,
                clean: function () {
                    $('.model-contacts-confirm', sandbox).remove();
                }
            });
        });
    });
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



