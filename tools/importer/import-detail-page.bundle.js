var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // tools/importer/import-detail-page.js
  var import_detail_page_exports = {};
  __export(import_detail_page_exports, {
    default: () => import_detail_page_default
  });

  // tools/importer/parsers/alert-banner.js
  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function parse(element, { document }) {
    const banner = element.querySelector(".cmp-alert-banner") || element;
    const cells = [];
    const icon = [...banner.querySelectorAll("img")].find((i) => i.getAttribute("src") && !i.getAttribute("src").startsWith("data:") && !i.closest("button"));
    if (icon) {
      const frag = document.createDocumentFragment();
      const img = document.createElement("img");
      img.setAttribute("src", icon.getAttribute("src"));
      img.setAttribute("alt", icon.getAttribute("alt") || "");
      frag.appendChild(document.createComment(" field:icon "));
      frag.appendChild(img);
      cells.push([frag]);
    } else {
      cells.push([""]);
    }
    const container = banner.querySelector(".cmp-alert-banner__icon-and-link") || banner;
    const p = document.createElement("p");
    const link = container.querySelector("a[href]");
    if (link) {
      const a = document.createElement("a");
      a.setAttribute("href", link.getAttribute("href"));
      a.textContent = clean(link.textContent);
      p.appendChild(a);
    } else {
      const clone = container.cloneNode(true);
      clone.querySelectorAll("img, button").forEach((n) => n.remove());
      p.textContent = clean(clone.textContent);
    }
    if (clean(p.textContent)) {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(" field:text "));
      frag.appendChild(p);
      cells.push([frag]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "alert-banner", cells });
    element.replaceWith(block);
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
  function parse2(element, { document, params }) {
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

  // tools/importer/parsers/cards-links.js
  var OVERLAY = ".cmp-leave-site-overlay";
  var TILE_BG = /(^|\s)cmp-vertical-card--(off-white|white)-bg(\s|$)/;
  var ACCENT = /(^|\s)cmp-vertical-card--(title-accent|accent-line)(\s|$)/;
  function clean2(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function linkText(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".cmp-link__screen-reader-only, .cmp-button__arrow").forEach((n) => n.remove());
    return clean2(clone.textContent);
  }
  function leadingNodes(child, document) {
    const nodes = [];
    if (child.matches(".title")) {
      const h = child.querySelector("h1, h2, h3, h4, h5, h6");
      if (h && h.textContent.trim()) {
        const heading = document.createElement(h.tagName.toLowerCase());
        heading.textContent = clean2(h.textContent);
        nodes.push(heading);
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
    return [...content.querySelectorAll("a[href]")].find((a) => !a.closest(OVERLAY) && !(description && description.contains(a)) && linkText(a));
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
      const badge = [...item.querySelectorAll(".cmp-vertical-card__img-container img")].find((i) => i.getAttribute("src") && !i.getAttribute("src").startsWith("data:") && !i.closest(OVERLAY));
      if (badge) {
        const p = document.createElement("p");
        const img = document.createElement("img");
        img.setAttribute("src", badge.getAttribute("src"));
        img.setAttribute("alt", badge.getAttribute("alt") || "");
        p.appendChild(img);
        frag.appendChild(p);
      }
    }
    if (pretitle && clean2(pretitle.textContent)) {
      const p = document.createElement("p");
      p.textContent = clean2(pretitle.textContent);
      frag.appendChild(p);
    }
    if (title && clean2(title.textContent)) {
      const h3 = document.createElement("h3");
      h3.textContent = clean2(title.textContent);
      frag.appendChild(h3);
    }
    if (description) {
      const paras = description.querySelectorAll("p");
      if (paras.length) {
        paras.forEach((p) => {
          if (!clean2(p.textContent)) return;
          if (tile) trimTrailingBreaks(p);
          frag.appendChild(p);
        });
      } else if (clean2(description.textContent)) {
        const p = document.createElement("p");
        p.textContent = clean2(description.textContent);
        frag.appendChild(p);
      }
    }
    const cta = findCta(content, description);
    if (cta) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.setAttribute("href", cta.getAttribute("href"));
      a.textContent = linkText(cta);
      p.appendChild(a);
      frag.appendChild(p);
    } else if (!tile) {
      const wrapper = item.querySelector("[href]");
      if (wrapper && title && clean2(title.textContent)) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.setAttribute("href", wrapper.getAttribute("href"));
        a.textContent = clean2(title.textContent);
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
  function parse3(element, { document, tileOptions = false }) {
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

  // tools/importer/parsers/columns-overlay.js
  var OVERLAY2 = ".cmp-leave-site-overlay";
  function clean3(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function linkText2(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".cmp-link__screen-reader-only, .cmp-button__arrow").forEach((n) => n.remove());
    return clean3(clone.textContent);
  }
  function trimBreaks(el) {
    ["firstChild", "lastChild"].forEach((edge) => {
      let node = el[edge];
      while (node) {
        if (node.nodeType === 3 && !node.textContent.trim() || node.nodeType === 1 && node.tagName === "BR") {
          const next = edge === "firstChild" ? node.nextSibling : node.previousSibling;
          node.remove();
          node = next;
        } else {
          if (node.nodeType === 1 && /^(B|STRONG|I|EM|SPAN)$/.test(node.tagName)) trimBreaks(node);
          break;
        }
      }
    });
  }
  function buildImageCell(element, document) {
    const img = [...element.querySelectorAll(".layoutcontainerimage img")].find((i) => i.getAttribute("src") && !i.getAttribute("src").startsWith("data:"));
    if (!img) return [];
    const image = document.createElement("img");
    image.setAttribute("src", img.getAttribute("src"));
    image.setAttribute("alt", img.getAttribute("alt") || "");
    return [image];
  }
  function buildTextCell(element, document) {
    const nodes = [];
    const parts = element.querySelectorAll(".title, .text, .button");
    parts.forEach((part) => {
      if (part.closest(".layoutcontainerimage") || part.closest(OVERLAY2)) return;
      if (part.matches(".title")) {
        const h = part.querySelector("h1, h2, h3, h4, h5, h6");
        if (h && clean3(h.textContent)) {
          const heading = document.createElement(h.tagName.toLowerCase());
          heading.textContent = clean3(h.textContent);
          nodes.push(heading);
        }
      } else if (part.matches(".text")) {
        part.querySelectorAll(".cmp-text > p, .cmp-text > ul, .cmp-text > ol, .cmp-text > h2, .cmp-text > h3, .cmp-text > h4").forEach((el) => {
          if (!clean3(el.textContent)) return;
          trimBreaks(el);
          nodes.push(el);
        });
      } else if (part.matches(".button")) {
        const cta = [...part.querySelectorAll("a[href]")].find((a) => !a.closest(OVERLAY2) && linkText2(a));
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
  function parse4(element, { document }) {
    const imageCell = buildImageCell(element, document);
    const textCell = buildTextCell(element, document);
    const row = [];
    if (imageCell.length) row.push(imageCell);
    if (textCell.length) row.push(textCell);
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-overlay", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-promo-panel.js
  var OVERLAY3 = ".cmp-leave-site-overlay";
  function clean4(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function linkText3(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll(".cmp-link__screen-reader-only, .cmp-button__arrow").forEach((n) => n.remove());
    return clean4(clone.textContent);
  }
  function buildTextCell2(content, document) {
    const nodes = [];
    const title = content.querySelector(".cmp-vertical-card-image-right__title, h1, h2, h3, h4");
    const eyebrow = content.querySelector(".cmp-vertical-card-image-right__title-pretitle");
    const description = content.querySelector(".cmp-vertical-card-image-right__description");
    if (eyebrow && clean4(eyebrow.textContent)) {
      const p = document.createElement("p");
      p.textContent = clean4(eyebrow.textContent);
      nodes.push(p);
    }
    if (title) {
      const clone = title.cloneNode(true);
      clone.querySelectorAll(".cmp-vertical-card-image-right__title-pretitle").forEach((n) => n.remove());
      if (clean4(clone.textContent)) {
        const h3 = document.createElement("h3");
        h3.textContent = clean4(clone.textContent);
        nodes.push(h3);
      }
    }
    if (description && clean4(description.textContent)) {
      const p = document.createElement("p");
      p.innerHTML = description.innerHTML;
      nodes.push(p);
    }
    const cta = [...content.querySelectorAll("a[href]")].find((a) => !a.closest(OVERLAY3) && !(description && description.contains(a)) && linkText3(a));
    if (cta) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.setAttribute("href", cta.getAttribute("href"));
      a.textContent = linkText3(cta);
      p.appendChild(a);
      nodes.push(p);
    }
    return nodes;
  }
  function buildImageCell2(wrapper, document) {
    const img = [...wrapper.querySelectorAll("img")].find((i) => i.getAttribute("src") && !i.getAttribute("src").startsWith("data:") && !i.closest(OVERLAY3));
    if (!img) return [];
    const image = document.createElement("img");
    image.setAttribute("src", img.getAttribute("src"));
    image.setAttribute("alt", img.getAttribute("alt") || "");
    return [image];
  }
  function parse5(element, { document }) {
    const container = element.querySelector(".cmp-vertical-card-image-right__container") || element;
    const row = [];
    let textNodes = null;
    [...container.children].forEach((child) => {
      if (child.matches(".cmp-vertical-card-image-right__content")) {
        const nodes = buildTextCell2(child, document);
        if (nodes.length) {
          row.push(nodes);
          textNodes = nodes;
        }
      } else if (child.matches(".cmp-vertical-card-image-right__image-wrapper")) {
        const nodes = buildImageCell2(child, document);
        if (nodes.length) row.push(nodes);
      }
    });
    const isDark = element.classList.contains("cmp-vertical-card-image-right--navy-full-bleed") || !!element.querySelector(".cmp-vertical-card-image-right--navy-full-bleed");
    const variants = isDark ? ["dark"] : [];
    const note = element.nextElementSibling;
    if (isDark && textNodes && note && note.matches(".text.cmp-text--footer")) {
      note.querySelectorAll("p").forEach((p) => {
        if (!clean4(p.textContent)) return;
        const para = document.createElement("p");
        para.innerHTML = p.innerHTML;
        para.querySelectorAll(".cmp-link__screen-reader-only").forEach((n) => n.remove());
        textNodes.push(para);
      });
      note.remove();
    }
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-promo-panel", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-faq.js
  function clean5(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function trimEdges(el) {
    ["firstChild", "lastChild"].forEach((edge) => {
      let node = el[edge];
      while (node && (node.nodeType === 3 && !node.textContent.trim() || node.nodeType === 1 && node.tagName === "BR")) {
        const next = edge === "firstChild" ? node.nextSibling : node.previousSibling;
        node.remove();
        node = next;
      }
      if (node && node.nodeType === 3) {
        node.textContent = edge === "firstChild" ? node.textContent.replace(/^\s+/, "") : node.textContent.replace(/\s+$/, "");
      }
    });
  }
  function answerNodes(answer, document) {
    if (!answer) return [];
    const blocks = [...answer.querySelectorAll("p, ul, ol, h4, h5, h6, table")].filter((el) => !el.parentElement.closest("p, ul, ol, table"));
    if (!blocks.length && clean5(answer.textContent)) {
      const p = document.createElement("p");
      p.textContent = clean5(answer.textContent);
      return [p];
    }
    return blocks.filter((el) => clean5(el.textContent) || el.querySelector("img")).map((el) => {
      trimEdges(el);
      return el;
    });
  }
  function parse6(element, { document }) {
    const items = [];
    const articles = element.querySelectorAll(".cmp-faq-cf-display__faq");
    if (articles.length) {
      articles.forEach((article) => {
        const q = article.querySelector(".cmp-faq-cf-display__faq-element--question") || article.querySelector(".cmp-faq-cf-display__accordion-header");
        const a = article.querySelector(".cmp-faq-cf-display__faq-element--answer");
        items.push({ question: clean5(q && q.textContent), answer: a });
      });
    } else {
      element.querySelectorAll("details").forEach((d) => {
        const summary = d.querySelector("summary");
        const body = document.createElement("div");
        [...d.childNodes].filter((n) => n !== summary).forEach((n) => body.append(n));
        items.push({ question: clean5(summary && summary.textContent), answer: body });
      });
    }
    const cells = [];
    items.forEach(({ question, answer }) => {
      if (!question) return;
      const qFrag = document.createDocumentFragment();
      qFrag.appendChild(document.createComment(" field:summary "));
      qFrag.appendChild(document.createTextNode(question));
      const aFrag = document.createDocumentFragment();
      const nodes = answerNodes(answer, document);
      if (nodes.length) {
        aFrag.appendChild(document.createComment(" field:text "));
        nodes.forEach((n) => aFrag.appendChild(n));
      }
      cells.push([qFrag, aFrag]);
    });
    const leading = [];
    const title = element.querySelector(".cmp-faq-cf-display__title");
    if (title && clean5(title.textContent)) {
      const tag = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : "h2";
      const h = document.createElement(tag);
      h.textContent = clean5(title.textContent);
      leading.push(h);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-faq", cells });
    element.replaceWith(...leading, block);
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
      let heading = target.matches(HEADING) ? target : target.querySelector(HEADING);
      if (!heading && target.matches(".cmp-text")) {
        const paras = [...target.children].filter((c) => normalizeText(c.textContent));
        const text = paras.length === 1 && paras[0].tagName === "P" ? normalizeText(paras[0].textContent) : "";
        if (text && text.length <= 80 && !paras[0].querySelector("a, img")) {
          heading = document.createElement("h2");
          heading.textContent = text;
          paras[0].replaceWith(heading);
        }
      }
      if (!heading) return;
      const label = normalizeText(a.textContent).toLowerCase();
      const headingText = normalizeText(heading.textContent).toLowerCase();
      if (!label || headingText === label || headingText.startsWith(label)) return;
      const slug = slugify(heading.textContent);
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

  // tools/importer/import-detail-page.js
  var PAGE_TEMPLATE = {
    "name": "detail-page",
    "urls": [
      "https://russellinvestments.com/content/ri/us/en/about-us/contact-us.html",
      "https://russellinvestments.com/content/ri/us/en/individual-investor/investments/models-and-products/exchange-traded-funds.html"
    ],
    "representativeUrl": "https://russellinvestments.com/content/ri/us/en/about-us/contact-us.html",
    "description": "Detail pages (Contact Us, ETF product page): page title, tile card grids, alert banner, Ceros embeds, overlay/promo columns, FAQ accordion, page disclosures",
    "blocks": [
      {
        "name": "alert-banner",
        "instances": [
          ".alertbanner"
        ]
      },
      {
        "name": "embed-ceros",
        "instances": [
          '.embed:has(iframe[src*="ceros"])'
        ]
      },
      {
        "name": "cards-links",
        "instances": [
          ".cmp-layout-container--white-bg > .aem-Grid:not(:has(> .verticalcard)):not(:has(> .responsivegrid > .aem-Grid > .title)):has(> .responsivegrid > .aem-Grid > .verticalcard)",
          ".aem-Grid:has(> .verticalcard):not(:has(a.cmp-vertical-card__link))"
        ]
      },
      {
        "name": "columns-overlay",
        "instances": [
          ".responsivegrid:has(> .aem-Grid > .layoutcontainerimage)"
        ]
      },
      {
        "name": "columns-promo-panel",
        "instances": [
          ".verticalcardimageright"
        ]
      },
      {
        "name": "accordion-faq",
        "instances": [
          ".faqCFDisplay"
        ]
      }
    ],
    "urlPattern": "/content/ri/us/en/*",
    "sections": [
      {
        "id": "section-1",
        "name": "Page title",
        "selector": [
          ".title:has(h1)"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "h1.cmp-title__text",
          ".text.cmp-text--bold p"
        ]
      },
      {
        "id": "section-2",
        "name": "Contact choices (tile grid)",
        "selector": [
          ".cmp-layout-container--white-bg:has(.verticalcard):not(:has(.cmp-button--tertiary))"
        ],
        "style": null,
        "blocks": [
          "cards-links"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
        "name": "US office locations",
        "selector": [
          ".cmp-layout-container--blue-bg:has(.verticalcard)"
        ],
        "style": "light-blue",
        "blocks": [
          "cards-links"
        ],
        "defaultContent": [
          "h2.cmp-title__text"
        ]
      },
      {
        "id": "etf-section-1",
        "name": "US-only audience alert",
        "selector": [
          ".alertbanner"
        ],
        "style": null,
        "blocks": [
          "alert-banner"
        ],
        "defaultContent": []
      },
      {
        "id": "etf-section-2",
        "name": "ETF hero banner (Ceros embed)",
        "selector": [
          '.embed:has(iframe[src*="ceros"])'
        ],
        "style": "full-width",
        "blocks": [
          "embed-ceros"
        ],
        "defaultContent": []
      },
      {
        "id": "etf-section-3",
        "name": "Jump links",
        "selector": [
          ".anchortab"
        ],
        "style": "light, jump-links",
        "blocks": [],
        "defaultContent": [
          "a.cmp-anchor-tab__tab"
        ]
      },
      {
        "id": "etf-section-4",
        "name": "Our funds (fund tile groups)",
        "selector": [
          ".cmp-layout-container--white-bg:has(.verticalcard .cmp-button--tertiary)"
        ],
        "style": null,
        "blocks": [
          "cards-links"
        ],
        "defaultContent": [
          "h3.cmp-title__text"
        ]
      },
      {
        "id": "etf-section-5",
        "name": "Why our ETFs",
        "selector": [
          ".responsivegrid:has(> .aem-Grid > .layoutcontainerimage)"
        ],
        "style": null,
        "blocks": [
          "columns-overlay"
        ],
        "defaultContent": []
      },
      {
        "id": "etf-section-6",
        "name": "Active vs passive comparison (Ceros)",
        "selector": [
          '.embed:has(iframe[src*="ceros"])'
        ],
        "style": "full-width",
        "blocks": [
          "embed-ceros"
        ],
        "defaultContent": []
      },
      {
        "id": "etf-section-7",
        "name": "Build a portfolio",
        "selector": [
          '.cmp-layout-container--white-bg:has(.embed iframe[src*="ceros"])'
        ],
        "style": "lead",
        "blocks": [
          "embed-ceros"
        ],
        "defaultContent": [
          "h2.cmp-title__text",
          ".cmp-text p"
        ]
      },
      {
        "id": "etf-section-8",
        "name": "Start investing today",
        "selector": [
          ".cmp-layout-container--blue-bg:has(.button):not(:has(.verticalcard))"
        ],
        "style": "light-blue, lead, stack",
        "blocks": [],
        "defaultContent": [
          ".cmp-text p",
          ".button a"
        ]
      },
      {
        "id": "etf-section-9",
        "name": "Ask your financial advisor",
        "selector": [
          ".verticalcardimageright"
        ],
        "style": "full-width",
        "blocks": [
          "columns-promo-panel"
        ],
        "defaultContent": []
      },
      {
        "id": "etf-section-10",
        "name": "FAQs",
        "selector": [
          ".cmp-layout-container--white-bg:has(.faqCFDisplay)"
        ],
        "style": null,
        "blocks": [
          "accordion-faq"
        ],
        "defaultContent": [
          "h3.cmp-faq-cf-display__title"
        ]
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
    "alert-banner": parse,
    "embed-ceros": parse2,
    "cards-links": parse3,
    "columns-overlay": parse4,
    "columns-promo-panel": parse5,
    "accordion-faq": parse6
  };
  var PARSER_OPTIONS = {
    "cards-links": { tileOptions: true }
  };
  var transformers = [transform, transform2];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
    transformers.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function renameElement(el, tagName, document) {
    if (el.tagName.toLowerCase() === tagName) return el;
    const next = document.createElement(tagName);
    [...el.attributes].forEach((attr) => next.setAttribute(attr.name, attr.value));
    while (el.firstChild) next.appendChild(el.firstChild);
    el.replaceWith(next);
    return next;
  }
  function normalizeTextStyles(main, document) {
    const clean6 = (t) => (t || "").replace(/\s+/g, " ").trim();
    const isHeadingLike = (p) => {
      const text = clean6(p.textContent);
      return text && text.length <= 80 && !p.querySelector("a, img");
    };
    main.querySelectorAll(".title.cmp-title--kilo :is(h3, h4), .cmp-faq-cf-display--kilo .cmp-faq-cf-display__title:is(h3, h4)").forEach((h) => renameElement(h, "h2", document));
    main.querySelectorAll(".title.cmp-title--alpha h2").forEach((h) => renameElement(h, "h3", document));
    main.querySelectorAll(".text.cmp-text--kilo p").forEach((p) => {
      if (isHeadingLike(p)) renameElement(p, "h2", document);
    });
    main.querySelectorAll(".text.cmp-text--beta p").forEach((p) => {
      if (isHeadingLike(p)) renameElement(p, "h3", document);
    });
    main.querySelectorAll(".text.cmp-text--bold p").forEach((p) => {
      if (!clean6(p.textContent) || p.querySelector("a, img, strong, b")) return;
      const strong = document.createElement("strong");
      while (p.firstChild) strong.appendChild(p.firstChild);
      p.appendChild(strong);
    });
  }
  function addHiddenTitle(main, document) {
    if (main.querySelector("h1")) return;
    const og = document.querySelector('meta[property="og:title"]');
    const raw = og && og.getAttribute("content") || document.title || "";
    const title = raw.replace(/\s*[|–—-]\s*Russell Investments.*$/i, "").replace(/\s+/g, " ").trim();
    if (!title) return;
    const h1 = document.createElement("h1");
    h1.textContent = title;
    const meta = WebImporter.Blocks.createBlock(document, {
      name: "Section Metadata",
      cells: { style: "sr-heading" }
    });
    main.prepend(h1, meta, document.createElement("hr"));
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
  var import_detail_page_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      normalizeTextStyles(main, document);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params, ...PARSER_OPTIONS[block.name] || {} });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      addHiddenTitle(main, document);
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
  return __toCommonJS(import_detail_page_exports);
})();
