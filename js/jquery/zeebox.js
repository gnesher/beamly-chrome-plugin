;(function(){
    'use strict';

    
    var LIGHTBOX_WIDTH_DEFAULT = 950,
        LIGHTBOX_WIDTH_MAX = 950,
        LIGHTBOX_HEIGHT_DEFAULT = 500,
        LIGHTBOX_HEIGHT_MAX = 650,
        LIGHTBOX_WIDTH_MIN = 300;

    var styles = {};

    styles.zeeboxIframe = [
        'overflow: hidden',
        'width: 100%',
        'height: 500px'
    ].join(';');

    styles.modalContainer = [
        'background: rgba(0, 0, 0, 0.6)',
        'position: fixed',
        'top: 0',
        'right: 0',
        'bottom: 0',
        'left: 0',
        'overflow-y: auto',
        'z-index: 999',
        '-webkit-overflow-scrolling: touch'
    ].join(';');

    styles.lightboxContainer = [
        'padding: 0',
        'border: 10px solid #313131',
        'position: relative',
        'margin: 90px auto 40px auto',
        'border-radius: 20px',
        'z-index: 31500'
    ].join(';');

    styles.lightbox = [
        'background-color: #313131',
        'overflow: hidden',
        'border-radius: 8px',
        'width: 100%',
        'height: 100%',
        'overflow-x: hidden',
        'overflow-y: auto'
    ].join(';');

    styles.closeButton = [
        'position: absolute',
        'top: -10px',
        'right: -10px',
        'border: 10px solid #313131',
        'background-color: #fff',
        'border-radius: 20px',
        'font-size: 20px',
        'font-weight: bold',
        'line-height: 21px',
        'padding: 0 4px 1px 4px',
        'color: #000',
        'cursor: pointer',
        'z-index: 5000'
    ].join(';');

    if (!document.querySelectorAll || !window.addEventListener || !window.postMessage){

        (function () {
            var allLinks = document.getElementsByTagName('a');
            var iframe, isZeeboxTag, isAlreadyProcessed, link;
            for (var i = 0, l = allLinks.length; i < l; i++){
                link = allLinks[i];
                isZeeboxTag = allLinks[i].getAttribute('data-zeebox-type');
                isAlreadyProcessed = allLinks[i].getAttribute('data-zeebox-embedded');

                if (isZeeboxTag && !isAlreadyProcessed){
                    iframe = document.createElement('iframe');
                    iframe.src = 'http://beamly.com/tv/rooms/browser-not-supported';
                    iframe.frameBorder = '0';
                    iframe.scrolling = 'no';
                    iframe.style.cssText = styles.zeeboxIframe;
                    link.style.display = 'none';
                    link.parentNode.appendChild(iframe);
                }
            }
        })();

        return;
    }

    var links = document.querySelectorAll('a[href][data-zeebox-type]');

    var getElementById = function(id, cssText, container){
        var el = document.getElementById(id);
        if (! el) {
            el = document.createElement('div');
            el.setAttribute('id', id);
            if(container) container.appendChild(el);
            else document.body.appendChild(el);
        }

        el.style.cssText = cssText;
        return el;
    };

    var removeChildren = function(element){
        while (element.firstChild){
            element.firstChild.parentNode.removeChild(element.firstChild);
        }
    };

    var createCloseButton = function(){
        var close = document.createElement('span');
        close.innerHTML = '&times;';
        close.style.cssText = styles.closeButton;
        return close;
    };

    var createLightboxIframe = function(url){
        var iframe = document.createElement('iframe');
        iframe.src = url || '';
        iframe.frameBorder = '0';
        iframe.scrolling = 'no';
        iframe.style.cssText = styles.lightbox;
        return iframe;
    };

    var getLightboxWidth = function(width){
        if (! width) width = LIGHTBOX_WIDTH_DEFAULT;
        if (width > LIGHTBOX_WIDTH_MAX) width = LIGHTBOX_WIDTH_MAX;
        if (width > window.innerWidth) width = window.innerWidth;
        if (width < LIGHTBOX_WIDTH_MIN) width = LIGHTBOX_WIDTH_MIN;
        return width;
    };

    var getLightboxHeight = function(height){
        if (! height) height = LIGHTBOX_HEIGHT_DEFAULT;
        if (height > LIGHTBOX_HEIGHT_MAX) height = LIGHTBOX_HEIGHT_MAX;
        return height;
    };

    var makeModal = function (data) {
        if (! data) return;

        tvc = link.hostname.match(/\/\/(au|uk)\./);
        tvc = tvc && tvc[1] || 'us';
        url = 'http://' + link.hostname;
        url += '/syndication/widgets?noBranding=true&url=' + encodeURIComponent(data.url);

        var modalContainer = getElementById('modalContainer', styles.modalContainer),
            container = getElementById('lightboxContainer', styles.lightboxContainer, modalContainer),
            content = createLightboxIframe(url),
            close = createCloseButton(),
            width = getLightboxWidth(data.width),
            height = getLightboxHeight(data.height);

        removeChildren(container);

        container.style.cssText = [
            'width: ' + width + 'px',
            'height: ' + height + 'px'
        ].join(';') + ';' + styles.lightboxContainer;

        container.appendChild(content);
        container.appendChild(close);

        // Make body not to scroll on behind.
        document.body.style.overflow = 'hidden';

        close.onclick = function(){
            modalContainer.style.display = 'none';
            document.body.style.overflow = 'auto';
        };

        return content;
    };

    var hideIframe = function(iframe){
        iframe.style.height = '0';
    };

    // Subscribe to events from a specific iframe
    var subscribeTo = function (iframe, link) {
        window.addEventListener('message', function(evt){
            var data = false, message;
            // Is this event for me?
            if (evt.source != iframe.contentWindow) {
                return;
            }

            if (evt && evt.data){
                try {
                    data = JSON.parse(evt.data);
                } catch(e) {}
            }

            /* Set iframe height */
            if (data && data.zeebox && typeof data.zeebox.height !== 'undefined'){
                // Ignore height if it was set explicitly
                if (!link.hasAttribute('data-zeebox-height')) {
                    iframe.style.height = 'auto';
                    iframe.style.height = (data.zeebox.height + 'px');

                    if (document.createEvent){
                        message = document.createEvent('CustomEvent');
                        message.initCustomEvent('zeebox:update', false, false, {
                            height: data.zeebox.height
                        });
                    } else if (window.CustomEvent){
                        message = new CustomEvent('zeebox:update', {
                            detail: { height: data.zeebox.height }
                        });
                        window.dispatchEvent(message);
                    }
                }
            }

            /* Reply with page info */
            if (evt.data == 'zeebox-info' || (data && data.zeebox == 'info')) {
                var info = {
                        zeebox: {
                            href: window.location.toString(),
                            referrer: document.referrer.toString(),
                            target: link.getAttribute('data-zeebox-link')
                        }
                    },
                    safe = JSON.stringify(info);

                evt.source.postMessage(safe, evt.origin);
            }

            if (data && data.zeebox == 'hide'){
                hideIframe(iframe);
            }

            /* Launch a lightbox */
            if (data && data.zeebox && data.zeebox['launch-lightbox']) {
                var modalIframe = makeModal(data.zeebox['launch-lightbox']);
                subscribeTo(modalIframe, link);
            }
        });
    };

    for (var i = 0, l = links.length; i < l; i++){
        var link = links[i],
            container = link.parentNode,
            type = link.getAttribute('data-zeebox-type'),
            height = link.getAttribute('data-zeebox-height'),
            width = link.getAttribute('data-zeebox-width'),
            iframe = document.createElement('iframe'),
            isTeaser = !!link.getAttribute('data-zeebox-teaser'),
            familyMode = link.getAttribute('data-zeebox-family-mode'),
            hidePosts = link.getAttribute('data-zeebox-teaser') === 'tile',
            altLink = link.getAttribute('data-zeebox-link'),
            limit = link.getAttribute('data-zeebox-limit'),
            masterbrand = link.getAttribute('data-zeebox-masterbrand'),
            lastPost = link.getAttribute('data-zeebox-last-post'),
            widgetUrl = link.getAttribute('data-zeebox-widget'),
            noBranding = link.getAttribute('data-zeebox-no-branding'),
            roomIdMatch = window.location.search.match(/roomId=([^&]+)/),
            roomIdMatchLegacy = window.location.hash.match(/roomId=([^&]+)/),
            roomId = roomIdMatch && roomIdMatch[1] || roomIdMatchLegacy && roomIdMatchLegacy[1],
            selectable = link.hasAttribute('data-zeebox-selectable'),
            brandId,
            tvc,
            url = '';

        // Ignore links that have already been activated
        if (link.getAttribute('data-zeebox-embedded')) {
            continue;
        }

        switch (type){
            case 'tv-room':

                // Selectable TV Room can be overridden with a #roomId= parameter
                if (selectable && roomId) {
                    link.href = link.protocol + '//' + link.host + '/tv/rooms/' + roomId;
                }

                if (isTeaser) {
                    url = link.href + '/teaser';

                    // Teaser can hide the posts
                    if (hidePosts) {
                        url += '?hidePosts';
                    }
                } else {
                    url = link.href + '/embedded';

                    // Embedded room can force a family mode setting.
                    if (typeof familyMode !== 'undefined') {
                        familyMode = parseInt(familyMode, 10);
                        if (familyMode === 0 || familyMode === 1) {
                            url += '?familyMode=' + familyMode;
                        }
                    }
                }
                break;

            case 'sync-widget':
                tvc = link.hostname.match(/\/\/(au|uk)\./);
                tvc = tvc && tvc[1] || 'us';
                brandId = link.href.match(/\/tv\/(brand|shows)\/([0-9]+)/);
                brandId = brandId && brandId[2];
                url = 'http://' + link.hostname;
                url += '/syndication/widgets?brandID=' + brandId;
                if (masterbrand) url += '&masterbrand=' + masterbrand;
                if (noBranding) url += '&noBranding=true';
                if (widgetUrl) url += '&url=' + widgetUrl;
                height = 300;
                width = 300;
                break;

            case 'hot-rooms':
                url = link.href + '/embedded?';
                if (altLink) {
                    url += '&link=' + encodeURIComponent(altLink);
                }
                if (limit) {
                    url += '&limit=' + encodeURIComponent(limit);
                }
                if (lastPost) {
                    url += '&lastPost=' + encodeURIComponent(lastPost);
                }
                break;

            case 'widget':
                url = link.href;
                break;
        }

        iframe.src = url;
        iframe.frameBorder = '0';
        iframe.scrolling = 'no';
        iframe.style.cssText = 'overflow: hidden; width: 100%;';

        if (height) {
            iframe.style.height = height + 'px';
        }

        if (width) {
            iframe.style.width = width + 'px';
        }

        link.style.display = 'none';
        link.setAttribute('data-zeebox-embedded', 'true');
        container.appendChild(iframe);
        subscribeTo(iframe, link);
    }
})();
