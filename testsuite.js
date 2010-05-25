$(document).ready(function() {
		    $('#picknumbers').rgbmultiselect({
						       runTests: true,
						       fieldTextFormatOnBlur: "%c: %o + %a more",
						       fieldTextFormatOnBlurNumToShow: 3,
						       fieldTextFormatOnBlurIfLTENumToShow: "%c: %o"
						     });

		    $('#picknumbers2').rgbmultiselect({
							clearAllSelectNoneAvailable: true,
							clearAllSelectNoneText: 'Clear All',
							clearAllSelectNoneTextShowOnBlur: true,
							keepSelectedItemsInPlace: true,
							selectingHeaderSelectsChildren: true
						     });
		  });
