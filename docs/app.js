(async () => {
  const grid = document.getElementById('grid');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const searchInput = document.getElementById('search');
  const authorFilter = document.getElementById('author-filter');
  const breadcrumbs = document.getElementById('breadcrumbs');
  const modal = document.getElementById('map-modal');
  const modalClose = document.getElementById('modal-close');

  let manifest = null;
  let authors = new Set();
  let currentPath = null;
  let currentMap = null;

  // Load manifest
  try {
    const res = await fetch('manifest.json');
    if (!res.ok) throw new Error('Network error');
    manifest = await res.json();
  } catch (e) {
    loading.classList.add('hidden');
    error.classList.remove('hidden');
    console.error(e);
    return;
  }

  loading.classList.add('hidden');

  // Extract authors from top-level collections
  manifest.collections.forEach(c => {
    const parts = c.path.split('/');
    if (parts.length >= 2) authors.add(parts[1]);
  });

  // Populate author filter
  Array.from(authors).sort().forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    authorFilter.appendChild(opt);
  });

  // Render helpers
  function renderBreadcrumbs(items) {
    if (!items || items.length === 0) {
      breadcrumbs.classList.add('hidden');
      return;
    }
    breadcrumbs.classList.remove('hidden');
    const ol = document.createElement('ol');
    items.forEach((item, idx) => {
      const li = document.createElement('li');
      if (idx === items.length - 1) {
        li.textContent = item.label;
        li.setAttribute('aria-current', 'page');
      } else {
        const a = document.createElement('a');
        a.textContent = item.label;
        a.addEventListener('click', (e) => {
          e.preventDefault();
          item.onClick();
        });
        li.appendChild(a);
      }
      ol.appendChild(li);
    });
    breadcrumbs.innerHTML = '';
    breadcrumbs.appendChild(ol);
  }

  function createCard(item, type) {
    const card = document.createElement('div');
    card.className = 'card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');

    const imgWrap = document.createElement('div');
    imgWrap.className = 'card-image';
    const img = document.createElement('img');
    const imgSrc = item.preview || item.image || '';
    img.src = imgSrc || '';
    img.alt = item.name || item.title || 'Map preview';
    img.loading = 'lazy';
    imgWrap.appendChild(img);

    if (type === 'collection' && item.maps && item.maps.length > 1) {
      const badge = document.createElement('span');
      badge.className = 'card-badge';
      badge.textContent = `+${item.maps.length} maps`;
      imgWrap.appendChild(badge);
    }

    const body = document.createElement('div');
    body.className = 'card-body';
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = item.name || item.title;
    body.appendChild(title);

    if (type === 'collection') {
      const meta = document.createElement('div');
      meta.className = 'card-meta';
      const parts = item.path.split('/');
      const author = parts.length >= 2 ? parts[1] : '';
      meta.innerHTML = `by <span class="author">${author}</span>`;
      body.appendChild(meta);
    }

    card.appendChild(imgWrap);
    card.appendChild(body);

    const activate = () => {
      if (type === 'collection') {
        if (item.subCollections && item.subCollections.length > 0) {
          showCollection(item);
        } else if (item.maps && item.maps.length === 1) {
          openMapModal(item.maps[0]);
        } else {
          showCollection(item);
        }
      } else {
        openMapModal(item);
      }
    };

    card.addEventListener('click', activate);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });

    return card;
  }

  function showRoot() {
    currentPath = null;
    renderBreadcrumbs([]);
    const term = searchInput.value.trim().toLowerCase();
    const author = authorFilter.value;

    const filtered = manifest.collections.filter(c => {
      const parts = c.path.split('/');
      const authorName = parts.length >= 2 ? parts[1] : '';
      const matchAuthor = !author || authorName === author;
      const matchSearch = !term ||
        c.name.toLowerCase().includes(term) ||
        (c.maps || []).some(m => m.title.toLowerCase().includes(term));
      return matchAuthor && matchSearch;
    });

    grid.innerHTML = '';
    filtered.forEach(c => grid.appendChild(createCard(c, 'collection')));
  }

  function showCollection(collection) {
    currentPath = collection.path;
    renderBreadcrumbs([
      { label: 'All Maps', onClick: showRoot },
      { label: collection.name },
    ]);

    grid.innerHTML = '';

    // Render sub-collections
    if (collection.subCollections) {
      collection.subCollections.forEach(sub => {
        grid.appendChild(createCard(sub, 'collection'));
      });
    }

    // Render individual maps
    if (collection.maps) {
      collection.maps.forEach(m => {
        grid.appendChild(createCard(m, 'map'));
      });
    }

    // Re-apply search filter
    const term = searchInput.value.trim().toLowerCase();
    if (term) {
      Array.from(grid.children).forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        if (!title.includes(term)) card.classList.add('hidden');
      });
    }
  }

  function openMapModal(map) {
    currentMap = map;
    document.getElementById('modal-image').src = map.image || '';
    document.getElementById('modal-title').textContent = map.title;
    document.getElementById('modal-description').textContent = map.description || '';

    const meta = document.getElementById('modal-meta');
    const parts = map.path.split('/');
    const author = parts.length >= 2 ? parts[1] : '';
    meta.innerHTML = `
      <span>Author: <strong>${author}</strong></span>
      <span>Total bricks: <strong>${map.totalBricks}</strong></span>
      ${map.creationDate ? `<span>Created: ${new Date(map.creationDate).toLocaleDateString()}</span>` : ''}
    `;

    const bricksTable = document.getElementById('modal-bricks-table');
    const entries = Object.entries(map.brickCount || {}).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) {
      const table = document.createElement('table');
      table.innerHTML = `
        <thead>
          <tr><th>Brick</th><th>Count</th></tr>
        </thead>
        <tbody>
          ${entries.map(([brick, count]) => `<tr><td>${brick}</td><td>${count}</td></tr>`).join('')}
        </tbody>
      `;
      bricksTable.innerHTML = '';
      bricksTable.appendChild(table);
      document.getElementById('modal-bricks').classList.remove('hidden');
    } else {
      document.getElementById('modal-bricks').classList.add('hidden');
    }

    const download = document.getElementById('modal-download');
    download.href = map.path;
    download.download = map.path.split('/').pop();

    modal.showModal();
    modalClose.focus();
  }

  function closeModal() {
    modal.close();
  }

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    const rect = modal.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      closeModal();
    }
  });
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  document.getElementById('modal-download-bricks').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentMap) return;

    const lines = Object.entries(currentMap.brickCount || {})
      .sort((a, b) => b[1] - a[1])
      .map(([brick, count]) => `${brick}: ${count}`);

    const content = `Map: ${currentMap.title}\nTotal bricks: ${currentMap.totalBricks}\n\nBrick List:\n${lines.join('\n')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Brick List - ${currentMap.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  searchInput.addEventListener('input', () => {
    if (currentPath) {
      // Filter within current collection
      const term = searchInput.value.trim().toLowerCase();
      Array.from(grid.children).forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        if (term && !title.includes(term)) {
          card.classList.add('hidden');
        } else {
          card.classList.remove('hidden');
        }
      });
    } else {
      showRoot();
    }
  });

  authorFilter.addEventListener('change', () => {
    if (!currentPath) showRoot();
  });

  // Initial render
  showRoot();
})();
