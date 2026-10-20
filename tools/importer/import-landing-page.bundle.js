/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-landing-page.js
  var import_landing_page_exports = {};
  __export(import_landing_page_exports, {
    default: () => import_landing_page_default
  });

  // tools/importer/parsers/hero-image-overlay.js
  var OVERLAY = ".cmp-leave-site-overlay";
  function resolveUrl(document, path) {
    if (!path) return "";
    if (/^(https?:)?\/\//i.test(path) || /^(data|blob):/i.test(path)) return path;
    const canonical = document.querySelector('link[rel="canonical"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const baseURI = document.baseURI || "";
    const base = canonical && canonical.getAttribute("href") || ogUrl && ogUrl.getAttribute("content") || (/^https?:/i.test(baseURI) ? baseURI : "");
    try {
      return base ? new URL(path, base).href : path;
    } catch (e) {
      return path;
    }
  }
  function unescapeCss(value) {
    return value.replace(/\\([0-9a-f]{1,6})\s?/gi, (m, hex) => String.fromCodePoint(parseInt(hex, 16))).replace(/\\(.)/g, "$1");
  }
  function getBackgroundImage(element) {
    const candidates = [element, ...element.querySelectorAll('[style*="background-image"]')];
    for (const el of candidates) {
      const fromProp = el.style && el.style.backgroundImage || "";
      const fromAttr = el.getAttribute("style") || "";
      for (const raw of [fromProp, fromAttr]) {
        const m = raw.match(/url\(\s*(['"]?)(.*?)\1\s*\)/i);
        if (m && m[2]) return unescapeCss(m[2]).trim();
      }
    }
    return "";
  }
  function linkText(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".cmp-link__screen-reader-only, .cmp-button__arrow").forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  }
  function parse(element, { document }) {
    const cells = [];
    const video = element.querySelector("video");
    let videoSrc = "";
    let posterSrc = "";
    if (video) {
      const source = video.querySelector("source[src]");
      videoSrc = video.getAttribute("src") || source && source.getAttribute("src") || "";
      posterSrc = video.getAttribute("poster") || "";
    }
    let imageSrc = posterSrc || getBackgroundImage(element);
    let imageAlt = "";
    if (!imageSrc) {
      const img = [...element.querySelectorAll("img")].find((i) => {
        const src = i.getAttribute("src") || "";
        return src && !src.startsWith("data:") && !i.closest(OVERLAY);
      });
      if (img) {
        imageSrc = img.getAttribute("src");
        imageAlt = img.getAttribute("alt") || "";
      }
    }
    if (imageSrc) {
      const img = document.createElement("img");
      img.setAttribute("src", resolveUrl(document, imageSrc));
      img.setAttribute("alt", imageAlt);
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(" field:image "));
      frag.appendChild(img);
      cells.push([frag]);
    } else {
      cells.push([""]);
    }
    if (videoSrc) {
      const href = resolveUrl(document, videoSrc);
      const a = document.createElement("a");
      a.setAttribute("href", href);
      a.textContent = href;
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(" field:video "));
      frag.appendChild(a);
      cells.push([frag]);
    } else {
      cells.push([""]);
    }
    const textFrag = document.createDocumentFragment();
    const heading2 = element.querySelector("h1");
    const intro = element.querySelector('p[class*="__subheading"]') || [...element.querySelectorAll("p")].find((p) => !p.closest(OVERLAY) && p.textContent.trim());
    const ctas = [...element.querySelectorAll("a[href]")].filter((a) => !a.closest(OVERLAY) && !(intro && intro.contains(a)) && linkText(a));
    const textNodes = [];
    if (heading2 && heading2.textContent.trim()) {
      const h1 = document.createElement("h1");
      h1.textContent = heading2.textContent.replace(/\s+/g, " ").trim();
      textNodes.push(h1);
    }
    if (intro && intro.textContent.trim()) {
      const p = document.createElement("p");
      p.innerHTML = intro.innerHTML;
      textNodes.push(p);
    }
    ctas.forEach((cta) => {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.setAttribute("href", cta.getAttribute("href"));
      a.textContent = linkText(cta);
      p.appendChild(a);
      textNodes.push(p);
    });
    if (textNodes.length) {
      textFrag.appendChild(document.createComment(" field:text "));
      textNodes.forEach((n) => textFrag.appendChild(n));
      cells.push([textFrag]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-image-overlay", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-stats.js
  function extractLeadingContent(element, document, isItem) {
    const nodes = [];
    [...element.children].forEach((child) => {
      if (isItem(child)) return;
      if (child.matches(".title")) {
        const h = child.querySelector("h1, h2, h3, h4, h5, h6");
        if (h && h.textContent.trim()) {
          const heading2 = document.createElement(h.tagName.toLowerCase());
          heading2.textContent = h.textContent.replace(/\s+/g, " ").trim();
          nodes.push(heading2);
        }
      } else if (child.matches(".text")) {
        child.querySelectorAll(".cmp-text > *").forEach((el) => {
          if (el.textContent.trim()) nodes.push(el);
        });
      }
    });
    return nodes;
  }
  function parse2(element, { document }) {
    const isItem = (el) => el.matches(".datadisplay");
    const leading = extractLeadingContent(element, document, isItem);
    const cells = [];
    element.querySelectorAll(":scope > .datadisplay").forEach((item) => {
      const value = item.querySelector(".cmp-data-display__value");
      const label = item.querySelector(".cmp-data-display__label");
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(" field:text "));
      if (value && value.textContent.trim()) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = value.textContent.replace(/\s+/g, " ").trim();
        p.appendChild(strong);
        frag.appendChild(p);
      }
      if (label && label.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = label.textContent.replace(/\s+/g, " ").trim();
        frag.appendChild(p);
      }
      cells.push([frag]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-stats", cells });
    if (leading.length) element.before(...leading);
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  var OVERLAY2 = ".cmp-leave-site-overlay";
  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function linkText2(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".cmp-link__screen-reader-only, .cmp-button__arrow").forEach((n) => n.remove());
    return clean(clone.textContent);
  }
  function extractLeadingContent2(element, document, isItem) {
    const nodes = [];
    [...element.children].forEach((child) => {
      if (isItem(child)) return;
      if (child.matches(".title")) {
        const h = child.querySelector("h1, h2, h3, h4, h5, h6");
        if (h && h.textContent.trim()) {
          const heading2 = document.createElement(h.tagName.toLowerCase());
          heading2.textContent = clean(h.textContent);
          nodes.push(heading2);
        }
      } else if (child.matches(".text")) {
        child.querySelectorAll(".cmp-text > *").forEach((el) => {
          if (el.textContent.trim()) nodes.push(el);
        });
      }
    });
    return nodes;
  }
  function buildImageCell(column, document) {
    const nodes = [];
    column.querySelectorAll(".cmp-image img").forEach((img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      const image = document.createElement("img");
      image.setAttribute("src", src);
      image.setAttribute("alt", img.getAttribute("alt") || "");
      nodes.push(image);
    });
    return nodes;
  }
  function buildTextCell(column, document) {
    const nodes = [];
    column.querySelectorAll(".text, .title, .button").forEach((comp) => {
      if (comp.closest(OVERLAY2)) return;
      if (comp.matches(".title")) {
        const h = comp.querySelector("h1, h2, h3, h4, h5, h6");
        if (h && clean(h.textContent)) {
          const heading2 = document.createElement("h3");
          heading2.textContent = clean(h.textContent);
          nodes.push(heading2);
        }
      } else if (comp.matches(".text")) {
        const isSubheading = comp.matches(".cmp-text--bold");
        comp.querySelectorAll(".cmp-text > *").forEach((el) => {
          if (!clean(el.textContent)) return;
          if (isSubheading) {
            const h3 = document.createElement("h3");
            h3.textContent = clean(el.textContent);
            nodes.push(h3);
          } else {
            nodes.push(el);
          }
        });
      } else if (comp.matches(".button")) {
        const cta = [...comp.querySelectorAll("a[href]")].find((a) => !a.closest(OVERLAY2) && linkText2(a));
        if (cta) {
          const p = document.createElement("p");
          const a = document.createElement("a");
          a.setAttribute("href", cta.getAttribute("href"));
          a.textContent = linkText2(cta);
          p.appendChild(a);
          nodes.push(p);
        }
      }
    });
    return nodes;
  }
  function parse3(element, { document }) {
    const isItem = (el) => el.matches(".responsivegrid");
    const leading = extractLeadingContent2(element, document, isItem);
    const row = [];
    element.querySelectorAll(":scope > .responsivegrid").forEach((column) => {
      const hasText = column.querySelector(".text, .button, .title");
      const nodes = hasText ? buildTextCell(column, document) : buildImageCell(column, document);
      if (nodes.length) row.push(nodes);
    });
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells });
    if (leading.length) element.before(...leading);
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-timeline.js
  function clean2(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function parse4(element, { document }) {
    const cells = [];
    element.querySelectorAll(".cmp-vertical-card-carousel__card").forEach((card) => {
      const img = card.querySelector(".cmp-vertical-card-carousel__card-img-container img");
      const year = card.querySelector(".cmp-vertical-card-carousel__card-pretitle");
      const title = card.querySelector(".cmp-vertical-card-carousel__card-title");
      const description = card.querySelector(".cmp-vertical-card-carousel__card-description");
      const imageFrag = document.createDocumentFragment();
      if (img && img.getAttribute("src")) {
        const image = document.createElement("img");
        image.setAttribute("src", img.getAttribute("src"));
        image.setAttribute("alt", img.getAttribute("alt") || "");
        imageFrag.appendChild(document.createComment(" field:image "));
        imageFrag.appendChild(image);
      }
      const textFrag = document.createDocumentFragment();
      textFrag.appendChild(document.createComment(" field:text "));
      if (year && clean2(year.textContent)) {
        const p = document.createElement("p");
        p.textContent = clean2(year.textContent);
        textFrag.appendChild(p);
      }
      if (title && clean2(title.textContent)) {
        const h3 = document.createElement("h3");
        h3.textContent = clean2(title.textContent);
        textFrag.appendChild(h3);
      }
      if (description && clean2(description.textContent)) {
        const p = document.createElement("p");
        p.innerHTML = description.innerHTML;
        textFrag.appendChild(p);
      }
      cells.push([imageFrag, textFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-timeline", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-image-trio.js
  var OVERLAY3 = ".cmp-leave-site-overlay";
  function clean3(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function linkText3(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".cmp-link__screen-reader-only, .cmp-button__arrow, a").forEach((n) => n.remove());
    return clean3(clone.textContent);
  }
  function toImage(img, document) {
    const image = document.createElement("img");
    image.setAttribute("src", img.getAttribute("src"));
    image.setAttribute("alt", img.getAttribute("alt") || "");
    return image;
  }
  function parse5(element, { document }) {
    const root = element.querySelector(".cmp-full-bleed-images-double") || element;
    const images = [...root.querySelectorAll(".cmp-full-bleed-images-double__images img")].filter((img) => img.getAttribute("src") && !img.getAttribute("src").startsWith("data:"));
    const card = root.querySelector(".cmp-full-bleed-images-double__card");
    const cardNodes = [];
    if (card) {
      const heading2 = card.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading2 && clean3(heading2.textContent)) {
        const h3 = document.createElement("h3");
        h3.textContent = clean3(heading2.textContent);
        cardNodes.push(h3);
      }
      const cta = [...card.querySelectorAll("a[href]")].find((a) => !a.closest(OVERLAY3) && linkText3(a));
      if (cta) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.setAttribute("href", cta.getAttribute("href"));
        a.textContent = linkText3(cta);
        p.appendChild(a);
        cardNodes.push(p);
      }
    }
    const row = [
      images[0] ? [toImage(images[0], document)] : "",
      cardNodes.length ? cardNodes : "",
      images[1] ? [toImage(images[1], document)] : ""
    ];
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-image-trio", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-links.js
  var OVERLAY4 = ".cmp-leave-site-overlay";
  var TILE_BG = /(^|\s)cmp-vertical-card--(off-white|white)-bg(\s|$)/;
  var ACCENT = /(^|\s)cmp-vertical-card--(title-accent|accent-line)(\s|$)/;
  function clean4(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function linkText4(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".cmp-link__screen-reader-only, .cmp-button__arrow").forEach((n) => n.remove());
    return clean4(clone.textContent);
  }
  function leadingNodes(child, document) {
    const nodes = [];
    if (child.matches(".title")) {
      const h = child.querySelector("h1, h2, h3, h4, h5, h6");
      if (h && h.textContent.trim()) {
        const heading2 = document.createElement(h.tagName.toLowerCase());
        heading2.textContent = clean4(h.textContent);
        nodes.push(heading2);
      }
    } else if (child.matches(".text")) {
      child.querySelectorAll(".cmp-text > *").forEach((el) => {
        if (el.textContent.trim()) nodes.push(el);
      });
    }
    return nodes;
  }
  function isTileCard(item) {
    const cls = item.getAttribute("class") || "";
    return TILE_BG.test(cls) && !ACCENT.test(cls);
  }
  function findCta(content, description) {
    return [...content.querySelectorAll("a[href]")].find((a) => !a.closest(OVERLAY4) && !(description && description.contains(a)) && linkText4(a));
  }
  function trimTrailingBreaks(p) {
    let last = p.lastChild;
    while (last && (last.nodeType === 3 && !last.textContent.trim() || last.nodeType === 1 && last.tagName === "BR")) {
      const prev = last.previousSibling;
      last.remove();
      last = prev;
    }
  }
  function buildCard(item, document, tile) {
    const content = item.querySelector(".cmp-vertical-card__content") || item;
    const pretitle = content.querySelector(".cmp-vertical-card__pretitle");
    const title = content.querySelector(".cmp-vertical-card__title");
    const description = content.querySelector(".cmp-vertical-card__description");
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(" field:text "));
    if (tile) {
      const badge = [...item.querySelectorAll(".cmp-vertical-card__img-container img")].find((i) => i.getAttribute("src") && !i.getAttribute("src").startsWith("data:") && !i.closest(OVERLAY4));
      if (badge) {
        const p = document.createElement("p");
        const img = document.createElement("img");
        img.setAttribute("src", badge.getAttribute("src"));
        img.setAttribute("alt", badge.getAttribute("alt") || "");
        p.appendChild(img);
        frag.appendChild(p);
      }
    }
    if (pretitle && clean4(pretitle.textContent)) {
      const p = document.createElement("p");
      p.textContent = clean4(pretitle.textContent);
      frag.appendChild(p);
    }
    if (title && clean4(title.textContent)) {
      const h3 = document.createElement("h3");
      h3.textContent = clean4(title.textContent);
      frag.appendChild(h3);
    }
    if (description) {
      const paras = description.querySelectorAll("p");
      if (paras.length) {
        paras.forEach((p) => {
          if (!clean4(p.textContent)) return;
          if (tile) trimTrailingBreaks(p);
          frag.appendChild(p);
        });
      } else if (clean4(description.textContent)) {
        const p = document.createElement("p");
        p.textContent = clean4(description.textContent);
        frag.appendChild(p);
      }
    }
    const cta = findCta(content, description);
    if (cta) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.setAttribute("href", cta.getAttribute("href"));
      a.textContent = linkText4(cta);
      p.appendChild(a);
      frag.appendChild(p);
    } else if (!tile) {
      const wrapper = item.querySelector("[href]");
      if (wrapper && title && clean4(title.textContent)) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.setAttribute("href", wrapper.getAttribute("href"));
        a.textContent = clean4(title.textContent);
        p.appendChild(a);
        frag.appendChild(p);
      }
    }
    return frag;
  }
  function variantsFor(items, tileOptions) {
    if (!tileOptions || !items.length || !items.every(isTileCard)) return [];
    const ctas = items.map((item) => {
      const content = item.querySelector(".cmp-vertical-card__content") || item;
      return findCta(content, content.querySelector(".cmp-vertical-card__description"));
    }).filter(Boolean);
    const arrow = ctas.length && ctas.every((a) => a.matches(".cmp-button--tertiary"));
    return arrow ? ["tile", "cta-arrow"] : ["tile"];
  }
  function parse6(element, { document, tileOptions = false }) {
    const groups = [{ leading: [], items: [] }];
    [...element.children].forEach((child) => {
      if (child.matches(".verticalcard")) {
        groups[groups.length - 1].items.push(child);
      } else if (child.matches(".responsivegrid") && !element.querySelector(":scope > .verticalcard")) {
        child.querySelectorAll(":scope > .aem-Grid > .verticalcard").forEach((card) => {
          groups[groups.length - 1].items.push(card);
        });
      } else if (child.matches(".title")) {
        if (groups[groups.length - 1].items.length) groups.push({ leading: [], items: [] });
        groups[groups.length - 1].leading.push(...leadingNodes(child, document));
      } else if (child.matches(".text")) {
        groups[groups.length - 1].leading.push(...leadingNodes(child, document));
      }
    });
    const output = [];
    groups.forEach((group) => {
      output.push(...group.leading);
      if (!group.items.length) return;
      const tile = variantsFor(group.items, tileOptions).length > 0;
      const cells = group.items.map((item) => [buildCard(item, document, tile)]);
      const variants = variantsFor(group.items, tileOptions);
      output.push(WebImporter.Blocks.createBlock(document, { name: "cards-links", variants, cells }));
    });
    if (!output.length) {
      element.replaceWith(WebImporter.Blocks.createBlock(document, { name: "cards-links", cells: [] }));
      return;
    }
    element.replaceWith(...output);
  }

  // tools/importer/parsers/embed-ceros.js
  var CEROS_HOST = /(^|\.)ceros\.(site|com)$/i;
  function iframeUrl(iframe, base) {
    const raw = iframe.getAttribute("src") || iframe.getAttribute("data-src") || "";
    if (!raw || raw.startsWith("about:")) return "";
    try {
      return new URL(raw, base).href;
    } catch (e) {
      return raw;
    }
  }
  function isCeros(href) {
    try {
      return CEROS_HOST.test(new URL(href).hostname);
    } catch (e) {
      return /ceros/i.test(href);
    }
  }
  function parse7(element, { document, params }) {
    const base = params && params.originalURL || "https://russellinvestments.com/";
    const urls = [...element.querySelectorAll("iframe")].map((f) => iframeUrl(f, base)).filter(Boolean);
    const src = urls.find(isCeros) || urls[0] || "";
    const cells = [];
    if (src) {
      const frag = document.createDocumentFragment();
      const a = document.createElement("a");
      a.setAttribute("href", src);
      a.textContent = src;
      frag.appendChild(document.createComment(" field:embed_uri "));
      frag.appendChild(a);
      cells.push([frag]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "embed-ceros", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-article-cards.js
  var OVERLAY5 = ".cmp-leave-site-overlay";
  function clean5(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function linkText5(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".cmp-link__screen-reader-only, .cmp-button__arrow").forEach((n) => n.remove());
    return clean5(clone.textContent);
  }
  function para(document, text) {
    const p = document.createElement("p");
    p.textContent = text;
    return p;
  }
  function linkPara(document, href, text) {
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.setAttribute("href", href);
    a.textContent = text;
    p.appendChild(a);
    return p;
  }
  function heading(document, tag, text, href) {
    const h = document.createElement(tag);
    if (href) {
      const a = document.createElement("a");
      a.setAttribute("href", href);
      a.textContent = text;
      h.appendChild(a);
    } else {
      h.textContent = text;
    }
    return h;
  }
  function usableSrc(img) {
    const src = img && img.getAttribute("src");
    return src && !src.startsWith("data:") ? src : "";
  }
  function textCell(document, field, value) {
    if (!value) return "";
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    frag.appendChild(document.createTextNode(value));
    return frag;
  }
  function imageCell(document, field, img, fallbackAlt) {
    const src = usableSrc(img);
    if (!src) return "";
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    const image = document.createElement("img");
    image.setAttribute("src", src);
    image.setAttribute("alt", clean5(img.getAttribute("alt")) || fallbackAlt || "");
    frag.appendChild(image);
    return frag;
  }
  function richCell(document, field, nodes) {
    if (!nodes.length) return "";
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function readRecentCard(card, document) {
    const textNodes = [];
    const container = card.querySelector(".cmp-recent-articles__card-content-container") || card.querySelector(".cmp-recent-articles__card-content") || card;
    [...container.children].forEach((el) => {
      if (el.closest(OVERLAY5)) return;
      const tag = el.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) {
        if (clean5(el.textContent)) textNodes.push(heading(document, tag, clean5(el.textContent)));
      } else if (tag === "a") {
        const text = linkText5(el);
        if (text && el.getAttribute("href")) textNodes.push(linkPara(document, el.getAttribute("href"), text));
      } else if (tag === "p") {
        if (clean5(el.textContent)) textNodes.push(para(document, clean5(el.textContent)));
      }
    });
    return {
      img: card.querySelector('.cmp-recent-articles__card-image, img:not([src^="data:"])'),
      textNodes,
      authorImg: null,
      authorNodes: []
    };
  }
  function readRelatedCard(card, document) {
    const link = card.closest("a[href]");
    const href = link ? link.getAttribute("href") : "";
    const textNodes = [];
    const date = card.querySelector(".cmp-related-articles__date");
    const readTime = card.querySelector(".cmp-related-articles__read-time");
    const meta = [date, readTime].map((n) => clean5(n && n.textContent)).filter(Boolean).join(" | ");
    if (meta) textNodes.push(para(document, meta));
    const title = card.querySelector(".cmp-related-articles__article-title, h3");
    if (title && clean5(title.textContent)) {
      textNodes.push(heading(document, "h3", clean5(title.textContent), href));
    }
    const author = card.querySelector(".cmp-related-articles__author-info");
    const authorNodes = [];
    if (author) {
      author.querySelectorAll(".cmp-related-articles__name-and-role p").forEach((p) => {
        if (clean5(p.textContent)) authorNodes.push(para(document, clean5(p.textContent)));
      });
    }
    return {
      img: card.querySelector(".cmp-related-articles__img-container img, .cmp-related-articles__teaser-img"),
      textNodes,
      authorImg: author ? author.querySelector("img") : null,
      authorNodes
    };
  }
  function findKeyed(element, key, selector) {
    return [...element.querySelectorAll(selector)].find((el) => el.classList.contains(key)) || null;
  }
  function parse8(element, { document }) {
    const toggles = [...element.querySelectorAll(".cmp-recent-articles__article-toggle > span, .cmp-recent-articles__article-toggle > button")];
    const cells = [];
    const sharedHeading = [...element.querySelectorAll(".cmp-recent-articles__heading h1, .cmp-recent-articles__heading h2, .cmp-recent-articles__heading h3")].find((h) => clean5(h.textContent));
    const leading = sharedHeading ? heading(document, sharedHeading.tagName.toLowerCase(), clean5(sharedHeading.textContent)) : null;
    toggles.forEach((toggle) => {
      const label = clean5(toggle.textContent);
      if (!label) return;
      const idKey = (toggle.id || "").replace(/Btn$/i, "");
      const key = (idKey || label).toLowerCase();
      const panel = element.querySelector(`[id="${idKey || key}"]`) || element.querySelector(`[class*="articles__${key}"]`);
      if (!panel) return;
      const eyebrowEl = findKeyed(element, key, ".cmp-recent-articles__top-row .subtitle");
      const eyebrow = eyebrowEl ? clean5(eyebrowEl.textContent) : "";
      const allBtn = findKeyed(element, key, ".cmp-recent-articles__russell-btn");
      const allLink = allBtn ? [...allBtn.querySelectorAll("a[href]")].find((l) => linkText5(l)) : null;
      const cards = [...panel.querySelectorAll(".cmp-recent-articles__card, .cmp-related-articles__article-card")];
      cards.forEach((card, i) => {
        const data = card.matches(".cmp-related-articles__article-card") ? readRelatedCard(card, document) : readRecentCard(card, document);
        const first = i === 0;
        const authorName = data.authorNodes.length ? clean5(data.authorNodes[0].textContent) : "";
        const footerNodes = first && allLink ? [linkPara(document, allLink.getAttribute("href"), linkText5(allLink))] : [];
        cells.push([
          textCell(document, "tab", label),
          textCell(document, "eyebrow", first ? eyebrow : ""),
          imageCell(document, "image", data.img, ""),
          richCell(document, "text", data.textNodes),
          imageCell(document, "authorImage", data.authorImg, authorName),
          richCell(document, "author", data.authorNodes),
          richCell(document, "footer", footerNodes)
        ]);
      });
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-article-cards", cells });
    if (leading) element.before(leading);
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-promo-panel.js
  var OVERLAY6 = ".cmp-leave-site-overlay";
  function clean6(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function linkText6(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".cmp-link__screen-reader-only, .cmp-button__arrow").forEach((n) => n.remove());
    return clean6(clone.textContent);
  }
  function buildTextCell2(content, document) {
    const nodes = [];
    const title = content.querySelector(".cmp-vertical-card-image-right__title, h1, h2, h3, h4");
    const eyebrow = content.querySelector(".cmp-vertical-card-image-right__title-pretitle");
    const description = content.querySelector(".cmp-vertical-card-image-right__description");
    if (eyebrow && clean6(eyebrow.textContent)) {
      const p = document.createElement("p");
      p.textContent = clean6(eyebrow.textContent);
      nodes.push(p);
    }
    if (title) {
      const clone = title.cloneNode(true);
      clone.querySelectorAll(".cmp-vertical-card-image-right__title-pretitle").forEach((n) => n.remove());
      if (clean6(clone.textContent)) {
        const h3 = document.createElement("h3");
        h3.textContent = clean6(clone.textContent);
        nodes.push(h3);
      }
    }
    if (description && clean6(description.textContent)) {
      const p = document.createElement("p");
      p.innerHTML = description.innerHTML;
      nodes.push(p);
    }
    const cta = [...content.querySelectorAll("a[href]")].find((a) => !a.closest(OVERLAY6) && !(description && description.contains(a)) && linkText6(a));
    if (cta) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.setAttribute("href", cta.getAttribute("href"));
      a.textContent = linkText6(cta);
      p.appendChild(a);
      nodes.push(p);
    }
    return nodes;
  }
  function buildImageCell2(wrapper, document) {
    const img = [...wrapper.querySelectorAll("img")].find((i) => i.getAttribute("src") && !i.getAttribute("src").startsWith("data:") && !i.closest(OVERLAY6));
    if (!img) return [];
    const image = document.createElement("img");
    image.setAttribute("src", img.getAttribute("src"));
    image.setAttribute("alt", img.getAttribute("alt") || "");
    return [image];
  }
  function parse9(element, { document }) {
    const container = element.querySelector(".cmp-vertical-card-image-right__container") || element;
    const row = [];
    [...container.children].forEach((child) => {
      if (child.matches(".cmp-vertical-card-image-right__content")) {
        const nodes = buildTextCell2(child, document);
        if (nodes.length) row.push(nodes);
      } else if (child.matches(".cmp-vertical-card-image-right__image-wrapper")) {
        const nodes = buildImageCell2(child, document);
        if (nodes.length) row.push(nodes);
      }
    });
    const isDark = element.classList.contains("cmp-vertical-card-image-right--navy-full-bleed") || !!element.querySelector(".cmp-vertical-card-image-right--navy-full-bleed");
    const variants = isDark ? ["dark"] : [];
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-promo-panel", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-image-link.js
  function clean7(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function extractLeadingContent3(element, document, isItem) {
    const nodes = [];
    [...element.children].forEach((child) => {
      if (isItem(child)) return;
      if (child.matches(".title")) {
        const h = child.querySelector("h1, h2, h3, h4, h5, h6");
        if (h && h.textContent.trim()) {
          const heading2 = document.createElement(h.tagName.toLowerCase());
          heading2.textContent = clean7(h.textContent);
          nodes.push(heading2);
        }
      } else if (child.matches(".text")) {
        child.querySelectorAll(".cmp-text > *").forEach((el) => {
          if (el.textContent.trim()) nodes.push(el);
        });
      }
    });
    return nodes;
  }
  function parse10(element, { document }) {
    const isItem = (el) => el.matches(".verticalcard");
    const leading = extractLeadingContent3(element, document, isItem);
    const cells = [];
    element.querySelectorAll(":scope > .verticalcard").forEach((item) => {
      const link = item.querySelector("a.cmp-vertical-card__link");
      const href = link ? link.getAttribute("href") : "";
      const img = item.querySelector('.cmp-vertical-card__img-container img, img:not([src^="data:"])');
      const pretitle = item.querySelector(".cmp-vertical-card__pretitle");
      const title = item.querySelector(".cmp-vertical-card__title");
      const description = item.querySelector(".cmp-vertical-card__description");
      const imageFrag = document.createDocumentFragment();
      if (img) {
        const image = document.createElement("img");
        image.setAttribute("src", img.getAttribute("src"));
        image.setAttribute("alt", img.getAttribute("alt") || "");
        imageFrag.appendChild(document.createComment(" field:image "));
        imageFrag.appendChild(image);
      }
      const textFrag = document.createDocumentFragment();
      textFrag.appendChild(document.createComment(" field:text "));
      if (pretitle && clean7(pretitle.textContent)) {
        const p = document.createElement("p");
        p.textContent = clean7(pretitle.textContent);
        textFrag.appendChild(p);
      }
      if (title && clean7(title.textContent)) {
        const h3 = document.createElement("h3");
        if (href) {
          const a = document.createElement("a");
          a.setAttribute("href", href);
          a.textContent = clean7(title.textContent);
          h3.appendChild(a);
        } else {
          h3.textContent = clean7(title.textContent);
        }
        textFrag.appendChild(h3);
      }
      if (description) {
        description.querySelectorAll("p").forEach((p) => {
          if (clean7(p.textContent)) {
            const para2 = document.createElement("p");
            para2.textContent = clean7(p.textContent);
            textFrag.appendChild(para2);
          }
        });
      }
      cells.push([imageFrag, textFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-image-link", cells });
    if (leading.length) element.before(...leading);
    element.replaceWith(block);
  }

  // tools/importer/transformers/russell-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var TRACKING_ATTRS = [
    "data-cmp-data-layer-enabled",
    "data-cmp-data-layer-name",
    "data-cmp-data-layer",
    "data-cmp-link-accessibility-enabled",
    "data-cmp-link-accessibility-text",
    "data-cmp-clickable"
  ];
  var COMMON_DISCLOSURE_OPENINGS = [
    /^The information, analyses and opinions set forth herein are intended to serve as general information only/i,
    /^Products and services described on this website are intended for United States residents only/i,
    /^Russell Investments is committed to ensuring digital accessibility/i,
    /^Russell Investments' ownership is composed of/i,
    /^On [A-Z][a-z]+ \d{1,2}, \d{4}, Russell Investments Group, Ltd\. \("Russell Investments"\) entered into a definitive agreement/i,
    /^Frank Russell Company is the owner of the Russell trademarks/i,
    /^© Russell Investments Group, LLC\./i
  ];
  function normalizeText(text) {
    return (text || "").replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, " ").trim();
  }
  function isCommonDisclosure(text) {
    const normalized = normalizeText(text);
    return COMMON_DISCLOSURE_OPENINGS.some((re) => re.test(normalized));
  }
  function cleanInline(source, document) {
    const KEEP = { STRONG: "strong", B: "strong", EM: "em", I: "em", A: "a", BR: "br", SUP: "sup", SUB: "sub" };
    const copy = (from, to) => {
      from.childNodes.forEach((node) => {
        if (node.nodeType === 3) {
          to.append(document.createTextNode(node.textContent.replace(/\s+/g, " ")));
        } else if (node.nodeType === 1) {
          if (node.classList && node.classList.contains("cmp-link__screen-reader-only")) return;
          const tag = KEEP[node.tagName];
          if (tag) {
            const el = document.createElement(tag);
            if (tag === "a" && node.getAttribute("href")) el.setAttribute("href", node.getAttribute("href"));
            copy(node, el);
            if (tag === "br" || el.textContent.trim()) to.append(el);
          } else {
            copy(node, to);
          }
        }
      });
    };
    const target = document.createElement(source.tagName === "P" ? "p" : source.tagName.toLowerCase());
    copy(source, target);
    const trimEdge = (el, first) => {
      let node = first ? el.firstChild : el.lastChild;
      while (node && node.nodeType === 3 && !node.textContent.trim()) {
        const next = first ? node.nextSibling : node.previousSibling;
        node.remove();
        node = next;
      }
      if (node && node.nodeType === 3) {
        node.textContent = first ? node.textContent.replace(/^\s+/, "") : node.textContent.replace(/\s+$/, "");
      } else if (node && node.nodeType === 1 && node.tagName !== "A") {
        trimEdge(node, first);
      }
    };
    trimEdge(target, true);
    trimEdge(target, false);
    return target;
  }
  function extractPageDisclosures(element, document) {
    const roots = [...element.querySelectorAll(".footerdisclosures")];
    element.querySelectorAll(".cmp-disclosure-cf, .cmp-footer-disclosures").forEach((el) => {
      if (!el.closest(".footerdisclosures")) roots.push(el);
    });
    if (!roots.length) return;
    const paragraphs = [];
    const codes = [];
    roots.forEach((root) => {
      const blocks = [...root.querySelectorAll(".cmp-disclosure-cf__text p, .cmp-disclosure-cf__text ul, .cmp-disclosure-cf__text ol")].filter((el) => !el.parentElement.closest("p, ul, ol"));
      blocks.forEach((el) => {
        if (!normalizeText(el.textContent) || isCommonDisclosure(el.textContent)) return;
        paragraphs.push(cleanInline(el, document));
      });
      const codeEls = root.matches(".cmp-footer-disclosures") ? [root] : [...root.querySelectorAll(".cmp-footer-disclosures")];
      codeEls.forEach((el) => {
        const text = normalizeText(el.textContent);
        if (text) codes.push(text);
      });
    });
    roots.forEach((root) => root.remove());
    if (!paragraphs.length && !codes.length) return;
    const container = document.createElement("div");
    container.className = "footerdisclosures";
    container.append(...paragraphs);
    codes.forEach((code) => {
      const p = document.createElement("p");
      p.textContent = code;
      container.append(p);
    });
    element.append(container);
  }
  function slugify(text) {
    return normalizeText(text).toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
  }
  function prepareJumpLinks(element, document) {
    const links = [...element.querySelectorAll('.anchortab a[href^="#"]')];
    if (!links.length) return;
    const byId = /* @__PURE__ */ new Map();
    element.querySelectorAll("[id]").forEach((el) => {
      if (!byId.has(el.id)) byId.set(el.id, el);
    });
    const HEADING = "h1, h2, h3, h4, h5, h6";
    links.forEach((a) => {
      let id = a.getAttribute("href").slice(1);
      try {
        id = decodeURIComponent(id);
      } catch (e) {
      }
      const target = id && byId.get(id);
      if (!target || target.closest(".anchortab")) return;
      let heading2 = target.matches(HEADING) ? target : target.querySelector(HEADING);
      if (!heading2 && target.matches(".cmp-text")) {
        const paras = [...target.children].filter((c) => normalizeText(c.textContent));
        const text = paras.length === 1 && paras[0].tagName === "P" ? normalizeText(paras[0].textContent) : "";
        if (text && text.length <= 80 && !paras[0].querySelector("a, img")) {
          heading2 = document.createElement("h2");
          heading2.textContent = text;
          paras[0].replaceWith(heading2);
        }
      }
      if (!heading2) return;
      const label = normalizeText(a.textContent).toLowerCase();
      const headingText = normalizeText(heading2.textContent).toLowerCase();
      if (!label || headingText === label || headingText.startsWith(label)) return;
      const slug = slugify(heading2.textContent);
      if (slug) a.setAttribute("href", `#${slug}`);
    });
  }
  function convertDefaultButtons(element, document) {
    element.querySelectorAll(".button").forEach((wrapper) => {
      if (!wrapper.isConnected || wrapper.closest("table")) return;
      const a = [...wrapper.querySelectorAll("a[href]")].find((link2) => normalizeText(link2.textContent));
      if (!a) return;
      const link = document.createElement("a");
      link.setAttribute("href", a.getAttribute("href"));
      link.textContent = normalizeText(a.textContent);
      const p = document.createElement("p");
      const cls = a.getAttribute("class") || "";
      if (/cmp-button--primary/.test(cls)) {
        const strong = document.createElement("strong");
        strong.append(link);
        p.append(strong);
      } else if (/cmp-button--secondary/.test(cls)) {
        const em = document.createElement("em");
        em.append(link);
        p.append(em);
      } else {
        p.append(link);
      }
      wrapper.replaceWith(p);
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      const document = payload && payload.document || element.ownerDocument;
      extractPageDisclosures(element, document);
      WebImporter.DOMUtils.remove(element, [
        "header.experiencefragment",
        ".cmp-experiencefragment--header",
        "header",
        "footer.experiencefragment",
        ".cmp-experiencefragment--footer",
        "footer"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        "#onetrust-banner-sdk",
        "#onetrust-pc-sdk",
        ".onetrust-pc-dark-filter",
        ".cmp-leave-site-overlay"
      ]);
      WebImporter.DOMUtils.remove(element, [".ghost"]);
      element.querySelectorAll(".embed").forEach((embed) => {
        if (!embed.querySelector("iframe")) {
          embed.remove();
        } else {
          embed.querySelectorAll(".cmp-embed__consent-banner").forEach((b) => b.remove());
        }
      });
      element.querySelectorAll("iframe").forEach((iframe) => {
        if (!iframe.closest(".embed")) iframe.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        ".cmp-hero-image-header__icon-wrapper",
        ".cmp-hero-video-header__double-arrow-wrapper",
        ".svgtemplates",
        '[class*="cmp-svg-templates"]',
        ".cmp-button__arrow",
        ".russell-btn-arrow",
        ".arrows:has(> button.arrow)",
        "svg"
      ]);
      element.querySelectorAll('[class*="cmp-layout-container--bg-graphic"] > .aem-Grid > .image').forEach((img) => img.remove());
      element.querySelectorAll('img[src^="data:image/svg"]').forEach((img) => img.remove());
      WebImporter.DOMUtils.remove(element, [".cmp-link__screen-reader-only"]);
      WebImporter.DOMUtils.remove(element, ["script", "style", "noscript", "link"]);
      prepareJumpLinks(element, document);
    }
    if (hookName === TransformHook.afterTransform) {
      convertDefaultButtons(element, payload && payload.document || element.ownerDocument);
      const nodes = [element, ...element.querySelectorAll("*")];
      nodes.forEach((el) => {
        TRACKING_ATTRS.forEach((attr) => {
          if (el.hasAttribute && el.hasAttribute(attr)) el.removeAttribute(attr);
        });
      });
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        ".cmp-leave-site-overlay",
        ".cmp-link__screen-reader-only",
        "script",
        "style",
        "noscript"
      ]);
    }
  }

  // tools/importer/transformers/russell-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var MARKER = "data-excat-section-id";
  var FIRST_MARKER = "data-excat-section-first";
  var sectionElements = /* @__PURE__ */ new Map();
  function toArray(selector) {
    if (!selector) return [];
    return Array.isArray(selector) ? selector : [selector];
  }
  function safeQueryAll(root, selector) {
    try {
      return [...root.querySelectorAll(selector)];
    } catch (e) {
      return [];
    }
  }
  function findSectionElement(root, section, claimed) {
    const selectors = toArray(section.selector);
    for (let s = 0; s < selectors.length; s += 1) {
      const matches = safeQueryAll(root, selectors[s]);
      const outermost = matches.filter(
        (el) => !matches.some((other) => other !== el && other.contains(el))
      );
      const found = outermost.find((el) => !claimed.some(
        (c) => c === el || c.contains(el) || el.contains(c)
      ));
      if (found) return found;
    }
    return null;
  }
  function sortByDocumentOrder(entries) {
    return entries.sort((a, b) => {
      if (a.el === b.el) return 0;
      return a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1;
    });
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template;
    const sections = template && Array.isArray(template.sections) ? template.sections : [];
    if (sections.length < 2) return;
    const document = payload && payload.document || element.ownerDocument;
    if (hookName === TransformHook2.beforeTransform) {
      sectionElements = /* @__PURE__ */ new Map();
      const claimed = [];
      const found = [];
      sections.forEach((section) => {
        const el = findSectionElement(element, section, claimed);
        if (el) {
          claimed.push(el);
          found.push({ section, el });
        }
      });
      if (found.length === 0) return;
      sortByDocumentOrder(found);
      for (let i = found.length - 1; i >= 0; i -= 1) {
        const { section, el } = found[i];
        sectionElements.set(section.id, el);
        if (i > 0) {
          const hr = document.createElement("hr");
          hr.setAttribute(MARKER, section.id);
          el.before(hr);
        } else if (section.style) {
          const hr = document.createElement("hr");
          hr.setAttribute(MARKER, section.id);
          hr.setAttribute(FIRST_MARKER, "true");
          el.before(hr);
        }
      }
    }
    if (hookName === TransformHook2.afterTransform) {
      const markers = [...element.querySelectorAll(`hr[${MARKER}]`)];
      const byId = new Map(sections.map((s) => [s.id, s]));
      for (let i = markers.length - 1; i >= 0; i -= 1) {
        const hr = markers[i];
        const section = byId.get(hr.getAttribute(MARKER));
        if (section && section.style) {
          const meta = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          const el = sectionElements.get(section.id);
          const next = markers[i + 1];
          if (el && el.isConnected && element.contains(el)) {
            el.after(meta);
          } else if (next) {
            next.before(meta);
          } else {
            element.append(meta);
          }
        }
      }
      markers.forEach((hr) => {
        if (hr.hasAttribute(FIRST_MARKER)) {
          hr.remove();
        } else {
          hr.removeAttribute(MARKER);
        }
      });
      sectionElements = /* @__PURE__ */ new Map();
    }
  }

  // tools/importer/import-landing-page.js
  var PAGE_TEMPLATE = {
    "name": "landing-page",
    "urls": [
      "https://russellinvestments.com/content/ri/us/en/about-us.html",
      "https://russellinvestments.com/content/ri/us/en/individual-investor.html",
      "https://russellinvestments.com/content/ri/us/en/insights.html"
    ],
    "representativeUrl": "https://russellinvestments.com/content/ri/us/en/about-us.html",
    "description": "Landing pages (homepage, About Us, Insights hub): hero, card grids, promos, carousels",
    "blocks": [
      {
        "name": "hero-image-overlay",
        "instances": [
          ".herovideoheader",
          '.heroimageheader:has(section[style*="background-image"])'
        ]
      },
      {
        "name": "cards-stats",
        "instances": [
          ".aem-Grid:has(> .datadisplay)"
        ]
      },
      {
        "name": "columns-media",
        "instances": [
          ".aem-Grid:has(> .title):has(> .responsivegrid .cmp-image):has(> .responsivegrid .cmp-ri-btn-wrapper)"
        ]
      },
      {
        "name": "carousel-timeline",
        "instances": [
          ".verticalcardcarousel"
        ]
      },
      {
        "name": "columns-image-trio",
        "instances": [
          ".fullbleedimagesdouble"
        ]
      },
      {
        "name": "cards-links",
        "instances": [
          ".aem-Grid:has(> .verticalcard):not(:has(a.cmp-vertical-card__link))"
        ]
      },
      {
        "name": "embed-ceros",
        "instances": [
          '.embed:has(iframe[src*="ceros"])'
        ]
      },
      {
        "name": "tabs-article-cards",
        "instances": [
          ".recentArticles"
        ]
      },
      {
        "name": "columns-promo-panel",
        "instances": [
          ".verticalcardimageright"
        ]
      },
      {
        "name": "cards-image-link",
        "instances": [
          ".aem-Grid:has(> .verticalcard a.cmp-vertical-card__link)"
        ]
      }
    ],
    "urlPattern": "/content/ri/us/en/*",
    "sections": [
      {
        "id": "section-1",
        "name": "Hero",
        "selector": [
          '.heroimageheader:has(section[style*="background-image"])',
          ".herovideoheader"
        ],
        "style": null,
        "blocks": [
          "hero-image-overlay"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Intro statement",
        "selector": [
          ".cmp-layout-container--bg-graphic-top-right:not(:has(.verticalcard))"
        ],
        "style": "intro",
        "blocks": [],
        "defaultContent": [
          ".cmp-text p"
        ]
      },
      {
        "id": "section-3",
        "name": "By the numbers",
        "selector": [
          ".cmp-layout-container--off-white-bg:has(.datadisplay)"
        ],
        "style": "light",
        "blocks": [
          "cards-stats"
        ],
        "defaultContent": [
          "h2.cmp-title__text"
        ]
      },
      {
        "id": "section-4",
        "name": "What sets us apart",
        "selector": [
          ".cmp-layout-container--white-bg:has(.cmp-image):has(.cmp-ri-btn-wrapper)"
        ],
        "style": null,
        "blocks": [
          "columns-media"
        ],
        "defaultContent": [
          "h2.cmp-title__text"
        ]
      },
      {
        "id": "section-5",
        "name": "A history of innovation",
        "selector": [
          ".cmp-layout-container--blue-bg:has(.verticalcardcarousel)"
        ],
        "style": "light-blue, split",
        "blocks": [
          "carousel-timeline"
        ],
        "defaultContent": [
          "h2.cmp-title__text",
          ".cmp-text p"
        ]
      },
      {
        "id": "section-6",
        "name": "Guiding every journey",
        "selector": [
          ".responsivegrid:has(> .aem-Grid > .fullbleedimagesdouble)"
        ],
        "style": null,
        "blocks": [
          "columns-image-trio"
        ],
        "defaultContent": []
      },
      {
        "id": "section-7",
        "name": "Invest without boundaries",
        "selector": [
          ".cmp-layout-container--bg-graphic-bottom-right"
        ],
        "style": null,
        "blocks": [
          "cards-links"
        ],
        "defaultContent": [
          "h2.cmp-title__text"
        ]
      },
      {
        "id": "home-section-2",
        "name": "ETF promo banner",
        "selector": [
          '.cmp-layout-container--white-bg:has(.embed iframe[src*="ceros"])'
        ],
        "style": null,
        "blocks": [
          "embed-ceros"
        ],
        "defaultContent": []
      },
      {
        "id": "home-section-3",
        "name": "Recent insights / research",
        "selector": [
          ".cmp-layout-container--off-white-bg:has(.recentArticles)"
        ],
        "style": "light",
        "blocks": [
          "tabs-article-cards"
        ],
        "defaultContent": [
          ".cmp-recent-articles__heading"
        ]
      },
      {
        "id": "home-section-4",
        "name": "We help invest without boundaries",
        "selector": [
          ".cmp-layout-container--bg-graphic-top-right:has(.verticalcard)"
        ],
        "style": null,
        "blocks": [
          "cards-links"
        ],
        "defaultContent": [
          ".cmp-text p",
          "h2.cmp-title__text"
        ]
      },
      {
        "id": "insights-section-1",
        "name": "Page header",
        "selector": [
          '.heroimageheader:not(:has(section[style*="background-image"]))'
        ],
        "style": "dark",
        "blocks": [],
        "defaultContent": [
          "h1",
          ".cmp-hero-image-header__subheading"
        ]
      },
      {
        "id": "insights-section-2",
        "name": "Jump-link nav",
        "selector": [
          ".anchortab"
        ],
        "style": "light, jump-links",
        "blocks": [],
        "defaultContent": [
          "a"
        ]
      },
      {
        "id": "insights-section-3",
        "name": "Insights",
        "selector": [
          ".cmp-layout-container--white-bg:has(.aem-Grid > .verticalcard):not(:has(a.cmp-vertical-card__link)):not(.cmp-layout-container--bg-graphic-bottom-right):not(.cmp-layout-container--bg-graphic-top-right):not(.cmp-layout-container--bg-graphic-bottom-right *):not(.cmp-layout-container--bg-graphic-top-right *)"
        ],
        "style": null,
        "blocks": [
          "cards-links"
        ],
        "defaultContent": [
          "h2.cmp-title__text"
        ]
      },
      {
        "id": "insights-section-4",
        "name": "Market Forecast",
        "selector": [
          ".cmp-layout-container--white-bg:has(.verticalcardimageright:not(.cmp-vertical-card-image-right--navy-full-bleed))"
        ],
        "style": null,
        "blocks": [
          "columns-promo-panel"
        ],
        "defaultContent": [
          "h2.cmp-title__text"
        ]
      },
      {
        "id": "insights-section-5",
        "name": "Interactive tools",
        "selector": [
          ".cmp-layout-container--blue-bg:has(a.cmp-vertical-card__link)"
        ],
        "style": "light-blue",
        "blocks": [
          "cards-image-link"
        ],
        "defaultContent": [
          "h2.cmp-title__text"
        ]
      },
      {
        "id": "insights-section-6",
        "name": "Market volatility resources",
        "selector": [
          ".verticalcardimageright.cmp-vertical-card-image-right--navy-full-bleed"
        ],
        "style": null,
        "blocks": [
          "columns-promo-panel"
        ],
        "defaultContent": []
      },
      {
        "id": "disclosures",
        "name": "Page disclosures",
        "selector": [
          ".footerdisclosures",
          ".cmp-disclosure-cf",
          ".cmp-footer-disclosures"
        ],
        "style": "disclosures",
        "blocks": [],
        "defaultContent": [
          "p"
        ]
      }
    ]
  };
  var parsers = {
    "hero-image-overlay": parse,
    "cards-stats": parse2,
    "columns-media": parse3,
    "carousel-timeline": parse4,
    "columns-image-trio": parse5,
    "cards-links": parse6,
    "embed-ceros": parse7,
    "tabs-article-cards": parse8,
    "columns-promo-panel": parse9,
    "cards-image-link": parse10
  };
  var transformers = [transform, transform2];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    return pageBlocks;
  }
  var import_landing_page_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/^\/content\/ri(?=\/)/, "").replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_landing_page_exports);
})();
