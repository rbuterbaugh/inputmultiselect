$(document).ready(
  function() {
    $("#picknumbers2 OPTION[value=fivesixseven]").removeAttr("selected");
    $('#picknumbers2')
      .inputmultiselect(
	{
	  clearAllSelectNoneAvailable: true,
	  clearAllSelectNoneText: 'No Preference',
	  clearAllSelectNoneTextShowOnBlur: true,
	  keepSelectedItemsInPlace: true,
	  selectingHeaderSelectsChildren: true
	})
      .inpms_enter(
	function() {
	  if (!$("#picknumbers2 OPTION[value=fivesixseven]").attr("selected") &&
	      $("#picknumbers2 OPTION.child").size() == $("#picknumbers2 OPTION.child:selected").size()) {
	    $("#picknumbers2").inpms_toggle("fivesixseven");
	  }
	})
      .inpms_preleave(
	function() {
	  if ($("#picknumbers2 OPTION[value=fivesixseven]").attr("selected")) {
	    $("#picknumbers2").inpms_toggle("fivesixseven",false);
	  }
	});

    $('#picknumbers')
      .inputmultiselect(
	{
	  runTests: true,
	  fieldTextFormatOnBlur: "%c: %o + %a more",
	  fieldTextFormatOnBlurNumToShow: 3,
	  fieldTextFormatOnBlurIfLTENumToShow: "%c: %o",
	  keepSelectedItemsInPlace: true,
	  selectingHeaderSelectsChildren: true
	})
      .inpms_change(
	function(event,data) {
	  if (typeof console != "undefined") {
	    console.log("change");
	    console.log(data);
	  }
	})
      .inpms_enter(
	function() {
	  if (typeof console != "undefined") {
	    console.log("enter");
	  }
	})
      .inpms_postleave(
	function() {
	  if (typeof console != "undefined") {
	    console.log("leave");
	  }
	}
      );
  }
);
