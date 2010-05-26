/*!
 * jQuery rgbmultiselect plugin v1.1.0
 *  http://ryan.buterbaugh.org/rgbmultiselect/
 *
 * Copyright (c) 2010 Ryan Buterbaugh
 *  http://ryan.buterbaugh.org/
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

(function($) {
   $.fn.extend({
		 rgbmultiselect: function(prefs) {

		   if (typeof prefs != "undefined") {
		     // if the user has specified a field text format and a threshold
		     // but hasn't specified an alternate field text format for cases
		     // when the number of results to show is less than the threshold,
		     // copy over their field text format instead of using our default
		     if (typeof prefs.fieldTextFormatOnBlurIfLTENumToShow == "undefined" &&
			 typeof prefs.fieldTextFormatOnBlurNumToShow != "undefined" &&
			 prefs.fieldTextFormatOnBlurNumToShow > -1 &&
			 typeof prefs.fieldTextFormatOnBlur != "undefined") {
		       prefs.fieldTextFormatOnBlurIfLTENumToShow = prefs.fieldTextFormatOnBlur;
		     }

		     // if the user doesn't specify max selections text, use their help text
		     // as the maxSelections help text if it exists
		     if (typeof prefs.helpText != "undefined" &&
			 typeof prefs.maxSelections != "undefined" &&
			 typeof prefs.helpTextMaxSelectionsReached == "undefined") {
		       prefs.helpTextMaxSelectionsReached=prefs.helpText;
		     }
		   }

		   prefs = $.extend({}, $.rgbmultiselector.defaults, prefs);

		   return this.each(function() {
				      var myPrefs=$.extend({}, prefs);
				      if (!$(this).attr("multiple")) {
					myPrefs.allOptionsExclusive=true;
				      }
				      new $.rgbmultiselector(this, myPrefs);
				    });
		 },
		 reparse: function() {
		   return this.trigger("reparse");
		 },
		 change: function(handler) {
		   return this.bind("change",handler);
		 }
	       });

   $.rgbmultiselector = function(input, prefs) {
     var KEY = {
       UP: 38,
       DOWN: 40,
       DEL: 46,
       TAB: 9,
       RETURN: 13,
       ESC: 27,
       COMMA: 188,
       PAGEUP: 33,
       PAGEDOWN: 34,
       BACKSPACE: 8
     };

     var $sSelect=$(input);
     var selectId=$sSelect.attr("id");
     var inputId=selectId+"_rgbmultiselect";
     var optionsId=inputId+"_container";
     var iframeId=inputId+"_iframe";
     var baseCheckboxId=optionsId+"_checkbox";
     var selectWidth=parseInt($sSelect.outerWidth(),10);
     var leaveFieldTimeout=null;
     var blockSubmit=false;
     var hasFocus=0;
     var keypressTimeout=null;
     var optionsNumMatching=0,optionsOneSelectedMatch=null,optionsOneSelectedMatchType="";
     var optionsKeyboardCurrentId=null,optionsKeyboardCurrentType=null;
     var clearInputField=true;
     var unselectedOriginalHeight=null;

     var currentExecutionTimestamp=(new Date()).valueOf();

     /*BEGINTEST*/var testsRun=0;
     var testsPassed=0;
     var testsFailed=0;/*ENDTEST*/

     var $sInput=buildInputField();
     $sSelect.hide();

     var $sOptions=buildOuterOptionsContainer();
     $(document.body).append($sOptions);

     var $sIframe=buildIE6Iframe();

     var selectCache=getSelectOptions();
     updateInputFieldText();

     $sSelect.bind("reparse",function() {
		     reparseSelectList();
		   });

     if (prefs.buildOptionsInBackground) {
       $(document).ready(function() { setTimeout(function() { buildOptions(); },10); });
     }

     // set up handlers
     // borrowed from jquery autocomplete by Jorn Zaefferer...
     // prevent form submit when pressing enter key in opera
     if ($.browser.opera) {
       $(input.form).bind("submit.rgbmultiselect",
			  function() {
			    if (blockSubmit) {
			      blockSubmit = false;
			      return false;
			    }
			    return true;
			  });
     }

     $sInput.focus(
       function() {
	 hasFocus++;
	 if (leaveFieldTimeout) {
	   clearTimeout(leaveFieldTimeout);
	   leaveFieldTimeout=null;
	 }

	 buildOptions();
	 showOptions();
	 $(this).removeClass("jquery_rgbmultiselect_blurred");
	 if (clearInputField) {
	   clearInputField=false;
	   $(this).val("");
	 }
       }
     );

     $sInput.click(
       function() {
	 hasFocus++;
	 if (hasFocus > 1 && !$sOptions.is(":visible")) {
	   showOptions();
	 }
       }
     );

     $sInput.blur(
       function() {
	 if (hasFocus > 0) {
	   hasFocus=0;
	   leaveFieldTimeout = setTimeout(function() { leaveField(); },200);
	 }
       }
     );

     $sInput.bind(($.browser.opera ? "keypress" : "keydown") + ".rgbmultiselect",
		  function (e) {
		    hasFocus=1;
		    switch (e.keyCode) {
		      case KEY.ESC:
		        hideOptions();
			break;

		      case KEY.RETURN:
			e.preventDefault();
			blockSubmit = true;
			selectCurrentKeyboardChoice();
			return false;

		      case KEY.TAB:
		        if (prefs.tabKeySelectsSingleFilteredUnselectedItem && optionsNumMatching == 1) {
			  selectCurrentKeyboardChoice();
			}
		        hasFocus=0;
			leaveField();
		        break;


		      case KEY.UP:
		        if (!$sOptions.is(":visible")) {
			  showOptions();
			} else {
			  keyGo(-1);
			}
		        break;

		      case KEY.DOWN:
		        if (!$sOptions.is(":visible")) {
			  showOptions();
			} else {
			  keyGo(1);
			}
		        break;

		      case KEY.PAGEUP:
		        if (!$sOptions.is(":visible")) {
			  showOptions();
			} else {
			  keyGo(prefs.pageUpDownDistance*-1);
			}
		        break;

		      case KEY.PAGEDOWN:
		        if (!$sOptions.is(":visible")) {
			  showOptions();
			} else {
			  keyGo(prefs.pageUpDownDistance);
			}
		        break;

		      default:
		        if (!$sOptions.is(":visible")) {
			  showOptions();
			}
		        if (keypressTimeout) {
			  clearTimeout(keypressTimeout);
			}
		        keypressTimeout = setTimeout(function() {
						       filterOptions($.trim($sInput.val()));
						       updateUnselectedHeight();
						       positionOptionsContainer();
						     },10);
			break;
		    }
		  });

     $(window).bind("resize.rgbmultiselect",
		    function() {
		      positionOptionsContainer();
		    });


     // chrome and IE will unfocus the input box when you click the scrollbar, so if
     // the user clicks within the box, refocus on the input box
     $(document).bind("mousedown.rgbmultiselect",
		      function(event) {
			if ($sOptions.is(":visible") && mouseOverObj($sOptions,event)) {
			  setTimeout(function(){$sInput.focus();},10);
			}
		      });

     /*BEGINTEST*/
     if (prefs.runTests) {
       runTests();
     }
     /*ENDTEST*/

     // end bindings, begin function definitions

     function reparseSelectList() {
       selectCache=getSelectOptions();
       $sOptions.removeClass("jquery_rgbmultiselect_optionsbuilt").html("");
       buildOptions();
       updateInputFieldText();
     }

     function resetAndUpdateKeySelection() {
       if (optionsKeyboardCurrentId !== null) {
	 $("#"+baseCheckboxId+"_"+optionsKeyboardCurrentType+optionsKeyboardCurrentId)
	   .parent().removeClass("jquery_rgbmultiselect_options_item_arrownav_selected");
	 optionsKeyboardCurrentId=optionsKeyboardCurrentType=null;
       }
       if (arguments.length == 2) {
	 optionsKeyboardCurrentId=arguments[0];
	 optionsKeyboardCurrentType=arguments[1];
       }
     }

     function keyGo(num) {
       var options=getAllVisibleOptions();
       if (optionsKeyboardCurrentId === null || (optionsKeyboardCurrentType != "clearlist" &&
						 selectCache[optionsKeyboardCurrentId].filtered)) {
	 resetAndUpdateKeySelection(options[0].id,options[0].type);
       } else {
	 var curIndex=getCurrentKeyboardSelectionIndex(options)+num;
	 while (curIndex < 0) {
	   curIndex+=options.length; // just in case our page up/down distance is greater than our options.length 
	 }
	 if (curIndex >= options.length) {
	   curIndex=curIndex % options.length;
	 }
	 resetAndUpdateKeySelection(options[curIndex].id,options[curIndex].type);
       }
       var checkbox=$("#"+baseCheckboxId+"_"+optionsKeyboardCurrentType+optionsKeyboardCurrentId);
       var parent=checkbox.parent();
       parent.addClass("jquery_rgbmultiselect_options_item_arrownav_selected");
       scrollToMiddleOfItem(parent,options);
     }

     function getCurrentKeyboardSelectionIndex(visibleOptions) {
       var curIndex=0;
       var l=visibleOptions.length;
       for (var i=0;i<l;i++) {
	 if (visibleOptions[i].id == optionsKeyboardCurrentId) {
	   curIndex=i;
	 }
       }
       return curIndex;
     }

     function scrollToMiddleOfItem(targetItem,visibleOptions) {
       var firstUn=firstUnselected(visibleOptions);
       var firstUnselectedOffset=0;
       if (firstUn != "") {
	 firstUnselectedOffset=$("#"+baseCheckboxId+"_unselected"+firstUn).parent().position().top;
       }
       var unselContainer=$sOptions.children(".jquery_rgbmultiselect_options_unselected");
       var scrollOffset=targetItem.position().top-firstUnselectedOffset-(unselContainer.height()/2);
       if (scrollOffset < 0 || optionsKeyboardCurrentType != "unselected") {
	 scrollOffset=0;
       }
       unselContainer.scrollTop(scrollOffset);
     }

     function firstUnselected(options) {
       var l=options.length;
       for (var i=0;i<l;i++) {
	 if (options[i].type == "unselected") {
	   return options[i].id;
	 }
       }
       return "";
     }

     function lastUnselected(options) {
       var last="";
       var l=options.length;
       for (var i=0;i<l;i++) {
	 if (options[i].type == "unselected") {
	   last=options[i].id;
	 }
       }
       return last;
     }

     // returns a list of all visible options
     function getAllVisibleOptions() {
       var options=[];
       if (prefs.clearAllSelectNoneAvailable) {
	 options.push({id:'',type:'clearlist'});
       }
       var stickyOptions=[];
       var selectedOptions=[];
       var unselectedOptions=[];
       for (var o in selectCache) {
	 if (typeof o == "string" && objTypeNot(o,"hidden") && !selectCache[o].filtered) {
	   if (objTypeIs(o,"sticky")) {
	     stickyOptions.push({id:o,type:'sticky'});
	   } else if (prefs.keepSelectedItemsInPlace || !selectCache[o].selected) {
	     // if we're keeping selected items in place, we just want to add the items in the
	     // 'unselected' container
	     unselectedOptions.push({id:o,type:'unselected'});
	   } else if (selectCache[o].selected) {
	     selectedOptions.push({id:o,type:'selected'});
	   }
	 }
       }

       return options.concat(stickyOptions,selectedOptions,unselectedOptions);
     }

     function filterOptions(str) {
       str+="";
       var strParts=str.split(/ +/);
       if (optionsNumMatching == 1) {
	 optionsOneSelectedMatch.parent().removeClass("jquery_rgbmultiselect_options_item_singlefiltered");
	 var value=getItemId(optionsOneSelectedMatch,optionsOneSelectedMatchType);
	 selectCache[value].filtered=false;
       }
       optionsNumMatching=0;
       for (var o in selectCache) {
	 if (typeof o == "string") {
	   var type="unselected";
	   if (objTypeIs(o,"sticky")) {
	     type="sticky";
	   }
	   var cur=$("#"+baseCheckboxId+"_"+type+o);
	   var optionText=cur.siblings("SPAN");
	   var parentItem=cur.parent();
	   if (objTypeNot(o,"hidden") && (!selectCache[o].selected || prefs.keepSelectedItemsInPlace) &&
	       !parentItem.hasClass("jquery_rgbmultiselect_options_item_is_selected")) {
	     // if the item has been selected, we don't want to alter its state (show/hide) when filtering.
	     // if we are keeping selected items in place, we want to filter both selected and unselected
	     // items, so we do not ever set the flag
	     var isAMatch=(str == "" || andMatch(selectCache[o].text.toLowerCase(),strParts));
	     if (isAMatch) {
	       if (str == "") {
		 restoreOptionText(optionText,o);
	       } else {
		 optionText.html(replaceAll(selectCache[o].text,strParts));
	       }
	       optionsNumMatching++;
	       // store this item and type in case it is a single match
	       optionsOneSelectedMatch=cur;
	       optionsOneSelectedMatchType=type;
	       parentItem.show();
	     } else {
	       restoreOptionText(optionText,o);
	       parentItem.removeClass("jquery_rgbmultiselect_options_item_singlefiltered").hide();
	       // if the currently key-selected item gets filtered out, reset key selection
	       if (optionsKeyboardCurrentId == o) {
		 resetAndUpdateKeySelection();
	       }
	     }
	     selectCache[o].filtered=!isAMatch;
	   }
	 }
       }
       if (optionsNumMatching == 1) {
	 optionsOneSelectedMatch.parent().addClass("jquery_rgbmultiselect_options_item_singlefiltered");
       }
     }

     function restoreOptionText(optionText,o) {
       if ($.trim(optionText.html()) != selectCache[o].text) {
	 optionText.html(selectCache[o].text);
       }
     }

     function andMatch(haystack,needles) {
       var l=needles.length;
       for (var i=0;i<l;i++) {
	 if (haystack.indexOf(needles[i].toLowerCase()) == -1) {
	   return false;
	 }
       }
       return true;
     }

     function replaceAll(originalText,filterTexts) {
       var l=filterTexts.length;
       if (l == 0 || (l == 1 && filterTexts[0] == "")) {
	 return originalText;
       }
       for (var i=0;i<l;i++) {
	 originalText=replaceWord(originalText+"",filterTexts[i]+"");
       }
       return originalText;
     }

     function replaceWord(originalText,searchText) {
       var l=originalText.length;
       var sl=searchText.length;
       var curPos=0;
       var matchLoc;
       while (true) {
	 matchLoc=originalText.toLowerCase().indexOf(searchText.toLowerCase(),curPos);
	 if (matchLoc == -1) {
	   break;
	 }
	 var before=originalText.substr(0,matchLoc);
	 var beforeWithSpan=before+'<span class="jquery_rgbmultiselect_options_text_filtermatch">';
	 var matched=originalText.substr(matchLoc,sl);
	 var after=originalText.substr(matchLoc+sl);
	 var afterWithSpan='</span>'+after;
	 if (((before.lastIndexOf('<') < before.lastIndexOf('>')) ||
	      (before.lastIndexOf('<') == -1 && before.lastIndexOf('>') == -1)) &&
	     ((after.indexOf('<') < after.indexOf('>')) ||
	      (after.indexOf('<') == -1 && after.indexOf('>') == -1))) {
	   originalText=beforeWithSpan+matched+afterWithSpan;
	   curPos=beforeWithSpan.length+matched.length+'</span>'.length;
	 } else {
	   curPos=matchLoc+sl;
	 }
       }
       return originalText;
     }

     function selectFilteredSelection() {
       var optionText=optionsOneSelectedMatch.siblings("SPAN");
       var itemId=getItemId(optionsOneSelectedMatch,optionsOneSelectedMatchType);

       if (numOptionsSelected() >= prefs.maxSelections && prefs.maxSelections > -1 &&
	   !selectCache[itemId].selected && !objIsExclusive(itemId)) {
	 return;
       }

       optionsNumMatching=0;
       optionsOneSelectedMatch.parent().removeClass("jquery_rgbmultiselect_options_item_singlefiltered");
       restoreOptionText(optionText,itemId);
       selectCache[itemId].filtered=false;

       triggerSelectUnselectAction(optionsOneSelectedMatchType,itemId);

       $sInput.focus().val("");
       filterOptions("");
       updateUnselectedHeight();
     }

     function selectCurrentKeyboardChoice() {
       if (optionsNumMatching == 1) {
	 selectFilteredSelection();
       } else {
	 if (optionsKeyboardCurrentId !== null && (optionsKeyboardCurrentType == "clearlist" ||
						   !selectCache[optionsKeyboardCurrentId].filtered)) {

	   // if we are attempting to select a normal (non-clearing, non-exclusive) option
	   // and we are at our limit, prevent the selection
	   if (numOptionsSelected() >= prefs.maxSelections &&
	       prefs.maxSelections > -1 &&
	       optionsKeyboardCurrentType != "clearlist" &&
	       !selectCache[optionsKeyboardCurrentId].selected &&
	       !objIsExclusive(optionsKeyboardCurrentId)) {
	     return;
	   }

	   var toBeSelectedId=optionsKeyboardCurrentId;
	   var toBeSelectedType=optionsKeyboardCurrentType;

	   // safer to go up than down in case we're on the last unselected item, unless it's an exclusive
	   // option, in which case we should just clear. ok to skip this if we are keeping selected items
	   // in place because the list doesn't change in that case
	   if (!prefs.keepSelectedItemsInPlace) {
	     if (toBeSelectedType == "clearlist" || objIsExclusive(toBeSelectedId)) {
	       resetAndUpdateKeySelection();
	     } else {
	       keyGo(1);
	     }
	   }

	   triggerSelectUnselectAction(toBeSelectedType,toBeSelectedId);

	   // trigger another unselectedOptionsResize
	   $sInput.focus();
	 }
       }
     }

     function triggerSelectUnselectAction(type,id) {
       if (type == "clearlist") {
	 clearTextClick();
       } else if (type == "sticky") {
	 if (selectCache[id].selected) {
	   unselectSticky(id);
	 } else {
	   selectSticky(id);
	 }
       } else {
	 if (selectCache[id].selected) {
	   unselectOption(id);
	 } else {
	   selectOption(id);
	 }
       }
     }

     function getHelpText(numOptSel) {
       var helpTextText=prefs.helpText;
       if ((prefs.maxSelections > -1 && numOptSel >= prefs.maxSelections) ||
	 (numOptSel == 1 && prefs.allOptionsExclusive)) {
	 helpTextText=prefs.helpTextMaxSelectionsReached;
       }
       return helpTextText;
     }

     function buildOptions() {
       if ($sOptions.hasClass("jquery_rgbmultiselect_optionsbuilt")) {
	 return;
       }
       $sOptions.addClass("jquery_rgbmultiselect_optionsbuilt");

       var numOptSel=numOptionsSelected();
       var helpTextText=getHelpText(numOptSel);

       var helpText=$e("div").addClass("jquery_rgbmultiselect_options_helptext")
	 .text(helpTextText).appendTo($sOptions);

       if (prefs.clearAllSelectNoneAvailable) {
	 var clearText=buildClearTextItem();
	 clearText.appendTo($sOptions);
	 if (numOptSel === 0) {
	   clearText.find(".jquery_rgbmultiselect_options_clearlist_checkbox").attr("checked","checked");
	 }
       }

       var stickyObj=$e("div").addClass("jquery_rgbmultiselect_options_sticky");
       buildStickyCheckboxList(stickyObj).appendTo($sOptions);

       if (!prefs.keepSelectedItemsInPlace) {
	 var selectedItems=$e("div").addClass("jquery_rgbmultiselect_options_selected");
	 buildNormalCheckboxList(selectedItems,"selected").appendTo($sOptions);
       }

       var unselectedItems=$e("div").addClass("jquery_rgbmultiselect_options_unselected");
       buildNormalCheckboxList(unselectedItems,"unselected").appendTo($sOptions);

       $sOptions.hover(function() {
		       },function() {
			 // address a bug where if you unhover onto an element like a scrollbar,
			 // the unhover doesn't register in jQuery
			 $(this).find(".jquery_rgbmultiselect_options_item_hovered")
			   .removeClass("jquery_rgbmultiselect_options_item_hovered");
		       });

       // when the page reloads after pressing back, IE sometimes does not
       // have the selected options checked...
       if ($.browser.msie) {
	 $sOptions.find(".jquery_rgbmultiselect_options_selected_item .jquery_rgbmultiselect_options_item_checkbox").attr("checked","checked");
       }
     }

     function buildStickyCheckboxList(stickyObj) {
       for (var o in selectCache) {
	 if (typeof o == "string" && objTypeIs(o,"sticky")) {
	   var stickyValueContainer=$e("div").addClass("jquery_rgbmultiselect_options_item")
	     .addClass('jquery_rgbmultiselect_options_sticky_item');

	   if (objTypeIs(o,"headernocb")) {
	     stickyValueContainer.addClass('jquery_rgbmultiselect_options_headernocb');
	   }

	   if (objTypeIs(o,"child")) {
	     stickyValueContainer.addClass('jquery_rgbmultiselect_options_child_sticky');
	   }

	   var stickyCheckbox=$e("input").addClass("jquery_rgbmultiselect_options_sticky_checkbox")
	     .attr({type:'checkbox',id:baseCheckboxId+'_sticky'+o,name:baseCheckboxId+'_sticky'+o});
	   stickyCheckbox.click(function() {$sInput.focus();}).appendTo(stickyValueContainer);

	   if (objTypeIs(o,"headernocb")) {
	     stickyCheckbox.hide();
	   }

	   var stickyText=$e("span").text(selectCache[o].text);
	   stickyText.appendTo(stickyValueContainer);

	   stickyValueContainer.appendTo(stickyObj);

	   stickyValueContainer.click(function(e) {
					var checkbox=$(this).find(".jquery_rgbmultiselect_options_sticky_checkbox");
					var value=getItemId(checkbox,"sticky");
					if (selectCache[value].selected) {
					  unselectSticky(value);
					} else {
					  selectSticky(value);
					}
					$sInput.focus();
				      });

	   if (objTypeNot(o,"headernocb")) {
	     attachHoverEvents(stickyValueContainer);
	   }

	   if (selectCache[o].selected) {
	     stickyValueContainer.addClass("jquery_rgbmultiselect_options_selected_item");
	     stickyCheckbox.attr("checked","checked");
	   }
	 }
       }
       return stickyObj;
     }

     function buildClearTextItem() {
       var clearText=$e("div").addClass("jquery_rgbmultiselect_options_cleartext");
       var clearTextContainer=$e("div").addClass("jquery_rgbmultiselect_options_item")
	 .addClass('jquery_rgbmultiselect_options_cleartext_item');

       var clearTextCheckbox=$e("input").addClass("jquery_rgbmultiselect_options_clearlist_checkbox")
	 .attr({type:'checkbox',id:baseCheckboxId+'_clearlist',name:baseCheckboxId+'_clearlist'});
       clearTextCheckbox.click(function() {$sInput.focus();}).appendTo(clearTextContainer);

       var clearTextText=$e("span").text(prefs.clearAllSelectNoneText).appendTo(clearTextContainer);

       clearTextContainer.appendTo(clearText);

       clearText.click(function(e) {
			 clearTextClick();
			 $sInput.focus();
		       });

       attachHoverEvents(clearTextContainer);

       return clearText;
     }

     function clearTextClick() {
       clearAll();
       updateUnselectedHeight();
       $("#"+baseCheckboxId+"_clearlist").attr("checked","checked");
     }

     function isItemDisplayed(o,type) {
       // if prefs.keepSelectedItemsInPlace is true, we will only call this function
       // for items in the unselected list, so always show them (always return true)
       if (prefs.keepSelectedItemsInPlace) {
	 return true;
       }
       return (selectCache[o].selected && type == "selected") || (!selectCache[o].selected && type == "unselected");
     }

     function buildItemCheckBox(type,o) {
       var optId=baseCheckboxId+'_'+type+o;
       var itemCheckbox=$e("input").attr({type:'checkbox',id:optId,name:optId})
	 .addClass("jquery_rgbmultiselect_options_item_checkbox")
	 .addClass('jquery_rgbmultiselect_options_'+type+'_item_checkbox');

       if (type == "selected" || (prefs.keepSelectedItemsInPlace && selectCache[o].selected)) {
	 itemCheckbox.attr("checked","checked");
       }

       itemCheckbox.click(function(e) {$sInput.focus();});
       return itemCheckbox;
     }

     function buildNormalCheckboxList(items,type) {
       for (var o in selectCache) {
	 if (typeof o == "string" && objTypeNot(o,"hidden") && objTypeNot(o,"sticky")) {
	   var item=$e("div").addClass("jquery_rgbmultiselect_options_item")
	     .addClass('jquery_rgbmultiselect_options_'+type+'_item').attr("id",optionsId+"_item"+o);
	   if (objTypeIs(o,"headernocb")) {
	     item.addClass('jquery_rgbmultiselect_options_headernocb');
	   }
	   if (objTypeIs(o,"child")) {
	     item.addClass('jquery_rgbmultiselect_options_child_'+type);
	   }

	   var displayed=isItemDisplayed(o,type);

	   if (!displayed && type == "unselected" && !prefs.keepSelectedItemsInPlace) {
	     item.addClass("jquery_rgbmultiselect_options_item_is_selected");
	   }

	   // if we are keeping selected items in place, we want to set the selected item
	   // class here even though this is in the 'unselected' container
	   if (prefs.keepSelectedItemsInPlace && selectCache[o].selected) {
	     item.addClass("jquery_rgbmultiselect_options_selected_item");
	   }

	   item.css("display",(displayed?"block":"none"));

	   var itemCheckbox=buildItemCheckBox(type,o);
	   itemCheckbox.appendTo(item);
	   if (objTypeIs(o,"headernocb")) {
	     itemCheckbox.hide();
	   }

	   var itemText=$e("span").text(selectCache[o].text).appendTo(item);

	   item.click(function(e) {
			var checkbox=$(this).find(".jquery_rgbmultiselect_options_item_checkbox");
			var value=getItemId(checkbox,type);
			// this works regardless of the state of keepSelectedItemsInPlace
			// since we're checking the cache instead of the object type
			if (selectCache[value].selected) {
			  unselectOption(value);
			} else {
			  selectOption(value);
			}
			$sInput.focus();
		      });

	   if (objTypeNot(o,"headernocb")) {
	     attachHoverEvents(item);
	   }

	   item.appendTo(items);
	 }
       }
       return items;
     }

     function getItemId(item,type) {
       return item.attr("id").substr((baseCheckboxId+"_"+type).length);
     }

     function attachHoverEvents(item) {
       item.hover(function() {
		    $(this).addClass("jquery_rgbmultiselect_options_item_hovered");
		  },function() {
		    $(this).removeClass("jquery_rgbmultiselect_options_item_hovered");
		  });
     }

     // expect a value in the form "_selectvalue"
     function selectOption(value) {
       if (objTypeIs(value,"headernocb")) {
	 return;
       }
       if (numOptionsSelected() >= prefs.maxSelections && prefs.maxSelections > -1) {
	 $("#"+baseCheckboxId+"_unselected"+value).removeAttr("checked");
	 return;
       }
       preselectCommon(value);
       var selectedCheckbox=$("#"+baseCheckboxId+"_selected"+value);
       var unselectedCheckbox=$("#"+baseCheckboxId+"_unselected"+value);

       if (prefs.keepSelectedItemsInPlace) {
	 unselectedCheckbox.attr("checked","checked");
	 unselectedCheckbox.parent().addClass("jquery_rgbmultiselect_options_selected_item");
       } else {
	 selectedCheckbox.attr("checked","checked").parent().show();
	 unselectedCheckbox.removeAttr("checked");
	 unselectedCheckbox.parent().addClass("jquery_rgbmultiselect_options_item_is_selected").hide();
       }

       selectCommon(value);
       updateUnselectedHeight();
     }

     // expect a value in the form "_selectvalue"
     function unselectOption(value) {
       if (objTypeIs(value,"headernocb")) {
	 return;
       }
       $sSelect.find("OPTION[value='"+value.substr(1)+"']").removeAttr("selected");
       var selectedCheckbox=$("#"+baseCheckboxId+"_selected"+value);
       var unselectedCheckbox=$("#"+baseCheckboxId+"_unselected"+value);

       if (prefs.keepSelectedItemsInPlace) {
	 unselectedCheckbox.removeAttr("checked");
	 unselectedCheckbox.parent().removeClass("jquery_rgbmultiselect_options_selected_item");
       } else {
	 selectedCheckbox.attr("checked","checked").parent().hide();
	 unselectedCheckbox.removeAttr("checked");
	 unselectedCheckbox.parent().removeClass("jquery_rgbmultiselect_options_item_is_selected").show();
       }

       unselectCommon(value);
       updateUnselectedHeight();
     }

     // expect a value in the form "_selectvalue"
     function selectSticky(value) {
       if (objTypeIs(value,"headernocb")) {
	 return;
       }
       if (numOptionsSelected() >= prefs.maxSelections && prefs.maxSelections > -1) {
	 $("#"+baseCheckboxId+"_sticky"+value).removeAttr("checked");
	 return;
       }
       preselectCommon(value);
       var checkBox=$("#"+baseCheckboxId+"_sticky"+value);
       checkBox.attr("checked","checked").parent().addClass("jquery_rgbmultiselect_options_selected_item");
       var optionText=checkBox.siblings("SPAN");
       restoreOptionText(optionText,value);
       selectCommon(value);
     }

     // expect a value in the form "_selectvalue"
     function unselectSticky(value) {
       if (objTypeIs(value,"headernocb")) {
	 return;
       }
       $("#"+baseCheckboxId+"_sticky"+value).removeAttr("checked")
	 .parent().removeClass("jquery_rgbmultiselect_options_selected_item");
       unselectCommon(value);
     }

     function preselectCommon(value) {
       if (objIsExclusive(value)) {
	 clearAll();
       } else {
	 clearExclusive();
       }
     }

     function selectCommon(value) {
       selectCache[value].selected=true;
       $sSelect.find("OPTION[value='"+value.substr(1)+"']").attr("selected","selected");

       if (objTypeIs(value,"headercb") && prefs.selectingHeaderSelectsChildren && !allChildrenAreSelected(value)) {
	 var nextItem=selectCache[value].nextItem;
	 while (nextItem != null && objTypeIs(nextItem,"child")) {
	   if (objTypeIs(nextItem,"sticky")) {
	     selectSticky(nextItem);
	   } else {
	     selectOption(nextItem);
	   }
	   nextItem=selectCache[nextItem].nextItem;
	 }
       }

       if (objTypeIs(value,"child") && objTypeIs(selectCache[value].parent,"headercb") &&
	   prefs.selectingHeaderSelectsChildren && allChildrenAreSelected(selectCache[value].parent)) {
	   if (objTypeIs(selectCache[value].parent,"sticky")) {
	     selectSticky(selectCache[value].parent);
	   } else {
	     selectOption(selectCache[value].parent);
	   }
       }

       if (prefs.clearAllSelectNoneAvailable) {
	 $("#"+baseCheckboxId+"_clearlist").removeAttr("checked");
       }
       positionOptionsContainer();
       $sOptions.children(".jquery_rgbmultiselect_options_helptext").text(getHelpText(numOptionsSelected()));
       $sSelect.trigger("change",[selectCache[value]]);
     }

     function unselectCommon(value) {
       selectCache[value].selected=false;
       $sSelect.find("OPTION[value='"+value.substr(1)+"']").removeAttr("selected");

       if (objTypeIs(value,"headercb") && prefs.selectingHeaderSelectsChildren && allChildrenAreSelected(value)) {
	 var nextItem=selectCache[value].nextItem;
	 while (nextItem != null && objTypeIs(nextItem,"child")) {
	   if (objTypeIs(nextItem,"sticky")) {
	     unselectSticky(nextItem);
	   } else {
	     unselectOption(nextItem);
	   }
	   nextItem=selectCache[nextItem].nextItem;
	 }
       }

       if (objTypeIs(value,"child") && objTypeIs(selectCache[value].parent,"headercb") &&
	   prefs.selectingHeaderSelectsChildren) {
	   if (objTypeIs(value,"sticky")) {
	     unselectSticky(selectCache[value].parent);
	   } else {
	     unselectOption(selectCache[value].parent);
	   }
       }

       if (prefs.clearAllSelectNoneAvailable && numOptionsSelected() === 0) {
	 $("#"+baseCheckboxId+"_clearlist").attr("checked","checked");
       }
       positionOptionsContainer();
       $sOptions.children(".jquery_rgbmultiselect_options_helptext").text(getHelpText(numOptionsSelected()));
       $sSelect.trigger("change",[selectCache[value]]);
     }

     function allChildrenAreSelected(value) {
       return allChildrenSelectedUnselected(value,false);
     }

     function allChildrenAreUnselected(value) {
       return allChildrenSelectedUnselected(value,true);
     }

     function allChildrenSelectedUnselected(value,match) {
       var parent=selectCache[value];
       var nextItem=selectCache[value].nextItem;
       while (nextItem != null && objTypeIs(nextItem,"child")) {
	 if (selectCache[nextItem].selected == match) {
	   return false;
	 }
	 nextItem=selectCache[nextItem].nextItem;
       }
       return true;
     }

     function clearAll() {
       for (var o in selectCache) {
	 if (typeof o == "string") {
	   if (objTypeNot(o,"hidden") && selectCache[o].selected) {
	     if (objTypeIs(o,"sticky")) {
	       unselectSticky(o);
	     } else {
	       unselectOption(o);
	     }
	   }
	 }
       }
     }

     function clearExclusive() {
       for (var o in selectCache) {
	 if (typeof o == "string") {
	   if (objTypeNot(o,"hidden") && objTypeIs(o,"exclusive") && selectCache[o].selected) {
	     if (objTypeIs(o,"sticky")) {
	       unselectSticky(o);
	     } else {
	       unselectOption(o);
	     }
	   }
	 }
       }
     }

     function showOptions() {
       positionOptionsContainer();
       if (!$sOptions.is(":visible")) {
	 $sOptions.css({width:parseInt($sInput.width(),10)+"px"}).show();
       }

       // make sure we get the original height of the unselected list before we manipulate it
       // if only CSS max-height was universally supported...
       if (unselectedOriginalHeight === null) {
	 unselectedOriginalHeight=$sOptions.children(".jquery_rgbmultiselect_options_unselected").height();
       }

       updateUnselectedHeight();

       // in case placing the options container causes the page to scroll, we might
       // need to reposition horizontally or vertically
       positionOptionsContainer();
     }

     function updateUnselectedHeight() {
       if (!$sOptions.is(":visible")) {
	 return;
       }
       var unselectedContainer=$sOptions.children(".jquery_rgbmultiselect_options_unselected");
       var unselHeight=heightOfUnselectedOptions();
       if (unselHeight >= unselectedOriginalHeight) {
	 unselectedContainer.css("height","");
       } else {
	 unselectedContainer.css("height",(unselHeight+2)+"px");
       }
       positionIframe(true);
     }

     function heightOfUnselectedOptions() {
       var options=getAllVisibleOptions();
       var first=firstUnselected(options);
       var last=lastUnselected(options);
       if (options.length === 0 || first === "" || last === "") {
	 return 0;
       }
       var firstParent=$("#"+baseCheckboxId+"_unselected"+first).parent();
       var lastParent=$("#"+baseCheckboxId+"_unselected"+last).parent();
       return lastParent.position().top + lastParent.height() - firstParent.position().top;
     }

     function hideOptions() {
       positionIframe(false);
       $sOptions.hide();
     }

     function leaveField() {
       hideOptions();
       clearInputField=true;
       resetAndUpdateKeySelection();
       updateInputFieldText();
     }

     function buildOuterOptionsContainer() {
       var existingContainer=$("#"+optionsId);
       if (existingContainer.size() == 0) {
	 var optContainer=$e("div");
	 optContainer.hide().addClass("jquery_rgbmultiselect_options_container").attr("id",optionsId);
	 return optContainer;
       } else {
	 return existingContainer;
       }
     }

     function positionOptionsContainer() {
       if (!$sOptions.is(":visible")) {
	 return;
       }
       var offset=$sInput.offset();
       var top=parseInt(offset.top,10);
       var left=parseInt(offset.left,10);
       var containerTop=top+$sInput.outerHeight();
       var containerLeft=left;

       $sOptions.css({top:containerTop+"px",left:containerLeft+"px"});
       positionIframe(true);
     }

     function updateInputFieldText() {
       $sInput.val("").removeClass("jquery_rgbmultiselect_blurred");
       filterOptions("");
       var vals = buildFieldText();
       if (vals[0] != "") {
	 $sInput.addClass(vals[0]);
       }
       $sInput.val(vals[1]);
     }

     function buildFieldText() {
       var returnVals=new Array(2);
       returnVals[0]=""; // class to add

       var replacementsO=""; // selected options to show
       var replacementsC=0; // total number of options selected
       var replacementsA=0; // additional number of options selected (other than options to show)
       var numAdded=0;
       for (var o in selectCache) {
	 if (typeof o == "string") {
	   if (selectCache[o].selected) {
	     replacementsC++;
	     if (prefs.fieldTextFormatOnBlurNumToShow == -1 ||
		 (prefs.fieldTextFormatOnBlurNumToShow > 0 && prefs.fieldTextFormatOnBlurNumToShow > numAdded)) {
	       replacementsO+=selectCache[o].text+", ";
	       numAdded++;
	     }
	   }
	 }
       }

       // easier than conditionally including the comma in the loop
       replacementsO=replacementsO.substr(0,replacementsO.length-2);

       if (prefs.fieldTextFormatOnBlurNumToShow > 0) {
	 replacementsA=replacementsC-prefs.fieldTextFormatOnBlurNumToShow;
       }

       if (replacementsC == 0) {
	 if (prefs.clearAllSelectNoneAvailable && prefs.clearAllSelectNoneTextShowOnBlur &&
	     $sOptions.hasClass("jquery_rgbmultiselect_optionsbuilt")) {
	   returnVals[1]=prefs.clearAllSelectNoneText;
	 } else {
	   returnVals[0]="jquery_rgbmultiselect_blurred";
	   returnVals[1]=prefs.inputDefaultText;
	 }
       } else {
	 var fieldText=prefs.fieldTextFormatOnBlur+"";
	 if (replacementsA <= 0) {
	   fieldText=prefs.fieldTextFormatOnBlurIfLTENumToShow+"";
	 }
	 fieldText=fieldText.replace(/%o/,replacementsO);
	 fieldText=fieldText.replace(/%c/,replacementsC);
	 fieldText=fieldText.replace(/%a/,replacementsA);
	 returnVals[1]=fieldText;
       }

       return returnVals;
     }

     function anyOptionsSticky() {
       for (var o in selectCache) {
	 if (typeof o == "string" && objTypeIs(o,"sticky")) {
	   return true;
	 }
       }
       return false;
     }

     function anyNonstickyOptionsSelected() {
       for (var o in selectCache) {
	 if (typeof o == "string" && objTypeNot(o,"sticky") && selectCache[o].selected) {
	   return true;
	 }
       }
       return false;
     }

     function numOptionsSelected() {
       var c=0;
       for (var o in selectCache) {
	 if (typeof o == "string") {
	   if (selectCache[o].selected) {
	     c++;
	   }
	 }
       }
       return c;
     }

     function getSelectOptions() {
       var data={};
       var curParent=null;
       var prevValue=null;
       $sSelect.find("OPTION").each(
	 function() {
	   var value=$(this).val();
	   var props=$(this).attr(prefs.optionPropertiesField);
	   var text=$(this).text();
	   var selected=$(this).is(":selected");

	   var parent=null;
	   if (typeof props == "string") {
	     if (props.indexOf('child') > -1) {
	       parent=curParent;
	     } else if (props.indexOf('headercb') > -1 || props.indexOf('headernocb') > -1) {
	       curParent="_"+value;
	     } else {
	       curParent=null;
	     }
	   }

	   data["_"+value]={
	     nextItem:null,
	     prevItem:prevValue,
	     parent:parent,
	     props:props,
	     text:text,
	     selected:selected,
	     filtered:false,
	     obj:$(this), // for the benefit of the callback
	     val:value // for the benefit of the callback
	   };

	   if (prevValue !== null) {
	     data[prevValue].nextItem="_"+value;
	   }

	   prevValue="_"+value;
	 }
       );

       return data;
     }

     function buildInputField() {
       // we check for an existing input field because adding dynamic form elements breaks
       // back button functionality in firefox. if this bothers you, you can add the form
       // elements on your own and we'll just use them instead, without changing your form.
       var existingInputField=$("#"+inputId);
       var inputField;
       if (existingInputField.size() == 1) {
	 inputField=existingInputField;
       } else {
	 inputField=$e("input");
	 inputField.attr({type:"text",id:inputId,name:inputId}).css({width:selectWidth+"px"});
	 $sSelect.after(inputField);
       }
       inputField.addClass("jquery_rgbmultiselect_input").attr("autocomplete","off").val(prefs.inputDefaultText);
       return inputField;
     }

     function positionIframe(makevisible) {
       if ($.browser.msie && $.browser.version == 6 && $sIframe && $sOptions.is(":visible")) {
	 if (makevisible) {
	   var w=$sOptions.outerWidth();
	   var h=$sOptions.outerHeight();
	   var o=$sOptions.offset();
	   var t=o.top;
	   var l=o.left;
	   $sIframe.css({display:"block",top:t,left:l,height:h,width:w});
	 } else {
	   $sIframe.css({display:"none"});
	 }
       }
     }

     function buildIE6Iframe() {
       if ($.browser.msie && $.browser.version == 6) {
	 var iFrame=$e("iframe");
	 iFrame.addClass("jquery_rgbmultiselect_ie6_iframe").attr({id:iframeId,src:"javascript:void(0)"});
	 $(document.body).append(iFrame);
	 return iFrame;
       } else {
	 return null;
       }
     }

     function objIsExclusive(value) {
       return objTypeIs(value,"exclusive") || prefs.allOptionsExclusive;
     }

     function objTypeIs(o,type) {
       return selectCache[o].props && selectCache[o].props.indexOf(type) > -1;
     }

     function objTypeNot(o,type) {
       return !selectCache[o].props || selectCache[o].props.indexOf(type) == -1;
     }

     function debug(str) {
       if (window.console && window.console.log) {
	 window.console.log(str);
       } else {
	 if ($("#console").size() === 0) {
	   $(document.body).append('<div style="margin:20px;border:1px solid black;width:400px;height:400px;overflow:auto" id="console"></div>');
	 }
	 var newTimestamp=(new Date()).valueOf();
	 $("#console").html($("#console").html()+(newTimestamp-currentExecutionTimestamp)+"ms: "+str+"<br>");
	 currentExecutionTimestamp=newTimestamp;
       }
     }

     // convenience functions
     function $e(t) {
       return $(document.createElement(t));
     }

     function between(q,l,h) {
       return (q >= l && q <= h);
     }

     function mouseOverObj(obj,event) {
       obj=$(obj);
       var mX=event.pageX;
       var mY=event.pageY;
       var pos=obj.offset();
       var top=pos.top;
       var left=pos.left;
       var bottom=top+obj.outerHeight();
       var right=left+obj.outerWidth();
       return between(mX,left,right) && between(mY,top,bottom);
     }

     /*BEGINTEST*/
     function runTests() {
       // test convenience functions
       assertFalse(between(1,2,3),"1 is not between 2 and 3");
       assertTrue(between(2,1,3),"2 is between 1 and 3");
       assertTrue(mouseOverObj($('#picknumbers'),{pageX:15,pageY:15}),"mouse is over input box");
       assertFalse(mouseOverObj($('#picknumbers'),{pageX:150,pageY:150}),"mouse is not over input box");

       // test field population method and reparse callback
       var ret=buildFieldText();
       assert("Start typing to search",ret[1],"default field value is 'Start typing to search'");
       $('#picknumbers OPTION').slice(1,3).attr('selected','selected');
       reparseSelectList();
       ret=buildFieldText();
       assert("2: Zero, One",ret[1],"new field value is '2: Zero, One'");
       $('#picknumbers OPTION').slice(1,6).attr('selected','selected');
       reparseSelectList();
       ret=buildFieldText();
       assert("5: Zero, One, Two + 2 more",ret[1],"new field value is '5: Zero, One, Two + 2 more'");

       // test object typing
       assertFalse(objIsExclusive("_0"),"option 0 is not exclusive");
       assertTrue(objIsExclusive("_10"),"option 10 is exclusive");
       assertTrue(objTypeIs("_0","sticky"),"option 0 is sticky (objTypeIs)");
       assertFalse(objTypeNot("_0","sticky"),"option 0 is sticky (objTypeNot)");
       assertFalse(objTypeIs("_1","sticky"),"option 1 is not sticky (objTypeIs)");
       assertTrue(objTypeNot("_1","sticky"),"option 1 is not sticky (objTypeNot)");
       
       // test input field
       assert(1,$("#picknumbers_rgbmultiselect").size(),"input field exists");
       assert("off",$("#picknumbers_rgbmultiselect").attr("autocomplete"),"input field has autocomplete turned off");

       // test that option array is populated correctly
       var tmpCache=getSelectOptions();
       assertFalse(tmpCache["_0"].filtered,"0 is not filtered");
       assertTrue(tmpCache["_0"].selected,"0 is selected");
       assert("sticky",tmpCache["_0"].props,"0 has sticky as a property");
       assert(null,tmpCache["_selectafew"].prevItem,"first element has no previous element");
       assert("_0",tmpCache["_selectafew"].nextItem,"first element has _0 as next element");
       assert("_selectafew",tmpCache["_0"].prevItem,"second element has _selectafew as previous element");
       assert("_1",tmpCache["_0"].nextItem,"second element has _1 as next element");
       assert("_9",tmpCache["_10"].prevItem,"last element has _9 as previous element");
       assert(null,tmpCache["_10"].nextItem,"last element has no as next element");
       assert("_fivesixseven",tmpCache["_5"].parent,"_5 has fivesixseven as a parent");
       assert(null,tmpCache["_4"].parent,"_4 has no parent");

       // test selectCache and other accessors
       assert(5,numOptionsSelected(),"5 options are selected");
       assertTrue(anyOptionsSticky(),"at least one option is sticky");
       assertTrue(anyNonstickyOptionsSelected(),"nonsticky options are selected");
       assert("_0",getItemId($("#picknumbers_rgbmultiselect_container_checkbox_sticky_0"),"sticky"),"_0 is the item id");
       assert("_1",getItemId($("#picknumbers_rgbmultiselect_container_checkbox_unselected_1"),"unselected"),"_1 is the item id");
       assertTrue(isItemDisplayed("_0","sticky"),"_0 is displayed when keepSelectedItemsInPlace is on");
       assertTrue(isItemDisplayed("_8","unselected"),"_8 is displayed when keepSelectedItemsInPlace is on");
       assert("Select options",getHelpText(0),"help text is Select options");

       // test children selected functions
       assertFalse(allChildrenAreSelected("_fivesixseven"),"all children of _fivesixseven are not selected");
       assertTrue(allChildrenAreUnselected("_fivesixseven"),"all children of _fivesixseven are unselected");
       selectOption("_fivesixseven");
       assertTrue(allChildrenAreSelected("_fivesixseven"),"all children of _fivesixseven are now selected");
       assertFalse(allChildrenAreUnselected("_fivesixseven"),"all children of _fivesixseven are now not unselected");
       unselectOption("_5");
       assertFalse(allChildrenAreSelected("_fivesixseven"),"all children of _fivesixseven are now not selected");
       assertFalse(allChildrenAreUnselected("_fivesixseven"),"all children of _fivesixseven are now not unselected");
       unselectOption("_6");
       unselectOption("_7");
       reparseSelectList();

       // test keyboard search functions
       assert("abc",replaceWord("abc","d"),"test replace without match");
       assert('a<span class="jquery_rgbmultiselect_options_text_filtermatch">b</span>c',replaceWord("abc","b"),"test replace with one match");
       assert('a<span class="jquery_rgbmultiselect_options_text_filtermatch">b</span>a<span class="jquery_rgbmultiselect_options_text_filtermatch">b</span>c',replaceWord("ababc","b"),"test replace with two matches");
       assert('a<span class="jquery_rgbmultiselect_options_text_filtermatch">match</span>c',replaceWord("amatchc","match"),"test replace with complicated match");

       assert('a<span class="jquery_rgbmultiselect_options_text_filtermatch">b</span>a<span class="jquery_rgbmultiselect_options_text_filtermatch">d</span>c',replaceAll("abadc",["b","d"]),"test replace with two matches");

       assertTrue(andMatch("woot",["woot"]),"single term successful 'and' match");
       assertTrue(andMatch("woot ness hoo ray",["ness","ray"]),"successful 'and' match");
       assertFalse(andMatch("woot ness hoo ray",["ness","ray","ski"]),"failed 'and' match");

       var visibleOptions=getAllVisibleOptions();
       assert(12,visibleOptions.length,"visible options length is 12");
       assert("_1",firstUnselected(visibleOptions),"first unselected is _1");
       assert("_10",lastUnselected(visibleOptions),"last unselected is _10");

       // print report
       suitefinished();
     }

     function testrecord(status,message) {
       var c="";
       testsRun++;
       if (status) {
	 testsPassed++;
	 c="green";
       } else {
	 testsFailed++;
	 c="red";
	 $("#testsuiteresults").append('<span style="color:'+c+'">'+new Date().toLocaleString()+": "+message+"</span><br/>");
       }
     }

     function suitefinished() {
       var c='gray';
       if (testsFailed > 0) {
	 c='red';
	 $("#testsuiteresults").append('<br/>');
       }
       $("#testsuiteresults").append('<span style="color:'+c+'">'+new Date().toLocaleString()+": "+testsRun+" tests were run, "+testsPassed+" tests passed, "+testsFailed+" tests failed.</span>");
     }

     function assert(expected,actual,message) {
       testrecord(expected == actual,message);
     }
     
     function assertTrue(actual,message) {
       testrecord(actual,message);
     }

     function assertFalse(actual,message) {
       testrecord(!actual,message);
     }
     /*ENDTEST*/
   };

   $.rgbmultiselector.defaults = {
     /*BEGINTEST*/ runTests: false, /*ENDTEST*/
     helpText: 'Select options',
     helpTextMaxSelectionsReached: 'Max options selected',
     inputDefaultText: 'Start typing to search',
     maxSelections: -1,
     clearAllSelectNoneAvailable: false,
     clearAllSelectNoneText: '',
     clearAllSelectNoneTextShowOnBlur: false,
     allOptionsExclusive: false,
     buildOptionsInBackground: true,
     pageUpDownDistance: 10,
     // replace keys:
     // %o: options list, in order
     //   - if fieldTextFormatOnBlurNumToShow == -1, show all,
     //     else show fieldTextFormatOnBlurNumToShow
     // %c: count of number of options selected
     // %a: count of number of options in addition to
     //     fieldTextFormatOnBlurNumToShow, or
     //     %c - fieldTextFormatOnBlurNumToShow
     fieldTextFormatOnBlur: "%o",
     fieldTextFormatOnBlurNumToShow: -1,
     fieldTextFormatOnBlurIfLTENumToShow: "%o",
     optionPropertiesField: "rel",
     tabKeySelectsSingleFilteredUnselectedItem: false,
     keepSelectedItemsInPlace: false,
     selectingHeaderSelectsChildren: false
   };
 })(jQuery);
