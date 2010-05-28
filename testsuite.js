$(document).ready(
  function() {
    $("#picknumbers2 OPTION[value=fivesixseven]").removeAttr("selected");
    $('#picknumbers2')
      .rgbmultiselect(
	{
	  keepSelectedItemsInPlace: true,
	  selectingHeaderSelectsChildren: true
	})
      .rgbms_enter(
	function() {
	  if (!$("#picknumbers2 OPTION[value=fivesixseven]").attr("selected") &&
	      $("#picknumbers2 OPTION.child").size() == $("#picknumbers2 OPTION.child:selected").size()) {
	    $("#picknumbers2").rgbms_toggle("fivesixseven");
	  }
	})
      .rgbms_preleave(
	function() {
	  if ($("#picknumbers2 OPTION[value=fivesixseven]").attr("selected")) {
	    $("#picknumbers2").rgbms_toggle("fivesixseven",false);
	  }
	});

    $('#picknumbers')
      .rgbmultiselect(
	{
	  runTests: true,
	  fieldTextFormatOnBlur: "%c: %o + %a more",
	  fieldTextFormatOnBlurNumToShow: 3,
	  fieldTextFormatOnBlurIfLTENumToShow: "%c: %o",
	  keepSelectedItemsInPlace: true,
	  selectingHeaderSelectsChildren: true
	})
      .rgbms_change(
	function(event,data) {
	  if (typeof console != "undefined") {
	    console.log("change");
	    console.log(data);
	  }
	})
      .rgbms_enter(
	function() {
	  if (typeof console != "undefined") {
	    console.log("enter");
	  }
	})
      .rgbms_postleave(
	function() {
	  if (typeof console != "undefined") {
	    console.log("leave");
	  }
	}
      );
  }
);
