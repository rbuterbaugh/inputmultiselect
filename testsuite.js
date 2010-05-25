$(document).ready(function() {
		    $('#picknumbers').rgbmultiselect({
						       runTests: true,
						       clearAllSelectNoneAvailable: true,
						       clearAllSelectNoneText: 'Clear All',
						       clearAllSelectNoneTextShowOnBlur: true,
						       fieldTextFormatOnBlur: "%c: %o + %a more",
						       fieldTextFormatOnBlurNumToShow: 3,
						       fieldTextFormatOnBlurIfLTENumToShow: "%c: %o",
						       keepSelectedItemsInPlace: true
						     })
		    .bind("onChange",function(event,data) {
			  });
		  });
