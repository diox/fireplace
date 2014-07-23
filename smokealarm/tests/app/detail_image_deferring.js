var suite = require('./kasperle').suite();

suite.run('/', function(test, waitFor) {

    waitFor(function() {
        return suite.exists('#featured');
    });

    test('Click on featured app', function() {
        suite.press('#featured ol li a:first-child');
    });

    waitFor(function() {
        // Wait for reviews to load in.
        return suite.exists('.reviews h3');
    });

    waitFor(function() {
        // Wait for the icon & first thumbnail to exist and be loaded.
        return (suite.exists('img.icon:not(.deferred)') &&
                suite.exists('.slider li:first-child img:not(.deferred)'));
    });

    test('Detail page base deferring tests', function(assert) {
        assert.URL(/\/app\/[a-zA-Z0-9]+/);
        assert.hasText('h3');
        assert.visible('.detail .icon:not(.deferred)');  // Visible icon
        assert.visible('.detail .info button.install');  // Visible icon
        assert.selectorExists('.tray.previews img:not(.deferred)');  // Has preview images
        assert.visible('.tray.previews .dots .dot');  // Has dots for the previews section
        assert.selectorExists('.tray.previews .dots .current');  // At least one of the dots is selected
    });

    // Here we'd need to wait for something telling us there is no more stuff
    // to load. We can't, so we just wait 3 seconds and hope for the best.
    suite.wait(3000);

    test('Detail page image deferring tests', function(assert) {
        // There should still be a couple deferred images that are too far
        // right to be loaded.
        assert.selectorExists('.tray.previews img.deferred');

        // click on the 4th dot. That should load the 2 images.
        suite.press('.previews .dots .dot:nth-child(4)');
    });

    waitFor(function() {
        // Wait for the all thumbnails to exist and be loaded.
        return !suite.exists('.slider img.deferred');
    });

    test('Detail page image deferring click on last dot', function(assert) {
        assert.selectorDoesNotExist('.slider img.deferred');

        suite.capture('detail_image_deferring.png');
    });
});
