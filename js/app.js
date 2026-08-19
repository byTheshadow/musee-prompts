// 整个应用程序入口与事件注册
document.addEventListener('DOMContentLoaded', () => {
  // 初始化解密状态与数据加载
  updateLockUI();
  loadArchiveData();

  // 绑定图片压缩
  const imageInput = document.getElementById('imageInput');
  const compressStatus = document.getElementById('compressStatus');

  if (imageInput) {
    imageInput.addEventListener('change', function (e) {
      const file = e.target.files[0];

      if (!file) return;

      compressStatus.innerText = '正在压缩图片...';

      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = function (event) {
        const img = new Image();

        img.src = event.target.result;

        img.onload = function () {
          const canvas = document.createElement('canvas');
          const maxWidth = 800;

          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          compressedImageBase64 = canvas.toDataURL('image/webp', 0.7);

          const sizeInKb = Math.round(
            (compressedImageBase64.length * 3) / 4 / 1024
          );

          compressStatus.innerText =
            `压缩成功! 大小约: ${sizeInKb} KB (将覆盖原图)`;
        };
      };

      reader.onerror = function () {
        compressStatus.innerText = '图片读取失败，请重新选择图片。';
      };
    });
  }

  // 初始化 AI 预设选择
  const presetSelect = document.getElementById('aiPresetSelect');

  if (presetSelect) {
    presetSelect.value = currentPresetKey;

    presetSelect.addEventListener('change', (e) => {
      currentPresetKey = e.target.value;
      localStorage.setItem('musee_ai_preset', currentPresetKey);
    });
  }

  renderChatMessages();
  renderTopicManager();
});

// UI 面板显隐控制
function toggleAIDrawer(open) {
  const panel = document.getElementById('aiDrawerPanel');

  if (open) {
    panel.classList.remove('translate-x-full');
  } else {
    panel.classList.add('translate-x-full');
  }
}

function toggleSlotModal(open) {
  const modal = document.getElementById('slotModal');

  if (open) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

// 打开或关闭 AI API 配置弹窗
function toggleAISettingsModal(open) {
  const modal = document.getElementById('aiSettingsModal');

  if (open) {
    const savedKey = getApiKey();
    const savedEndpoint = getApiEndpoint();
    const savedModel = getApiModel();

    const keyInput = document.getElementById('cfgApiKey');
    const endpointInput = document.getElementById('cfgApiEndpoint');
    const selectEl = document.getElementById('cfgApiModelSelect');

    keyInput.value = savedKey;
    endpointInput.value = savedEndpoint;

    // 如果已有保存的模型，先显示当前保存模型，
    // 避免用户还未请求模型列表时看不到当前的模型配置。
    selectEl.innerHTML = '';

    if (savedModel) {
      const option = document.createElement('option');

      option.value = savedModel;
      option.textContent = savedModel;
      option.selected = true;

      selectEl.appendChild(option);
    } else {
      selectEl.innerHTML =
        '<option value="">-- 请点击“获取模型列表” --</option>';
    }

    modal.classList.remove('hidden');

    // 已存在 Key 时，打开配置弹窗自动拉取模型列表。
    // fetchAvailableModels() 在 js/ai-chat.js 中定义。
    if (savedKey && selectEl.options.length <= 1) {
      fetchAvailableModels();
    }
  } else {
    modal.classList.add('hidden');
  }
}

// 保存 AI API 配置
function saveAISettings() {
  const key = document.getElementById('cfgApiKey').value.trim();

  const endpoint =
    document.getElementById('cfgApiEndpoint').value.trim() ||
    'https://api.openai.com/v1';

  const modelSelect = document.getElementById('cfgApiModelSelect');
  const selectedModel = modelSelect.value;

  if (!key) {
    alert('请填写 API Key！');
    return;
  }

  if (!selectedModel) {
    alert('请选择一个模型！如果列表为空，请先点击“获取模型列表”。');
    return;
  }

  // 清除末尾 /，避免后续请求 URL 出现双斜杠。
  const normalizedEndpoint = endpoint.replace(/\/+$/, '');

  localStorage.setItem('musee_openai_key', key);
  localStorage.setItem('musee_openai_endpoint', normalizedEndpoint);
  localStorage.setItem('musee_openai_model', selectedModel);

  toggleAISettingsModal(false);

  alert(`AI 配置保存成功！已锁定模型：${selectedModel}`);
}

function openDrawer() {
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerPanel = document.getElementById('drawerPanel');

  drawerOverlay.classList.remove('pointer-events-none', 'opacity-0');
  drawerOverlay.classList.add('opacity-100');

  drawerPanel.classList.remove('drawer-closed');
  drawerPanel.classList.add('drawer-open');
}

function closeDrawer() {
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerPanel = document.getElementById('drawerPanel');

  drawerOverlay.classList.remove('opacity-100');
  drawerOverlay.classList.add('pointer-events-none', 'opacity-0');

  drawerPanel.classList.remove('drawer-open');
  drawerPanel.classList.add('drawer-closed');
}
