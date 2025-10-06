// --- CONFIGURATION ---
const CONFIG = {
  LANG_PAIR: 'en|vi',
  LANG_CODES: {
    EN: 'en-US',
    VI: 'vi-VN'
  },
  API_URLS: {
    TRANSLATE: 'https://api.mymemory.translated.net/get',
    DICTIONARY: 'https://api.dictionaryapi.dev/api/v2/entries/en/'
  }
};

// --- DOM ELEMENTS ---
const inputText = document.getElementById('inputText');
const translateBtn = document.getElementById('translateBtn');
const translationOutput = document.getElementById('translationOutput');

// --- EVENTS ---
translateBtn.addEventListener('click', handleTranslation);
inputText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleTranslation();
  }
});

// --- CORE LOGIC ---
async function handleTranslation() {
  const text = inputText.value.trim();
  if (!text) {
    translationOutput.innerHTML = '<span class="text-red-400">Vui lòng nhập văn bản.</span>';
    return;
  }

  setLoadingState(true);
  const [translation, ipa] = await Promise.all([
    fetchTranslation(text),
    fetchIPA(text)
  ]);
  renderOutput(translation, ipa, text);
  setLoadingState(false);
}

// --- RENDERING ---
function renderOutput(translation, ipaData, originalText) {
  translationOutput.innerHTML = '';
  const originalSection = createOriginalTextElement(ipaData, originalText);
  const separator = createSeparator();
  const translationSection = createTranslationElement(translation);
  translationOutput.append(originalSection, separator, translationSection);
}

function createOriginalTextElement(ipaData, originalText) {
  const section = document.createElement('div');
  section.className = 'flex items-start justify-between gap-3';
  const container = document.createElement('div');
  container.className = 'flex flex-wrap gap-x-4 gap-y-2';

  if (Array.isArray(ipaData)) {
    ipaData.forEach(item => {
      const wordContainer = document.createElement('div');
      wordContainer.className = 'text-center mb-2';
      const wordSpan = document.createElement('span');
      wordSpan.className = 'block text-base sm:text-lg text-white';
      wordSpan.textContent = item.word;
      const ipaSpan = document.createElement('span');
      ipaSpan.className = 'block text-sm text-indigo-300 font-mono';
      ipaSpan.textContent = item.ipa || ' ';
      wordContainer.append(wordSpan, ipaSpan);
      container.appendChild(wordContainer);
    });
  }

  const speakerButton = createSpeakerButton(originalText, CONFIG.LANG_CODES.EN);
  section.append(container, speakerButton);
  return section;
}

function createTranslationElement(translation) {
  const section = document.createElement('div');
  section.className = 'flex items-center justify-between gap-3';
  const textElement = document.createElement('p');
  textElement.className = 'text-base sm:text-lg flex-grow';
  textElement.textContent = translation;
  const speakerButton = createSpeakerButton(translation, CONFIG.LANG_CODES.VI);
  section.append(textElement, speakerButton);
  return section;
}

function createSeparator() {
  const hr = document.createElement('hr');
  hr.className = 'my-4 border-gray-600';
  return hr;
}

function createSpeakerButton(text, lang) {
  const btn = document.createElement('button');
  btn.className = 'p-1 text-gray-400 hover:text-indigo-300 transition-colors flex-shrink-0';
  btn.innerHTML = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>`;
  btn.onclick = () => speakText(text, lang);
  return btn;
}

// --- UTILITIES ---
function setLoadingState(isLoading) {
  translateBtn.disabled = isLoading;
  if (isLoading) {
    translateBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg> Đang dịch...`;
    translationOutput.innerHTML = '<span class="text-gray-400">Đang tải kết quả...</span>';
  } else {
    translateBtn.innerHTML = `
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
      </svg> Dịch ⚡️`;
  }
}

function speakText(text, lang) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 1.0;
    window.speechSynthesis.speak(utter);
  } else {
    console.error('Trình duyệt không hỗ trợ phát âm (Web Speech API).');
  }
}

async function fetchTranslation(text) {
  try {
    const url = `${CONFIG.API_URLS.TRANSLATE}?q=${encodeURIComponent(text)}&langpair=${CONFIG.LANG_PAIR}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.responseStatus === 200
      ? data.responseData.translatedText
      : `Lỗi dịch: ${data.responseDetails}`;
  } catch {
    return 'Không thể kết nối đến máy chủ dịch.';
  }
}

async function fetchIPA(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const ipaPromises = words.map(async (word) => {
    const cleaned = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    if (!cleaned) return { word, ipa: null };

    const getPhonetic = async (w) => {
      try {
        const res = await fetch(`${CONFIG.API_URLS.DICTIONARY}${w}`);
        if (!res.ok) return null;
        const data = await res.json();
        const phonetic = data[0]?.phonetics?.find(p => p.text);
        return phonetic?.text || null;
      } catch {
        return null;
      }
    };

    let ipa = await getPhonetic(cleaned);
    if (!ipa && cleaned.toLowerCase().endsWith('s')) ipa = await getPhonetic(cleaned.slice(0, -1));
    if (!ipa && cleaned.includes("'")) ipa = await getPhonetic(cleaned.split("'")[0]);
    return { word, ipa };
  });

  return Promise.all(ipaPromises);
}
