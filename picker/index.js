var utils = require('utils');
var serand = require('serand');
var form = require('form');
var dust = require('dust')();

var create = require('../create');

dust.loadSource(dust.compile(require('./template.html'), 'contacts-picker'));

var pickerConfig = {
    contact: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please select an existing contact or create one');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, pickerForm, data, value, done) {
            var picker = $('.picker .contact', pickerForm.elem);
            var creator = $('.creator', pickerForm.elem);
            serand.blocks('select', 'create', picker, {
                value: value,
                change: function () {
                    pickerForm.find(function (err, pick) {
                        if (err) {
                            return done(err);
                        }
                        pickerForm.validate(pick, function (err, errors, contact) {
                            if (err) {
                                return done(err);
                            }
                            pickerForm.update(errors, contact, function (err) {
                                if (err) {
                                    return done(err);
                                }
                                var val = pick.contact;
                                if (val === '+') {
                                    return creator.removeClass('hidden');
                                }
                                creator.addClass('hidden');
                            });
                        });
                    });
                }
            }, done);
        }
    },
};

var findContacts = function (options, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('accounts:///apis/v/contacts' + utils.data({query: {user: options.user}})),
        dataType: 'json',
        success: function (data) {
            done(null, data);
        },
        error: function (xhr, status, err) {
            done(err);
        }
    });
};

var serialize = function (o) {
    var items = [];
    if (o.email) {
        items.push(o.email);
    }
    if (o.phones) {
        o.phones.forEach(function (phone) {
            items.push(phone);
        });
    }
    if (o.viber) {
        items.push(o.viber);
    }
    if (o.whatsapp) {
        items.push(o.whatsapp);
    }
    if (o.messenger) {
        items.push(o.messenger);
    }
    if (o.skype) {
        items.push(o.skype);
    }
    return o.name + ' (' + items.join(' | ') + ')';
};

// Need to define a form and call create
module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    options = options || {};
    findContacts({user: options.user || ctx.token && ctx.token.user.id}, function (err, contacts) {
        if (err) {
            return done(err);
        }
        var picks = [
            {value: '', label: 'Contacts'},
            {value: '+', label: 'Add Contacts'}
        ];
        picks = picks.concat(_.map(contacts, function (contact) {
            return {
                value: contact.id,
                label: serialize(contact)
            }
        }));
        dust.render('contacts-picker', {
            _: {
                label: options.label,
                container: container.id,
                picks: picks
            }
        }, function (err, out) {
            if (err) {
                return done(err);
            }
            var elem = sandbox.append(out);

            var pickerForm = form.create(container.id, elem, pickerConfig);

            var eventer = utils.eventer();

            create(ctx, {
                id: container.id,
                sandbox: $('.creator', elem),
                parent: elem
            }, null, function (err, o) {
                if (err) {
                    return done(err)
                }
                var creatorForm = o.form;
                var create = o.create;
                eventer.find = function (done) {
                    pickerForm.find(function (err, o) {
                        if (err) {
                            return done(err);
                        }
                        if (o.contact !== '+') {
                            return done(err, o.contact);
                        }
                        creatorForm.find(done);
                    });
                };
                eventer.validate = function (cont, done) {
                    pickerForm.find(function (err, o) {
                        if (err) {
                            return done(err);
                        }
                        if (o.contact !== '+') {
                            pickerForm.validate({
                                contact: cont
                            }, function (err, errors) {
                                if (err) {
                                    return done(err);
                                }
                                done(err, errors, cont);
                            });
                            return;
                        }
                        creatorForm.validate(cont, done);
                    });
                };
                eventer.update = function (errors, contact, done) {
                    pickerForm.find(function (err, o) {
                        if (err) {
                            return done(err);
                        }
                        if (o.contact !== '+') {
                            return pickerForm.update(errors, contact, done);
                        }
                        creatorForm.update(errors, contact, done);
                    });
                };
                eventer.create = function (contact, done) {
                    console.log('creating contact');
                    console.log(contact);
                    if (typeof contact === 'string' || contact instanceof String) {
                        return done(null, null, contact);
                    }
                    o.create(function (err, errors, contact) {
                        if (err) {
                            return done(err);
                        }
                        if (errors) {
                            return done(null, errors);
                        }
                        done(null, null, contact.id);
                    });
                };

                pickerForm.render(ctx, {
                    contact: options.contact
                }, function (err) {
                    if (err) {
                        return done(err);
                    }
                    creatorForm.render(ctx, {
                        contact: options.contact
                    }, function (err) {
                        if (err) {
                            return done(err);
                        }
                        done(null, eventer);
                    });
                });
            });
        });
    });
};
