/* global $, analytics */

// Utility function for sliding from section to section
function slideToNextRow(selector, delay) {
    var activeRowIndex = $('.row').index($(selector).closest('.row'));
    var nextRow = $('.row')[activeRowIndex + 1];
    $('html, body').delay(delay).animate({scrollTop: $(nextRow).offset().top},'slow');

    return false;
}

// Disable scrolling
// up: 38, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
var keys = [38, 40];

function preventDefault(e) {
    e = e || window.event;
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.returnValue = false;
}

function keydown(e) {
    for (var i = keys.length; i--;) {
        if (e.keyCode === keys[i]) {
            preventDefault(e);
            return;
        }
    }
}

function wheel(e) {
  preventDefault(e);
}

function disableScroll() {
  if (window.addEventListener) {
      window.addEventListener('DOMMouseScroll', wheel, false);
  }
  window.onmousewheel = document.onmousewheel = wheel;
  document.onkeydown = keydown;
}

function enableScroll() {
    if (window.removeEventListener) {
        window.removeEventListener('DOMMouseScroll', wheel, false);
    }
    window.onmousewheel = document.onmousewheel = document.onkeydown = null;
}

function triggerFailModal() {
    $('#fail-modal').modal();
}

// Builds the curl request for uploading a file
function buildUploadRequestString(boxViewAPIKey, url) {
    var firstPiece = 'curl https:\/\/view-api.box.com\/1\/documents \\\r\n-H \"Authorization: Token ';
    var secondPiece = '\" \\\r\n-H \"Content-Type: application\/json\" \\\r\n-d \'{\"url\": \"';
    var thirdPiece = '\"}\' \\\r\n-X POST';
    return firstPiece + boxViewAPIKey + secondPiece + url + thirdPiece;
}

// Build the curl request for creating a session
function buildSessionRequestString(boxViewAPIKey, documentID) {
    var firstPiece = 'curl https:\/\/view-api.box.com\/1\/sessions \\\r\n-H \"Authorization: Token ';
    var secondPiece = '\" \\\r\n-H \"Content-Type: application\/json\" \\\r\n-d \'{\"document_id\": \"';
    var thirdPiece = '\"}\' \\\r\n-X POST';
    return firstPiece + boxViewAPIKey + secondPiece + documentID + thirdPiece;
}

// Unbinds submit events
function unbindSubmitEvents(selector) {
    $(selector).off('submit');
    $(selector).find('input').off('blur');
}

// Slide down a copy of the document creation to make it seem like it's "following you"
function slideInUploadResult() {
    $('#document-result-copy').delay(3000).queue(function(next) {
        $(this).addClass('fade-in').animate({top: 0}, 1000, function() {
            $(this).children('span').addClass('flashing-highlight');
        });
        next();
    });
}

function uploadAnimation() {
    $('#upload-svg').addClass('shrink-up');
    $('#upload-prompt').addClass('fade-out');
    slideToNextRow('#upload-svg', 2100);
}

function convertAnimation() {
    $('#doc-svg').addClass('spin-and-fade-out');
    $('#html-svg').delay(3600).queue(function(next) {
        $('#doc-svg').remove();
        $(this).removeClass('hidden').addClass('fade-in-and-spin');
        slideToNextRow(this, 3000);
        slideInUploadResult();
        next();
    });
}

$.fn.cssFadeOut = function() {
    $(this).removeClass('transparent fade-in')
        .addClass('fade-switch')
        .delay(400).queue( function(next) {
            $(this).text('Got it! Next step...');
            next();
        });
    return this;
};

// Transition in the welcome screen
function welcomeAnimation() {
    $('#welcome, #crocobox, #motivation, #get-started').addClass('fade-in');
    $('#get-started').addClass('fade-in').click(function() {
        slideToNextRow(this, 0);
    });
}

// Re-centers the viewport on blur for a field
// (necessary for iOS and mobile devices that move the viewport because of keyboards)
function recenterScreenOnBlur() {
    $('input').blur(function() {
        $(this).off('blur');
        var activeRow = $(this).closest('.row');
        $('html, body').animate({scrollTop: $(activeRow).offset().top},'fast');
    });
}

// Buttons are hidden until someone starts typing, at which point they fade in
function fadeInButtonsOnFocus() {
$('input').focus(function() {
        $(this).off('focus');
        $(this).parent().siblings('button').addClass('fade-in');
    });
}

// Autofills a PDF URL if the user doesn't have one
$('#url-help').click(function() {
    analytics.track("Clicked Document Help URL");
    var url = "https://cloud.box.com/shared/static/4qhegqxubg8ox0uj5ys8.pdf";
    $('#document-url').val(url).focus();

    return false;
});

// Set the API token on window
$('#set-token').submit(function() {
    analytics.track("Set API Key");
    unbindSubmitEvents(this);
    slideToNextRow(this, 0);
    // Set the View API token on window (less than ideal, but w/e)
    window.boxViewToken = $('#box-view-token').val();
    uploadAnimation();
    return false;
});



function convertDocumentAnimation() {
    // Send the URL to Box View for conversion
    $('#convert-document').submit(function() {
        analytics.track("Uploaded Document for Conversion");
        unbindSubmitEvents(this);
        // Call to the server which uploads the document to the View API
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                box_view_token: window.boxViewToken,
                url: $('#document-url').val()
            }),
            dataType: 'json',
            url: '/upload',
            error: function() {
                triggerFailModal();
            }
        }).done(function(data) {
            // Trolling
            data.status = 'done';
            // Add a span around the document ID so we can highlight it later
            data.id = '<span>' + data.id + '</span>';
            $('#convert-result, #document-result-copy').html(JSON.stringify(data, undefined, 2));
            // Set the Document ID in the emergency help text
            $('#document-id-help').html("Hint, it's: " + data.id);
        });

        $('#convert-code').text(buildUploadRequestString(window.boxViewToken, $('#document-url').val()));

        $('#convert-code').addClass('fade-in').tooltip('toggle');
        $('#convert-result').delay(1200).queue(function(next) {
            $(this).addClass('fade-in').tooltip('toggle');
            $('#convert-button').click(function() {
                slideToNextRow(this, 0);
                convertAnimation();
                return false;
            })
            .delay(1700)
            .queue(function(next) {
                $(this).cssFadeOut();
                next();
            });

            next();
        });
        return false;
    });
}

function createSessionAnimation() {
    // Creates a session for the document ID
    $('#create-session').submit(function() {
        analytics.track("Created Session");
        unbindSubmitEvents(this);
        // Call to the server which requests a session from the View API
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                box_view_token: window.boxViewToken,
                document_id: $('#document-id').val()
            }),
            dataType: 'json',
            url: '/session',
            error: function() {
                triggerFailModal();
            }
        }).done(function(data) {
            // Load the hidden iframe into the page as soon as possible
            $('iframe').attr('src', data.session_url);
            $('#doc-help-link').attr('href', data.session_url);
        });

        $('#session-code').text(buildSessionRequestString(window.boxViewToken, $('#document-id').val()));

        // Remove the document result
        $('#document-result-copy').removeClass('transparent fade-in').fadeOut('slow', function() {
            // Fade in the API request
            $('#session-code').addClass('fade-in').tooltip('toggle');
            // Fade in the API response
            $('#session-result').delay(1200).queue(function(next) {
                $(this).addClass('fade-in').tooltip('toggle');
                $('#session-button').click(function() {
                    slideToNextRow(this, 0);
                    // Fade in the View iframe, make it feel magical!
                    $('iframe').addClass('fade-in');
                    // A help text in case they don't realize you can scroll the iframe
                    $('.doc-help').delay(1200).queue(function(next) {
                        $(this).addClass('fade-in');
                        next();
                    });
                    enableScroll();
                    analytics.track("Completed Quickstart");
                    return false;
                })
                .delay(1700)
                .queue(function(next) {
                    $(this).cssFadeOut();
                    next();
                });
                next();
            });
        });

        return false;
    });
}

disableScroll();
recenterScreenOnBlur();
fadeInButtonsOnFocus();
welcomeAnimation();
convertDocumentAnimation();
createSessionAnimation();