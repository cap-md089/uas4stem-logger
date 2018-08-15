const $ = require('./jquery-2.1.4.min.js');

$('.block').css('display', 'none');
$('#logger').css('display', 'block');

$('#menu a').on('click', function (e: Event) {
	e.preventDefault();

	$('.block').css('display', 'none');

	const id = $(this).prop('id');
	const targetID = id.slice(0, -6);

	$(`#${targetID}`).css('display', 'block');

	return false;
});