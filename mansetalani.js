// Slider
;(function ($) {
  "use strict";

  $.fn.memeSlider = function (options) {
    return this.each(function (index, el) {
      let $el = $(el),
      slider = new MemeSlider($el, options);

      $el.data("memeSlider", slider);
    });
  };

  $.fn.memeSlider.defaults = {
    wrapperSelector: ".meme-wrapper",
    slideSelector: ".meme-slide,.yazarlar img",
    navigation: {
      nextSelector: ".next",
      prevSelector: ".prev" },

    pagination: {
      containerSelector: ".meme-pagination",
      bulletRender: function (className, index) {
        return `<button class="${className}">${index}</button>`;
      } },
