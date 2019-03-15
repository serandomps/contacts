var utils = require('utils');
var serand = require('serand');
var form = require('form');
var dust = require('dust')();

dust.loadSource(dust.compile(require('./template'), 'contacts'));

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

var creatorConfig = function (o) {
    var oo = {
        name: {
            find: function (context, source, done) {
                done(null, $('input', source).val());
            },
            validate: function (context, data, value, done) {
                if (!value) {
                    return done(null, 'Please specify a name for your contacts');
                }
                done(null, null, value);
            },
            update: function (context, source, error, value, done) {
                $('input', source).val(value);
                done()
            }
        },
        phones: {
            find: function (context, source, done) {
                var value = $('input', source).val();
                done(null, value.trim().split(/\s*,\s*/));
            },
            validate: function (context, data, value, done) {
                if (!value) {
                    return done();
                }
                var i;
                var number;
                var length = value.length;
                for (i = 0; i < length; i++) {
                    number = value[i];
                    if (number && !/^\+[1-9]\d{1,14}$/.test(number)) {
                        return done(null, 'Please enter a valid phone number');
                    }
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
                    return done(null, 'Please enter a valid email address');
                }
                done(null, null, value);
            },
            update: function (context, source, error, value, done) {
                $('input', source).val(value);
                done()
            }
        },
        viber: {
            find: function (context, source, done) {
                done(null, $('input', source).val());
            },
            validate: function (context, data, value, done) {
                if (value && !/^\+[1-9]\d{1,14}$/.test(value)) {
                    return done(null, 'Please enter a valid phone number');
                }
                done(null, null, value);
            },
            update: function (context, source, error, value, done) {
                $('input', source).val(value);
                done()
            }
        },
        whatsapp: {
            find: function (context, source, done) {
                done(null, $('input', source).val());
            },
            validate: function (context, data, value, done) {
                if (value && !/^\+[1-9]\d{1,14}$/.test(value)) {
                    return done(null, 'Please enter a valid phone number');
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

var findContacts = function (options, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('accounts:///apis/v/contacts' + utils.data({user: options.user})),
        dataType: 'json',
        success: function (data) {
            done(null, data);
        },
        error: function (xhr, status, err) {
            done(err);
        }
    });
};

var create = function (contact, done) {
    $.ajax({
        method: 'POST',
        url: utils.resolve('accounts:///apis/v/contacts'),
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(contact),
        success: function (data) {
            done(null, data.id);
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
    findContacts({user: options.user || ctx.user && ctx.user.id}, function (err, contacts) {
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
        dust.render('contacts', {
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
            var o = utils.eventer();

            var pickerForm = form.create(container.id, elem, pickerConfig);
            var creatorForm = form.create(container.id, elem, creatorConfig(options));

            o.find = function (done) {
                pickerForm.find(function (err, o) {
                    if (err) {
                        return done(err);
                    }
                    if (o.contact !== '+') {
                        return done(err, o.contact);
                    }
                    creatorForm.find(function (err, o) {
                        if (err) {
                            return done(err);
                        }
                        creatorForm.validate(o, function (err, errors, contact) {
                            if (err) {
                                return done(err);
                            }
                            done(err, contact);
                        });
                    });
                });
            };
            o.validate = function (cont, done) {
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
            o.update = function (errors, contact, done) {
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
            o.create = function (contact, done) {
                console.log('creating contact');
                console.log(contact);
                if (typeof contact === 'string' || contact instanceof String) {
                    return done(null, null, contact);
                }
                creatorForm.create(contact, function (err, errors, contact) {
                    if (err) {
                        return done(err);
                    }
                    if (errors) {
                        return done(null, errors);
                    }
                    create(contact, function (err, id) {
                        done(err, null, id);
                    });
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
                    done(null, o);
                });
            });
        });
    });
};
