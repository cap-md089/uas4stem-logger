"use strict";
var $ = require('./jquery-2.1.4.min.js');
$('.block').css('display', 'none');
$('#logger').css('display', 'block');
$('#menu a').on('click', function (e) {
    e.preventDefault();
    $('.block').css('display', 'none');
    var id = $(this).prop('id');
    var targetID = id.slice(0, -6);
    $("#" + targetID).css('display', 'block');
    return false;
});
