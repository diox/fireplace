define('utils_local',
    ['core/defer', 'core/log', 'core/settings', 'core/urls', 'core/z',
     'jquery', 'salvattore', 'underscore'],
    function(defer, log, settings, urls, z,
             $, salvattore, _) {

    var logger = log('utils_local');
    var check_interval;

    var build_localized_field = function(name) {
        var data = {};
        $('.localized[data-name="' + name + '"]').each(function(i, field) {
            data[this.getAttribute('data-lang')] = this.value;
        });
        return data;
    };

    var items = function(obj) {
        // Like Python's dict.items().
        var items = [];
        var keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
            var item = [];
            item.push(keys[i]);
            item.push(obj[keys[i]]);
            items.push(item);
        }
        return items;
    };

    function offline(def, socket) {
        if (z.onLine) {
            // Fire event for going offline.
            logger.log('Offline detected.');
            z.win.trigger('offline_detected');
            z.onLine = false;
        }
        if (socket) {
            reset_socket(socket);
        }
        def.reject();
    }

    function online(def, socket) {
        if (!z.onLine) {
            // Fire event for going online.
            // Fire event to start loading images.
            logger.log('Online detected.');
            z.win.trigger('online_detected');
            z.onLine = true;
        }
        if (socket) {
            reset_socket(socket);
        }
        def.resolve();
    }

    function reset_socket(socket) {
        socket.onopen = null;
        socket.onerror = null;
        socket.close();
    }

    function checkOnline() {
        // `navigator.onLine` is unreliable (see bugs 654579 and 756364)
        // so we need to test an actual connection.
        var def = defer.Deferred();
        if (window.__mockOffLine === true) {
            offline(def);
            return def.promise();
        } else if (settings.allow_offline) {
            online(def);
            return def.promise();
        }
        
        var i = new Image();
        i.src = urls.media('fireplace/img/online-status-beacon.gif') + '?' + (+new Date());
        i.onload = function() {
            online(def);
        };
        i.onerror = function(e) {
            offline(def);
        };

        return def.promise();
    }

    function checkOnlineDesktop() {
        var def = defer.Deferred();

        

        return def.promise();
    }

    function pollOnlineState() {
        if (check_interval) {
            clearInterval(check_interval);
        }
        check_interval = setInterval(checkOnline, 10000);
    }

    function initSalvattore(elem) {
        // Initializes Salvattore layout on an element.
        if (elem) {
            salvattore.register_grid(elem);
        }

        var width = z.win.width();
        z.win.on('resize', _.debounce(function() {
            var newWidth = z.win.width();
            if (newWidth !== width) {
                salvattore.recreate_columns(elem);
                width = newWidth;
            }
        }, 100));
    }

    function headerTitle(title) {
        document.getElementById('global-header')
                .setAttribute('header-title', title);
        $('.mkt-header--title').text(title);
    }

    return {
        build_localized_field: build_localized_field,
        checkOnline: checkOnline,
        headerTitle: headerTitle,
        initSalvattore: initSalvattore,
        items: items,
        pollOnlineState: pollOnlineState,
    };

});
