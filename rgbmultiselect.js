$(document).ready(function() {
  $("#selecthotels").rgbmultiselect({
				      clearAllSelectNoneAvailable: true,
				      clearAllSelectNoneText: 'Shop All Hotels',
				      clearAllSelectNoneTextShowOnBlur: true,
				      fieldTextFormatOnBlur: "%o + %a more",
				      fieldTextFormatOnBlurIfLTENumToShow: "%o",
				      fieldTextFormatOnBlurNumToShow: 1
				    });

  $("#picknumbers").rgbmultiselect();

  $("#pick3numbers").rgbmultiselect({
				      maxSelections: 3,
				      tabKeySelectsSingleFilteredUnselectedItem: true
				    });

  $("#pickone").rgbmultiselect();
});
