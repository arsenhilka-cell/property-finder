const pageSize = 50;
let listings = [];
let page = 1;
const form = document.querySelector('#search-form');
const cards = document.querySelector('#cards');
const summary = document.querySelector('#summary');
const counts = document.querySelector('#source-counts');
const notice = document.querySelector('#notice');
const pagination = document.querySelector('#pagination');
const sort = document.querySelector('#sort');
const submit = form.querySelector('button');
const sendDialog = document.querySelector('#send-dialog');
const sendForm = document.querySelector('#send-form');
const sendTitle = document.querySelector('#send-title');
const sendSubmit = document.querySelector('#send-submit');
let selectedListing = null;
let sendMode = null;
let activeSheetsButton = null;

const sourceLabel = { olx: 'OLX', dimria: 'DIM.RIA', rieltor: 'RIELTOR' };
const number = value => value === undefined ? '—' : new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(value);
const dateValue = value => { const parsed = value ? Date.parse(value) : NaN; return Number.isNaN(parsed) ? 0 : parsed; };

function sorted() {
  const output = [...listings];
  const missingLast = (a, b, direction) => (a === undefined ? 1 : b === undefined ? -1 : direction * (a - b));
  output.sort((a, b) => {
    if (sort.value === 'newest') return dateValue(b.publishedAt) - dateValue(a.publishedAt);
    if (sort.value === 'price-asc') return missingLast(a.price, b.price, 1);
    if (sort.value === 'price-desc') return missingLast(a.price, b.price, -1);
    if (sort.value === 'area-asc') return missingLast(a.area, b.area, 1);
    return missingLast(a.area, b.area, -1);
  });
  return output;
}

function render() {
  const output = sorted();
  const totalPages = Math.ceil(output.length / pageSize);
  page = Math.min(Math.max(page, 1), totalPages || 1);
  const visible = output.slice((page - 1) * pageSize, page * pageSize);
  cards.replaceChildren();
  if (!visible.length) { cards.innerHTML = '<div class="empty">По этим параметрам объявлений не найдено.</div>'; }
  for (const listing of visible) {
    const node = document.querySelector('#card-template').content.cloneNode(true);
    const image = node.querySelector('.photo');
    image.src = listing.imageUrl || '';
    image.alt = listing.title;
    image.onerror = () => { image.removeAttribute('src'); image.alt = 'Фото отсутствует'; };
    node.querySelector('.source').textContent = sourceLabel[listing.source];
    node.querySelector('h3').textContent = listing.title;
    node.querySelector('.location').textContent = [listing.city, listing.location].filter(Boolean).join(' · ') || 'Локация не указана';
    node.querySelector('.published').textContent = listing.publishedAt ? `Опубликовано: ${listing.publishedAt}` : '';
    node.querySelector('.price').textContent = listing.price === undefined ? 'Цена не указана' : `${number(listing.price)} ${listing.currency || ''}`;
    node.querySelector('.area').textContent = listing.area === undefined ? 'Площадь не указана' : `${number(listing.area)} м²`;
    node.querySelector('.ppm').textContent = listing.pricePerM2 === undefined ? '' : `${number(listing.pricePerM2)} ${listing.currency || ''}/м²`;
    node.querySelector('.telegram').onclick = () => openSendDialog(listing, 'telegram');
    node.querySelector('.sheets').onclick = event => openSendDialog(listing, 'sheets', event.currentTarget);
    node.querySelector('.open').href = listing.listingUrl;
    cards.append(node);
  }
  pagination.replaceChildren();
  for (let item = 1; item <= totalPages; item++) { const button = document.createElement('button'); button.textContent = item; button.className = item === page ? 'active' : ''; button.onclick = () => { page = item; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }; pagination.append(button); }
}

function showNotice(text, type = '') { notice.textContent = text; notice.className = text ? `notice ${type}` : ''; }

function openSendDialog(listing, mode, sheetsButton = null) {
  selectedListing = listing;
  sendMode = mode;
  activeSheetsButton = sheetsButton;
  sendForm.reset();
  sendTitle.textContent = mode === 'telegram' ? 'Отправить в Telegram' : 'Добавить в таблицу';
  sendSubmit.textContent = mode === 'telegram' ? 'Отправить' : 'Добавить';
  sendDialog.showModal();
  sendForm.elements.comment.focus();
}

function closeSendDialog() {
  sendDialog.close();
  selectedListing = null;
  sendMode = null;
  activeSheetsButton = null;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(form);
  const payload = Object.fromEntries(['city', 'operation', 'minPrice', 'maxPrice', 'minArea', 'maxArea'].map(key => [key, data.get(key) || undefined]));
  payload.sources = data.getAll('sources');
  submit.disabled = true; showNotice('Ищем объявления...', 'loading'); cards.replaceChildren(); pagination.replaceChildren();
  try {
    const response = await fetch('/api/search', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Search failed');
    listings = result.listings; page = 1;
    summary.textContent = `Найдено: ${listings.length}`;
    counts.replaceChildren(...Object.entries(result.counts).filter(([source]) => payload.sources.includes(source)).map(([source, count]) => { const tag = document.createElement('span'); tag.className = 'count'; tag.textContent = `${sourceLabel[source]} ${count}`; return tag; }));
    const failed = Object.entries(result.errors);
    showNotice(failed.length ? `Часть источников недоступна: ${failed.map(([source]) => sourceLabel[source]).join(', ')}. Показаны результаты остальных.` : '');
    render();
  } catch (error) { showNotice(`Не удалось выполнить поиск: ${error.message}`, 'error'); }
  finally { submit.disabled = false; }
});
sort.addEventListener('change', () => { page = 1; render(); });
sendDialog.querySelector('[data-cancel]').addEventListener('click', closeSendDialog);
sendDialog.querySelector('.icon-close').addEventListener('click', closeSendDialog);
sendForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!selectedListing || !sendMode) return;
  sendSubmit.disabled = true;
  try {
    const endpoint = sendMode === 'telegram' ? '/api/telegram' : '/api/sheets';
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ listing: selectedListing, comment: sendForm.elements.comment.value }) });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Сервис не принял запрос');
    const mode = sendMode;
    const sheetsButton = activeSheetsButton;
    closeSendDialog();
    if (mode === 'telegram') showNotice('Отправлено в Telegram');
    else if (result.status === 'added') {
      if (sheetsButton) { sheetsButton.textContent = '✓ В таблице'; sheetsButton.disabled = true; sheetsButton.classList.add('in-sheet'); }
      showNotice('✓ Добавлено в таблицу');
    } else if (result.status === 'already_exists') showNotice('Уже есть в таблице');
    else throw new Error('Google Sheets вернул неизвестный статус');
  } catch (error) { showNotice(`Не удалось отправить: ${error.message}`, 'error'); }
  finally { sendSubmit.disabled = false; }
});
