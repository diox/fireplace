var suite = require('./kasperle').suite();

suite.run('/', function(test, waitFor) {

    waitFor(function() {
        return suite.exists('#splash-overlay.hide');
    });

    test('Click on featured app', function() {
        suite.press('#featured ol li a:last-child');
    });

    waitFor(function() {
        // Wait for the thumbnail to exist and be loaded.
        return suite.exists('.slider li:first-child .screenshot img:not(.deferred)');
    });

    test('Test preview image exists and click it.', function(assert) {
        assert.selectorExists('.slider li:first-child .screenshot img:not(.deferred)');
        suite.press('.slider li:first-child .screenshot img');
    });

    waitFor(function() {
        // Wait for the lightbox to exist and the transition to be over.
        return suite.evaluate(function() {
            var $elm = jQuery('#lightbox.show');
            return $elm.length && parseInt($elm.css('opacity'), 10) == 1;
        });
    });

    test('Test lightbox is opened', function(assert) {
        assert.selectorExists('#lightbox.show', 'Lightbox is visible');

        waitFor(function() {
            // Wait till the image is loaded.
            return suite.exists('#lightbox .content img:not(.deferred)');
        });

        assert.selectorExists('#lightbox .content img:not(.deferred)', 'Screenshot is loaded');
        suite.capture('detail_lightbox.png');
        suite.back();
    });

    waitFor(function() {
        return !suite.visible('#lightbox');
    });

    test('Test lightbox is closed', function(assert) {
        assert.invisible('#lightbox', 'Lightbox should be invisible');
    });
});
