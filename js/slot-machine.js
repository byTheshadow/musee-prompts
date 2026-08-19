// 随机主题抽卡 / 老虎机 (支持批量导入词库与分池抽取)
let defaultTopics = {
  "风格 (Style)": ["Cyberpunk", "Retro Anime", "Impressionism", "Gothic Fantasy", "Ukiyo-e", "Watercolor", "Minimalist Oil Painting"],
  "主体 (Subject)": ["Cyber Samurai", "Witch in Forest", "Astronaut Cat", "Mechanical Dragon", "Ethereal Goddess", "Street Musician"],
  "光影氛围 (Lighting & Atmosphere)": ["Neon Illumination", "Dappled Sunlight", "Tyndall Light Rays", "Moody Cinematic Shadows", "Golden Hour Sunset"]
};

function getTopicPools() {
  const stored = localStorage.getItem('musee_slot_topics');
  return stored ? JSON.parse(stored) : defaultTopics;
}

function saveTopicPools(pools) {
  localStorage.setItem('musee_slot_topics', JSON.stringify(pools));
}

function spinSlotMachine() {
  const pools = getTopicPools();
  const keys = Object.keys(pools);
  if (keys.length === 0) return alert("词库为空，请先在下方导入或添加词库！");

  const results = [];
  const reelsContainer = document.getElementById('slotReelsContainer');
  reelsContainer.innerHTML = '';

  keys.forEach(category => {
    const arr = pools[category];
    if (!arr || arr.length === 0) return;
    const randomWord = arr[Math.floor(Math.random() * arr.length)];
    results.push(`${category}: ${randomWord}`);

    const reel = document.createElement('div');
    reel.className = "bg-white/70 border border-stone-300 rounded p-4 text-center slot-spinning transition";
    reel.innerText = "🎲 抽集中...";
    reelsContainer.appendChild(reel);
  });

  setTimeout(() => {
    reelsContainer.innerHTML = '';
    results.forEach(res => {
      const reel = document.createElement('div');
      reel.className = "bg-white border border-stone-900 rounded p-4 text-center font-serif text-sm text-stone-900 font-semibold shadow-sm";
      reel.innerText = res;
      reelsContainer.appendChild(reel);
    });
  }, 400);
}

function handleBatchImportTopics() {
  const raw = document.getElementById('topicBatchInput').value.trim();
  if (!raw) return alert("请输入批量导入的内容！");

  const pools = getTopicPools();
  const lines = raw.split('\n');

  lines.forEach(line => {
    if (!line.trim()) return;
    const parts = line.split('|');
    const cate = parts[0]?.trim();
    const words = parts[1]?.split(',').map(w => w.trim()).filter(Boolean);

    if (cate && words && words.length > 0) {
      if (!pools[cate]) pools[cate] = [];
      pools[cate] = [...new Set([...pools[cate], ...words])];
    }
  });

  saveTopicPools(pools);
  alert("词库导入成功！");
  document.getElementById('topicBatchInput').value = '';
  renderTopicManager();
}

function renderTopicManager() {
  const container = document.getElementById('topicManagerContainer');
  if (!container) return;
  const pools = getTopicPools();
  container.innerHTML = '';

  Object.keys(pools).forEach(cate => {
    const box = document.createElement('div');
    box.className = "bg-white/50 p-3 rounded border border-stone-200 text-xs";
    box.innerHTML = `
      <div class="flex justify-between items-center font-semibold text-stone-800 mb-2 border-b border-stone-200 pb-1">
        <span>${cate} (${pools[cate].length})</span>
        <button onclick="deleteTopicCategory('${cate}')" class="text-red-500 text-[10px]">删除分类</button>
      </div>
      <div class="flex flex-wrap gap-1">
        ${pools[cate].map(w => `<span class="bg-stone-200 px-1.5 py-0.5 rounded text-[10px]">${w}</span>`).join('')}
      </div>
    `;
    container.appendChild(box);
  });
}

function deleteTopicCategory(cate) {
  const pools = getTopicPools();
  delete pools[cate];
  saveTopicPools(pools);
  renderTopicManager();
}
