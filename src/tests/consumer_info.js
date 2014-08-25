(function() {
var a = require('assert');
var eq_ = a.eq_;
var contains = a.contains;
var mock = a.mock;
var defer = require('defer');
var urls = require('urls');

function mockConsumerInfoRequestSuccess(data) {
    return function(args) {
        var def = defer.Deferred();
        def.args = args;
        def.resolve(data);
        return def;
    };
}

function mockConsumerInfoRequestFailure(data) {
    return function(args) {
        var def = defer.Deferred();
        def.args = args;
        def.reject();
        return def;
    };
}

test('consumer_info automatically set region and switches when required', function(done, fail) {
    var geoip_region = null;
    var settings = {};
    mock(
        'consumer_info',
        {
            requests: {
                get: mockConsumerInfoRequestSuccess({
                    region: 'nowhere',
                    waffle: {
                        switches: ['dummy-switch']
                    },
                    fxa_auth_state: 'fxa_auth_state',
                    fxa_auth_url: 'fxa_auth_url'
                }
            )},
            user: {logged_in: function() { return false; }},
            settings: settings,
            user_helpers: {
                dev: function(x) { return x; },
                region: function(x, y) { return ''; },
                carrier: function() { return ''; },
                set_region_geoip: function(r) { geoip_region = r; }
            }
        },
        function(consumer_info) {
            var promise = consumer_info.promise;
            promise.then(function() {
                eq_(geoip_region, 'nowhere');
                eq_(settings.fxa_auth_state, 'fxa_auth_state');
                eq_(settings.fxa_auth_url, 'fxa_auth_url');
                eq_(settings.switches.length, 1);
                contains(settings.switches, 'dummy-switch');
                done();
            });
        },
        fail
    );
});

test('consumer_info automatically does not reset region if already present', function(done, fail) {
    var geoip_region = null;
    mock(
        'consumer_info',
        {
            requests: {get: mockConsumerInfoRequestSuccess({region: 'nowhere'})},
            user: {logged_in: function() { return false; }},
            user_helpers: {
                dev: function(x) { return x; },
                region: function(x, y) { return 'previous_region'; },
                carrier: function() { return ''; },
                set_region_geoip: function(r) { geoip_region = r; }
            }
        },
        function(consumer_info) {
            var promise = consumer_info.promise;
            promise.then(function() {
                // We already had a region, we shouldn't have reset it.
                eq_(geoip_region, null);
                done();
            });
        },
        fail
    );
});

test('consumer_info automatically sets region to restofworld if API call fails', function(done, fail) {
    var geoip_region = null;
    mock(
        'consumer_info',
        {
            requests: {get: mockConsumerInfoRequestFailure()},
            user_helpers: {
                dev: function(x) { return x; },
                region: function(x, y) { return ''; },
                carrier: function() { return ''; },
                set_region_geoip: function(r) { geoip_region = r; }
            }
        },
        function(consumer_info) {
            var promise = consumer_info.promise;
            promise.then(function() {
                eq_(geoip_region, 'restofworld');
                done();
            });
        },
        fail
    );
});

})();
