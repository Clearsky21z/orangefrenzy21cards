const cardGrid = document.querySelector("#cardGrid");
const galleryTopGrid = document.querySelector("#galleryTopGrid");
const galleryFirstGrid = document.querySelector("#galleryFirstGrid");
const galleryFirstReusGrid = document.querySelector("#galleryFirstReusGrid");
const resultCount = document.querySelector("#resultCount");
const orange21Cards = document.querySelector("#orange21Cards");
const orangeCards = document.querySelector("#orangeCards");
const serial21Cards = document.querySelector("#serial21Cards");
const jerseyNumberCards = document.querySelector("#jerseyNumberCards");
const totalCards = document.querySelector("#totalCards");
const numberedCards = document.querySelector("#numberedCards");
const gradedCards = document.querySelector("#gradedCards");
const autographCards = document.querySelector("#autographCards");
const relicCards = document.querySelector("#relicCards");
const clubCountryStats = document.querySelector("#clubCountryStats");
const playerStats = document.querySelector("#playerStats");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const clubCountryFilter = document.querySelector("#clubCountryFilter");
const setFilter = document.querySelector("#setFilter");
const seasonFilter = document.querySelector("#seasonFilter");
const featureFilter = document.querySelector("#featureFilter");
const sortFilter = document.querySelector("#sortFilter");
const clearFilters = document.querySelector("#clearFilters");
const filterToggle = document.querySelector("#filterToggle");
const filters = document.querySelector("#filters");
const cardTemplate = document.querySelector("#cardTemplate");
const cardDialog = document.querySelector("#cardDialog");
const dialogClose = document.querySelector("#dialogClose");
const dialogContent = document.querySelector("#dialogContent");
const pagination = document.querySelector("#pagination");
const paginationPages = document.querySelector("#paginationPages");
const previousPage = document.querySelector("#previousPage");
const nextPage = document.querySelector("#nextPage");

const siteRoot = new URL("./", document.currentScript?.src || window.location.href);

const CARDS_PER_PAGE = 16;
const GALLERY_TOP_CARD_IDS = [
  "2017-18-topps-chrome-ucl-marco-reus-35-orange-refractor",
  "2017-18-topps-chrome-ucl-marco-reus-35-auto-orange-refractor",
  "2020-topps-transcendent-bvb-marco-reus-bda-mr-auto-black"
];
const GALLERY_FIRST_CARD_ID =
  "2022-23-topps-ucc-kalidou-koulibaly-akk-auto-blue-icy-foil";
const GALLERY_FIRST_REUS_CARD_ID =
  "2022-23-topps-bvb-china-edition-marco-reus-rc-mr-relic-orange";

const fallbackCards = [
  {
    id: "2017-18-topps-chrome-ucl-marco-reus-35-orange-refractor",
    player: "Marco Reus",
    clubCountry: "Borussia Dortmund",
    category: "Football/Soccer",
    season: "2017-18",
    set: "2017-18 Topps Chrome UCL",
    cardNumber: "35",
    parallel: "Orange Refractor",
    parallelColor: "#f36b00",
    serial: "21/25",
    auto: false,
    relic: false,
    graded: true,
    gradeCompany: "PSA",
    grade: "10",
    certification: "84859190",
    frontImage:
      "images/cards/2017-18-topps-chrome-ucl-marco-reus-35-orange-refractor-front.jpg",
    backImage:
      "images/cards/2017-18-topps-chrome-ucl-marco-reus-35-orange-refractor-back.jpg"
  }
];

let cards = [];
let currentPage = 1;

async function loadCards() {
  try {
    const response = await fetch(resolveAssetPath("cards.json"));
    if (!response.ok) {
      throw new Error(`Could not load cards.json: ${response.status}`);
    }

    cards = await response.json();
  } catch (error) {
    console.warn(error);
    cards = fallbackCards;
  }

  if (cardGrid) {
    populateFilters(cards);
    renderCards();
  }

  renderGalleryCards(cards);
  renderStats(cards);
}

function renderStats(cardList) {
  setText(
    orange21Cards,
    cardList.filter((card) => {
      const serial = parseSerial(card.serial);
      return (
        isOrangeCard(card) &&
        serial.parsed &&
        serial.numerator === 21 &&
        serial.denominator === 25
      );
    }).length
  );
  setText(orangeCards, cardList.filter(isOrangeCard).length);
  setText(
    serial21Cards,
    cardList.filter((card) => {
      const serial = parseSerial(card.serial);
      return serial.parsed && serial.numerator === 21;
    }).length
  );
  setText(
    jerseyNumberCards,
    cardList.filter((card) => /jersey#/i.test(String(card.serial || ""))).length
  );
  setText(totalCards, cardList.length);
  setText(
    numberedCards,
    cardList.filter((card) => String(card.serial || "").trim()).length
  );
  setText(gradedCards, cardList.filter((card) => card.graded === true).length);
  setText(autographCards, cardList.filter((card) => card.auto === true).length);
  setText(relicCards, cardList.filter((card) => card.relic === true).length);

  renderBreakdown(clubCountryStats, countBy(cardList, "clubCountry"), 5);
  renderBreakdown(playerStats, countBy(cardList, "player"), 5);
}

function isOrangeCard(card) {
  return (
    String(card.parallelColor || "").toLowerCase() === "#f36b00" ||
    String(card.parallel || "").toLowerCase().includes("orange")
  );
}

function populateFilters(cardList) {
  fillSelect(categoryFilter, uniqueValues(cardList, "category"), "All categories");
  fillSelect(
    clubCountryFilter,
    uniqueValues(cardList, "clubCountry"),
    "All clubs/countries"
  );
  fillSelect(setFilter, uniqueValues(cardList, "set"), "All sets");
  fillSelect(
    seasonFilter,
    [...new Set(cardList.map((card) => card.season).filter(Boolean))]
      .sort(compareSeasonDesc)
      .map(String),
    "All seasons"
  );
}

function fillSelect(select, values, defaultLabel) {
  select.innerHTML = "";
  select.append(createOption("", defaultLabel));
  values.forEach((value) => select.append(createOption(value, value)));
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function uniqueValues(cardList, key) {
  return [...new Set(cardList.map((card) => card[key]).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { numeric: true })
  );
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function countBy(cardList, key) {
  return cardList.reduce((counts, card) => {
    const value = card[key];
    if (!value) return counts;
    counts.set(value, (counts.get(value) || 0) + 1);
    return counts;
  }, new Map());
}

function renderBreakdown(container, counts, limit = Infinity) {
  if (!container) return;

  const entries = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
  const maxCount = Math.max(...entries.map(([, count]) => count), 0);

  container.innerHTML = entries
    .map(
      ([label, count]) => {
        const percentage = maxCount ? (count / maxCount) * 100 : 0;

        return `
        <li class="statistics-bar-item">
          <div class="statistics-bar-heading">
            <span>${escapeHtml(label)}</span>
            <strong>${count}</strong>
          </div>
          <div class="statistics-bar-track" aria-hidden="true">
            <span class="statistics-bar-fill" style="width: ${percentage.toFixed(
              2
            )}%"></span>
          </div>
        </li>
      `;
      }
    )
    .join("");
}

function renderCards() {
  if (!cardGrid) return;

  const matchingCards = sortCards(getFilteredCards(cards), sortFilter.value);
  const totalPages = Math.ceil(matchingCards.length / CARDS_PER_PAGE);
  currentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const pageStart = (currentPage - 1) * CARDS_PER_PAGE;
  const pageCards = matchingCards.slice(pageStart, pageStart + CARDS_PER_PAGE);

  cardGrid.innerHTML = "";
  if (resultCount) {
    const rangeStart = matchingCards.length ? pageStart + 1 : 0;
    const rangeEnd = pageStart + pageCards.length;
    resultCount.textContent = `Showing ${rangeStart}-${rangeEnd} of ${matchingCards.length} ${
      matchingCards.length === 1 ? "card" : "cards"
    }`;
  }

  if (matchingCards.length === 0) {
    cardGrid.innerHTML = `
      <div class="empty-state">
        No cards match those filters. Clear the filters and try again.
      </div>
    `;
    updatePagination(0);
    return;
  }

  pageCards.forEach((card) => appendCard(card, cardGrid));

  updatePagination(totalPages);
}

function renderGalleryCards(cardList) {
  if (!galleryTopGrid || !galleryFirstGrid || !galleryFirstReusGrid) return;

  galleryTopGrid.innerHTML = "";
  galleryFirstGrid.innerHTML = "";
  galleryFirstReusGrid.innerHTML = "";

  GALLERY_TOP_CARD_IDS.map((id) => cardList.find((card) => card.id === id))
    .filter(Boolean)
    .forEach((card) => appendCard(card, galleryTopGrid));

  const firstNumberedAuto = cardList.find((card) => card.id === GALLERY_FIRST_CARD_ID);
  if (firstNumberedAuto) appendCard(firstNumberedAuto, galleryFirstGrid);

  const firstReusCard = cardList.find((card) => card.id === GALLERY_FIRST_REUS_CARD_ID);
  if (firstReusCard) appendCard(firstReusCard, galleryFirstReusGrid);
}

function appendCard(card, container) {
  const node = cardTemplate.content.cloneNode(true);
  const item = node.querySelector(".card-item");
  const button = node.querySelector(".card-open");
  const image = node.querySelector(".card-image");
  const set = node.querySelector(".card-set");
  const title = node.querySelector(".card-title");
  const details = node.querySelector(".card-details");

  item.classList.toggle("card-item-landscape", card.orientation === "landscape");
  item.classList.toggle("card-item-raw", !card.graded);
  item.classList.toggle("card-item-graded", Boolean(card.graded));
  image.src = resolveAssetPath(card.frontImage || "images/placeholders/card-front.svg");
  image.alt = `${card.player} ${card.set} card front`;
  set.textContent = card.set;
  title.innerHTML = renderCardTitle(card);
  details.innerHTML = renderParallel(card);
  if (!hasParallelParts(card)) details.style.color = getParallelColor(card);

  button.addEventListener("click", () => openCardDialog(card));
  item.dataset.cardId = card.id;
  container.append(node);
}

function getFilteredCards(cardList) {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;
  const selectedClubCountry = clubCountryFilter.value;
  const selectedSet = setFilter.value;
  const selectedSeason = seasonFilter.value;
  const selectedFeature = featureFilter.value;

  return cardList.filter((card) => {
    const haystack = [
      card.player,
      card.category,
      card.clubCountry,
      card.season,
      card.set,
      card.cardNumber,
      card.parallel,
      card.serial,
      card.autoType,
      card.relicType,
      card.certification
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      (!searchTerm || haystack.includes(searchTerm)) &&
      (!selectedCategory || card.category === selectedCategory) &&
      (!selectedClubCountry || card.clubCountry === selectedClubCountry) &&
      (!selectedSet || card.set === selectedSet) &&
      (!selectedSeason || card.season === selectedSeason) &&
      matchesFeature(card, selectedFeature)
    );
  });
}

function sortCards(cardList, sortValue) {
  return [...cardList].sort((a, b) => {
    if (sortValue === "oldest") return compareCardsBySeasonAsc(a, b);
    if (sortValue === "player-asc") return compareText(a.player, b.player) || compareCards(a, b);
    if (sortValue === "player-desc") return compareText(b.player, a.player) || compareCards(a, b);
    if (sortValue === "set-asc") return compareText(a.set, b.set) || compareCards(a, b);
    return compareCards(a, b);
  });
}

function compareCards(a, b) {
  return (
    compareSeasonDesc(a.season, b.season) ||
    compareText(a.set, b.set) ||
    compareText(a.player, b.player) ||
    compareSerial(a.serial, b.serial) ||
    compareNullableText(a.cardNumber, b.cardNumber) ||
    compareText(a.parallel, b.parallel) ||
    compareText(a.id, b.id)
  );
}

function compareCardsBySeasonAsc(a, b) {
  return (
    compareSeasonAsc(a.season, b.season) ||
    compareText(a.set, b.set) ||
    compareText(a.player, b.player) ||
    compareSerial(a.serial, b.serial) ||
    compareNullableText(a.cardNumber, b.cardNumber) ||
    compareText(a.parallel, b.parallel) ||
    compareText(a.id, b.id)
  );
}

function compareSeasonDesc(a, b) {
  return seasonStart(b) - seasonStart(a) || compareText(b, a);
}

function compareSeasonAsc(a, b) {
  return seasonStart(a) - seasonStart(b) || compareText(a, b);
}

function seasonStart(season) {
  const match = String(season || "").match(/^(\d{4})/);
  return match ? Number(match[1]) : Number.NEGATIVE_INFINITY;
}

function compareSerial(a, b) {
  const parsedA = parseSerial(a);
  const parsedB = parseSerial(b);

  return (
    parsedA.rank - parsedB.rank ||
    parsedA.denominator - parsedB.denominator ||
    parsedA.numerator - parsedB.numerator ||
    compareText(parsedA.raw, parsedB.raw)
  );
}

function parseSerial(serial) {
  if (serial === null || serial === undefined || serial === "") {
    return {
      parsed: false,
      rank: 2,
      denominator: Number.POSITIVE_INFINITY,
      numerator: Number.POSITIVE_INFINITY,
      raw: ""
    };
  }

  const raw = String(serial);
  const match = raw.match(/(\d+)\/(\d+)/);
  if (!match) {
    return {
      parsed: false,
      rank: 1,
      denominator: Number.POSITIVE_INFINITY,
      numerator: Number.POSITIVE_INFINITY,
      raw
    };
  }

  return {
    parsed: true,
    rank: 0,
    denominator: Number(match[2]),
    numerator: Number(match[1]),
    raw
  };
}

function compareNullableText(a, b) {
  const aMissing = a === null || a === undefined || a === "";
  const bMissing = b === null || b === undefined || b === "";

  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return compareText(a, b);
}

function compareText(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""), undefined, {
    numeric: true,
    sensitivity: "base"
  });
}

function matchesFeature(card, feature) {
  if (!feature) return true;
  if (feature === "numbered") return Boolean(card.serial);
  return Boolean(card[feature]);
}

function formatGridParallel(card) {
  return card.parallel || "Base";
}

function getParallelColor(card) {
  return card.parallelColor || "#f36b00";
}

function hasParallelParts(card) {
  return Array.isArray(card.parallelParts) && card.parallelParts.length > 0;
}

function renderParallel(card) {
  if (!hasParallelParts(card)) return escapeHtml(formatGridParallel(card));

  return card.parallelParts
    .map(
      (part) =>
        `<span style="color: ${escapeAttribute(
          part.color || getParallelColor(card)
        )}">${escapeHtml(part.text || "")}</span>`
    )
    .join(" ");
}

function formatSerial(serial) {
  const value = String(serial);
  return value.includes("/") ? value : `/${value}`;
}

function formatDisplaySerial(serial) {
  return String(serial) === "1/1" ? "1 of 1" : serial;
}

function renderSerial(serial) {
  if (!serial) return "";

  const isOneOfOne = String(serial) === "1/1";
  const className = isOneOfOne ? "serial-number serial-one-of-one" : "serial-number";
  return `<span class="${className}">${escapeHtml(formatDisplaySerial(serial))}</span>`;
}

function renderCardTitle(card) {
  return `${escapeHtml(card.player)}${card.serial ? ` ${renderSerial(card.serial)}` : ""}`;
}

function clearAllFilters() {
  searchInput.value = "";
  categoryFilter.value = "";
  clubCountryFilter.value = "";
  setFilter.value = "";
  seasonFilter.value = "";
  featureFilter.value = "";
  currentPage = 1;
  renderCards();
}

function resetAndRenderCards() {
  currentPage = 1;
  renderCards();
}

function updatePagination(totalPages) {
  if (!pagination || !paginationPages || !previousPage || !nextPage) return;

  pagination.hidden = totalPages <= 1;
  previousPage.disabled = currentPage <= 1;
  nextPage.disabled = currentPage >= totalPages;
  paginationPages.innerHTML = renderPageButtons(totalPages);
}

function renderPageButtons(totalPages) {
  if (totalPages <= 0) return "";

  const visiblePages =
    totalPages <= 7
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
          .filter((page) => page >= 1 && page <= totalPages)
          .sort((a, b) => a - b);

  const items = [];
  visiblePages.forEach((page, index) => {
    if (index > 0 && page - visiblePages[index - 1] > 1) {
      items.push('<span class="pagination-ellipsis" aria-hidden="true">...</span>');
    }

    const isCurrent = page === currentPage;
    items.push(`
      <button
        class="pagination-page${isCurrent ? " active" : ""}"
        type="button"
        data-page="${page}"
        ${isCurrent ? 'aria-current="page"' : ""}
        aria-label="Page ${page}"
      >
        ${page}
      </button>
    `);
  });

  return items.join("");
}

function goToPage(page) {
  currentPage = page;
  renderCards();
  document.querySelector(".collection-toolbar")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function openCardDialog(card) {
  const isLandscape = card.orientation === "landscape";
  const cardTypeClass = card.graded ? " dialog-content-graded" : " dialog-content-raw";
  const imageTypeClass = card.graded ? " dialog-images-graded" : " dialog-images-raw";
  const contentLayoutClass = isLandscape ? " dialog-content-landscape" : "";
  const imageLayoutClass = isLandscape ? " dialog-images-landscape" : "";
  cardDialog.classList.toggle("card-dialog-landscape", isLandscape);

  dialogContent.innerHTML = `
    <div class="dialog-images${imageLayoutClass}${imageTypeClass}">
      ${renderDialogImage(card.frontImage, `${card.player} card front`, "Front")}
      ${renderDialogImage(card.backImage, `${card.player} card back`, "Back")}
    </div>
    <div class="dialog-details">
      <p class="dialog-eyebrow">${escapeHtml(card.set)}</p>
      <h2 id="dialogTitle">${renderCardTitle(card)}</h2>
      <p class="dialog-feature">${renderParallel(card)}</p>
      <dl class="detail-list">
        ${renderDetail("Category", card.category)}
        ${renderDetail("Club/Country", card.clubCountry)}
        ${renderDetail("Player", card.player)}
        ${renderDetail("Set", card.set)}
        ${card.cardNumber ? renderDetail("Card number", card.cardNumber) : ""}
        ${renderDetail("Parallel", card.parallel)}
        ${card.serial ? renderDetail("Serial", formatSerial(card.serial)) : ""}
        ${card.auto ? renderDetail("Autograph", formatAutograph(card)) : ""}
        ${card.relic ? renderDetail("Relic", formatRelic(card)) : ""}
        ${
          card.graded
            ? renderDetail(
                "Grade",
                formatGrade(card)
              )
            : ""
        }
        ${card.certification ? renderDetail("Certification", card.certification) : ""}
      </dl>
    </div>
  `;

  dialogContent.className = `dialog-content${contentLayoutClass}${cardTypeClass}`;
  if (!hasParallelParts(card)) {
    dialogContent.querySelector(".dialog-feature").style.color = getParallelColor(card);
  }
  document.body.classList.add("dialog-open");
  cardDialog.showModal();
}

function renderDialogImage(src, alt, label) {
  const imageSrc = resolveAssetPath(src || "images/placeholders/card-front.svg");

  return `
    <figure>
      <span class="dialog-image-frame">
        <img src="${escapeAttribute(imageSrc)}" alt="${escapeAttribute(
          alt
        )}" />
      </span>
      <figcaption>${label}</figcaption>
    </figure>
  `;
}

function resolveAssetPath(path) {
  return new URL(path, siteRoot).href;
}

function renderDetail(label, value) {
  return `
    <div class="detail-row">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value || "Unknown")}</dd>
    </div>
  `;
}

function formatAutograph(card) {
  if (!card.auto) return "No";
  return card.autoType ? `Yes - ${card.autoType}` : "Yes";
}

function formatRelic(card) {
  if (!card.relic) return "No";
  return card.relicType ? `Yes - ${card.relicType}` : "Yes";
}

function formatGrade(card) {
  const cardGrade = `${card.gradeCompany || "Graded"} ${card.grade || ""}`.trim();
  return card.autoGrade ? `${cardGrade}, AUTO ${card.autoGrade}` : cardGrade;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

[searchInput, categoryFilter, clubCountryFilter, setFilter, seasonFilter, featureFilter, sortFilter]
  .filter(Boolean)
  .forEach((input) => {
    input.addEventListener("input", resetAndRenderCards);
  });

clearFilters?.addEventListener("click", clearAllFilters);

previousPage?.addEventListener("click", () => {
  if (currentPage > 1) goToPage(currentPage - 1);
});

nextPage?.addEventListener("click", () => {
  goToPage(currentPage + 1);
});

paginationPages?.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-page]");
  if (!pageButton) return;
  goToPage(Number(pageButton.dataset.page));
});

filterToggle?.addEventListener("click", () => {
  const isOpen = filters.classList.toggle("is-open");
  filterToggle.setAttribute("aria-expanded", String(isOpen));
  filterToggle.textContent = isOpen ? "Hide filters" : "Filter";
});

dialogClose?.addEventListener("click", () => cardDialog.close());

cardDialog?.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
});

cardDialog?.addEventListener("click", (event) => {
  const dialogBox = cardDialog.getBoundingClientRect();
  const isInDialog =
    event.clientX >= dialogBox.left &&
    event.clientX <= dialogBox.right &&
    event.clientY >= dialogBox.top &&
    event.clientY <= dialogBox.bottom;

  if (!isInDialog) {
    cardDialog.close();
  }
});

loadCards();
