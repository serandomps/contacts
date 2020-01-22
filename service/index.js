var utils = require('utils');

var verifiable = function (data) {
    var o = Array.isArray(data) ? data : [data];
    o.forEach(function (d) {
        d._ = d._ || (d._ = {});
        var verified = d._.verified || (d._.verified = {});
        if (d.email && !verified.email) {
            d._.verify = true;
            return;
        }
        if (d.phone && !verified.phone) {
            d._.verify = true;
            return;
        }
    });
    return data;
};

exports.findOne = function (options, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('accounts:///apis/v/contacts/' + options.id),
        dataType: 'json',
        success: function (data) {
            done(null, verifiable(data));
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

exports.find = function (options, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('accounts:///apis/v/contacts' + utils.toData(options)),
        dataType: 'json',
        success: function (data) {
            done(null, verifiable(data));
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

exports.remove = function (options, done) {
    $.ajax({
        method: 'DELETE',
        url: utils.resolve('accounts:///apis/v/contacts/' + options.id),
        dataType: 'json',
        success: function (data) {
            done(null, data);
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

exports.create = function (options, done) {
    $.ajax({
        url: utils.resolve('accounts:///apis/v/contacts' + (options.id ? '/' + options.id : '')),
        type: options.id ? 'PUT' : 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(options),
        success: function (data) {
            done(null, verifiable(data));
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};
