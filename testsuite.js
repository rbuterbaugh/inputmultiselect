$(document).ready(function() {
		    $('#picknumbers').rgbmultiselect({
						       runTests: true,
						       fieldTextFormatOnBlur: "%c: %o + %a more",
						       fieldTextFormatOnBlurNumToShow: 3,
						       fieldTextFormatOnBlurIfLTENumToShow: "%c: %o",
						       keepSelectedItemsInPlace: true,
						       selectingHeaderSelectsChildren: true
						     }).rgbms_change(
						       function(event,data) {
							 console.log("change");
							 console.log(data);
						       }).rgbms_enter(
						       function() {
							 console.log("enter");
						       }).rgbms_leave(
							 function() {
							   console.log("leave");
							 });
		  });
