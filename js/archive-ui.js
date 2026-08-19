// 画师串/文档 UI 操作
let currentCategory = 'artist-string';
let allItems = [];
let masterPassword = sessionStorage.getItem('musee_password') || '';
let compressedImageBase64 = "";
let existingImageBase64 = "";

function updateLockUI() {
  const lockIcon = document.getElementById('lockIcon');
  const lockText = document.getElementById('lockText');
  if (masterPassword) {
    lockIcon.innerText = "🔓";
    lockText.innerText = "已解锁";
  } else {
    lockIcon.innerText = "🔒";
    lockText.innerText = "未解锁";
  }
}

function promptPassword() {
  const pwd = prompt("请输入您的主密码以解密/保存画师串:");
  if (pwd !== null) {
    masterPassword = pwd;
    sessionStorage.setItem('musee_password', pwd);
    updateLockUI();
    renderCards();
  }
}

async function loadArchiveData() {
  document.getElementById('itemCount').innerText = "LOADING...";
  allItems = await fetchItemsFromDB();
  renderCards();
}

function switchCategory(cate) {
  currentCategory = cate;
  document.querySelectorAll('#categoryNav a').forEach(a => {
    if (a.getAttribute('data-cate') === cate) {
      a.className = "text-stone-900 border-b border-stone-900 pb-1";
    } else {
      a.className = "hover:text-stone-900 transition pb-1";
    }
  });

  const titles = {
    'artist-string': 'Artist Strings / 画师串',
    'single-artist': 'Individual Artists / 单独画师',
    'template': 'Prompt Templates / 提示词模板',
    'collection': 'Collection / 收藏画师',
    'document': '📌 Documents & Notes / 记事文档'
  };
  document.getElementById('currentCategoryTitle').innerText = titles[cate] || 'Archive';
  renderCards();
}

function renderCards() {
  const container = document.getElementById('cardsContainer');
  container.innerHTML = "";

  const filtered = allItems.filter(item => item.category === currentCategory);
  document.getElementById('itemCount').innerText = `${filtered.length} ITEMS`;

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-20 text-center text-stone-400 text-xs tracking-widest uppercase">No items found.</div>`;
    return;
  }

  if (currentCategory === 'document') {
    container.className = "max-w-4xl mx-auto space-y-12 w-full col-span-full";
    filtered.forEach(item => {
      const docElement = document.createElement('div');
      docElement.className = "document-card p-6 md:p-12 rounded-lg shadow-sm flex flex-col justify-between";

      let contentDisplay = "🔒 此文档已被加密 (请在右上角解锁查看)";
      if (masterPassword) {
        const decrypted = decryptData(item.content, masterPassword);
        contentDisplay = decrypted ? decrypted : "❌ 密码错误，无法解密";
      }

      const formattedContent = contentDisplay.replace(/\n/g, '<br>');

      docElement.innerHTML = `
        <div>
          <div class="flex items-center justify-between border-b border-stone-200 pb-4 mb-6">
            <div>
              <span class="text-[10px] tracking-widest text-stone-400 uppercase">📌 DOCUMENT NOTE</span>
              <h2 class="serif-title text-2xl font-semibold mt-1">${item.title}</h2>
            </div>
            <div class="flex gap-4 text-xs">
              <button onclick="editItem('${item.id}')" class="text-stone-400 hover:text-stone-850">编辑</button>
              <button onclick="handleDeleteItem('${item.id}', '${item.title}')" class="text-red-400 hover:text-red-600">删除</button>
            </div>
          </div>
          ${item.image_base64 ? `<img src="${item.image_base64}" class="w-full max-h-[300px] object-cover rounded mb-6 opacity-90">` : ''}
          ${item.remarks ? `<p class="text-xs text-stone-400 italic mb-6">备注：${item.remarks}</p>` : ''}
          <div class="no-select text-stone-700 leading-8 text-base tracking-wide whitespace-pre-wrap font-serif mb-8 p-6 bg-white/40 rounded border border-stone-200/50" oncontextmenu="return false">
            ${formattedContent}
          </div>
        </div>
        <div class="flex items-center justify-between text-xs border-t border-stone-100 pt-4">
          <span class="text-[10px] text-stone-400">${new Date(item.created_at).toLocaleDateString()}</span>
          <button onclick="copyPrompt(this, '${item.content}')" class="tracking-wider border-b border-stone-900 pb-0.5 hover:text-stone-500 font-medium">COPY DOCUMENT CONTENT</button>
        </div>
      `;
      container.appendChild(docElement);
    });
  } else {
    container.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8";
    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = "museum-card rounded-lg overflow-hidden flex flex-col justify-between";

      let imageHtml = item.image_base64 
        ? `<div class="aspect-[4/3] bg-stone-200 relative overflow-hidden group"><img src="${item.image_base64}" alt="${item.title}" class="w-full h-full object-cover transition duration-700 group-hover:scale-105"></div>`
        : `<div class="aspect-[4/3] bg-stone-300/30 flex items-center justify-center select-none"><span class="logo-font text-8xl font-light text-stone-200">${item.title.charAt(0).toUpperCase()}</span></div>`;

      let contentDisplay = "🔒 已加密 (点击下方按钮复制解锁)";
      if (masterPassword) {
        const decrypted = decryptData(item.content, masterPassword);
        contentDisplay = decrypted ? decrypted : "❌ 密码错误，无法解密内容";
      }

      let tagsHtml = item.tags ? item.tags.split(',').map(tag => `<span class="text-[10px] bg-stone-200/50 px-2 py-0.5 rounded text-stone-600">${tag.trim()}</span>`).join(' ') : '';

      card.innerHTML = `
        <div>
          ${imageHtml}
          <div class="p-6">
            <div class="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-stone-400 mb-2">
              <span>${item.category.replace('-', ' ')}</span>
              <div class="flex gap-2">
                <button onclick="editItem('${item.id}')" class="hover:text-stone-900 transition">编辑</button>
                <button onclick="handleDeleteItem('${item.id}', '${item.title}')" class="hover:text-red-500 transition">删除</button>
              </div>
            </div>
            <h2 class="serif-title text-xl italic font-semibold mb-3">${item.title}</h2>
            <p class="text-xs text-stone-500 mb-4">${item.remarks || '无备注'}</p>
            <div class="no-select p-3 bg-stone-200/40 rounded text-xs font-mono text-stone-600 break-all mb-4" oncontextmenu="return false">${contentDisplay}</div>
          </div>
        </div>
        <div class="px-6 pb-6">
          <div class="flex flex-wrap gap-1.5 mb-6">${tagsHtml}</div>
          <div class="pt-4 border-t border-stone-200/60 flex items-center justify-between">
            <span class="text-[10px] text-stone-400 font-mono">${new Date(item.created_at).toLocaleDateString()}</span>
            <button onclick="copyPrompt(this, '${item.content}')" class="text-xs tracking-wider border-b border-stone-900 pb-0.5 hover:text-stone-500 font-medium">COPY STRING</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }
}

async function handleDeleteItem(id, title) {
  if (!confirm(`确认要删除 “${title}” 吗？此操作无法撤销。`)) return;
  const { error } = await deleteItemFromDB(id);
  if (error) alert("删除失败: " + error.message);
  else loadArchiveData();
}

function copyPrompt(btn, ciphertext) {
  if (!masterPassword) {
    alert("内容已加密，请先输入密码解锁后才能复制！");
    promptPassword();
    return;
  }
  const decrypted = decryptData(ciphertext, masterPassword);
  if (!decrypted) return alert("解密失败，主密码错误！");

  navigator.clipboard.writeText(decrypted).then(() => {
    const originalText = btn.innerText;
    btn.innerText = "COPIED! ✓";
    btn.style.color = "#15803d";
    setTimeout(() => { btn.innerText = originalText; btn.style.color = ""; }, 1500);
  });
}

function editItem(id) {
  const item = allItems.find(i => i.id === id);
  if (!item) return;
  if (!masterPassword) {
    alert("解密编辑需要输入密码！");
    promptPassword();
    if (!masterPassword) return;
  }
  const decrypted = decryptData(item.content, masterPassword);
  if (!decrypted) return alert("无法解密，请确保主密码输入正确！");

  document.getElementById('editId').value = item.id;
  document.getElementById('singleTitle').value = item.title;
  document.getElementById('singleCategory').value = item.category;
  document.getElementById('singleContent').value = decrypted;
  document.getElementById('singleRemarks').value = item.remarks || "";
  document.getElementById('singleTags').value = item.tags || "";

  if (item.image_base64) {
    existingImageBase64 = item.image_base64;
    document.getElementById('existingImagePreview').src = item.image_base64;
    document.getElementById('existingImageContainer').classList.remove('hidden');
  } else {
    existingImageBase64 = "";
    document.getElementById('existingImageContainer').classList.add('hidden');
  }

  document.getElementById('drawerTitle').innerText = "Edit Archive";
  document.getElementById('singleSubmitBtn').innerText = "Update Archive / 更新";
  document.getElementById('drawerTabs').classList.add('hidden');
  document.getElementById('tabSingleBtn').click();
  openDrawer();
}
