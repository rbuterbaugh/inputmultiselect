$(document).ready(function() {
		    $('#picknumbers').rgbmultiselect({
						       runTests: true,
						       fieldTextFormatOnBlur: "%c: %o + %a more",
						       fieldTextFormatOnBlurNumToShow: 3,
						       fieldTextFormatOnBlurIfLTENumToShow: "%c: %o",
						       keepSelectedItemsInPlace: true,
						       selectingHeaderSelectsChildren: true
						     });
		  });
