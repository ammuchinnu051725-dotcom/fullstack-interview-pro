const pageSize = 10;
let allQuestions = [];
let filteredQuestions = [];
let currentPage = 1;

const JSON_SOURCES = [
  'jsons for Java/core-java.json',
  'jsons for Java/collections.json',
  'jsons for Java/multithreading.json',
  'jsons for Java/streams.json',
  'jsons for Java/spring-core.json',
  'jsons for Java/spring-boot.json',
  'jsons for Java/microservices.json',
  'jsons for Java/restAPIs.json',
  'jsons for Java/designpatterns.json',
  'jsons for Java/systemdesign.json',
  'jsons for Java/sql.json',
  'jsons for Java/javascript.json',
  'jsons for Java/react.json',
  'jsons for Java/junit.json',
  'jsons for Java/docker.json',
  'jsons for Java/git.json'
];

let selectedCategories = [];

async function loadQuestions() {
  try {
    const loads = JSON_SOURCES.map(p => fetch(encodeURI(p)).then(r => r.json()).catch(() => []));
    const results = await Promise.all(loads);
    allQuestions = results.flat();

    populateExperienceFilter();
    populateCategoryFilter();
    populateTypeFilter();
    populateDifficultyFilter();
    populateSubcategoryFilter();

    filteredQuestions = allQuestions.slice();
    currentPage = 1;
    renderQuestions();
    bindFilters();
  } catch (err) {
    document.getElementById('questions').innerHTML = '<p class="card">Failed to load questions. Check JSON files in jsons for Java</p>';
    console.error(err);
  }
}

function populateExperienceFilter() {
  const sel = document.getElementById('experienceFilter');
  if (!sel) return;
  const labels = Array.from(new Set(allQuestions.map(q => {
    if (!q.experience) return null;
    return (typeof q.experience === 'object' && q.experience.label) ? q.experience.label : q.experience;
  }).filter(Boolean))).sort();
  sel.innerHTML = '<option value="All">All</option>' + labels.map(l => `<option value="${l}">${l}</option>`).join('');
}

function populateCategoryFilter() {
  const btn = document.getElementById('categoryDropdownBtn');
  if (!btn) return;
  const categories = Array.from(new Set(allQuestions.map(q => q.category).filter(Boolean))).sort();
  populateCategoryModal(categories);
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openCategoryModal();
  });
  updateCategoryDisplay();
}

function populateCategoryModal(categories) {
  const list = document.getElementById('categoryModalList');
  if (!list) return;

  list.innerHTML = categories.map(cat => {
    const id = ('modal_cat_' + cat).replace(/[^a-z0-9_]/gi, '_');
    return `
      <div class="category-item-container">
        <input type="checkbox" id="${id}" value="${encodeURIComponent(cat)}" class="modal-category-checkbox" />
        <label for="${id}">${escapeHtml(cat)}</label>
      </div>
    `;
  }).join('');

  const modalSearch = document.getElementById('categoryModalSearch');
  if (modalSearch) {
    modalSearch.value = '';
    modalSearch.addEventListener('input', () => {
      const q = modalSearch.value.trim().toLowerCase();
      const items = list.querySelectorAll('.category-item-container');
      items.forEach(item => {
        const label = item.querySelector('label').textContent.toLowerCase();
        item.style.display = label.includes(q) ? 'flex' : 'none';
      });
    });
  }

  const modalAll = document.getElementById('modalCategoryAllCheck');
  const modalChecks = list.querySelectorAll('.modal-category-checkbox');

  if (modalAll) {
    modalAll.addEventListener('change', () => {
      if (modalAll.checked) {
        modalChecks.forEach(mc => mc.checked = false);
      }
    });
  }

  modalChecks.forEach(mc => {
    mc.addEventListener('change', () => {
      if (mc.checked && modalAll) {
        modalAll.checked = false;
      }
      const anyChecked = Array.from(modalChecks).some(i => i.checked);
      if (!anyChecked && modalAll) modalAll.checked = true;
    });
  });
}

function openCategoryModal() {
  const overlay = document.getElementById('categoryModal');
  if (!overlay) return;
  const modalChecks = document.querySelectorAll('.modal-category-checkbox');
  modalChecks.forEach(c => {
    c.checked = selectedCategories.includes(decodeURIComponent(c.value));
  });
  const modalAll = document.getElementById('modalCategoryAllCheck');
  if (modalAll) modalAll.checked = (selectedCategories.length === 0);
  overlay.style.display = 'flex';
}

function closeCategoryModal() {
  const overlay = document.getElementById('categoryModal');
  if (overlay) overlay.style.display = 'none';
}

function updateCategoryDisplay() {
  const btns = document.querySelectorAll('#categoryDropdownBtn');
  btns.forEach(btn => {
    if (selectedCategories.length === 0) {
      btn.textContent = 'Select Categories ▼';
      return;
    }
    const preview = selectedCategories.slice(0, 2).join(', ');
    btn.textContent = selectedCategories.length > 2 ? `${preview} +${selectedCategories.length - 2} more ▼` : `${preview} ▼`;
  });
}

function populateSubcategoryFilter() {
  const subSels = document.querySelectorAll('#subcategoryFilter');
  subSels.forEach(subSel => {
    const parentLabel = subSel.closest('label');

    if (selectedCategories.length === 0) {
      subSel.disabled = true;
      subSel.innerHTML = '<option value="All">All Subcategories</option>';
      if (parentLabel) parentLabel.style.display = 'none';
      return;
    }

    const subs = Array.from(new Set(
      allQuestions.filter(q => selectedCategories.includes(q.category) && q.subcategory)
        .map(q => q.subcategory)
    )).sort();

    if (subs.length === 0) {
      subSel.disabled = true;
      subSel.innerHTML = '<option value="All">All Subcategories</option>';
      if (parentLabel) parentLabel.style.display = 'none';
      return;
    }

    if (parentLabel) parentLabel.style.display = 'flex';
    subSel.disabled = false;
    const currentValue = subSel.value;
    subSel.innerHTML = '<option value="All">All Subcategories</option>';
    subs.forEach(s => {
      const o = document.createElement('option');
      o.value = s;
      o.textContent = s;
      subSel.appendChild(o);
    });
    // Restore value if it still exists in new list
    if (Array.from(subSel.options).some(opt => opt.value === currentValue)) {
      subSel.value = currentValue;
    }
  });
}

function populateTypeFilter() {
  const sel = document.getElementById('typeFilter');
  if (!sel) return;
  const types = Array.from(new Set(allQuestions.map(q => q.type).filter(Boolean))).sort();
  sel.innerHTML = '<option value="All">All Types</option>' + types.map(t => `<option value="${t}">${t}</option>`).join('');
}

function populateDifficultyFilter() {
  const sel = document.getElementById('difficultyFilter');
  if (!sel) return;
  const diffs = Array.from(new Set(allQuestions.map(q => q.difficulty).filter(Boolean))).sort();
  sel.innerHTML = '<option value="All">All Difficulties</option>' + diffs.map(d => `<option value="${d}">${d}</option>`).join('');
}

function filterQuestions() {
  const exp = document.getElementById('experienceFilter').value;
  const company = document.getElementById('companyFilter').value;
  const subSel = document.getElementById('subcategoryFilter');
  const subcategory = (subSel && !subSel.disabled) ? subSel.value : 'All';
  const type = document.getElementById('typeFilter') ? document.getElementById('typeFilter').value : 'All';
  const difficulty = document.getElementById('difficultyFilter') ? document.getElementById('difficultyFilter').value : 'All';
  const popularity = document.getElementById('popularityFilter') ? document.getElementById('popularityFilter').value : 'All';

  filteredQuestions = allQuestions.filter(q => {
    const qexp = (typeof q.experience === 'object' && q.experience) ? q.experience.label : q.experience;
    const matchExp = (exp === 'All') || (qexp === exp);
    const matchCompany = (company === 'All Companies') || (q.companies && q.companies.includes(company));
    const matchCategory = (selectedCategories.length === 0) || selectedCategories.includes(q.category);
    const matchSub = (subcategory === 'All') || (q.subcategory === subcategory);
    const matchType = (type === 'All') || (q.type === type);
    const matchDiff = (difficulty === 'All') || (q.difficulty === difficulty);
    let matchPop = true;
    if (popularity && popularity !== 'All') {
      const [min, max] = popularity.split('-').map(Number);
      matchPop = (typeof q.popularity === 'number') && q.popularity >= min && q.popularity <= max;
    }
    return matchExp && matchCompany && matchCategory && matchSub && matchType && matchDiff && matchPop;
  });
  currentPage = 1;
  renderQuestions();
}

function searchQuestions() {
  const term = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!term) {
    filterQuestions();
    return;
  }
  filterQuestions();
  filteredQuestions = filteredQuestions.filter(q => {
    return (q.question && q.question.toLowerCase().includes(term)) ||
      (q.answer && q.answer.toLowerCase().includes(term)) ||
      (q.category && q.category.toLowerCase().includes(term));
  });
  currentPage = 1;
  renderQuestions();
}

function renderQuestions() {
  const container = document.getElementById('questions');
  if (!container) return;
  container.innerHTML = '';

  let source = filteredQuestions.slice();
  const sortSel = document.getElementById('frequencySort');
  const order = sortSel ? sortSel.value : 'none';
  if (order === 'desc') source.sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
  if (order === 'asc') source.sort((a, b) => (a.frequency || 0) - (b.frequency || 0));

  const totalPages = Math.max(1, Math.ceil(source.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  const startIndex = (currentPage - 1) * pageSize;
  const items = source.slice(startIndex, startIndex + pageSize);

  if (items.length === 0) {
    container.innerHTML = '<div class="card">No matching questions.</div>';
    renderPagination(totalPages);
    return;
  }

  items.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    const questionNumber = startIndex + idx + 1;
    const meta = [];
    if (q.type) meta.push(q.type);
    if (q.difficulty) meta.push(q.difficulty);
    if (typeof q.frequency !== 'undefined') meta.push(`Freq: ${q.frequency}`);
    if (typeof q.popularity !== 'undefined') meta.push(`Pop: ${q.popularity}`);

    card.innerHTML = `
      <div class="q-title" aria-expanded="true">
        <div><strong>${questionNumber}. ${escapeHtml(q.question)}</strong></div>
        <div class="chev">▾</div>
      </div>
      <div class="meta">${escapeHtml(meta.join(' • '))}</div>
      <div class="q-content expanded">${escapeHtml(q.answer)}</div>
    `;
    container.appendChild(card);

    // In-Feed Ad: Show an ad after the 5th question on the page
    if (idx === 4) {
      const adDiv = document.createElement('div');
      adDiv.className = 'ad-container in-feed';
      adDiv.innerHTML = `
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-format="fluid"
             data-ad-layout-key="-fb+5w+4e-db+86"
             data-ad-client="ca-pub-3797040072271957"
             data-ad-slot="IN_FEED_ID"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      `;
      container.appendChild(adDiv);
    }
  });
  handleAccordion();
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const container = document.getElementById('pagination');
  if (!container) return;
  container.innerHTML = '';
  if (totalPages <= 1) return;

  const makeButton = (label, page, extraClass) => {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (extraClass ? ' ' + extraClass : '');
    btn.textContent = label;
    if (page === currentPage) btn.classList.add('active');
    btn.onclick = () => {
      currentPage = page;
      renderQuestions();
    };
    return btn;
  };

  const prev = document.createElement('button');
  prev.className = 'page-btn small';
  prev.textContent = '‹';
  prev.disabled = (currentPage === 1);
  prev.onclick = () => { if (currentPage > 1) { currentPage--; renderQuestions(); } };
  container.appendChild(prev);

  const maxButtons = 7;
  if (totalPages <= maxButtons) {
    for (let p = 1; p <= totalPages; p++) container.appendChild(makeButton(p, p));
  } else {
    container.appendChild(makeButton(1, 1));
    let left = Math.max(2, currentPage - 2);
    let right = Math.min(totalPages - 1, currentPage + 2);
    if (currentPage <= 4) { left = 2; right = 5; }
    if (currentPage >= totalPages - 3) { left = totalPages - 4; right = totalPages - 1; }

    if (left > 2) {
      const ell = document.createElement('span'); ell.className = 'ellipsis'; ell.textContent = '…'; container.appendChild(ell);
    }
    for (let p = left; p <= right; p++) container.appendChild(makeButton(p, p));
    if (right < totalPages - 1) {
      const ell = document.createElement('span'); ell.className = 'ellipsis'; ell.textContent = '…'; container.appendChild(ell);
    }
    container.appendChild(makeButton(totalPages, totalPages));
  }

  const next = document.createElement('button');
  next.className = 'page-btn small';
  next.textContent = '›';
  next.disabled = (currentPage === totalPages);
  next.onclick = () => { if (currentPage < totalPages) { currentPage++; renderQuestions(); } };
  container.appendChild(next);

  // Go to page number
  const gotoDiv = document.createElement('div');
  gotoDiv.className = 'goto-page';
  gotoDiv.innerHTML = `
    <input type="number" id="gotoPageInput" placeholder="Page" min="1" max="${totalPages}">
    <button id="gotoPageBtn" class="page-btn active">Go</button>
  `;
  container.appendChild(gotoDiv);

  const gotoInput = gotoDiv.querySelector('#gotoPageInput');
  const gotoBtn = gotoDiv.querySelector('#gotoPageBtn');

  const doGoto = () => {
    const p = parseInt(gotoInput.value);
    if (p >= 1 && p <= totalPages) {
      currentPage = p;
      renderQuestions();
    } else if (p > totalPages) {
      alert(`Max page is ${totalPages}`);
    }
  };

  gotoBtn.onclick = doGoto;
  gotoInput.onkeypress = (e) => { if (e.key === 'Enter') doGoto(); };
}

function handleAccordion() {
  const titles = document.querySelectorAll('.q-title');
  titles.forEach(t => {
    t.onclick = () => {
      const content = t.parentElement.querySelector('.q-content');
      const expanded = t.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        t.setAttribute('aria-expanded', 'false');
        content.classList.replace('expanded', 'collapsed');
      } else {
        t.setAttribute('aria-expanded', 'true');
        content.classList.replace('collapsed', 'expanded');
      }
    };
  });
}

function setupFilterToggle() {
  const button = document.getElementById('filterToggleBtn');
  const content = document.getElementById('filterContent');
  const downloadRow = document.querySelector('.download-row');
  if (!button || !content || !downloadRow) return;
  content.classList.add('collapsed');
  downloadRow.classList.add('collapsed');
  button.textContent = 'Expand filters';
  button.onclick = () => openFilterModal();
}

function openFilterModal() {
  const overlay = document.getElementById('filterModal');
  const body = document.getElementById('filterModalBody');
  if (!overlay || !body) return;

  const content = document.getElementById('filterContent');
  body.innerHTML = '';
  const clone = content.cloneNode(true);
  clone.id = '';
  clone.classList.remove('collapsed');

  const searchRow = clone.querySelector('.search-row');
  if (searchRow) searchRow.remove();

  const catBtn = clone.querySelector('#categoryDropdownBtn');
  if (catBtn) catBtn.onclick = (e) => { e.preventDefault(); openCategoryModal(); };

  clone.querySelectorAll('[style]').forEach(el => {
    if (el.style.display === 'none') el.style.display = 'block';
  });

  body.appendChild(clone);

  // Update the cloned elements to match current state
  updateCategoryDisplay();
  populateSubcategoryFilter();

  overlay.style.display = 'flex';

  const modalAdvBtn = body.querySelector('#advancedToggleBtn');
  const modalAdvPanel = body.querySelector('#advancedFilters');
  if (modalAdvBtn && modalAdvPanel) {
    modalAdvPanel.style.display = 'none';
    modalAdvBtn.textContent = 'Show Advanced Filters';
    modalAdvBtn.onclick = (e) => {
      e.preventDefault();
      const isHidden = modalAdvPanel.style.display === 'none';
      modalAdvPanel.style.display = isHidden ? 'block' : 'none';
      modalAdvBtn.textContent = isHidden ? 'Hide Advanced Filters' : 'Show Advanced Filters';
    };
  }

  document.getElementById('filterModalApply').onclick = () => {
    try {
      const mExp = body.querySelector('#experienceFilter');
      if (mExp) document.getElementById('experienceFilter').value = mExp.value;
      const mComp = body.querySelector('#companyFilter');
      if (mComp) document.getElementById('companyFilter').value = mComp.value;
      const mSub = body.querySelector('#subcategoryFilter');
      if (mSub) document.getElementById('subcategoryFilter').value = mSub.value;
      const mType = body.querySelector('#typeFilter');
      if (mType) document.getElementById('typeFilter').value = mType.value;
      const mDiff = body.querySelector('#difficultyFilter');
      if (mDiff) document.getElementById('difficultyFilter').value = mDiff.value;
      const mPop = body.querySelector('#popularityFilter');
      if (mPop) document.getElementById('popularityFilter').value = mPop.value;
      const mFreq = body.querySelector('#frequencySort');
      if (mFreq) document.getElementById('frequencySort').value = mFreq.value;
    } catch (e) { console.error(e); }
    overlay.style.display = 'none';
    filterQuestions();
  };
  document.getElementById('filterModalCancel').onclick = () => overlay.style.display = 'none';
  document.getElementById('filterModalClose').onclick = () => overlay.style.display = 'none';
}

function clearFilters() {
  const exp = document.getElementById('experienceFilter'); if (exp) exp.value = 'All';
  const comp = document.getElementById('companyFilter'); if (comp) comp.value = 'All Companies';
  const sub = document.getElementById('subcategoryFilter'); if (sub) { sub.innerHTML = '<option value="All">All Subcategories</option>'; sub.disabled = true; }
  selectedCategories = [];
  updateCategoryDisplay();
  const t = document.getElementById('typeFilter'); if (t) t.value = 'All';
  const d = document.getElementById('difficultyFilter'); if (d) d.value = 'All';
  const p = document.getElementById('popularityFilter'); if (p) p.value = 'All';
  const fs = document.getElementById('frequencySort'); if (fs) fs.value = 'none';
  const s = document.getElementById('searchInput'); if (s) s.value = '';
  filterQuestions();
}

function setTheme(theme) {
  const toggle = document.getElementById('themeToggle');
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    if (toggle) { toggle.textContent = '☀'; toggle.title = 'Switch to light mode'; }
  } else {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
    if (toggle) { toggle.textContent = '🌙'; toggle.title = 'Switch to dark mode'; }
  }
  localStorage.setItem('preferredTheme', theme);
}

function bindFilters() {
  document.getElementById('experienceFilter').onchange = filterQuestions;
  document.getElementById('companyFilter').onchange = filterQuestions;
  const sub = document.getElementById('subcategoryFilter'); if (sub) sub.onchange = filterQuestions;
  const t = document.getElementById('typeFilter'); if (t) t.onchange = filterQuestions;
  const d = document.getElementById('difficultyFilter'); if (d) d.onchange = filterQuestions;
  const p = document.getElementById('popularityFilter'); if (p) p.onchange = filterQuestions;
  const fs = document.getElementById('frequencySort'); if (fs) fs.onchange = renderQuestions;
  const clearBtn = document.getElementById('clearFiltersBtn'); if (clearBtn) clearBtn.onclick = clearFilters;
  document.getElementById('searchInput').oninput = searchQuestions;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

function setupThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  setTheme(localStorage.getItem('preferredTheme') || 'light');
  if (toggle) toggle.onclick = () => setTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark');
}

function setupInfoModals() {
  const modal = document.getElementById('infoModal');
  const title = document.getElementById('infoModalTitle');
  const body = document.getElementById('infoModalBody');
  const closeBtn = document.getElementById('infoModalClose');
  const okBtn = document.getElementById('infoModalOk');

  const showInfo = (type) => {
    modal.style.display = 'flex';
    if (type === 'about') {
      title.textContent = 'About Us';
      body.innerHTML = `
        <div class="legal-text">
          <p><strong>Ultimate Full Stack Interview Pro</strong> is a dedicated platform designed to help software developers master their technical interviews. With over 1,600 curated questions covering the entire Full Stack ecosystem—from Core Java and Spring Boot to React, DevOps, and System Design—we provide real-world scenarios and frequency-based insights.</p>
          <p>Our mission is to simplify interview preparation and empower developers to land their dream jobs at top-tier tech companies. We believe in providing clear, concise, and accurate information to help you stay ahead in the competitive tech landscape.</p>
        </div>
      `;
    } else if (type === 'contact') {
      title.textContent = 'Contact Us';
      body.innerHTML = `
        <div class="legal-text">
          <p>We value your feedback and inquiries. If you have any questions, suggestions, or found a mistake in our content, please feel free to reach out to us.</p>
          <p><strong>Email:</strong> <a href="mailto:ammuchinnu051725@gmail.com">ammuchinnu051725@gmail.com</a></p>
          <p>We typically respond within 24-48 hours.</p>
        </div>
      `;
    } else if (type === 'privacy') {
      title.textContent = 'Privacy Policy';
      body.innerHTML = `
        <div class="legal-text">
          <p>Last Updated: May 2024</p>
          <p>Your privacy is important to us. This Privacy Policy explains how Ultimate Full Stack Interview Pro collects, uses, and protects your information.</p>
          <h4>1. Information We Collect</h4>
          <p>We do not require users to create accounts. We may collect non-personal information such as browser type, device information, and pages visited to improve our service.</p>
          <h4>2. Google AdSense & Cookies</h4>
          <p>We use Google AdSense to serve ads. Google use cookies to serve ads based on your prior visits to our website or other websites. You may opt out of personalized advertising by visiting Ads Settings.</p>
          <h4>3. Third-Party Links</h4>
          <p>Our site contains links to other websites (like LeetCode or HackerRank). We are not responsible for the privacy practices of these external sites.</p>
          <h4>4. Contact Information</h4>
          <p>For questions regarding this policy, contact us at: ammuchinnu051725@gmail.com</p>
        </div>
      `;
    }
  };

  document.getElementById('aboutLink').onclick = (e) => { e.preventDefault(); showInfo('about'); };
  document.getElementById('contactLink').onclick = (e) => { e.preventDefault(); showInfo('contact'); };
  document.getElementById('privacyLink').onclick = (e) => { e.preventDefault(); showInfo('privacy'); };

  closeBtn.onclick = () => modal.style.display = 'none';
  okBtn.onclick = () => modal.style.display = 'none';
  window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };
}

document.addEventListener('DOMContentLoaded', () => {
  loadQuestions();
  setupThemeToggle();
  setupFilterToggle();
  setupInfoModals();

  const mConfirm = document.getElementById('categoryModalConfirm');
  if (mConfirm) mConfirm.onclick = () => {
    const checked = Array.from(document.querySelectorAll('.modal-category-checkbox:checked'));
    selectedCategories = checked.map(i => decodeURIComponent(i.value));
    updateCategoryDisplay();
    populateSubcategoryFilter();
    filterQuestions();
    closeCategoryModal();
  };
  const mCancel = document.getElementById('categoryModalCancel');
  if (mCancel) mCancel.onclick = closeCategoryModal;
  const mClose = document.getElementById('categoryModalClose');
  if (mClose) mClose.onclick = closeCategoryModal;
});

window.downloadCheatsheet = async () => {
  const source = filteredQuestions;

  if (source.length === 0) {
    alert('No questions match your current filters. Please adjust your filters before downloading.');
    return;
  }

  // Show the "Preparing Download" modal with an ad
  const modal = document.getElementById('infoModal');
  const title = document.getElementById('infoModalTitle');
  const body = document.getElementById('infoModalBody');
  const okBtn = document.getElementById('infoModalOk');

  title.textContent = 'Preparing Your Download';
  body.innerHTML = `
    <div style="text-align:center;">
      <p>Please wait while we generate your customized PDF cheatsheet...</p>
      <div style="margin:20px 0; min-height:250px; background:#f9f9f9; display:flex; align-items:center; justify-content:center; border:1px dashed #ccc;">
        <!-- AdSense Download Interstitial Placeholder -->
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="ca-pub-3797040072271957"
             data-ad-slot="DOWNLOAD_AD_ID"
             data-ad-format="rectangle"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      </div>
      <p style="font-size:12px; color:#666;">Your download will start automatically in a few seconds.</p>
    </div>
  `;
  okBtn.style.display = 'none'; // Hide the close button temporarily
  modal.style.display = 'flex';

  // Delay the download to allow the ad to be seen
  await new Promise(resolve => setTimeout(resolve, 4000));

  const pdfLibUrl = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = pdfLibUrl;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const margin = 16;
  let y = 20;
  const textWidth = doc.internal.pageSize.getWidth() - margin * 2;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text('Java Full Stack Interview Prep', margin, y);
  y += 12;

  source.forEach((q, idx) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    const qLines = doc.splitTextToSize(`${idx + 1}. ${q.question}`, textWidth);
    qLines.forEach(line => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, margin, y); y += 7;
    });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    const aLines = doc.splitTextToSize(q.answer, textWidth);
    aLines.forEach(line => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, margin, y); y += 6;
    });
    y += 4;
  });

  // Construct dynamic filename based on active filters
  const company = document.getElementById('companyFilter').value;
  const exp = document.getElementById('experienceFilter').value;
  const sub = document.getElementById('subcategoryFilter').value;

  let parts = ['Java_Interview'];

  if (company !== 'All Companies') parts.push(company);
  if (exp !== 'All') parts.push(exp);

  if (selectedCategories.length === 1) {
    parts.push(selectedCategories[0]);
  } else if (selectedCategories.length > 1) {
    parts.push(`${selectedCategories.length}_Categories`);
  }

  if (sub !== 'All') parts.push(sub);

  const sanitize = (s) => s.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
  const filename = parts.map(sanitize).join('_') + '.pdf';

  doc.save(filename);

  // Close the modal and restore the button
  setTimeout(() => {
    modal.style.display = 'none';
    okBtn.style.display = 'inline-flex';
  }, 1000);
};

document.getElementById('downloadBtn').onclick = () => window.downloadCheatsheet();
