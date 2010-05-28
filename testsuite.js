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
	  // here we can't just say rgbms_toggle("fivesixseven") because we don't want
	  // to recursively deselect the group. just deselect the parent and reparse
	  $("#picknumbers2 OPTION[value=fivesixseven]").removeAttr("selected");
	  $("#picknumbers2").rgbms_reparse();
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
	  console.log("change");
	  console.log(data);
	})
      .rgbms_enter(
	function() {
	  console.log("enter");
	})
      .rgbms_postleave(
	function() {
	  console.log("leave");
	}
      );
  }
);
