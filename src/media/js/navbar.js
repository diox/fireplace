define('navbar',
    ['categories', 'jquery', 'jquery.hammer', 'log', 'navigation', 'nunjucks',
     'settings', 'storage', 'underscore', 'urls', 'z'],
    function(cats, $, hammer, log, navigation, nunjucks,
             settings, storage, _, urls, z) {
    'use strict';

    var console = log('navbar');

    // Tab name must match route/view name to match window.location.pathname.
    var tabsMkt = ['homepage', 'new', 'popular', 'categories'];
    var tabsSettings = ['settings', 'purchases', /*'help',*/ 'feedback'];

    // Navbar settings + Marketplace buttons.
    function initNavbarButtons() {
        var $mktNavGroup = $('.nav-mkt , .act-tray.mobile');
        var $settingsNavGroup = $('.nav-settings, .mkt-tray');

        function toggleNavbar($on, $off) {
            $on.addClass('active');
            $off.removeClass('active');
            // Highlight first child if haven't visited this nav yet.
            if (!$on.find('li.active').length) {
                $('li:first-child', $on).addClass('active');
            }
        }

        // Toggle between Settings page and Marketplace pages.
        z.body.on('click', '.act-tray.mobile', function(e) {
            // Activate Settings page navbar.
            e.preventDefault();
            toggleNavbar($settingsNavGroup, $mktNavGroup);
            z.page.trigger('navigate', $settingsNavGroup.find('li.active a').attr('href'));
        })
        .on('click', '.mkt-tray', function() {
            // Activate Marketplace pages navbar.
            toggleNavbar($mktNavGroup, $settingsNavGroup);
            navigation.back();
        })
        .on('click', '.site a', function() {
            // Activate Marketplace pages navbar.
            toggleNavbar($mktNavGroup, $settingsNavGroup);

            // Change tab to home.
            $('.nav-mkt').attr('data-tab', 'homepage')
                   .find('li').removeClass('active')
                   .eq(0).addClass('active');
        });
    }
    z.body.one('loaded', initNavbarButtons);

    // Swipe handler.
    z.body.hammer({'swipe_velocity': 0.3}).on('swipe', function(e) {
        if (['left', 'right'].indexOf(e.gesture.direction) === -1 ||
            $('body').attr('data-page-type').indexOf('leaf') !== -1 ||
            $('body').attr('data-page-type').indexOf('search') !== -1) {
            return;
        }
        var $navbar = $('.navbar.active');
        var tabs = tabsMkt;
        if ($navbar.hasClass('nav-settings')) {
            tabs = tabsSettings;
        }

        // Calculate next tab.
        var currentTab = $navbar.attr('data-tab');
        var tabPos = tabs.indexOf(currentTab);
        if (e.gesture.direction == 'left') {
            // Next tab (unless we're at the end of the array).
            tabPos = tabPos === tabs.length - 1 ? tabPos : tabPos + 1;
        } else if (e.gesture.direction == 'right') {
            // Prev tab (unless we're at the beginning of the array).
            tabPos = tabPos === 0 ? tabPos : tabPos - 1;
        }

        var newTab = tabs[tabPos];
        if (newTab == currentTab) {
            // Reached the end.
            return;
        }

        $navbar.find('li').eq(tabPos).find('.tab-link').trigger('click');
    });

    // Tap handler.
    z.body.on('click', '.navbar li > a', function() {
        var $this = $(this);
        if ($this.hasClass('desktop-cat-link')) {
            // Don't allow click of category tab on desktop.
            return;
        }
        var $navbar = $this.closest('.navbar.active');
        var tabs = tabsMkt;
        if ($navbar.hasClass('nav-settings')) {
            tabs = tabsSettings;
        }

        var targetTab = $this.closest('li').attr('data-tab');
        var tabPos = tabs.indexOf(targetTab);

        // Visually change tab by sliding navbar.
        $navbar.attr('data-tab', targetTab)
               .find('li').removeClass('active')
               .eq(tabPos).addClass('active');

        z.page.trigger('navigate', $this.attr('href'));
    });

    // Desktop.
    function initActTray() {
        $('.act-tray:not(.mobile)').on('mouseover', function() {
            $(this).addClass('active');
        }).on('mouseout', function() {
            $(this).removeClass('active');
        }).on('click', '.account-links a', function() {
            $('.account-links, .settings, .act-tray').removeClass('active');
        });

        // Check the right radio button depending on device_filtering being
        // active (the default if the pref is missing) or not.
        if (storage.getItem('device_filtering') === false) {
            $('.device_filtering[value="0"]').prop('checked', true);
        } else {
            $('.device_filtering[value="1"]').prop('checked', true);
        }

        $('.device_filtering').on('change', function() {
            var value = this.value === '1';
            storage.setItem('device_filtering', value);
            console.log('Device filtering was toggled to ' + value + ', reloading');
            require('views').reload();
        });
    }
    initActTray();
    z.page.on('loaded', function() {
        $('.account-links, .act-tray .settings').removeClass('active');
    });
    z.body.on('reloaded_chrome', initActTray);

    // Build navbar.
    function render() {
        // Set class and data attribute of navbar to name of active tab.
        var tabsMktRouteMap = {};
        var tabName;
        for (i = 0; i < tabsMkt.length; i++) {
            tabName = tabsMkt[i];
            try {
                tabsMktRouteMap[urls.reverse(tabName)] = tabName;
            } catch(e) {
                continue;
            }
        }
        var tabsSettingsRouteMap = {};
        for (var i = 0; i < tabsSettings.length; i++) {
            tabName = tabsSettings[i];
            try {
                tabsSettingsRouteMap[urls.reverse(tabName)] = tabName;
            } catch(e) {
                continue;
            }
        }

        $('#site-nav').html(
            nunjucks.env.render('nav.html', {
                active_tab_mkt: tabsMktRouteMap[window.location.pathname] || 'homepage',
                active_tab_settings: tabsSettingsRouteMap[window.location.pathname] || 'settings',
                is_settings: z.body.attr('data-page-type').indexOf('settings') !== -1,
                z: z,
            })
        ).addClass('secondary-header');

        // Desktop categories hover menu.
        var catsTrigger = '.navbar > .categories';
        var $menu = $('.hovercats');

        $menu.html(
            nunjucks.env.render('cat_overlay.html', {categories: cats})
        );

        z.body.on('mouseenter', catsTrigger, function() {
            $menu.addClass('active');
        }).on('mouseleave', catsTrigger, function() {
            $menu.removeClass('active');
        }).on('click', catsTrigger + ' li a', function(e) {
            e.stopPropagation();
            $menu.removeClass('active');
        }).on('mouseenter', catsTrigger + ' li a', function() {
            $(this).removeClass('cur-cat');
        }).on('mouseleave', catsTrigger + ' li a', function() {
            $(this).addClass('cur-cat');
        });
    }

    // Render navbar.
    z.page.one('loaded', render);
});
