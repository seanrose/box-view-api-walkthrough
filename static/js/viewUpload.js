/* global $ */

$('#upload-form').submit(function () {
    $('button').blur();
    var data = new FormData();
    data.append('file', $('#file_to_convert')[0].files[0]);

    $.ajax({
        type: 'POST',
        contentType: false,
        processData: false,
        data: data,
        dataType: 'json',
        url: 'upload-convert',
        error: function (data) {
            console.log(data);
        }
    }).done(function (data) {
        $('#session-link').text(data.session_url).attr('href', data.session_url);
    });

    return false;
});