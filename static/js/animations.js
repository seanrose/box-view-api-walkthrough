/*global $ */

// Utility function for sliding from section to section
function slideToNextRow(selector, delay) {
    var activeRowIndex = $('.row').index($(selector).closest('.row'));
    var nextRow = $('.row')[activeRowIndex + 1];
    $('html, body').delay(delay).animate({scrollTop: $(nextRow).offset().top},'slow');
    return false;
}

$('#url-help').click(function() {
    var url = "https://cloud.box.com/shared/static/4qhegqxubg8ox0uj5ys8.pdf";
    $('#document-url').val(url);
    return false;
});

// Set the API token on window
$('#token-button').click(function() {
    $(this).off('click');
    slideToNextRow(this, 0);
    window.boxViewToken = $('#box-view-token').val();
});

// Send the URL to Box View for conversion
$('#convert-button').click(function() {
    $(this).off('click');
    $.ajax({
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            box_view_token: window.boxViewToken,
            url: $('#document-url').val()
        }),
        dataType: 'json',
        url: '/upload',
    }).done(function(data) {
        $('#convert-result, #document-result-copy').text(JSON.stringify(data, undefined, 2));
        $('#document-id-help').text("Hint, it's: " + data.id);
    });

    $('#convert-code').fadeIn('slow', function() {
        $(this).delay(500).tooltip('show');
        $('#convert-result').delay(1000).fadeIn('slow', function() {
            $(this).delay(500).tooltip('show');
            $('#convert-button')
                .click(function() {
                    slideToNextRow(this, 0);
                    $('#document-result-copy').delay(200).fadeIn().animate({top: 0}, 1000);
                    $('iframe').delay('slow').fadeIn('slow');
                    return false;
                })
                .delay(1000)
                .animate({'opacity':'.3'}, function() {
                    $(this).text('Got it! Next step...', function() {
                    }).animate({'opacity':'1'});
            });
        });
    });

    return false;
});

// Creates a session for the document ID
$('#session-button').click(function() {
    $(this).off('click');
    $.ajax({
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            box_view_token: window.boxViewToken,
            document_id: $('#document-id').val()
        }),
        dataType: 'json',
        url: '/session',
    }).done(function(data) {
        $('iframe').attr('src', data.session_url);
    });

    $('#document-result-copy').fadeOut('fast', function() {
        $('#session-code').fadeIn('slow', function() {
            $(this).delay(500).tooltip('show');
            $('#session-result').delay(1000).fadeIn('slow', function() {
                $(this).delay(500).tooltip('show');
                $('#session-button')
                    .click(function() {
                        slideToNextRow(this, 0);
                        $('iframe').delay('slow').fadeIn('slow');
                        return false;
                    })
                    .delay(1000)
                    .animate({'opacity':'.3'}, function() {
                        $(this).text('Got it! Next step...', function() {
                        }).animate({'opacity':'1'});
                });
            });
        });
    });

    return false;
});
