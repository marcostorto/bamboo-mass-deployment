(function ($, window) {

	// Helper for data-provide=* selectors builder
	var _provide = function (value) {
		return '[data-provide="' + value + '"]'
	};

	var SUBMIT_URL = 'deploymentExecution.action',
		RESULTS_URL = 'deploymentResultsForm.action',
		pages = {
			form: formPageInit,
			results: resultsPageInit
		};

	/**
	 * Form page init function
	 */
	function formPageInit() {

		var $selectCheckboxes = $(_provide('select-project-checkbox')),
			$selectChangedCheckboxes = $('[data-changed="true"]')
			$selectAllCheckbox = $(_provide('select-all-checkbox')),
			$deployButton = $(_provide('deploy-button')),
			$safetyCheckbox = $(_provide('safety-check')),
			$envListFrom = $(_provide('environment-list-from')),
			$envListTo = $(_provide('environment-list-to')),
			$envFilterInput = $(_provide('environment-filter')),
			urlParams = [];

		var changeSubmitButtonState = function () {
			var isEnabled = $safetyCheckbox.prop('checked') && urlParams.length !== 0;
			$deployButton.prop('disabled', !isEnabled);
		};

		var recalculateParams = function () {
			urlParams = [];
			$.each($selectCheckboxes, function (i, item) {
				var $item = $(item);
				if ($item.prop('checked')) {
					urlParams.push($item.data('code'));
				}
			});
		};

		$selectCheckboxes.change(function () {
			recalculateParams();
			changeSubmitButtonState();
		});

		$selectAllCheckbox.change(function () {
			$.each($selectCheckboxes, function (i, item) {
				var $item = $(item);
				$item.prop('checked', $selectAllCheckbox.prop('checked'))
			});
			recalculateParams();
			changeSubmitButtonState();
		});

		$selectChangedCheckbox.change(function () {
			$.each($selectChangedCheckboxes, function (i, item) {
				var $item = $(item);
				$item.prop('checked', $selectAllCheckbox.prop('checked'))
			});
			recalculateParams();
			changeSubmitButtonState();
		});

		$safetyCheckbox.change(function () {
			changeSubmitButtonState();
		});

		$deployButton.click(function () {
			form = $('<form>', {
                    method: 'post',
                    action: SUBMIT_URL + '?params=' + urlParams.join(';') +
                    	"&atl_token=" + Cookies.get('atl.xsrf.token') + "&atl_token_source=js"
                });
			$(document.body).append(form);
        	form.submit();
		});

		$envFilterInput.change(function () {
			var filterValue = $(this).val();
			filterEnvironmentOptions($envListFrom, filterValue);
			filterEnvironmentOptions($envListTo, filterValue);
		});

		$envFilterInput.change();

		function filterEnvironmentOptions ($list, filter) {
			$list.find('option').each(function (i, option) {
				var $option = $(option),
					isVisible = new RegExp(filter, 'gi').test($option.text());

				if (isVisible) $option.show();
				else {
					if ($option.is(':selected')) $option.prop("selected", false);
					$option.hide();
				}
			});
		}
	}

	/**
	 * Results page init function
	 */
	function resultsPageInit() {

		var FINISHED_STATE = 'Finished',
			OK_RESPONSE_STATUS = 'OK',
			UNKNOWN_STATE = 'Unknown',
			DEFAULT_STATUS = 'error',
			STATUS_CLASS_PREFIX = 'status-',
			INTERVAL_PERIOD = 2000;

		var $results = $(_provide('result-status'));

		// Deployments' results status checks
		// and rendering status widgets
		$.each($results, function (i, result) {
			var $result = $(result),
				interval;

			interval = setInterval(function () {
				$.getJSON($result.data('url'), function (data) {
					var cssClass = DEFAULT_STATUS,
						caption = data.status;

					// Response Ok from the backend API
					if (data.status === OK_RESPONSE_STATUS) {
						caption = data.life_cycle_state;

						// Deployment was finished
						if (data.life_cycle_state === FINISHED_STATE) {
							caption = data.deployment_state;

							// Status of deployment is not Unknown - because it's not the answer
							if (data.deployment_state !== UNKNOWN_STATE) {
								window.clearInterval(interval);
								$result.parent().find('i').remove();
							}
						}
						cssClass = caption.toLowerCase();
					}

					// Split string by uppercase and add spaces (e.g. InProgress -> In Progress)
					var formatted = caption.match(/[A-Z][a-z]+/g);
					if (formatted) caption = formatted.join(" ");

					$result.html(caption);

					$result[0].className = STATUS_CLASS_PREFIX + cssClass;
				});
			}, INTERVAL_PERIOD);
		});

	}

	// Execute different functions depending on the current page
	$(document).ready(function () {
		var $page = $(_provide('plugin-mass-deploy-page'));
		if ($page.length !== 0) {
			var pageName = $page.data('page');
			if (typeof pageName !== 'undefined') {
				var func = pages[pageName];
				if (typeof func === 'function') func();
			}
		}
	});

})(jQuery, window);
