define('newsletter',
    ['jquery', 'notification', 'requests', 'urls', 'utils', 'z'],
    function($, notification, requests, urls, utils, z) {
    'use strict';

    z.body.on('focus', '#newsletter-footer .email', function() {
         $('#newsletter-details').slideDown();
    });

    // Handle newsletter signup form submit.
    z.body.on('submit', '.newsletter form', utils._pd(function() {
        var $form = $(this);
        var $success = $form.siblings('.success');
        var $processing = $form.siblings('.processing');
        var data = utils.getVars($form.serialize());

        $form.addClass('processing-hidden');
        $processing.show();

        requests.post(urls.api.url('newsletter'), data).done(function() {
            $form.remove();
            $processing.remove();
            $success.show();
        }).fail(function() {
            $processing.remove();
            $form.removeClass('processing-hidden');
            notification.notification({message: gettext('There was an error submitting your newsletter sign up request')});
        });
    }));
});
