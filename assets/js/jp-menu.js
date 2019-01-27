$(document).ready(function(){

   var jpHeader = $(".jp-header");
   var searchBtn = $(".search-btn");
   var menuBtn = $(".menu-btn");
   var jpNav = $(".jp-nav");
   var jpSearch = $(".jp-search");
   var dimmy = $(".dim-overlay");
$(window).on('scroll', function(){
if ($(this).scrollTop() > 20 && !$(jpNav).hasClass("open")){
   $(jpHeader).addClass("shadow");
   }
   else{
   $(jpHeader).removeClass("shadow");
   }
   $(jpSearch).removeClass("open");
});
$(searchBtn).click(function(){
   $(jpSearch).addClass("open");
});
$(menuBtn).click(function(){
   $(jpNav).addClass("open");
   $(dimmy).fadeIn();
});
//close menu if user click outside of it
   $(window).click(function(e) {
    if ($(e.target).closest(menuBtn).length){
     return;}
    if ($(e.target).closest(jpNav).length){
     return;}
 $(jpNav).removeClass("open");
    if (!$(jpNav).hasClass("open")) {
     $(dimmy).fadeOut();
        }
      });
}); //jQuery 
