define('views/purchases', ['cache', 'l10n', 'linefit', 'notification', 'requests', 'urls', 'utils', 'z'],
    function(cache, l10n, linefit, notification, requests, urls, utils, z) {
    'use strict';

    var gettext = l10n.gettext;

    z.page.on('click', '.remove-from-list', utils._pd(function(e) {
        e.stopPropagation();
        var $this = $(this);
        var app = $this.prev('.install').data('product');
        var item = $this.parents('li.item');
        var confirmationData = {
            'message': gettext('Are you sure you would like to remove {app_name} from your My Apps list?', {app_name: app.name})
        };

        notification.confirmation(confirmationData).done(function() {
            // Immediately remove element from my list.
            item.remove();
            requests.post(urls.api.url('installed-remove-app'), {app: app.id}).done(function() {
                // Bust cache for installed endpoint.
                cache.bust(urls.api.url('installed'));
            });
        }).fail(function() {
            window.console.error('cancelled, its fine its fine');
        });
    }));

    return function(builder, args) {
        builder.start('user/purchases.html');

        var $linefit = $('.linefit');
        if ($linefit.length) {
            $('.linefit').linefit(2);
        }

        builder.z('type', 'root settings purchases');
        builder.z('title', gettext('My Apps'));
        builder.z('parent', urls.reverse('homepage'));
    };
});
