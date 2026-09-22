/* ============================================
   Kit Visual: ferandrade-com-br
   Arquivo: animations.js
   GSAP + ScrollTrigger + Lenis + Counters
   ============================================ */

(function () {
  "use strict";

  function runWhenIdle(fn, timeout) {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(fn, { timeout: timeout || 1200 });
    } else {
      window.setTimeout(fn, 250);
    }
  }

  function shouldUseEnhancedAnimations() {
    var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var saveData = navigator.connection && navigator.connection.saveData;
    var isSmallScreen = window.matchMedia && window.matchMedia("(max-width: 767px)").matches;
    return !(prefersReduced || saveData || isSmallScreen);
  }

  function init() {
    if (typeof gsap === "undefined") {
      console.warn("[kit] GSAP nao carregado. Animacoes JS desativadas.");
      revealAll();
      initFaqToggles();
      initSwiperCarousels({ autoplay: false, allowTouchMove: true });
      return;
    }

    if (gsap.registerPlugin && typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    if (!shouldUseEnhancedAnimations()) {
      initFaqToggles();
      try {
        initScrollReveals(true);
      } catch (e) {
        revealAll();
      }
      initCounterAnimations();
      initSwiperCarousels({ autoplay: false, allowTouchMove: true });
      return;
    }

    try {
      initLenis();
    } catch (e) {
      console.warn("Lenis init failed:", e);
    }

    try {
      initScrollReveals();
    } catch (e) {
      console.warn("ScrollReveals init failed", e);
    }

    initFaqToggles();
    initCounterAnimations();
    runWhenIdle(function () {
      initSwiperCarousels({ autoplay: true, allowTouchMove: false });
    }, 1600);
    runWhenIdle(initBokehParticles, 2000);
  }

  function revealAll() {
    var els = document.querySelectorAll("[data-anim]");
    for (var i = 0; i < els.length; i++) {
      els[i].style.opacity = "1";
      els[i].classList.add("kit-visible");
    }
  }

  function initLenis() {
    if (typeof Lenis === "undefined") return;

    var lenis = new Lenis({
      duration: 1.2,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smooth: true,
    });

    var rafId = 0;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        lenis.stop();
        cancelAnimationFrame(rafId);
      } else {
        lenis.start();
        rafId = requestAnimationFrame(raf);
      }
    });

    if (typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.lagSmoothing(0);
    }
  }

  function initScrollReveals(mobileMode) {
    var reveals = document.querySelectorAll("[data-anim]");
    if (!reveals.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          var el = entry.target;
          var animType = el.getAttribute("data-anim");
          if (animType === "hero-section") {
            el.classList.add("kit-visible");
            observer.unobserve(el);
            return;
          }

          var delay = parseFloat(el.getAttribute("data-anim-delay") || "0");
          var duration = parseFloat(el.getAttribute("data-anim-duration") || (mobileMode ? "0.6" : "0.8"));

          var from = {};
          var to = { opacity: 1, duration: duration, delay: delay, ease: "power2.out" };

          switch (animType) {
            case "fade-up":
              from = { opacity: 0, y: mobileMode ? 20 : 30 };
              break;
            case "fade-left":
              // No mobile evita transform X (causa overflow-x cortado)
              from = mobileMode ? { opacity: 0, y: 15 } : { opacity: 0, x: -40 };
              break;
            case "fade-right":
              from = mobileMode ? { opacity: 0, y: 15 } : { opacity: 0, x: 40 };
              break;
            case "fade-in":
              from = { opacity: 0 };
              break;
            case "zoom-in":
              from = { opacity: 0, scale: mobileMode ? 0.95 : 0.9 };
              break;
            case "slide-up":
              from = { opacity: 0, y: mobileMode ? 30 : 50 };
              to.ease = "power3.out";
              break;
            default:
              from = { opacity: 0, y: 20 };
          }

          gsap.fromTo(el, from, to);
          el.classList.add("kit-visible");
          observer.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initCounterAnimations() {
    var counters = document.querySelectorAll("[data-anim-counter]");
    if (!counters.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          var el = entry.target;
          var target = parseInt(el.getAttribute("data-anim-counter"), 10);
          var suffix = el.getAttribute("data-anim-suffix") || "";
          var prefix = el.getAttribute("data-anim-prefix") || "";
          var duration = parseFloat(el.getAttribute("data-anim-duration") || "2");

          var obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration: duration,
            ease: "power1.out",
            onUpdate: function () {
              el.textContent = prefix + Math.round(obj.val) + suffix;
            },
          });

          observer.unobserve(el);
        });
      },
      { threshold: 0.3 }
    );

    counters.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initSwiperCarousels(opts) {
    if (typeof Swiper === "undefined") return;
    opts = opts || {};

    var isMobile = !!opts.allowTouchMove;
    var swipers = [];

    document.querySelectorAll("[data-anim-swiper]").forEach(function (el) {
      var config = {
        slidesPerView: 1,
        spaceBetween: isMobile ? 16 : 24,
        loop: true,
        // Mobile: transição rápida para feedback tátil responsivo
        // Desktop: transição suave ao arrastar
        speed: isMobile ? 400 : 800,
        allowTouchMove: true,
        grabCursor: true,
        breakpoints: {
          768: { slidesPerView: 2, spaceBetween: 24 },
          1024: { slidesPerView: 3, spaceBetween: 24 },
        },
      };

      // Sem passagem automática: o carrossel só se move por interação do usuário
      if (isMobile) {
        var pag = el.querySelector(".swiper-pagination");
        if (pag) {
          config.pagination = {
            el: pag,
            clickable: true,
          };
        }
      }

      var s = new Swiper(el, config);
      swipers.push(s);
    });

    // Pausar marquee desktop ao trocar de aba
    if (!isMobile) {
      document.addEventListener("visibilitychange", function () {
        swipers.forEach(function (s) {
          if (!s.autoplay) return;
          if (document.hidden) {
            s.autoplay.stop();
          } else {
            s.autoplay.start();
          }
        });
      });
    }
  }

  function initFaqToggles() {
    document.querySelectorAll("[data-anim-faq]").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var parent = trigger.closest(".kit-faq-item");
        if (!parent) return;

        var isOpen = parent.classList.contains("kit-faq-open");

        document.querySelectorAll(".kit-faq-item.kit-faq-open").forEach(function (item) {
          if (item !== parent) item.classList.remove("kit-faq-open");
        });

        if (isOpen) {
          parent.classList.remove("kit-faq-open");
        } else {
          parent.classList.add("kit-faq-open");
        }
      });
    });
  }

  function initBokehParticles() {
    var containers = document.querySelectorAll(".kit-bokeh-container[data-anim-bokeh]");
    containers.forEach(function (container) {
      var count = parseInt(container.getAttribute("data-anim-bokeh") || "15", 10);
      for (var i = 0; i < count; i++) {
        var p = document.createElement("span");
        p.className = "kit-bokeh-particle";
        var size = Math.random() * 6 + 2;
        p.style.width = size + "px";
        p.style.height = size + "px";
        p.style.left = Math.random() * 100 + "%";
        p.style.top = Math.random() * 100 + "%";
        p.style.animationDuration = (Math.random() * 20 + 10) + "s";
        p.style.animationDelay = Math.random() * 5 + "s";
        if (Math.random() > 0.7) {
          p.classList.add("kit-bokeh-particle--flash");
          p.style.animationDuration = Math.random() * 6 + 4 + "s";
        }
        container.appendChild(p);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
