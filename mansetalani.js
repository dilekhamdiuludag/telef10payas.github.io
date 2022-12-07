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

    items: 1,
    slideActiveClass: "active",
    bulletActiveClass: "active",
    infinity: true,
    swipe: true,
    swipeDelta: 50,
    spaceBetween: 20,
    autoPlay: true,
    autoPlayDelay: 3500,
    resizeDelay: 300,
    animationFunction: function (newIndex, onSlideChangeEnd) {
      let $wrapper = this.$wrapper;

      if (!$wrapper.length) {
        return;
      }

      let offset = newIndex * this.slides.width,
      animationSpeed = 500,
      animationFunc = "ease-in-out";

      $wrapper.css({
        transition: `transform ${animationSpeed}ms ${animationFunc}`,
        transform: `translateX(-${offset}px)` });


      clearTimeout(this.slides._timer);

      this.slides._timer = setTimeout(() => {
        onSlideChangeEnd();
      }, animationSpeed);
    },
    animationFunctionOnResize: function (currentIndex) {
      let offset = currentIndex * this.slides.width;

      this.$wrapper.css({
        transition: `transform 0ms ease-in-out`,
        transform: `translateX(-${offset}px)` });

    },
    onInit: function () {},
    onResizeStart: function () {},
    onResizeEnd: function () {},
    onSlideChangeStart: function () {},
    onSlideChangeEnd: function () {} };


  class MemeSlider {
    constructor($slider, options) {
      this.options = Object.assign({}, $.fn.memeSlider.defaults, options);
      this.$slider = $slider;

      let $slides = this.$slider.find(this.options.slideSelector),
      slideWidth = this._calcSlidesWidth();

      this.slides = {
        $collection: $slides,
        count: $slides.length,
        width: slideWidth,
        step: slideWidth * this.options.items,
        currentSlide: 0 };

      this.$wrapper = $slider.find(this.options.wrapperSelector);
      this.$bullets = null;
      this.autoPlayTimer = null;
      this._init($slider, options);
    }

    _calcSlidesWidth() {
      let items = this.options.items,
      sliderWidth = this.$slider.innerWidth();
      return items >= 1 ? sliderWidth / items : sliderWidth;
    }

    goTo(newIndex) {
      let slidesCount = this.slides.count,
      items = this.options.items;

      if (slidesCount === items) {
        return this;
      }

      newIndex = this._calcNewSlideIndex(newIndex, slidesCount, items);

      this._reinitAutoplay();

      if (newIndex === this.slides.currentSlide) {
        return this;
      }

      this._changeBulletActiveClass(newIndex);
      this._changeSlidesActiveClass(newIndex);
      this._changeSlide(newIndex);
      return this;
    }

    _calcNewSlideIndex(newIndex, slidesCount, items) {
      let isInfinity = this.options.infinity;

      if (newIndex >= slidesCount) {
        return isInfinity ? 0 : this._calcSlideLastIndex(slidesCount, items);
      } else if (newIndex < 0) {
        return isInfinity ? this._calcSlideLastIndex(slidesCount, items) : 0;
      }

      return newIndex;
    }

    _calcSlideLastIndex(slidesCount, items) {
      let remainder = slidesCount % items;
      return remainder === 0 ? slidesCount - items : slidesCount - remainder;
    }

    _changeBulletActiveClass(buttonIndex) {
      let activeClass = this.options.bulletActiveClass,
      $bullets = this.$bullets;

      if (!$bullets) {
        return this;
      }

      $bullets.
      removeClass(activeClass).
      filter(function () {
        return $(this).data("meme-bullet") === buttonIndex;
      }).
      addClass(activeClass);
      return this;
    }

    _changeSlidesActiveClass(nextIndex) {
      let $slides = this.slides.$collection,
      activeClass = this.options.slideActiveClass;
      $slides.filter(`.${activeClass}`).removeClass(activeClass);
      for (let i = 0; i < this.options.items; i++) {
        $slides.eq(nextIndex + i).addClass(activeClass);
      }
      this.slides.currentSlide = nextIndex;
      return this;
    }

    _changeSlide(newIndex) {
      let options = this.options;
      options.onSlideChangeStart();
      options.animationFunction.call(this, newIndex, options.onSlideChangeEnd.bind(this));
      return this;
    }

    goNext() {
      this.goTo(this.slides.currentSlide + this.options.items);
      return this;
    }

    goPrev() {
      this.goTo(this.slides.currentSlide - this.options.items);
      return this;
    }

    _init($slider, options) {
      this._setSlidesWidth();
      this._addSwipeEvent();
      this._addResizeEvent();
      this._initNavigation();
      this._initPagination();
      this._changeBulletActiveClass(0);
      this._changeSlidesActiveClass(0);
      this._initAutoPlay();
      this.options.onInit.call(this);
      return this;
    }

    _setSlidesWidth() {
      this.slides.$collection.css("width", this.slides.width);
      return this;
    }

    _addSwipeEvent() {
      if (!this.options.swipe) {
        return this;
      }

      let touchstartX = 0,
      touchendX = 0,
      delta = this.options.swipeDelta;

      this.$wrapper.on("touchstart.meme", e => {
        touchstartX = e.changedTouches[0].screenX;
      });

      this.$wrapper.on("touchend.meme", e => {
        touchendX = e.changedTouches[0].screenX;
        if (touchendX < touchstartX - delta) {
          this.goNext();
        } else if (touchendX - delta > touchstartX) {
          this.goPrev();
        }
      });

      return this;
    }

    _addResizeEvent() {
      let timer;
      $(window).on("resize.meme", e => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          this.options.onResizeStart.call(this);
          this.slides.width = this._calcSlidesWidth();
          this._setSlidesWidth();
          this.options.animationFunctionOnResize.call(this, this.slides.currentSlide);
          this.options.onResizeEnd.call(this);
        }, this.options.resizeDelay);
      });
    }

    _initNavigation() {
      let nextSelector = this.options.navigation.nextSelector,
      prevSelector = this.options.navigation.prevSelector;

      if ($(nextSelector).length) {
        this._addNavigationEvent(nextSelector);
      }

      if ($(prevSelector).length) {
        this._addNavigationEvent(prevSelector, "prev");
      }

      return this;
    }

    _addNavigationEvent(buttonSelector, direction) {
      let $button = this._findNavigationButton(buttonSelector);

      if (!$button) {
        return this;
      }

      $button.off("click.meme");

      $button.on("click.meme", e => {
        e.preventDefault();
        let currentSlide = this.slides.currentSlide,
        slidesCount = this.options.items;

        if (direction === "prev") {
          this.goTo(currentSlide - slidesCount);
        } else {
          this.goTo(currentSlide + slidesCount);
        }
      });

      return this;
    }

    _findNavigationButton(buttonSelector) {
      let $button = this.$slider.find(buttonSelector);

      if (!$button.length) {
        $button = $(buttonSelector);

        if (!$button.length) {
          return false;
        }
      }

      this.$button = $button;

      return this.$button;
    }

    _initPagination() {
      let paginationSelector = this.options.pagination.containerSelector,
      $pagination = this.$slider.find(paginationSelector);

      if (!$pagination.length) {
        return this;
      }

      $pagination.empty();

      let bulletsCount = Math.ceil(this.slides.count / this.options.items);
      this.$bullets = $();

      for (let i = 0; i < bulletsCount; i++) {
        let $bullet = $(this.options.pagination.bulletRender("meme-bullet", i + 1));
        this.$bullets = this.$bullets.add($bullet);
        $bullet.data("meme-bullet", i * this.options.items);
        this._addPaginationEvent($bullet);
        $pagination.append($bullet);
      }

      return this;
    }

    _addPaginationEvent($bullet) {
      $bullet.on("click.meme", e => {
        e.preventDefault();
        let slideTo = $(e.target).data("meme-bullet");
        this.goTo(slideTo);
      });
      return this;
    }

    _initAutoPlay() {
      if (!this.options.autoPlay) {
        return this;
      }

      this.autoPlayTimer = setInterval(() => {
        this.goNext();
      }, this.options.autoPlayDelay);
      return this;
    }

    _reinitAutoplay() {
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
        this._initAutoPlay();
      }
    }}

})(jQuery);

// What user can do
$(".meme-slider").memeSlider({
  items: 1,
  autoPlay: true,
  onResizeEnd: function () {
    console.log("Resize event Ended!");
  } });

$(".meme-slider-1").memeSlider({
  infinity: true,
  autoPlay: true,
  items: 1,
  onSlideChangeStart: function () {
    console.log("onSlideChangeStart Fired");
  }
});

$(".meme-slider-2").memeSlider({
  infinity: false,
  autoPlay: false,
  items: 4,
  onSlideChangeStart: function () {
    console.log("onSlideChangeStart Fired");
  }
});

$(".meme-slider-3").memeSlider({
  infinity: false,
  autoPlay: false,
  items: 2,
  onSlideChangeStart: function () {
    console.log("onSlideChangeStart Fired");
  }
});

console.log($(".meme-slider").data("memeSlider"));
// Menu
const navToggler = document.querySelector(".nav-toggler");navToggler.addEventListener("click", navToggle);function navToggle() {navToggler.classList.toggle("active");const nav = document.querySelector(".nav");nav.classList.toggle("open");if(nav.classList.contains("open")){nav.style.maxHeight = nav.scrollHeight + "px";}else{nav.removeAttribute("style");}}
// Search Box
$(function(){$('a[href="#seaform"]').on("click",function(e){e.preventDefault(),$("#seaform").addClass("open"),$('#seaform > form > input[type="search"]').focus()}),$("#seaform, #seaform button.close").on("click keyup",function(e){e.target!=this&&"close"!=e.target.className&&27!=e.keyCode||$(this).removeClass("open")})});
