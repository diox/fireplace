define('image-deferrer', ['underscore', 'urls', 'z'], function(_, urls, z) {
    'use strict';
    /*
       <img class="deferred" data-src="{{ image.src }}" src="{{ placeholderSrc }}">
       imageDeferrer = require('image-deferrer').ImageDeferrer(null, 200);
       imageDeferrer.setImages($('img.deferred.defer-us'));
    */
    function getXYPos(elem) {
        /*
            Return X/Y position of an element within the page (recursive).
        */
        if (!elem) {
            return {
                x: 0,
                y: 0
            };
        }
        var rect = elem.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top
        };
    }

    function getScrollOffsets(w) {
        /*
           Return the current scrollbar offsets as the x and y properties of
           an object
        */
        w = w || window;

        // This works for all browsers except IE versions 8 and before
        if (w.pageXOffset !== null) {
            return {
                x: w.pageXOffset,
                y: w.pageYOffset
            };
        }
        // For IE (or any browser) in Standards mode
        var d = w.document;
        if (document.compatMode == 'CSS1Compat') {
            return {
                x: d.documentElement.scrollLeft,
                y: d.documentElement.scrollTop
            };
        }
        // For browsers in Quirks mode
        return {
            x: d.body.scrollLeft,
            y: d.body.scrollTop
        };
    }

    function Deferrer(throttleMs, debounceMs) {
        /*
            Defer image loading to load only images within a viewport's or
            two's scroll away. Done so scrolling isn't blocked on image loading
            on FXOS.

            throttleMs -- set to ms if want to load images on throttled scroll,
                          images will load WHILE user scrolls (icons).
            debounceMs -- set if want to load images on debounced scroll,
                          images will load AFTER user scrolls (screenshots).
        */
        var loadTimeout;
        var $images;
        var imagesAlreadyLoaded = [];
        var _srcsAlreadyLoaded = [];  // Keep track of images already loaded.
        var selector;

        var scrollListener = function(e) {
            if (!$images) {
               return;
            }
            loadImages();
        };
        if (debounceMs) {
            scrollListener = _.debounce(scrollListener, debounceMs || 200);
        } else {
            scrollListener = _.throttle(scrollListener, throttleMs || 100);
        }

        // Defer image loading.
        z.win.on('scroll resize image_defer', scrollListener);

        var loadImages = function() {
            // Calculate viewport loading boundaries (vertical).
            var offsets = getScrollOffsets();
            var viewport = {
                h: z.win.height(),
                w: z.win.width()
            };
            var min = {
                x: offsets.x - viewport.w * 1,   // 1 viewport(s) back horizontally.
                y: offsets.y - viewport.h * 0.5 // 0.5 viewport(s) back vertically.
            };
            var max = {
                x: offsets.x + viewport.w * 1,  // 1 viewport(s) ahead horizontally.
                y: offsets.y + viewport.h * 1.5  // 1.5 viewport(s) ahead vertically.
            };

            // If images are within viewport loading boundaries, load it.
            var imagesLoading = 0;
            var imagesLoaded = 0;
            var imagesNotLoaded = [];
            $images.each(function(i, img) {
                var pos = getXYPos(img);

                if (pos.y > min.y && pos.y < max.y &&
                    pos.x > min.x && pos.x < max.x) {
                    // Load image via clone + replace. It's slower, but it
                    // looks visually smoother than changing the image's
                    // class/src in place.
                    imagesLoading++;
                    imagesAlreadyLoaded.push(img);

                    var replace = img.cloneNode(false);
                    replace.classList.remove('deferred');
                    replace.style.backgroundImage = 'none';
                    replace.onload = function() {
                        // Once the replace has loaded, swap and fade in.
                        if (img.parentNode === null) {
                            return;
                        }
                        img.parentNode.replaceChild(replace, img);

                        setTimeout(function() {
                            replace.style.opacity = 1;  // Fade in.
                        }, 50);

                        // Keep track of what img have already been deferred.
                        _srcsAlreadyLoaded.push(replace.src);
                        if (++imagesLoaded == imagesLoading) {
                            z.page.trigger('images_loaded');
                        }
                    };
                    replace.src = replace.getAttribute('data-src');
                    replace.style.opacity = 0.5;
                } else {
                    imagesNotLoaded.push(img);
                }
            });

            if (imagesLoading === 0) {
                // No images to load? Trigger images loaded.
                z.page.trigger('images_loaded');
            }

            // Don't loop over already loaded images.
            $images = $(imagesNotLoaded);
        };

        var setImages = function($newImages) {
            /* Sets the deferrer's set of images to loop over and render. */
            selector = $newImages.selector;

            if (imagesAlreadyLoaded.length) {
                // If we already loaded images, don't put them in the pool to
                // load again. Do a set difference between image sets.
                $images = $newImages.filter(function(i) {
                    return imagesAlreadyLoaded.indexOf($images[i]) === -1;
                });
            } else {
                $images = $newImages;
            }

            // Render images within or near the viewport.
            scrollListener();
        };

        var refresh = function() {
            setImages($(selector));
        };

        var clear = function() {
            /* Used when page is rebuilt on visibility change. */
            imagesAlreadyLoaded = [];
            refresh();
        };
        z.win.on('unloading', clear);


        var getSrcsAlreadyLoaded = function() {
            return _srcsAlreadyLoaded;
        };

        return {
            clear: clear,
            refresh: refresh,
            selector: selector,
            setImages: setImages,
            getSrcsAlreadyLoaded: getSrcsAlreadyLoaded
        };
    }

    return {
        Deferrer: Deferrer,
    };
});
