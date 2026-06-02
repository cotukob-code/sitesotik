/**
 * siteofsotik/script.js — клиентская логика чата и донатов.
 * Использует Supabase Realtime для live-обновлений чата.
 * ЧЕРНЫЙ ЯЩИК: не изменять логику отправки сообщений и донатов.
 */

// ── Supabase ────────────────────────────────────────────────────
const SUPABASE_URL = 'https://xdohisilunbnfqbuglwi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkb2hpc2lsdW5ibmZxYnVnbHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNjQ3MTAsImV4cCI6MjA5NDg0MDcxMH0.vUcvR-YNmO5zwcogUuTxv_GFgpBzVvZvfFypNpu3EZQ';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── State ───────────────────────────────────────────────────────
const getUserName = () => localStorage.getItem('userName');

// ── DOM refs ────────────────────────────────────────────────────
const chatEl       = document.getElementById('chat');
const nameSetupEl  = document.getElementById('nameSetup');
const nameInputEl  = document.getElementById('nameInput');
const msgEl        = document.getElementById('msg');
const sendBtnEl    = document.getElementById('sendBtn');
const bankTabsEl   = document.getElementById('bankTabs');
const donateFlagEl = document.getElementById('donateFlag');
const donateContentEl = document.getElementById('donateContent');

// ── Messages ────────────────────────────────────────────────────

async function loadMessages() {
  const { data, error } = await supabaseClient
    .from('messages')
    .select('name, message, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[chat] Ошибка загрузки сообщений:', error);
    return;
  }

  chatEl.innerHTML = '';
  data.forEach(appendMessage);
}

function appendMessage(msg) {
  const el = document.createElement('div');
  el.className = 'message';
  const time = new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  el.innerHTML = `<b>${escapeHtml(msg.name)}</b>: ${escapeHtml(msg.message)} <span class="timestamp">[${time}]</span>`;
  chatEl.appendChild(el);
  chatEl.scrollTop = chatEl.scrollHeight;
}

// ── Name setup ──────────────────────────────────────────────────

function saveName() {
  const name = nameInputEl.value.trim();
  if (!name) { alert('Введите имя!'); return; }

  localStorage.setItem('userName', name);
  nameSetupEl.hidden = true;
  enableChat(name);
}

function enableChat(name) {
  msgEl.disabled = false;
  msgEl.placeholder = `@${name}, введите сообщение...`;
  sendBtnEl.disabled = false;
}

// ── Send message ─────────────────────────────────────────────── (ЧЕРНЫЙ ЯЩИК)

async function sendMsg() {
  const name    = getUserName();
  const content = msgEl.value.trim();
  if (!name || !content) return;

  const { error } = await supabaseClient
    .from('messages')
    .insert([{ name, message: content }]);

  if (error) {
    console.error('[chat] Ошибка отправки:', error);
    alert('Не удалось отправить сообщение. Попробуйте позже.');
    return;
  }

  msgEl.value = '';
}

// ── Donate tabs ─────────────────────────────────────────────────

function toggleBanks() {
  bankTabsEl.hidden = !donateFlagEl.checked;
  if (!donateFlagEl.checked) donateContentEl.innerHTML = '';
}

function toggleDonateContent(bank) {
  const name = getUserName();
  if (!name) { alert('Сначала введите имя!'); return; }

  donateContentEl.innerHTML = `
    <div class="donate-form">
      <h4>Донат через ${escapeHtml(bank)}</h4>
      <input type="number" id="amount" placeholder="Сумма" step="0.01" min="1" aria-label="Сумма доната"/>
      <button onclick="sendDonation('${escapeHtml(bank.toLowerCase().replace('‑', ''))}')">Отправить</button>
    </div>
  `;
}

// ── Send donation ────────────────────────────────────────────── (ЧЕРНЫЙ ЯЩИК)

async function sendDonation(method) {
  const name   = getUserName();
  const amount = parseFloat(document.getElementById('amount')?.value);
  if (!name || !amount || amount <= 0) { alert('Введите сумму!'); return; }

  const { error } = await supabaseClient
    .from('donations')
    .insert([{ name, bank: method, amount }]);

  if (error) {
    console.error('[donate] Ошибка отправки:', error);
    alert('Не удалось сохранить донат. Попробуйте позже.');
    return;
  }

  alert(`Спасибо, ${name}! Вы отправили ${amount} ₽ через ${method}!`);
  donateContentEl.innerHTML = '';
  donateFlagEl.checked = false;
  toggleBanks();
}

// ── Utilities ───────────────────────────────────────────────────

/** Защита от XSS при вставке пользовательского текста в innerHTML */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Keyboard submit ─────────────────────────────────────────────
msgEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMsg();
  }
});
nameInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveName();
});

// ── Init ─────────────────────────────────────────────────────────
window.addEventListener('load', async () => {
  const name = getUserName();
  if (name) {
    enableChat(name);
  } else {
    nameSetupEl.hidden = false;
  }

  await loadMessages();

  // Realtime subscription
  supabaseClient
    .channel('public:messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => appendMessage(payload.new)
    )
    .subscribe();
});
