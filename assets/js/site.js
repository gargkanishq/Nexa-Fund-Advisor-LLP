(function () {
	'use strict';
	var toggle = document.querySelector('.menu-toggle');
	var nav = document.getElementById('site-nav');
	if (toggle && nav) {
		toggle.addEventListener('click', function () {
			var expanded = toggle.getAttribute('aria-expanded') === 'true';
			toggle.setAttribute('aria-expanded', String(!expanded));
			nav.classList.toggle('open', !expanded);
		});
		nav.addEventListener('click', function (event) {
			if (event.target.closest('a')) {
				toggle.setAttribute('aria-expanded', 'false');
				nav.classList.remove('open');
			}
		});
	}
	var form = document.getElementById('enquiry-form');
	var status = document.getElementById('form-status');
	if (form && status) {
		form.addEventListener('submit', function (event) {
			event.preventDefault();
			if (!form.reportValidity()) return;
			status.textContent = 'Your details have not been sent or saved. Please contact Nexa directly through a verified contact channel once one is provided.';
		});
	}
}());
