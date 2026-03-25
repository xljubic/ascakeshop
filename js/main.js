(function () {
  const ORIGIN_LABEL = "Kaluđerica";
  const ORIGIN_LABEL_EN = "Kaludjerica";
  const ORIGIN_QUERY = "Hercegovacka 35, Kaludjerica, Belgrade, Serbia";
  const DELIVERY_BASE_PRICE = 250;
  const DELIVERY_PRICE_PER_KM = 35;

  const state = {
    lang: "sr",
    originCoords: null,
    map: null,
    routeLine: null,
    originMarker: null,
    destinationMarker: null
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  function getNestedValue(obj, path) {
    return path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);
  }

  function applyTranslations() {
    const dictionary = window.translations[state.lang];
    document.documentElement.lang = state.lang;

    $$("[data-i18n]").forEach((element) => {
      const value = getNestedValue(dictionary, element.dataset.i18n);
      if (typeof value === "string") {
        element.textContent = value;
      }
    });

    $$("[data-i18n-placeholder]").forEach((element) => {
      const value = getNestedValue(dictionary, element.dataset.i18nPlaceholder);
      if (typeof value === "string") {
        element.placeholder = value;
      }
    });

    $(".nav-toggle").setAttribute("aria-label", state.lang === "sr" ? "Otvori meni" : "Open menu");
    $("#delivery-city").value = state.lang === "sr" ? "Beograd" : "Belgrade";

    renderCakes();
    renderFaq();
  }

  function renderCakes() {
    const container = $("#cake-list");
    const dictionary = window.translations[state.lang].cakes;

    container.innerHTML = window.siteData.cakes
      .map((cake) => {
        const content = dictionary[cake.id];
        const layers = cake.layers[state.lang].map((layer) => `<li>${layer}</li>`).join("");

        return `
          <article class="cake-card reveal" id="cake-${cake.id}">
            <div class="cake-copy">
              <span class="eyebrow">${cake.emoji} ${dictionary.eyebrow}</span>
              <h3>${content.name}</h3>
              <p>${content.description}</p>
              <strong>${dictionary.layersTitle}</strong>
              <ul class="cake-layers">${layers}</ul>
              <div class="cake-meta">
                <div class="meta-pill">${dictionary.weight}: ${cake.weight}</div>
                <div class="meta-pill">${dictionary.price}: ${cake.price}</div>
              </div>
            </div>
            <div class="cake-gallery" data-gallery="${cake.id}">
              <div class="gallery-stage" style="background-image: url('${cake.imageSet[0]}')"></div>
              <div class="gallery-controls">
                ${cake.imageSet
                  .map(
                    (image, index) => `
                      <button
                        class="gallery-thumb ${index === 0 ? "active" : ""}"
                        type="button"
                        style="background-image: url('${image}')"
                        data-image="${image}"
                        aria-label="${content.name} ${index + 1}"
                      ></button>
                    `
                  )
                  .join("")}
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    revealVisibleElements();
    bindGalleryControls();
  }

  function renderFaq() {
    const faqList = $("#faq-list");
    const items = window.translations[state.lang].faq.items;

    faqList.innerHTML = items
      .map(
        (item, index) => `
          <article class="faq-item reveal ${index === 0 ? "open" : ""}">
            <button class="faq-question" type="button" aria-expanded="${index === 0}">
              <span>${item.q}</span>
              <span>${index === 0 ? "-" : "+"}</span>
            </button>
            <div class="faq-answer">
              <div>
                <p>${item.a}</p>
              </div>
            </div>
          </article>
        `
      )
      .join("");

    revealVisibleElements();
    bindFaq();
  }

  function bindGalleryControls() {
    $$(".cake-gallery").forEach((gallery) => {
      const stage = $(".gallery-stage", gallery);
      const thumbs = $$(".gallery-thumb", gallery);
      let activeIndex = thumbs.findIndex((thumb) => thumb.classList.contains("active"));
      let intervalId = null;

      function showImage(nextIndex) {
        activeIndex = nextIndex;
        stage.style.backgroundImage = `url('${thumbs[activeIndex].dataset.image}')`;
        thumbs.forEach((item, itemIndex) => item.classList.toggle("active", itemIndex === activeIndex));
      }

      function startAutoplay() {
        if (thumbs.length < 2) {
          return;
        }

        intervalId = setInterval(() => {
          showImage((activeIndex + 1) % thumbs.length);
        }, 2800);
      }

      function restartAutoplay() {
        if (intervalId) {
          clearInterval(intervalId);
        }
        startAutoplay();
      }

      thumbs.forEach((thumb, thumbIndex) => {
        thumb.addEventListener("click", () => {
          showImage(thumbIndex);
          restartAutoplay();
        });
      });

      startAutoplay();
    });
  }

  function bindFaq() {
    $$(".faq-item").forEach((item) => {
      const button = $(".faq-question", item);
      button.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        $$(".faq-item").forEach((faq) => {
          faq.classList.remove("open");
          $(".faq-question", faq).setAttribute("aria-expanded", "false");
          $(".faq-question span:last-child", faq).textContent = "+";
        });

        if (!isOpen) {
          item.classList.add("open");
          button.setAttribute("aria-expanded", "true");
          $(".faq-question span:last-child", item).textContent = "-";
        }
      });
    });
  }

  function bindNav() {
    const navToggle = $(".nav-toggle");
    const dropdown = $(".dropdown");
    const dropdownToggle = $(".dropdown-toggle");

    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      document.body.classList.toggle("menu-open", !expanded);
    });

    dropdownToggle.addEventListener("click", () => {
      if (window.innerWidth <= 840) {
        dropdown.classList.toggle("open");
        return;
      }

      const cakesSection = $("#cakes");
      if (cakesSection) {
        cakesSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    $$(".nav-links a, .logo").forEach((link) => {
      link.addEventListener("click", () => {
        document.body.classList.remove("menu-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function bindLanguageSwitch() {
    $$(".lang-btn").forEach((button) => {
      button.addEventListener("click", () => {
        state.lang = button.dataset.lang;
        $$(".lang-btn").forEach((item) => item.classList.toggle("active", item === button));
        applyTranslations();
      });
    });
  }

  function bindHeroTilt() {
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    $$(".hero-story").forEach((card) => {
      card.addEventListener("mousemove", (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        const rotateY = (x - 0.5) * 7;
        const rotateX = (0.5 - y) * 7;

        card.classList.add("is-tilting");
        card.style.transform =
          `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.classList.remove("is-tilting");
        card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)";
      });
    });
  }

  function initHeroSlider() {
    $$("[data-slider='hero']").forEach((slider) => {
      const slides = $$(".hero-slide", slider);
      const dotsContainer = $(".slider-dots", slider);
      let index = 0;

      dotsContainer.innerHTML = slides
        .map((_, dotIndex) => `<button class="slider-dot ${dotIndex === 0 ? "active" : ""}" type="button"></button>`)
        .join("");

      const dots = $$(".slider-dot", dotsContainer);

      function showSlide(nextIndex) {
        slides[index].classList.remove("active");
        dots[index].classList.remove("active");
        index = nextIndex;
        slides[index].classList.add("active");
        dots[index].classList.add("active");
      }

      dots.forEach((dot, dotIndex) => dot.addEventListener("click", () => showSlide(dotIndex)));

      setInterval(() => {
        showSlide((index + 1) % slides.length);
      }, 4500);
    });
  }

  function revealVisibleElements() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    $$(".reveal:not(.visible)").forEach((element) => observer.observe(element));
  }

  function formatMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    if (!hours) {
      return `${minutes} min`;
    }
    return `${hours}h ${minutes} min`;
  }

  async function geocode(query) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    if (!data.length) {
      return null;
    }

    return {
      lat: Number(data[0].lat),
      lon: Number(data[0].lon)
    };
  }

  async function ensureOriginCoords() {
    if (!state.originCoords) {
      state.originCoords = await geocode(ORIGIN_QUERY);
    }
    return state.originCoords;
  }

  async function calculateRoute(destination) {
    const origin = await ensureOriginCoords();
    const target = await geocode(destination);

    if (!origin || !target) {
      return null;
    }

    const routeResponse = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${target.lon},${target.lat}?overview=false`
    );
    const routeData = await routeResponse.json();

    if (!routeData.routes || !routeData.routes.length) {
      return { error: "route" };
    }

    const route = routeData.routes[0];
    return {
      origin,
      destination: target,
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60
    };
  }

  function updateDeliveryStatus(message, isError = false) {
    const status = $("#delivery-status");
    status.textContent = message;
    status.style.color = isError ? "#b33d4f" : "";
  }

  function buildDestinationQuery() {
    const street = $("#delivery-street").value.trim();
    const number = $("#delivery-number").value.trim();
    const area = $("#delivery-area").value.trim();
    const city = $("#delivery-city").value.trim();

    if (!street || !number || !area || !city) {
      return null;
    }

    return `${street} ${number}, ${area}, ${city}, Serbia`;
  }

  function ensureMap() {
    if (!window.L) {
      return null;
    }

    if (!state.map) {
      state.map = window.L.map("delivery-map", {
        scrollWheelZoom: false
      }).setView([44.787, 20.57], 12);

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(state.map);
    }

    return state.map;
  }

  function updateMap(origin, destination) {
    const mapWrap = $("#delivery-map-wrap");
    const map = ensureMap();

    if (!map) {
      return false;
    }

    mapWrap.hidden = false;

    if (state.routeLine) {
      state.routeLine.remove();
      state.routeLine = null;
    }
    if (state.originMarker) {
      state.originMarker.remove();
      state.originMarker = null;
    }
    if (state.destinationMarker) {
      state.destinationMarker.remove();
    }

    state.destinationMarker = window.L.marker([destination.lat, destination.lon]).addTo(map);
    map.setView([destination.lat, destination.lon], 15);
    setTimeout(() => map.invalidateSize(), 100);
    return true;
  }

  function bindDeliveryForm() {
    const form = $("#delivery-form");
    const results = $("#delivery-results");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const destination = buildDestinationQuery();
      const dictionary = window.translations[state.lang].delivery;

      if (!destination) {
        updateDeliveryStatus(dictionary.noAddress, true);
        return;
      }

      updateDeliveryStatus(dictionary.loading);
      results.hidden = true;

      try {
        const route = await calculateRoute(destination);

        if (!route) {
          updateDeliveryStatus(dictionary.geocodeError, true);
          return;
        }

        if (route.error) {
          updateDeliveryStatus(dictionary.routeError, true);
          return;
        }

        const roundedDistance = Math.max(1, Math.round(route.distanceKm * 10) / 10);
        const rawDeliveryPrice = DELIVERY_BASE_PRICE + roundedDistance * DELIVERY_PRICE_PER_KM;
        const deliveryPrice = Math.round(rawDeliveryPrice / 50) * 50;

        $("#result-price").textContent = `${deliveryPrice} RSD`;

        const mapRendered = updateMap(route.origin, route.destination);
        updateDeliveryStatus(
          state.lang === "sr"
            ? `Procena dostave za adresu: ${destination}${mapRendered ? "" : ` (${dictionary.mapError})`}`
            : `Delivery estimate for: ${destination}${mapRendered ? "" : ` (${dictionary.mapError})`}`
        );
        results.hidden = false;
      } catch (error) {
        updateDeliveryStatus(dictionary.routeError, true);
      }
    });
  }

  function bindImageLightbox() {
    const lightbox = $("#image-lightbox");
    const image = $("#image-lightbox-image");
    const closeButton = $("#image-lightbox-close");
    const backdrop = $("#image-lightbox-backdrop");

    if (!lightbox || !image || !closeButton || !backdrop) {
      return;
    }

    function openLightbox(source, alt) {
      image.src = source;
      image.alt = alt || "";
      lightbox.hidden = false;
      document.body.classList.add("lightbox-open");
    }

    function closeLightbox() {
      lightbox.hidden = true;
      image.src = "";
      image.alt = "";
      document.body.classList.remove("lightbox-open");
    }

    $$("[data-zoom-src]").forEach((trigger) => {
      const openFromTrigger = () => openLightbox(trigger.dataset.zoomSrc, trigger.dataset.zoomAlt);

      trigger.addEventListener("click", openFromTrigger);
      trigger.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openFromTrigger();
        }
      });
    });

    closeButton.addEventListener("click", closeLightbox);
    backdrop.addEventListener("click", closeLightbox);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !lightbox.hidden) {
        closeLightbox();
      }
    });
  }

  function init() {
    $("#delivery-city").value = "Beograd";
    bindNav();
    bindLanguageSwitch();
    bindHeroTilt();
    initHeroSlider();
    applyTranslations();
    bindDeliveryForm();
    bindImageLightbox();
    revealVisibleElements();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
