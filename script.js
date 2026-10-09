// ==========================================
// 1. تعريف المتغيرات وربط العناصر
// ==========================================
// الإعدادات والاسم
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const settingsNameInput = document.getElementById('settings-name-input');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const agentNameEl = document.getElementById('agent-name');

// الميسينج مينتس (Input) والشيفت
const missingInputEl = document.getElementById('missing-val-input');
const goAvailableBtn = document.getElementById('go-available-btn');
const shiftStartSelect = document.getElementById('shift-start');

// العداد والتحكم
const timerDisplay = document.getElementById('shift-timer-display');
const countdownEl = document.getElementById('main-countdown');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

// الإيميل وزراير الـ AUX
const generateEmailBtn = document.getElementById('generate-email-btn');
const emailBox = document.getElementById('email-box');
const emailText = document.getElementById('email-text');
const copyBtn = document.querySelector('.copy-btn');
const delayReasonSelect = document.getElementById('delay-reason');
const allAuxBtns = document.querySelectorAll('.aux-btn, .bubble-btn');

// ==========================================
// 2. دوال مساعدة لتحويل الوقت (MM:SS) 
// ==========================================
// تحويل الثواني لشكل 00:00
function formatMMSS(totalSeconds) {
    let m = Math.floor(totalSeconds / 60);
    let s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// تحويل الكلام اللي إنت بتكتبه لثواني عشان السيستم يفهمه
function parseMMSS(str) {
    if (!str.includes(':')) {
        let val = parseInt(str) || 0;
        return val * 60; // لو كتبت رقم بس، هيعتبره دقايق ويحط ثواني صفر
    }
    let parts = str.split(':');
    let m = parseInt(parts[0]) || 0;
    let s = parseInt(parts[1]) || 0;
    return (m * 60) + s;
}

// ==========================================
// 3. الذاكرة (Local Storage)
// ==========================================
// بنخزن التوتال بالثواني عشان الدقة
let totalMissingSeconds = parseInt(localStorage.getItem('lyftTotalMissingSecs')) || 0;
let savedName = localStorage.getItem('lyftAgentName') || "Ahmed";

// تحديث الشاشة أول ما تفتح
agentNameEl.textContent = savedName;
missingInputEl.value = formatMMSS(totalMissingSeconds);

// التعديل اليدوي في خانة الميسينج (لما تكتب وتدوس برا أو إنتر)
missingInputEl.addEventListener('change', function() {
    totalMissingSeconds = parseMMSS(this.value);
    this.value = formatMMSS(totalMissingSeconds); // تظبيط الشكل بعد ما تكتب
    localStorage.setItem('lyftTotalMissingSecs', totalMissingSeconds);
});

// ==========================================
// 4. نافذة الإعدادات (Modal)
// ==========================================
// فتح النافذة
settingsBtn.addEventListener('click', () => {
    settingsNameInput.value = savedName; // بيحط اسمك القديم عشان تعدل عليه
    settingsModal.classList.remove('hidden');
});

// قفل النافذة من الـ (X)
closeModalBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

// حفظ الاسم
saveSettingsBtn.addEventListener('click', () => {
    let newName = settingsNameInput.value.trim();
    if (newName !== "") {
        savedName = newName;
        agentNameEl.textContent = savedName;
        localStorage.setItem('lyftAgentName', savedName);
    }
    settingsModal.classList.add('hidden');
});

// ==========================================
// 5. قلب السيستم: زرار GO AVAILABLE (بالثانية)
// ==========================================
let isAvailable = false;
let todayDelaySeconds = 0; // تأخير النهارده بس
let actualLoginTimeStr = "";

let timerInterval;
let totalShiftSeconds = 9 * 60 * 60; // 9 ساعات
let isPaused = false;

goAvailableBtn.addEventListener('click', () => {
    if (isAvailable) return;
    isAvailable = true;

    const now = new Date();
    
    // حساب وقتك دلوقتي بالثواني
    let currentTotalSecs = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    
    // حساب وقت الشيفت بالثواني
    const shiftStartVal = shiftStartSelect.value;
    const [startH, startM] = shiftStartVal.split(':').map(Number);
    let startTotalSecs = (startH * 3600) + (startM * 60);

    // حماية لو شيفت بالليل ودخلت بعد نص الليل
    if (currentTotalSecs < startTotalSecs && (startTotalSecs - currentTotalSecs) > 43200) {
        currentTotalSecs += 86400; // بنزود 24 ساعة بالثواني
    }

    // لو متأخر
    if (currentTotalSecs > startTotalSecs) {
        todayDelaySeconds = currentTotalSecs - startTotalSecs;
        totalMissingSeconds += todayDelaySeconds;
        
        // تحديث الشاشة والذاكرة
        missingInputEl.value = formatMMSS(totalMissingSeconds);
        localStorage.setItem('lyftTotalMissingSecs', totalMissingSeconds);
    } else {
        todayDelaySeconds = 0; 
    }

    actualLoginTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    goAvailableBtn.classList.add('hidden');
    timerDisplay.classList.remove('hidden');

    totalShiftSeconds = 9 * 60 * 60;
    isPaused = false;
    startTimer();
});

// ==========================================
// 6. العداد التنازلي والتحكم
// ==========================================
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isPaused) {
            if (totalShiftSeconds <= 0) {
                clearInterval(timerInterval);
                countdownEl.textContent = "00:00:00";
                return;
            }
            totalShiftSeconds--;
            
            let h = Math.floor(totalShiftSeconds / 3600);
            let m = Math.floor((totalShiftSeconds % 3600) / 60);
            let s = totalShiftSeconds % 60;

            h = h < 10 ? '0' + h : h;
            m = m < 10 ? '0' + m : m;
            s = s < 10 ? '0' + s : s;

            countdownEl.textContent = `${h}:${m}:${s}`;
        }
    }, 1000);
}

pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    if (isPaused) {
        pauseBtn.textContent = '▶ Resume';
        pauseBtn.classList.add('paused');
    } else {
        pauseBtn.textContent = '⏸ Pause';
        pauseBtn.classList.remove('paused');
    }
});

resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    isAvailable = false;
    isPaused = false;
    todayDelaySeconds = 0;
    countdownEl.textContent = "09:00:00";
    
    pauseBtn.textContent = '⏸ Pause';
    pauseBtn.classList.remove('paused');

    timerDisplay.classList.add('hidden');
    goAvailableBtn.classList.remove('hidden');
    emailBox.classList.add('hidden');

    allAuxBtns.forEach(btn => btn.classList.remove('used'));
});

// ==========================================
// 7. زراير الـ AUX
// ==========================================
allAuxBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('used');
    });
});

// ==========================================
// 8. مولد الإيميل الرسمي
// ==========================================
generateEmailBtn.addEventListener('click', () => {
    if (!isAvailable) {
        alert("⚠️ Please click 'GO AVAILABLE' first so we can track your time!");
        return;
    }

    const reason = delayReasonSelect.options[delayReasonSelect.selectedIndex].text;
    const todayDate = new Date().toLocaleDateString('en-US');
    const delayFormatted = formatMMSS(todayDelaySeconds); // صيغة MM:SS للإيميل

    const emailTemplate = `Subject: Login Delay Notification - ${savedName} - ${todayDate}

Hi Manager,

Please be informed that I experienced an unavoidable delay logging into the system today due to ${reason}.

Here are my login details:
- Actual Available Time: ${actualLoginTimeStr}
- Total Missing: ${delayFormatted}

This delay was completely unintentional and out of my control. I am sending this email to officially document the situation so it can be waived.

Thank you for your understanding and support.

Best regards,
${savedName}`;

    emailText.value = emailTemplate;
    emailBox.classList.remove('hidden');
});

// ==========================================
// 9. زرار النسخ 
// ==========================================
copyBtn.addEventListener('click', () => {
    emailText.select();
    document.execCommand('copy');
    
    copyBtn.textContent = 'Copied! ✔';
    setTimeout(() => {
        copyBtn.textContent = 'Copy to Clipboard';
    }, 2000);
});