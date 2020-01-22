var dust = require('dust')();
var form = require('form');
var utils = require('utils');
var serand = require('serand');
var Contact = require('../service');

dust.loadSource(dust.compile(require('./template.html'), 'model-contacts-create'));

var configs = {
    name: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please specify a name for your contacts.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    phone: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done();
            }
            if (!/^\+[1-9]\d{1,14}$/.test(value)) {
                return done(null, 'Please enter a valid phone number.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    email: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (value && !is.email(value)) {
                return done(null, 'Please enter a valid email address.');
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
    },
    skype: {
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
    },
    _: {
        validate: function (data, done) {
            var field;
            for (field in data) {
                if (!data.hasOwnProperty(field)) {
                    continue;
                }
                if (field === 'name') {
                    continue;
                }
                var value = data[field];
                if (value) {
                    return done(null, null, data);
                }
            }
            done(null, {
                _: 'Please specify at least one contact information.'
            }, data);
        }
    }
};

var create = function (contactsForm, contact, done) {
    contactsForm.find(function (err, data) {
        if (err) {
            return done(err);
        }
        contactsForm.validate(data, function (err, errors, data) {
            if (err) {
                return done(err);
            }
            contactsForm.update(errors, data, function (err) {
                if (err) {
                    return done(err);
                }
                if (errors) {
                    return done(null, errors);
                }
                var o = {};
                if (contact) {
                    o.id = contact.id;
                }
                Object.keys(data).forEach(function (key) {
                    var value = data[key];
                    if (Array.isArray(value)) {
                        if (!value.length) {
                            return;
                        }
                        o[key] = data[key];
                        return;
                    }
                    if (value) {
                        o[key] = value;
                    }
                });
                Contact.create(o, function (err, data) {
                    if (err) {
                        return done(err);
                    }
                    done(null, null, data);
                });
            });
        });
    });
};

var render = function (ctx, container, options, contact, done) {
    var sandbox = container.sandbox;
    var cont = _.cloneDeep(contact || {
        name: options.contacts ? null : 'Primary'
    });
    cont._ = cont._ || {};
    cont._.parent = container.parent;
    dust.render('model-contacts-create', serand.pack(cont, container, 'model-contacts'), function (err, out) {
        if (err) {
            return done(err);
        }
        var elem = sandbox.append(out);
        var contactsForm = form.create(container.id, elem, configs);
        ctx.form = contactsForm;
        contactsForm.render(ctx, contact, function (err) {
            if (err) {
                return done(err);
            }
            if (container.parent) {
                done(null, {
                    create: function (created) {
                        create(contactsForm, contact, function (err, errors, data) {
                            if (err) {
                                return created(err);
                            }
                            if (errors) {
                                return created(null, errors)
                            }
                            created(null, null, data);
                        });
                    },
                    form: contactsForm,
                    clean: function () {
                        $('.model-contacts-create', sandbox).remove();
                    }
                });
                return;
            }
            sandbox.on('click', '.create', function (e) {
                utils.loading();
                create(contactsForm, contact, function (err, errors, contact) {
                    utils.loaded();
                    if (err) {
                        return console.error(err);
                    }
                    if (errors) {
                        return;
                    }
                    var verified = contact._ && contact._.verified || {};
                    if ((!contact.email || verified.email) && (!contact.phone || verified.phone)) {
                        return serand.redirect('/contacts');
                    }
                    serand.redirect('/contacts/' + contact.id + '/verify');
                });
            });
            sandbox.on('click', '.cancel', function (e) {
                serand.redirect(options.location || '/contacts');
            });
            done(null, {
                form: contactsForm,
                clean: function () {
                    $('.model-contacts-create', sandbox).remove();
                }
            });
        });
    });
};

module.exports = function (ctx, container, options, done) {
    options = options || {};
    var id = options.id;
    if (!id) {
        return render(ctx, container, options, null, done);
    }
    Contact.findOne(options, function (err, contact) {
        if (err) {
            return done(err);
        }
        render(ctx, container, options, contact, done);
    });
};



