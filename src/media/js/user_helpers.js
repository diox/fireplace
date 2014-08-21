define('user_helpers', ['settings', 'storage', 'user', 'utils'],
       function(settings, storage, user, utils) {

    var initialArgs = utils.getVars();

    var region_geoip = null;

    function region(default_, ignore_geoip) {
        if ('region' in initialArgs &&
            initialArgs.region &&
            settings.REGION_CHOICES_SLUG[initialArgs.region]) {
            return initialArgs.region;
        }
        return user.get_setting('region_override') ||
               user.get_setting('region_sim') ||
               region_geoip ||
               (!ignore_geoip && user.get_setting('region_geoip')) ||
               default_ ||
               '';
    }

    function carrier() {
        if ('carrier' in initialArgs) {
            return initialArgs.carrier;
        }
        return user.get_setting('carrier_override') ||
               user.get_setting('carrier_sim') ||
               '';
    }

    function dev(_dev) {
        // On desktop, obey the device_filtering pref (defaults to True if
        // missing).
        if (_dev == 'desktop' && storage.getItem('device_filtering') === false) {
            return null;
        }
        return _dev;
    }

    return {
        carrier: carrier,
        dev: dev,
        region: region,
        set_region_geoip: function(region) {
            region_geoip = region;
            user.update_settings({region_geoip: region});
        }
    };
});
