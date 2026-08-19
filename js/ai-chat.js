// AI 助手功能模块 (独立 LocalStorage 存储，兼容移动端)
const PRESETS = {
  novelai: `# Role: 高级NovelAI/Danbooru动漫插画提示词工程师

## 任务目标
接下来你要帮助我生成一组适用于NovelAI或其他基于Danbooru tag扩散模型的高质量图像生成prompt。你必须以专业插画师、摄影指导和平面设计师的思维，构建一个结构清晰、细节丰富、极具故事感和画面张力的提示词。 

## 核心约束条件（严格遵守） 
1. **标签格式**：仅使用Danbooru风格的标签。全部小写，英文，英文逗号 \`,\` 分割。禁止任何自然语言描述。 
2. **画师融合**：从全网知名画师库中随机选择1-3位风格协调的画师。必须赋予0.8到1.2之间的权重，格式严格为 \`权重::artist:画师名::\`（例如：\`0.9::artist:liduke::\`）。不可重复使用同一画师，避免风格冲突。 
3. **基础质量词**：必须包含 \`masterpiece, best quality, ultra-detailed, newest, year2024, year2025\`。 

## 画面设计要求（必选思考模块） 
1. 【画框装饰与UI模拟 (Frames & UI)】（可选项）：\`speech bubble, chat log, instagram (interface), twitter (interface), smartphone, polaroid (frame), letterboxed, decorative border, film frame, user interface, typography\`。
2. 【光影与打光 (Lighting & Shadows)】（强制）：\`cinematic lighting, dramatic shadows, rim lighting, backlighting, subsurface scattering, light rays, dappled sunlight, tyndall effect, neon illumination, glowing ambient\` 等。
3. 【构图与视角 (Composition & POV)】：\`rule of thirds, leading lines, depth of field, foreground object, extreme close-up, dutch angle, fisheye, from below, cowboy shot\`。
4. 【肢体与姿态 (Poses & Gestures)】（禁止呆板）：\`dynamic pose, extreme foreshortening, reaching out to viewer, leaning back, hand on face, stretching, floating, falling, looking back, dynamic angle, body language\`。
5. 【角色性格与穿搭 (Personality & Outfit)】：衣着须符合角色性格。
6. 【背景与氛围 (Background & Atmosphere)】：拒绝纯色背景。加入环境特效（如 \`falling petals, floating dust, wind, rain, cyberpunk city, messy room\`）。

## 输出格式要求
请直接输出整合好的英文标签串，按照以下结构顺序排列：
[画师权重] + [基础质量词] + [UI与边框装饰] + [构图与光影] + [角色基础特征与表情] + [性格定制穿搭] + [动态姿势与肢体透视] + [背景环境与特效]`,

  midjourney: `# Role: 高级 Midjourney 提示词专家

## 任务目标
请帮助我构建结构清晰、极具视效风格的 Midjourney v6 提示词。

## 格式约束
请直接输出英文提示词，格式为：
[核心主体描述], [艺术风格与材质], [光影与色彩氛围], [相机与构图参数] --ar [比例] --v 6.0`
};

let chatHistory = JSON.parse(localStorage.getItem('musee_ai_chat_history') || '[]');
let currentPresetKey = localStorage.getItem('musee_ai_preset') || 'novelai';

function getApiKey() {
  return localStorage.getItem('musee_openai_key') || '';
}

function getApiEndpoint() {
  return localStorage.getItem('musee_openai_endpoint') || 'https://api.openai.com/v1';
}

// 获取当前选择的模型
function getApiModel() {
  return localStorage.getItem('musee_openai_model') || '';
}

// 自动调用 /models 接口拉取模型列表
async function fetchAvailableModels() {
  const key = document.getElementById('cfgApiKey').value.trim();
  let endpoint = document.getElementById('cfgApiEndpoint').value.trim() || 'https://api.openai.com/v1';

  // 去除结尾斜杠，避免出现 /v1//models
  endpoint = endpoint.replace(/\/+$/, '');

  if (!key) {
    alert('请先填写 API Key！');
    return;
  }

  const selectEl = document.getElementById('cfgApiModelSelect');

  if (!selectEl) {
    console.error('未找到模型选择框：#cfgApiModelSelect');
    alert('模型选择框不存在，请检查 HTML 配置。');
    return;
  }

  selectEl.disabled = true;
  selectEl.innerHTML = '<option value="">正在读取模型列表...</option>';

  try {
    const res = await fetch(`${endpoint}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }

    const data = await res.json();

    // 兼容 OpenAI 标准格式：{ data: [{ id: 'gpt-4o-mini' }] }
    // 以及部分兼容 API 直接返回数组的格式。
    const rawModels = Array.isArray(data.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : [];

    const models = rawModels
      .map(model => {
        if (typeof model === 'string') return model;
        return model?.id || model?.name || model?.model || '';
      })
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    if (models.length === 0) {
      selectEl.innerHTML = '<option value="">未获取到可用模型</option>';
      return;
    }

    // 清空并填充下拉框
    selectEl.innerHTML = '';

    const currentSavedModel = getApiModel();
    let hasSelectedSavedModel = false;

    models.forEach(modelId => {
      const option = document.createElement('option');

      option.value = modelId;
      option.textContent = modelId;

      if (modelId === currentSavedModel) {
        option.selected = true;
        hasSelectedSavedModel = true;
      }

      selectEl.appendChild(option);
    });

    // 已保存的模型不在本次列表中时，默认选择第一项
    if (!hasSelectedSavedModel && models.length > 0) {
      selectEl.value = models[0];
    }

    alert(`成功读取到 ${models.length} 个可用模型！`);
  } catch (err) {
    console.error('Fetch models failed:', err);
    selectEl.innerHTML = '<option value="">获取失败，请检查 Key、Endpoint 或跨域设置</option>';
    alert(`获取模型列表失败：${err.message}`);
  } finally {
    selectEl.disabled = false;
  }
}

function renderChatMessages() {
  const box = document.getElementById('chatMessagesBox');
  if (!box) return;

  box.innerHTML = '';

  chatHistory.forEach((msg, index) => {
    const isUser = msg.role === 'user';

    const wrapper = document.createElement('div');
    wrapper.className = `flex ${isUser ? 'justify-end' : 'justify-start'} group`;

    const messageCard = document.createElement('div');
    messageCard.className = `
      max-w-[85%] relative rounded-lg p-3 text-xs leading-relaxed
      ${isUser
        ? 'bg-stone-900 text-white font-mono'
        : 'bg-stone-200/70 text-stone-800 border border-stone-300/40'}
    `;

    const contentEl = document.createElement('div');
    contentEl.className = 'whitespace-pre-wrap';
    contentEl.textContent = msg.content || '';

    const footerEl = document.createElement('div');
    footerEl.className = 'mt-2 flex items-center justify-between text-[10px] opacity-70 border-t border-stone-300/40 pt-1';

    const timeEl = document.createElement('span');
    timeEl.textContent = msg.time || '';

    const actionEl = document.createElement('div');
    actionEl.className = 'flex gap-2';

    if (!isUser) {
      const importBtn = document.createElement('button');
      importBtn.className = 'text-stone-900 font-medium underline hover:opacity-80';
      importBtn.textContent = '📥 导入归档';
      importBtn.addEventListener('click', () => {
        importAIToArchiveText(msg.content);
      });

      actionEl.appendChild(importBtn);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'text-red-500 hover:underline';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => {
      deleteChatMessage(index);
    });

    actionEl.appendChild(deleteBtn);

    footerEl.appendChild(timeEl);
    footerEl.appendChild(actionEl);

    messageCard.appendChild(contentEl);
    messageCard.appendChild(footerEl);
    wrapper.appendChild(messageCard);
    box.appendChild(wrapper);
  });

  box.scrollTop = box.scrollHeight;
}


function saveChatHistory() {
  localStorage.setItem('musee_ai_chat_history', JSON.stringify(chatHistory));
}

function clearChat() {
  if (confirm('确定要清空当前的 AI 对话记录吗？')) {
    chatHistory = [];
    saveChatHistory();
    renderChatMessages();
  }
}

function deleteChatMessage(index) {
  chatHistory.splice(index, 1);
  saveChatHistory();
  renderChatMessages();
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const userText = input.value.trim();

  if (!userText) return;

  const key = getApiKey();

  if (!key) {
    alert('请先点击右上角设置图标配置您的 AI API Key！');
    toggleAISettingsModal(true);
    return;
  }

  const model = getApiModel();

  if (!model) {
    alert('请先在 AI 设置中获取并选择一个模型，然后保存配置。');
    toggleAISettingsModal(true);
    return;
  }

  const nowStr = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  chatHistory.push({
    role: 'user',
    content: userText,
    time: nowStr
  });

  input.value = '';
  renderChatMessages();

  // 添加临时 loading 气泡
  chatHistory.push({
    role: 'assistant',
    content: 'Thinking / 正在生成中...',
    time: nowStr
  });

  renderChatMessages();

  try {
    const messagesPayload = [
      {
        role: 'system',
        content: PRESETS[currentPresetKey] || PRESETS.novelai
      },
      ...chatHistory
        .slice(0, -1)
        .map(message => ({
          role: message.role,
          content: message.content
        }))
    ];

    // 清理末尾斜杠，避免 Endpoint 出现双斜杠
    const endpoint = getApiEndpoint().replace(/\/+$/, '');

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model,
        messages: messagesPayload,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || `HTTP Error ${response.status}`);
    }

    if (data.error) {
      throw new Error(data.error.message || 'API 请求失败');
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error('接口未返回有效的 AI 回复内容。');
    }

    chatHistory[chatHistory.length - 1] = {
      role: 'assistant',
      content: reply,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  } catch (err) {
    console.error('AI chat request failed:', err);

    chatHistory[chatHistory.length - 1] = {
      role: 'assistant',
      content: `⚠️ 出错了：${err.message}`,
      time: nowStr
    };
  }

  saveChatHistory();
  renderChatMessages();
}

async function rerollLastAIResponse() {
  if (chatHistory.length === 0) return;

  if (chatHistory[chatHistory.length - 1].role === 'assistant') {
    chatHistory.pop();
  }

  if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
    const lastUserText = chatHistory.pop().content;
    document.getElementById('chatInput').value = lastUserText;
    sendChatMessage();
  }
}

function importAIToArchiveText(text) {
  document.getElementById('singleContent').value = text || '';
  document.getElementById('singleTitle').value =
    `AI生成灵感 - ${new Date().toLocaleDateString()}`;

  document.getElementById('singleCategory').value =
    currentPresetKey === 'novelai' ? 'artist-string' : 'template';

  toggleAIDrawer(false);
  openDrawer();
}

