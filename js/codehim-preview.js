(function($){
      $.fn.CodehimPreview = function(options) {
      var setting = $.extend({
    		       item: "",
                 itemFile: "",
               
  		   }, options);
  
        return this.each(function() {

var preview = $(".codehim-item-preview").find("iframe");

var uWidth = $(window).width();
var uHeight = $(window).height();



function getParams(){
var idx = document.URL.indexOf('?');
var params = new Array();
if (idx != -1) {
var pairs = document.URL.substring(idx+1, document.URL.length).split('&');
for (var i=0; i<pairs.length; i++){
nameVal = pairs[i].split('=');
params[nameVal[0]] = nameVal[1];
}
}
return params;
}
params = getParams();

item = unescape(params["item"]);
file = unescape(params["file"]);



var userDevice = {
  'width' : uWidth,
  'height' : uHeight,


};

var desktop = {
   'width' : '1280px',
   'height' : '720px',

};


var laptop = {
   'width' : '1440px',
   'height' : '900px',

};

var tablet = {
 'width' : '768px',
   'height' : '1024px',


};

var mobile = {
 'width' : '360px',
   'height' : '640px',


};
 
var codehim_item = {
   'src' : "https://codehimblog.github.io/"+item,

};

var btnControl = $(".btn-control");
var active = "active";



document.title = item + " Example & Demo - Codehim";


//apply the screen size according to the user device 

$(preview).attr(userDevice).prop(codehim_item);

if (item == undefined){
   alert("no file to show");

}


$(window).on("resize", function(){
       
   responsive();

});


function responsive(){

uWidth = $(window).width();
       uHeight = $(window).height();

userDevice = {
  'width' : uWidth,
  'height' : uHeight
};

       $(preview).attr(userDevice);
     $(btnControl).removeClass(active);
     $(".responsive").addClass(active);

}


$(".responsive").click(function(){

responsive();

   
   $(this).parent().addClass("act");
   $(".ripple-out").not($(this).parent()).removeClass("act");

});





$(".desktop").click(function(){

  $(preview).attr(desktop);
   $(this).addClass("active");
   $(btnControl).not(this).removeClass(active);


$(this).parent().addClass("act");
   $(".ripple-out").not($(this).parent()).removeClass("act");

});

$(".laptop").click(function(){
$(this).addClass("active");
  $(preview).attr(laptop);

$(btnControl).not(this).removeClass(active);

$(this).parent().addClass("act");
   $(".ripple-out").not($(this).parent()).removeClass("act");


});

$(".tablet").click(function(){
$(this).addClass("active");
  $(preview).attr(tablet);

$(btnControl).not(this).removeClass(active);


$(this).parent().addClass("act");
   $(".ripple-out").not($(this).parent()).removeClass("act");

});

$(".mobile").click(function(){
$(this).addClass("active");
  $(preview).attr(mobile);

$(btnControl).not(this).removeClass(active);


$(this).parent().addClass("act");
   $(".ripple-out").not($(this).parent()).removeClass("act");

});



setTimeout(function(){

$("#codehim-logo").hide();

     $(".logo-splash").fadeIn(500, function(){

        $(".codehim-loader").fadeOut();

    });


  },2500);







        });
      };
    
    })(jQuery);
