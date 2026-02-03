(function () {
  const API_BASE = window.location.origin;
  const SESSION_STORAGE_KEY = 'ransomware-game-username';
  function getStateKey(username) { return 'ransomware-game-state-' + (username || ''); }

  const state = {
    sessionUsername: null,
    started: false,
    phase: 'intro',
    negPhase: 0,
    negStep: 0,
    quizPhase: 0,
    quizIndex: 0,
    chatMessages: [],
    conversationId: null,
    flags: {},
    negotiationScore: 0,
    quiz1Score: 0,
    quiz2Score: 0,
    quiz1Max: 0,
    quiz2Max: 0,
    negotiationMax: 0,
    walletBalance: 0,
    ransomPayments: [],
    negotiationStartTime: null,
    btcPriceUsd: null,
    totalBtcPurchased: 0,
    bmailEmails: [],
    filesDecrypted: false,
    decryptorAgreed: false,
    bankBalance: 7500000,
    savingsBalance: 500000,
    bankTransactions: [],
    torHistoryStack: [],
    torHistoryList: [],
    torHistoryIndex: -1,
    torCurrentPage: 'start',
    ransomBtcAmount: 2.5,
    ransomDeadlineStartRealTime: null,
    ransomDeadlineGameHours: 72,
    proofOfStolenDataEmailSent: false,
    proofOfDecryptionEmailSent: false,
    fileExplorerSelectedFolder: 'desktop',
    fileExplorerItems: { documents: [], pictures: [], music: [], videos: [] },
    fileExplorerClipboard: null,
    ransomTrackerShownOnFirstReadme: false,
    calendarEvents: [],
    calendarViewYear: null,
    calendarViewMonth: null,
    calendarSelectedDate: null,
  };

  var REAL_MS_PER_GAME_HOUR = (30 * 60 * 1000) / 72;

  window.__startRansomwareGame = function () {
    if (!state.started) startGame();
  };

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Generate random session values for ransom note (new each page load). */
  function generateSessionRansomValues() {
    const base32 = 'abcdefghijklmnopqrstuvwxyz234567';
    const bech32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    const hex = '0123456789abcdef';
    function pick(n, from) {
      let s = '';
      for (let i = 0; i < n; i++) s += from[Math.floor(Math.random() * from.length)];
      return s;
    }
    state.ransomOnionAddress = pick(56, base32) + '.onion';
    state.ransomBtcAddress = 'bc1q' + pick(59, bech32);
    state.personalId = 'MRH-' + pick(8, hex) + '-' + pick(4, hex);
  }

  function updateRansomNoteContent() {
    var personalEl = document.getElementById('readme-personal-id');
    var btcEl = document.getElementById('readme-btc-address');
    var onionLink = document.getElementById('readme-onion-link');
    if (personalEl && state.personalId) personalEl.textContent = state.personalId;
    if (btcEl && state.ransomBtcAddress) btcEl.textContent = state.ransomBtcAddress;
    if (onionLink && state.ransomOnionAddress) {
      var url = 'http://' + state.ransomOnionAddress;
      onionLink.setAttribute('href', url);
      onionLink.textContent = url;
    }
  }

  function getStateToSave() {
    return {
      sessionUsername: state.sessionUsername,
      started: state.started,
      phase: state.phase,
      negPhase: state.negPhase,
      negStep: state.negStep,
      quizPhase: state.quizPhase,
      quizIndex: state.quizIndex,
      chatMessages: state.chatMessages,
      conversationId: state.conversationId,
      flags: state.flags,
      negotiationScore: state.negotiationScore,
      quiz1Score: state.quiz1Score,
      quiz2Score: state.quiz2Score,
      quiz1Max: state.quiz1Max,
      quiz2Max: state.quiz2Max,
      negotiationMax: state.negotiationMax,
      walletBalance: state.walletBalance,
      ransomPayments: state.ransomPayments,
      negotiationStartTime: state.negotiationStartTime,
      totalBtcPurchased: state.totalBtcPurchased,
      bmailEmails: state.bmailEmails,
      filesDecrypted: state.filesDecrypted,
      decryptorAgreed: state.decryptorAgreed,
      bankBalance: state.bankBalance,
      savingsBalance: state.savingsBalance,
      bankTransactions: state.bankTransactions,
      torHistoryStack: state.torHistoryStack,
      torHistoryList: state.torHistoryList,
      torHistoryIndex: state.torHistoryIndex,
      torCurrentPage: state.torCurrentPage,
      ransomBtcAmount: state.ransomBtcAmount,
      ransomDeadlineStartRealTime: state.ransomDeadlineStartRealTime,
      ransomDeadlineGameHours: state.ransomDeadlineGameHours,
      proofOfStolenDataEmailSent: state.proofOfStolenDataEmailSent,
      proofOfDecryptionEmailSent: state.proofOfDecryptionEmailSent,
      personalId: state.personalId,
      ransomBtcAddress: state.ransomBtcAddress,
      ransomOnionAddress: state.ransomOnionAddress,
      initialRansomBtc: state.initialRansomBtc,
      initialDeadlineHours: state.initialDeadlineHours,
      outcomeScore: state.outcomeScore,
      assessmentScore: state.assessmentScore,
      quizQuestions: state.quizQuestions,
      torChatStarted: state.torChatStarted,
      fileExplorerSelectedFolder: state.fileExplorerSelectedFolder,
      fileExplorerItems: state.fileExplorerItems,
      calendarEvents: state.calendarEvents,
      calendarViewYear: state.calendarViewYear,
      calendarViewMonth: state.calendarViewMonth,
    };
  }

  function loadStateFromSaved(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.sessionUsername != null) state.sessionUsername = obj.sessionUsername;
    if (obj.started != null) state.started = obj.started;
    if (obj.phase != null) state.phase = obj.phase;
    if (obj.negPhase != null) state.negPhase = obj.negPhase;
    if (obj.negStep != null) state.negStep = obj.negStep;
    if (obj.quizPhase != null) state.quizPhase = obj.quizPhase;
    if (obj.quizIndex != null) state.quizIndex = obj.quizIndex;
    if (Array.isArray(obj.chatMessages)) state.chatMessages = obj.chatMessages;
    if (obj.conversationId != null) state.conversationId = obj.conversationId;
    if (obj.flags && typeof obj.flags === 'object') state.flags = obj.flags;
    if (typeof obj.negotiationScore === 'number') state.negotiationScore = obj.negotiationScore;
    if (typeof obj.quiz1Score === 'number') state.quiz1Score = obj.quiz1Score;
    if (typeof obj.quiz2Score === 'number') state.quiz2Score = obj.quiz2Score;
    if (typeof obj.quiz1Max === 'number') state.quiz1Max = obj.quiz1Max;
    if (typeof obj.quiz2Max === 'number') state.quiz2Max = obj.quiz2Max;
    if (typeof obj.negotiationMax === 'number') state.negotiationMax = obj.negotiationMax;
    if (typeof obj.walletBalance === 'number') state.walletBalance = obj.walletBalance;
    if (Array.isArray(obj.ransomPayments)) state.ransomPayments = obj.ransomPayments;
    if (obj.negotiationStartTime != null) state.negotiationStartTime = obj.negotiationStartTime;
    if (typeof obj.totalBtcPurchased === 'number') state.totalBtcPurchased = obj.totalBtcPurchased;
    if (Array.isArray(obj.bmailEmails)) state.bmailEmails = obj.bmailEmails;
    if (obj.filesDecrypted != null) state.filesDecrypted = !!obj.filesDecrypted;
    if (obj.decryptorAgreed != null) state.decryptorAgreed = !!obj.decryptorAgreed;
    if (typeof obj.bankBalance === 'number') state.bankBalance = obj.bankBalance;
    if (typeof obj.savingsBalance === 'number') state.savingsBalance = obj.savingsBalance;
    if (Array.isArray(obj.bankTransactions)) state.bankTransactions = obj.bankTransactions;
    if (Array.isArray(obj.torHistoryStack)) state.torHistoryStack = obj.torHistoryStack;
    if (Array.isArray(obj.torHistoryList)) state.torHistoryList = obj.torHistoryList;
    if (typeof obj.torHistoryIndex === 'number') state.torHistoryIndex = obj.torHistoryIndex;
    if (obj.torCurrentPage != null) state.torCurrentPage = obj.torCurrentPage;
    if (Array.isArray(obj.torHistoryStack) && obj.torHistoryStack.length > 0 && (!Array.isArray(obj.torHistoryList) || obj.torHistoryList.length === 0)) {
      state.torHistoryList = obj.torHistoryStack.slice();
      state.torHistoryList.push(obj.torCurrentPage || 'start');
      state.torHistoryIndex = state.torHistoryList.length - 1;
    }
    if (typeof obj.ransomBtcAmount === 'number') state.ransomBtcAmount = obj.ransomBtcAmount;
    // Ransom timer and "first open" tracker are not restored — each session gets a fresh 72h countdown and tracker opens on first README open
    state.ransomDeadlineStartRealTime = null;
    state.ransomDeadlineGameHours = 72;
    state.ransomTrackerShownOnFirstReadme = false;
    if (obj.proofOfStolenDataEmailSent != null) state.proofOfStolenDataEmailSent = !!obj.proofOfStolenDataEmailSent;
    if (obj.proofOfDecryptionEmailSent != null) state.proofOfDecryptionEmailSent = !!obj.proofOfDecryptionEmailSent;
    if (obj.personalId != null) state.personalId = obj.personalId;
    if (obj.ransomBtcAddress != null) state.ransomBtcAddress = obj.ransomBtcAddress;
    if (obj.ransomOnionAddress != null) state.ransomOnionAddress = obj.ransomOnionAddress;
    if (obj.initialRansomBtc != null) state.initialRansomBtc = obj.initialRansomBtc;
    if (obj.initialDeadlineHours != null) state.initialDeadlineHours = obj.initialDeadlineHours;
    if (obj.outcomeScore != null) state.outcomeScore = obj.outcomeScore;
    if (obj.assessmentScore != null) state.assessmentScore = obj.assessmentScore;
    if (Array.isArray(obj.quizQuestions)) state.quizQuestions = obj.quizQuestions;
    if (obj.torChatStarted != null) state.torChatStarted = !!obj.torChatStarted;
    if (obj.fileExplorerSelectedFolder != null) state.fileExplorerSelectedFolder = obj.fileExplorerSelectedFolder;
    if (obj.fileExplorerItems && typeof obj.fileExplorerItems === 'object') state.fileExplorerItems = obj.fileExplorerItems;
    if (Array.isArray(obj.calendarEvents)) state.calendarEvents = obj.calendarEvents;
    if (obj.calendarViewYear != null) state.calendarViewYear = obj.calendarViewYear;
    if (obj.calendarViewMonth != null) state.calendarViewMonth = obj.calendarViewMonth;
  }

  function saveState() {
    try {
      if (state.sessionUsername) {
        localStorage.setItem(getStateKey(state.sessionUsername), JSON.stringify(getStateToSave()));
      }
    } catch (e) {}
  }

  function applyRestoredStateUI() {
    updateRansomNoteContent();
    if (typeof updateStartMenuUsername === 'function') updateStartMenuUsername();
    renderDesktopFakeFiles();
    updateWalletBalanceDisplay();
    updateBankBalanceDisplay();
    if (state.bmailEmails && state.bmailEmails.length) renderBmailInbox();
    var desktopContent = document.querySelector('.desktop-content');
    if (desktopContent && state.started) desktopContent.classList.add('game-started');
    var walletIcon = $('#wallet-icon');
    if (walletIcon && state.started) walletIcon.removeAttribute('hidden');
    var startMenu = document.getElementById('start-menu');
    if (startMenu) { startMenu.hidden = true; startMenu.setAttribute('aria-hidden', 'true'); }
    var gw = $('#game-window');
    if (gw) gw.setAttribute('hidden', 'true');
    var readmeWindow = $('#readme-window');
    if (readmeWindow) { readmeWindow.setAttribute('hidden', 'true'); readmeWindow.classList.remove('readme-window-open'); }
    var walletWindow = $('#wallet-window');
    if (walletWindow) { walletWindow.setAttribute('hidden', 'true'); walletWindow.classList.remove('wallet-window-open'); }
    var bankWindow = $('#bank-window');
    if (bankWindow) { bankWindow.setAttribute('hidden', 'true'); bankWindow.classList.remove('bank-window-open'); }
    var bmailWindow = $('#bmail-window');
    if (bmailWindow) { bmailWindow.setAttribute('hidden', 'true'); bmailWindow.classList.remove('bmail-window-open'); }
    var torWindow = $('#tor-window');
    if (torWindow) { torWindow.setAttribute('hidden', 'true'); torWindow.classList.remove('tor-window-open'); }
    var fileViewerWindow = $('#file-viewer-window');
    if (fileViewerWindow) { fileViewerWindow.setAttribute('hidden', 'true'); fileViewerWindow.classList.remove('file-viewer-open'); }
    var ransomTrackerWindow = $('#ransom-tracker-window');
    if (ransomTrackerWindow) ransomTrackerWindow.setAttribute('hidden', 'true');
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /** Remove fake .xyz extension when file is decrypted (desktop and proof-of-compromise). */
  function stripFakeExtension(name) {
    return (name || '').replace(/\.xyz$/i, '');
  }

  function showSectionLabel(text) {
    const el = $('#section-label');
    if (el) el.textContent = text;
  }

  function updateWalletBalanceDisplay() {
    const el = $('#wallet-balance');
    if (el) el.textContent = (state.walletBalance || 0).toFixed(8) + ' BTC';
  }

  function updateBankBalanceDisplay() {
    var fmt = function (n) { return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var el = $('#bank-balance');
    if (el) el.textContent = fmt(state.bankBalance);
    var savingsEl = $('#bank-savings-balance');
    if (savingsEl) savingsEl.textContent = fmt(state.savingsBalance);
  }

  function addBankTransaction(entry) {
    state.bankTransactions = state.bankTransactions || [];
    state.bankTransactions.push({ ...entry, date: new Date().toISOString() });
  }

  function addBmailEmail(subject, body, from, isDecryptorEmail, attachment) {
    var email = {
      id: 'bmail-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      subject: subject,
      body: body,
      from: from || 'Bitmonster - BTC Wallet <noreply@bitmonster.bmail>',
      date: new Date().toLocaleString(),
      unread: true,
      isDecryptorEmail: !!isDecryptorEmail,
    };
    if (attachment && typeof attachment === 'object') {
      email.attachment = attachment;
    }
    state.bmailEmails = state.bmailEmails || [];
    state.bmailEmails.unshift(email);
    renderBmailInbox();
  }

  function showBmailAttachmentInView(email) {
    var wrap = $('#bmail-view-attachment');
    if (!wrap || !email || !email.attachment) {
      if (wrap) wrap.setAttribute('hidden', 'true');
      return;
    }
    var att = email.attachment;
    wrap.innerHTML = '';
    wrap.removeAttribute('hidden');
    var displayName = att.showDecrypted ? stripFakeExtension(att.name) : (att.name || 'file');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bmail-attachment-icon' + (att.showDecrypted ? '' : ' encrypted');
    btn.setAttribute('aria-label', 'Open ' + displayName);
    btn.innerHTML =
      '<span class="bmail-attachment-icon-symbol">\uD83D\uDCCA</span>' +
      '<span class="bmail-attachment-icon-label">' + escapeHtml(displayName) + '</span>';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openAttachmentViewer(att);
    });
    wrap.appendChild(btn);
  }

  function renderBmailInbox() {
    var list = $('#bmail-list');
    var view = $('#bmail-view');
    if (!list) return;
    var emails = state.bmailEmails || [];
    if (emails.length === 0) {
      list.innerHTML = '<p class="bmail-empty" id="bmail-empty">No messages yet. Make some friends!</p>';
      if (view) view.setAttribute('hidden', 'true');
      return;
    }
    list.innerHTML = '';
    emails.forEach(function (email) {
      var row = document.createElement('div');
      row.className = 'bmail-email-row' + (email.unread ? ' unread' : '');
      row.setAttribute('data-email-id', email.id);
      row.innerHTML =
        '<span class="bmail-email-from">' + escapeHtml(email.from) + '</span>' +
        '<span class="bmail-email-subject">' + escapeHtml(email.subject) + '</span>' +
        '<span class="bmail-email-date">' + escapeHtml(email.date) + '</span>';
      row.addEventListener('click', function () {
        email.unread = false;
        renderBmailInbox();
        var subj = $('#bmail-view-subject');
        var meta = $('#bmail-view-meta');
        var body = $('#bmail-view-body');
        var decryptorWrap = $('#bmail-view-decryptor-wrap');
        if (view) view.removeAttribute('hidden');
        if (subj) subj.textContent = email.subject;
        if (meta) meta.textContent = email.from + ' · ' + email.date;
        if (body) body.textContent = email.body;
        if (decryptorWrap) {
          if (email.isDecryptorEmail) {
            decryptorWrap.removeAttribute('hidden');
          } else {
            decryptorWrap.setAttribute('hidden', 'true');
          }
        }
        showBmailAttachmentInView(email);
      });
      list.appendChild(row);
    });
  }

  function showBmailNewMessagePopup() {
    var popup = document.getElementById('bmail-new-message-popup');
    if (!popup) return;
    popup.removeAttribute('hidden');
    clearTimeout(state.bmailPopupTimeout);
    state.bmailPopupTimeout = setTimeout(function () {
      popup.setAttribute('hidden', 'true');
    }, 4000);
  }

  function renderDesktopFakeFiles() {
    var container = $('#desktop-fake-files');
    if (!container || typeof FAKE_DESKTOP_FILES === 'undefined') return;
    container.innerHTML = '';
    var decrypted = !!state.filesDecrypted;
    FAKE_DESKTOP_FILES.forEach(function (file) {
      var displayName = decrypted ? stripFakeExtension(file.name) : file.name;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'desktop-file-icon' + (decrypted ? '' : ' encrypted');
      btn.setAttribute('data-file-id', file.id);
      btn.setAttribute('aria-label', 'Open ' + displayName);
      btn.innerHTML =
        '<span class="desktop-file-icon-symbol">' + escapeHtml(file.icon) + '</span>' +
        '<span class="desktop-file-icon-label">' + escapeHtml(displayName) + '</span>';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openFileViewer(file.id);
      });
      container.appendChild(btn);
    });
  }

  function openFileViewer(fileId) {
    if (typeof FAKE_DESKTOP_FILES === 'undefined') return;
    var file = FAKE_DESKTOP_FILES.find(function (f) { return f.id === fileId; });
    if (!file) return;
    var win = $('#file-viewer-window');
    var titleEl = $('#file-viewer-title');
    var iconEl = $('#file-viewer-icon');
    var contentEl = $('#file-viewer-content');
    if (!win || !contentEl) return;
    var decrypted = !!state.filesDecrypted;
    if (titleEl) titleEl.textContent = decrypted ? stripFakeExtension(file.name) : file.name;
    if (iconEl) iconEl.textContent = file.icon;
    contentEl.classList.toggle('encrypted', !decrypted);
    if (file.type === 'image' && decrypted && file.decryptedImageUrl) {
      contentEl.innerHTML = '<img src="' + escapeHtml(file.decryptedImageUrl) + '" alt="Staff photo" class="file-viewer-image">';
    } else {
      contentEl.textContent = decrypted ? file.decryptedContent : file.encryptedContent;
    }
    win.removeAttribute('hidden');
    requestAnimationFrame(function () {
      win.classList.add('file-viewer-open');
    });
  }

  /** Open file viewer with Bmail attachment content (encrypted or decrypted). */
  function openAttachmentViewer(attachment) {
    if (!attachment) return;
    var win = $('#file-viewer-window');
    var titleEl = $('#file-viewer-title');
    var iconEl = $('#file-viewer-icon');
    var contentEl = $('#file-viewer-content');
    if (!win || !contentEl) return;
    var isDecrypted = !!attachment.showDecrypted;
    var content = isDecrypted ? (attachment.decryptedContent || '') : (attachment.encryptedContent || '');
    var attachmentDisplayName = isDecrypted ? stripFakeExtension(attachment.name) : (attachment.name || 'Attachment');
    if (titleEl) titleEl.textContent = attachmentDisplayName || 'Attachment';
    if (iconEl) iconEl.textContent = '\uD83D\uDCCA';
    contentEl.classList.toggle('encrypted', !isDecrypted);
    contentEl.innerHTML = '';
    contentEl.textContent = content;
    win.removeAttribute('hidden');
    requestAnimationFrame(function () {
      win.classList.add('file-viewer-open');
    });
  }

  function runDecryptor() {
    state.filesDecrypted = true;
    renderDesktopFakeFiles();
    var feWin = document.getElementById('file-explorer-window');
    if (feWin && !feWin.hidden) setFileExplorerFolder(state.fileExplorerSelectedFolder);
    var decryptorWrap = $('#bmail-view-decryptor-wrap');
    if (decryptorWrap) decryptorWrap.setAttribute('hidden', 'true');
    saveState();
  }

  var FAKE_APP_WINDOW_IDS = [
    'file-explorer-window', 'edge-window', 'calendar-window', 'calculator-window',
    'documents-window', 'pictures-window', 'music-window', 'videos-window'
  ];

  var DESKTOP_SHORTCUTS = [
    { id: 'shortcut-readme', name: 'README.txt', icon: '📄', type: 'shortcut', shortcutAction: 'readme' },
    { id: 'shortcut-wallet', name: 'Bitmonster - BTC Wallet', icon: '😈', type: 'shortcut', shortcutAction: 'wallet' },
    { id: 'shortcut-tor', name: 'Tor Browser', icon: '🧅', type: 'shortcut', shortcutAction: 'tor' },
    { id: 'shortcut-bank', name: 'BNC Banking', icon: '🏦', type: 'shortcut', shortcutAction: 'bank' },
    { id: 'shortcut-bmail', name: 'Bmail', icon: 'B', type: 'shortcut', shortcutAction: 'bmail' }
  ];

  function getFileExplorerDesktopItems() {
    var decrypted = !!state.filesDecrypted;
    var list = DESKTOP_SHORTCUTS.slice();
    if (typeof FAKE_DESKTOP_FILES !== 'undefined') {
      FAKE_DESKTOP_FILES.forEach(function (f) {
        list.push({
          id: 'file-' + f.id,
          name: decrypted ? stripFakeExtension(f.name) : f.name,
          icon: f.icon,
          type: 'file',
          fileId: f.id
        });
      });
    }
    return list;
  }

  function getFileExplorerItemsForFolder(folderId) {
    if (folderId === 'desktop') return getFileExplorerDesktopItems();
    var stored = state.fileExplorerItems[folderId];
    return Array.isArray(stored) ? stored.slice() : [];
  }

  function setFileExplorerFolder(folderId) {
    state.fileExplorerSelectedFolder = folderId;
    var sidebar = document.querySelector('.file-explorer-window .file-explorer-sidebar');
    if (sidebar) {
      sidebar.querySelectorAll('.file-explorer-folder').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-folder') === folderId);
      });
    }
    renderFileExplorerMain();
  }

  window.setFileExplorerFolder = setFileExplorerFolder;

  function triggerShortcutAction(action) {
    if (action === 'readme') {
      var w = $('#readme-window');
      if (w) {
        w.removeAttribute('hidden');
        requestAnimationFrame(function () {
          w.classList.add('readme-window-open');
          if (typeof onReadmeOpened === 'function') onReadmeOpened();
        });
      }
    } else if (action === 'wallet') {
      var w = document.getElementById('wallet-window');
      if (w) {
        closeAllAppWindows();
        w.removeAttribute('hidden');
        requestAnimationFrame(function () {
          w.classList.add('wallet-window-open');
          if (typeof updateWalletBalanceDisplay === 'function') updateWalletBalanceDisplay();
          if (typeof updateBuyPreview === 'function') updateBuyPreview();
          if (typeof startWalletPriceRefresh === 'function') startWalletPriceRefresh();
          if (typeof loadBtcPriceChart === 'function') loadBtcPriceChart(state.walletChartRange || '6h');
        });
      }
    } else if (action === 'bank') {
      var w = document.getElementById('bank-window');
      if (w) { closeAllAppWindows(); w.removeAttribute('hidden'); requestAnimationFrame(function () { w.classList.add('bank-window-open'); }); }
    } else if (action === 'bmail') {
      openBmailWindow();
    } else if (action === 'tor') {
      var w = document.getElementById('tor-window');
      if (w) { closeAllAppWindows(); w.removeAttribute('hidden'); requestAnimationFrame(function () { w.classList.add('tor-window-open'); }); }
    }
  }

  function removeItemFromFolder(folderId, itemId) {
    if (folderId === 'desktop') return;
    var arr = state.fileExplorerItems[folderId];
    if (!Array.isArray(arr)) return;
    var idx = arr.findIndex(function (x) { return x.id === itemId; });
    if (idx !== -1) arr.splice(idx, 1);
  }

  function addItemToFolder(folderId, item) {
    if (folderId === 'desktop') return;
    var arr = state.fileExplorerItems[folderId];
    if (!Array.isArray(arr)) state.fileExplorerItems[folderId] = arr = [];
    var copy = { id: item.id, name: item.name, icon: item.icon, type: item.type };
    if (item.shortcutAction) copy.shortcutAction = item.shortcutAction;
    if (item.fileId) copy.fileId = item.fileId;
    var baseId = copy.id.replace(/-copy-\d+$/, '');
    var max = 0;
    arr.forEach(function (x) {
      var m = x.id.match(/-copy-(\d+)$/);
      if (m && x.id.replace(/-copy-\d+$/, '') === baseId) max = Math.max(max, parseInt(m[1], 10));
    });
    if (arr.some(function (x) { return x.id === copy.id; })) {
      copy.id = baseId + '-copy-' + (max + 1);
      copy.name = copy.name.replace(/\s*\(copy(?:\s+\d+)?\)$/, '') + ' (copy)';
    }
    arr.push(copy);
  }

  function renderFileExplorerMain() {
    var main = document.getElementById('file-explorer-main');
    if (!main) return;
    var folderId = state.fileExplorerSelectedFolder;
    var items = getFileExplorerItemsForFolder(folderId);
    main.innerHTML = '';
    main.setAttribute('data-folder', folderId);
    items.forEach(function (item) {
      var div = document.createElement('div');
      var isFileEncrypted = item.type === 'file' && !state.filesDecrypted;
      div.className = 'file-explorer-item' + (isFileEncrypted ? ' encrypted' : '');
      div.setAttribute('data-item-id', item.id);
      div.setAttribute('draggable', 'true');
      div.innerHTML = '<span class="file-explorer-item-icon">' + escapeHtml(item.icon) + '</span><span class="file-explorer-item-label">' + escapeHtml(item.name) + '</span>';
      div.addEventListener('dblclick', function () {
        if (item.type === 'shortcut' && item.shortcutAction) triggerShortcutAction(item.shortcutAction);
        else if (item.type === 'file' && item.fileId) openFileViewer(item.fileId);
      });
      div.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        e.stopPropagation();
        state.fileExplorerContextItem = item;
        state.fileExplorerContextFolder = folderId;
        showFileExplorerContextMenu(e.clientX, e.clientY);
      });
      div.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', JSON.stringify({ itemId: item.id, folderId: folderId }));
        e.dataTransfer.effectAllowed = 'move';
        div.classList.add('file-explorer-item-dragging');
      });
      div.addEventListener('dragend', function () { div.classList.remove('file-explorer-item-dragging'); });
      main.appendChild(div);
    });
  }

  function showFileExplorerContextMenu(x, y) {
    var menu = document.getElementById('file-explorer-context-menu');
    if (!menu) return;
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.removeAttribute('hidden');
    menu.querySelector('[data-action="copy"]').disabled = !state.fileExplorerContextItem;
    menu.querySelector('[data-action="paste"]').disabled = !state.fileExplorerClipboard || state.fileExplorerSelectedFolder === 'desktop';
  }

  function handleFileExplorerDrop(e, toFolder) {
    e.preventDefault();
    var main = document.getElementById('file-explorer-main');
    if (main) main.classList.remove('file-explorer-drop-target');
    document.querySelectorAll('.file-explorer-folder').forEach(function (f) { f.classList.remove('file-explorer-drop-target'); });
    var raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    try {
      var payload = JSON.parse(raw);
      var fromFolder = payload.folderId;
      var itemId = payload.itemId;
      if (!toFolder || fromFolder === toFolder) return;
      var fromItems = getFileExplorerItemsForFolder(fromFolder);
      var item = fromItems.find(function (x) { return x.id === itemId; });
      if (!item) return;
      removeItemFromFolder(fromFolder, itemId);
      addItemToFolder(toFolder, item);
      setFileExplorerFolder(toFolder);
      saveState();
    } catch (err) {}
  }

  function toDateKey(d) {
    var y = d.getFullYear();
    var m = (d.getMonth() + 1);
    var day = d.getDate();
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function ensureCalendarView() {
    var now = new Date();
    if (state.calendarViewYear == null) state.calendarViewYear = now.getFullYear();
    if (state.calendarViewMonth == null) state.calendarViewMonth = now.getMonth();
  }

  function renderCalendar() {
    ensureCalendarView();
    if (!state.calendarEvents) state.calendarEvents = [];
    var grid = document.getElementById('calendar-grid');
    var monthLabel = document.getElementById('calendar-month-year');
    if (!grid || !monthLabel) return;
    var y = state.calendarViewYear;
    var m = state.calendarViewMonth;
    var first = new Date(y, m, 1);
    var last = new Date(y, m + 1, 0);
    var startDay = first.getDay();
    var daysInMonth = last.getDate();
    var prevMonth = new Date(y, m, 0);
    var prevDays = prevMonth.getDate();
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthLabel.textContent = monthNames[m] + ' ' + y;
    grid.innerHTML = '';
    var todayKey = toDateKey(new Date());
    var i, cell, dayNum, dateKey, isCurrentMonth, eventsOnDay, cls;
    for (i = 0; i < startDay; i++) {
      dayNum = prevDays - startDay + 1 + i;
      cell = document.createElement('div');
      cell.className = 'calendar-day calendar-day-other';
      cell.textContent = dayNum;
      cell.setAttribute('data-date', toDateKey(new Date(y, m - 1, dayNum)));
      cell.setAttribute('data-current-month', 'false');
      cell.addEventListener('click', function () {
        var d = this.getAttribute('data-date');
        state.calendarSelectedDate = d;
        var dateInput = document.getElementById('calendar-event-date');
        if (dateInput) dateInput.value = d;
        renderCalendar();
        renderCalendarEventsList();
      });
      grid.appendChild(cell);
    }
    for (i = 1; i <= daysInMonth; i++) {
      dateKey = y + '-' + (m + 1 < 10 ? '0' : '') + (m + 1) + '-' + (i < 10 ? '0' : '') + i;
      eventsOnDay = (state.calendarEvents || []).filter(function (ev) { return ev.date === dateKey; }).length;
      cls = 'calendar-day calendar-day-current';
      if (dateKey === todayKey) cls += ' calendar-day-today';
      if (state.calendarSelectedDate === dateKey) cls += ' calendar-day-selected';
      cell = document.createElement('div');
      cell.className = cls;
      cell.textContent = i;
      cell.setAttribute('data-date', dateKey);
      cell.setAttribute('data-current-month', 'true');
      if (eventsOnDay > 0) {
        var dot = document.createElement('span');
        dot.className = 'calendar-day-dots';
        dot.textContent = eventsOnDay > 3 ? '3+' : String(eventsOnDay);
        dot.setAttribute('aria-label', eventsOnDay + ' event(s)');
        cell.appendChild(dot);
      }
      cell.addEventListener('click', function () {
        var d = this.getAttribute('data-date');
        state.calendarSelectedDate = d;
        var dateInput = document.getElementById('calendar-event-date');
        if (dateInput) dateInput.value = d;
        renderCalendar();
        renderCalendarEventsList();
      });
      grid.appendChild(cell);
    }
    var totalCells = startDay + daysInMonth;
    var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (i = 1; i <= remaining; i++) {
      cell = document.createElement('div');
      cell.className = 'calendar-day calendar-day-other';
      cell.textContent = i;
      cell.setAttribute('data-date', toDateKey(new Date(y, m + 1, i)));
      cell.setAttribute('data-current-month', 'false');
      cell.addEventListener('click', function () {
        var d = this.getAttribute('data-date');
        state.calendarSelectedDate = d;
        var dateInput = document.getElementById('calendar-event-date');
        if (dateInput) dateInput.value = d;
        renderCalendar();
        renderCalendarEventsList();
      });
      grid.appendChild(cell);
    }
  }

  function renderCalendarEventsList() {
    var list = document.getElementById('calendar-events-list');
    var titleEl = document.getElementById('calendar-events-title');
    if (!list) return;
    var date = state.calendarSelectedDate;
    if (!date) {
      list.innerHTML = '<li class="calendar-events-empty">Click a date to view events.</li>';
      if (titleEl) titleEl.textContent = 'Events';
      return;
    }
    var events = (state.calendarEvents || []).filter(function (ev) { return ev.date === date; });
    if (titleEl) titleEl.textContent = 'Events on ' + date;
    list.innerHTML = '';
    if (events.length === 0) {
      list.innerHTML = '<li class="calendar-events-empty">No events.</li>';
      return;
    }
    events.forEach(function (ev) {
      var li = document.createElement('li');
      li.className = 'calendar-event-item';
      li.innerHTML = '<span class="calendar-event-title">' + escapeHtml(ev.title) + '</span><button type="button" class="calendar-event-delete" data-event-id="' + escapeHtml(ev.id) + '" aria-label="Delete">×</button>';
      li.querySelector('.calendar-event-delete').addEventListener('click', function () {
        deleteCalendarEvent(ev.id);
      });
      list.appendChild(li);
    });
  }

  function addCalendarEvent() {
    var dateInput = document.getElementById('calendar-event-date');
    var titleInput = document.getElementById('calendar-event-title');
    if (!dateInput || !titleInput) return;
    var date = dateInput.value;
    var title = (titleInput.value || '').trim();
    if (!date || !title) return;
    if (!state.calendarEvents) state.calendarEvents = [];
    var id = 'cal-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    state.calendarEvents.push({ id: id, date: date, title: title });
    titleInput.value = '';
    saveState();
    renderCalendar();
    renderCalendarEventsList();
  }

  function deleteCalendarEvent(eventId) {
    if (!state.calendarEvents) return;
    state.calendarEvents = state.calendarEvents.filter(function (ev) { return ev.id !== eventId; });
    saveState();
    renderCalendar();
    renderCalendarEventsList();
  }

  function openFakeAppWindow(windowId) {
    var win = document.getElementById(windowId);
    if (!win) return;
    closeAllAppWindows();
    win.removeAttribute('hidden');
    requestAnimationFrame(function () {
      win.classList.add('fake-app-window-open');
      if (windowId === 'file-explorer-window') setFileExplorerFolder(state.fileExplorerSelectedFolder);
      if (windowId === 'calendar-window') {
        ensureCalendarView();
        var dateInput = document.getElementById('calendar-event-date');
        if (dateInput && !dateInput.value) dateInput.value = toDateKey(new Date());
        renderCalendar();
        renderCalendarEventsList();
      }
    });
  }

  function closeFakeAppWindow(windowId) {
    var win = document.getElementById(windowId);
    if (!win) return;
    win.classList.remove('fake-app-window-open');
    win.setAttribute('hidden', 'true');
  }

  /** Close BNC Banking, Bitmonster - BTC Wallet, Bmail, Tor Browser, and all fake app windows. README is not affected. */
  function closeAllAppWindows() {
    var wallet = document.getElementById('wallet-window');
    var bank = document.getElementById('bank-window');
    var bmail = document.getElementById('bmail-window');
    var tor = document.getElementById('tor-window');
    if (wallet && !wallet.hidden) {
      wallet.classList.remove('wallet-window-open');
      wallet.setAttribute('hidden', 'true');
    }
    if (bank && !bank.hidden) {
      bank.classList.remove('bank-window-open');
      bank.setAttribute('hidden', 'true');
    }
    if (bmail && !bmail.hidden) {
      bmail.classList.remove('bmail-window-open');
      bmail.setAttribute('hidden', 'true');
    }
    if (tor && !tor.hidden) {
      tor.classList.remove('tor-window-open');
      tor.setAttribute('hidden', 'true');
    }
    FAKE_APP_WINDOW_IDS.forEach(function (id) {
      closeFakeAppWindow(id);
    });
  }

  function openBmailAndShowLatestEmail() {
    closeAllAppWindows();
    var bmailWindow = document.getElementById('bmail-window');
    if (!bmailWindow) return;
    bmailWindow.removeAttribute('hidden');
    requestAnimationFrame(function () {
      bmailWindow.classList.add('bmail-window-open');
    });
    var bmailView = $('#bmail-view');
    if (bmailView) bmailView.setAttribute('hidden', 'true');
    renderBmailInbox();
    var emails = state.bmailEmails || [];
    if (emails.length > 0) {
      var latest = emails[0];
      latest.unread = false;
      renderBmailInbox();
      var subj = $('#bmail-view-subject');
      var meta = $('#bmail-view-meta');
      var body = $('#bmail-view-body');
      var decryptorWrap = $('#bmail-view-decryptor-wrap');
      if (bmailView) bmailView.removeAttribute('hidden');
      if (subj) subj.textContent = latest.subject;
      if (meta) meta.textContent = latest.from + ' · ' + latest.date;
      if (body) body.textContent = latest.body;
      if (decryptorWrap) {
        if (latest.isDecryptorEmail) decryptorWrap.removeAttribute('hidden');
        else decryptorWrap.setAttribute('hidden', 'true');
      }
      showBmailAttachmentInView(latest);
    }
  }

  function appendChatMessage(role, text) {
    state.chatMessages.push({
      role,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    const container = $('#chat-panel-messages');
    if (!container) return;
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg-' + role;
    msg.innerHTML =
      '<span class="chat-sender">' +
      escapeHtml(role === 'operator' ? 'Blackout_Op' : 'You') +
      '</span><span class="chat-time">' +
      escapeHtml(state.chatMessages[state.chatMessages.length - 1].time) +
      '</span><div class="chat-text">' +
      escapeHtml(text) +
      '</div>';
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  function appendChatMessageInTor(role, text) {
    state.chatMessages.push({
      role,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    var container = document.getElementById('tor-chat-messages');
    if (!container) return;
    var msg = document.createElement('div');
    msg.className = 'ransom-site-chat-msg ransom-site-chat-msg-' + role;
    msg.innerHTML =
      '<span class="ransom-site-chat-sender">' +
      escapeHtml(role === 'operator' ? 'Blackout_Op' : 'You') +
      '</span><span class="ransom-site-chat-time">' +
      escapeHtml(state.chatMessages[state.chatMessages.length - 1].time) +
      '</span><div class="ransom-site-chat-text">' +
      escapeHtml(text) +
      '</div>';
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  function updateRansomTrackerDisplay() {
    var btcEl = document.getElementById('ransom-tracker-btc');
    var deadlineEl = document.getElementById('ransom-tracker-deadline');
    if (btcEl) btcEl.textContent = (state.ransomBtcAmount != null ? Number(state.ransomBtcAmount).toFixed(2) : '2.50') + ' BTC';
    if (deadlineEl && state.ransomDeadlineStartRealTime != null && state.ransomDeadlineGameHours != null) {
      var realElapsedMs = Date.now() - state.ransomDeadlineStartRealTime;
      var gameHoursElapsed = realElapsedMs / REAL_MS_PER_GAME_HOUR;
      var gameHoursRemaining = Math.max(0, state.ransomDeadlineGameHours - gameHoursElapsed);
      var h = Math.floor(gameHoursRemaining);
      var m = Math.floor((gameHoursRemaining - h) * 60);
      deadlineEl.textContent = h + 'h ' + (m < 10 ? '0' : '') + m + 'm';
    } else if (deadlineEl) {
      deadlineEl.textContent = '72h 00m';
    }
  }

  function updateStartMenuUsername() {
    var el = document.getElementById('start-menu-username-text');
    if (el) el.textContent = state.sessionUsername || '';
    var row = document.getElementById('start-menu-username');
    if (row) row.style.display = state.sessionUsername ? '' : 'none';
  }

  function openRansomTracker() {
    var trackerWin = document.getElementById('ransom-tracker-window');
    if (!trackerWin) return;
    trackerWin.removeAttribute('hidden');
    requestAnimationFrame(function () {
      trackerWin.classList.add('ransom-tracker-open');
    });
    updateRansomTrackerDisplay();
    if (state.ransomTrackerTickId == null) {
      state.ransomTrackerTickId = setInterval(updateRansomTrackerDisplay, 1000);
    }
  }

  /** Run when README.txt is opened (desktop icon, File Explorer, or shortcut). On first open this session, always show 2.5 BTC and 72h, then open tracker once. */
  function onReadmeOpened() {
    if (!state.started) startGame();
    if (!state.ransomTrackerShownOnFirstReadme) {
      state.ransomBtcAmount = typeof RANSOM_BTC_AMOUNT === 'number' ? RANSOM_BTC_AMOUNT : 2.5;
      state.ransomDeadlineGameHours = typeof INITIAL_DEADLINE_HOURS === 'number' ? INITIAL_DEADLINE_HOURS : 72;
      state.ransomDeadlineStartRealTime = Date.now();
      openRansomTracker();
      state.ransomTrackerShownOnFirstReadme = true;
    } else if (state.ransomDeadlineStartRealTime == null) {
      state.ransomDeadlineStartRealTime = Date.now();
      if (state.ransomDeadlineGameHours == null) state.ransomDeadlineGameHours = 72;
    }
  }

  function parseOperatorReplyForRansom(reply) {
    if (!reply || typeof reply !== 'string') return;
    var text = reply;
    var btcMatch = text.match(/\b(\d+(?:\.\d+)?)\s*BTC\b/i);
    if (btcMatch) {
      var amt = parseFloat(btcMatch[1], 10);
      if (!isNaN(amt) && amt > 0 && amt <= 100) state.ransomBtcAmount = amt;
    }
    var hoursMatch =
      text.match(/(?:you have|we're giving you|giving you|deadline is|within|in|extend(?:ing)? to|give you)\s*(\d+)\s*hours?/i) ||
      text.match(/(\d+)\s*hours?\s*(?:remaining|left|to pay|until|from now)/i) ||
      text.match(/(\d+)\s*hour\s*deadline/i) ||
      text.match(/(?:deadline|time)\s*(?:of|:)?\s*(\d+)\s*hours?/i) ||
      text.match(/(\d+)\s*hours?\.?\s*(?:no more|final|last chance)/i) ||
      text.match(/(\d+)\s*h\s*(?:remaining|left|to pay|no more|final)/i) ||
      text.match(/(?:pay|send)\s*(?:in|within)\s*(\d+)\s*(?:h|hours?)/i);
    if (hoursMatch) {
      var hrs = parseInt(hoursMatch[1], 10);
      if (!isNaN(hrs) && hrs > 0 && hrs <= 168) {
        if (state.ransomDeadlineStartRealTime == null) state.ransomDeadlineStartRealTime = Date.now();
        state.ransomDeadlineGameHours = hrs;
      }
    }
  }

  /** Apply tracker values from API (OpenAI-extracted ransom/deadline). Overrides regex parsing when present. */
  function applyTrackerFromApi(data) {
    if (!data) return;
    if (typeof data.trackerRansomBtc === 'number' && data.trackerRansomBtc > 0 && data.trackerRansomBtc <= 100) {
      state.ransomBtcAmount = data.trackerRansomBtc;
    }
    if (typeof data.trackerDeadlineHours === 'number' && data.trackerDeadlineHours > 0 && data.trackerDeadlineHours <= 168) {
      state.ransomDeadlineGameHours = data.trackerDeadlineHours;
      if (state.ransomDeadlineStartRealTime == null) state.ransomDeadlineStartRealTime = Date.now();
    }
    updateRansomTrackerDisplay();
  }

  function renderTorChatSuggestions() {
    var phaseNum = state.negPhaseNum;
    var suggestions = (typeof NEGOTIATION_SUGGESTIONS !== 'undefined' && NEGOTIATION_SUGGESTIONS[phaseNum]) ? NEGOTIATION_SUGGESTIONS[phaseNum][state.negStep] : [];
    var content = document.getElementById('tor-suggestions-content');
    var toggle = document.getElementById('tor-suggestions-toggle');
    if (content && suggestions && suggestions.length > 0) {
      content.innerHTML = suggestions.map(function(s) { return '<p>' + escapeHtml(s) + '</p>'; }).join('');
      if (toggle) toggle.style.display = 'block';
    } else {
      if (content) content.innerHTML = '';
      if (toggle) toggle.style.display = 'none';
    }
  }

  /** Negotiation outcome score (max 100): proof of theft (15), proof of decryption (15), lower ransom (35), extra time (35). */
  function computeOutcomeScore() {
    var initialRansom = typeof INITIAL_RANSOM_BTC === 'number' ? INITIAL_RANSOM_BTC : 2.5;
    var initialTime = typeof INITIAL_DEADLINE_HOURS === 'number' ? INITIAL_DEADLINE_HOURS : 72;
    var finalRansom = state.ransomBtcAmount != null ? Number(state.ransomBtcAmount) : initialRansom;
    var finalHours = state.ransomDeadlineGameHours != null ? Number(state.ransomDeadlineGameHours) : initialTime;

    var proofTheft = (state.proofOfStolenDataEmailSent === true) ? 15 : 0;
    var proofDecrypt = (state.proofOfDecryptionEmailSent === true) ? 15 : 0;

    var ransomScore = 0;
    if (finalRansom < initialRansom && initialRansom > 0) {
      var range = initialRansom - 1;
      if (range <= 0) range = 1;
      ransomScore = Math.round(35 * (initialRansom - finalRansom) / range);
      if (ransomScore < 0) ransomScore = 0;
      if (ransomScore > 35) ransomScore = 35;
    } else if (finalRansom <= initialRansom) {
      ransomScore = 0;
    } else {
      ransomScore = 0;
    }

    var timeScore = 0;
    var extraHours = finalHours - initialTime;
    if (extraHours > 0) {
      var maxExtra = 96;
      timeScore = Math.round(35 * Math.min(extraHours, maxExtra) / maxExtra);
      if (timeScore > 35) timeScore = 35;
    }

    var total = proofTheft + proofDecrypt + ransomScore + timeScore;
    return {
      proofTheft: proofTheft,
      proofDecrypt: proofDecrypt,
      ransom: ransomScore,
      time: timeScore,
      total: total
    };
  }

  function setFlagsFromMessage(text) {
    const t = (text || '').toLowerCase();
    if ((t.includes('proof') || t.includes('verify') || t.includes('evidence')) && (t.includes('data') || t.includes('stolen') || t.includes('have'))) state.flags.askedStolenData = true;
    if ((t.includes('proof') || t.includes('decrypt') || t.includes('decryption') || t.includes('decryptor')) && (t.includes('file') || t.includes('work') || t.includes('first'))) state.flags.askedDecryptionProof = true;
    if (t.includes('negotiate') || t.includes('negotiation') || (t.includes('willing') && t.includes('engage'))) state.flags.confirmedNegotiation = true;
    if (t.includes('extension') || t.includes('extend') || t.includes('more time') || t.includes('deadline')) state.flags.askedExtension = true;
    if (t.includes('lower') || t.includes('reduce') || t.includes('less') || t.includes('counter')) state.flags.askedLowerRansom = true;
    if (!t.includes('threat') && !t.includes('fbi') && !t.includes('police') && (t.includes('thank') || t.includes('agree') || t.includes('commit'))) state.flags.professionalTone = true;
  }

  function runNegotiationPhase(phaseSteps, phaseNum, skipFirstMessage) {
    state.negStep = 0;
    state.negPhaseSteps = phaseSteps;
    state.negPhaseNum = phaseNum;
    state.negotiationSendCallback = null;
    showSectionLabel(
      phaseNum === 1
        ? 'Section 1: Initial contact — Confirm stolen data, decryption, and negotiation'
        : phaseNum === 2
          ? 'Section 2: Buying time — Extensions and lowering the ransom'
          : 'Section 3: Final negotiation — Lower ransom and payment'
    );
    function nextStep(skipOperatorMessage) {
      if (state.negStep >= phaseSteps.length) {
        state.negotiationSendCallback = null;
        var ie = document.getElementById('tor-chat-input');
        var sb = document.getElementById('tor-chat-send');
        if (ie) ie.disabled = true;
        if (sb) sb.disabled = true;
        if (phaseNum === 1) runNegotiationPhase(NEGOTIATION_PHASE_2, 2, true);
        else if (phaseNum === 2) runNegotiationPhase(NEGOTIATION_PHASE_3, 3, true);
        else startFinalAssessment();
        return;
      }
      const step = phaseSteps[state.negStep];
      if (!step.options || step.options.length === 0) {
        state.negotiationSendCallback = null;
        var ie = document.getElementById('tor-chat-input');
        var sb = document.getElementById('tor-chat-send');
        if (ie) ie.disabled = true;
        if (sb) sb.disabled = true;
        if (phaseNum === 1) runNegotiationPhase(NEGOTIATION_PHASE_2, 2, true);
        else if (phaseNum === 2) runNegotiationPhase(NEGOTIATION_PHASE_3, 3, true);
        else startFinalAssessment();
        return;
      }
      if (skipFirstMessage && step.operatorMessage) {
        parseOperatorReplyForRansom(step.operatorMessage);
        updateRansomTrackerDisplay();
      }
      if (!skipOperatorMessage && step.operatorMessage) {
        appendChatMessageInTor('operator', step.operatorMessage);
      }
      state.negotiationSendCallback = function () { nextStep(true); };
      renderTorChatSuggestions();
    }
    nextStep(!!skipFirstMessage);
  }

  function sendNegotiationMessage(userText) {
    var phaseNum = state.negPhaseNum;
    var phaseSteps = state.negPhaseSteps;
    var callback = state.negotiationSendCallback;
    if (!phaseNum || !phaseSteps || state.negStep >= phaseSteps.length || !callback) return;
    var inputEl = $('#chat-panel-input');
    var sendBtn = $('#chat-panel-send');
    if (inputEl) inputEl.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    appendChatMessage('user', userText);
    setFlagsFromMessage(userText);
    var messagesContainer = $('#chat-panel-messages');
    var loadingEl = document.createElement('p');
    loadingEl.className = 'chat-loading';
    loadingEl.textContent = 'Blackout_Op is typing…';
    loadingEl.setAttribute('data-loading', '1');
    var typingDelayMs = 300 + Math.random() * 3700;
    var typingTimeout = setTimeout(function () {
      if (loadingEl.parentNode) return;
      if (messagesContainer) {
        messagesContainer.appendChild(loadingEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, typingDelayMs);
    if (!state.negotiationStartTime) state.negotiationStartTime = Date.now();
    var lastPayment = state.ransomPayments.length > 0 ? state.ransomPayments[state.ransomPayments.length - 1] : null;
    var paymentMade = lastPayment != null;
    var lastPaymentAmount = lastPayment ? lastPayment.amount : 0;
    var paymentCorrect = paymentMade && typeof RANSOM_BTC_AMOUNT !== 'undefined' && lastPaymentAmount >= RANSOM_BTC_AMOUNT;
    var step = phaseSteps[state.negStep];
    var initialOperatorMessage = (!state.conversationId && step && step.operatorMessage) ? step.operatorMessage : null;
      fetch(API_BASE + '/api/negotiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phase: phaseNum,
        stepIndex: state.negStep,
        userMessage: userText,
        conversationId: state.conversationId,
        initialOperatorMessage: initialOperatorMessage,
        paymentMade: paymentMade,
        lastPaymentAmount: lastPaymentAmount,
        paymentCorrect: paymentCorrect,
        negotiationStartTime: state.negotiationStartTime,
        proofOfStolenDataEmailSent: !!state.proofOfStolenDataEmailSent,
        proofOfDecryptionEmailSent: !!state.proofOfDecryptionEmailSent,
      }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data.conversationId) {
          state.conversationId = result.data.conversationId;
        }
        var reply;
        if (result.ok && result.data.reply) {
          reply = result.data.reply;
        } else if (result.data && result.data.error) {
          reply = 'Error: ' + result.data.error;
        } else {
          reply = 'No response.';
        }
        appendChatMessage('operator', reply);
        if (result.ok && (result.data.trackerRansomBtc != null || result.data.trackerDeadlineHours != null)) {
          applyTrackerFromApi(result.data);
        } else {
          parseOperatorReplyForRansom(reply);
          updateRansomTrackerDisplay();
        }
        if (!state.decryptorAgreed && result.ok && result.data.decryptorAgreed === true) {
          state.decryptorAgreed = true;
          addBmailEmail(
            'Your decryptor is ready',
            'Payment confirmed. Your decryptor is ready.\n\nClick the link below to download and run the decryption tool. It will restore your encrypted files.\n\n— Blackout_Op',
            'Blackout_Op <noreply@blackout.onion>',
            true
          );
          showBmailNewMessagePopup();
        }
        state.negStep += 1;
        callback();
      })
      .catch(function () {
        appendChatMessage('operator', 'Connection error. Try again.');
        state.negStep += 1;
        callback();
      })
      .finally(function () {
        clearTimeout(typingTimeout);
        if (loadingEl && loadingEl.parentNode) loadingEl.remove();
        if (inputEl) {
          inputEl.disabled = false;
          inputEl.value = '';
        }
        if (sendBtn) sendBtn.disabled = false;
      });
  }

  function startGame() {
    state.started = true;
    state.phase = 'neg1';
    state.chatMessages = [];
    state.conversationId = null;
    state.flags = {};
    state.initialRansomBtc = typeof INITIAL_RANSOM_BTC === 'number' ? INITIAL_RANSOM_BTC : 2.5;
    state.initialDeadlineHours = typeof INITIAL_DEADLINE_HOURS === 'number' ? INITIAL_DEADLINE_HOURS : 72;
    state.outcomeScore = null;
    state.assessmentScore = null;

    /* Leave README window open (user just "opened" it by clicking the icon); close button will hide it. */
    var desktopContent = document.querySelector('.desktop-content');
    if (desktopContent) desktopContent.classList.add('game-started');

    state.walletBalance = 0;
    state.ransomPayments = [];
    state.negotiationStartTime = null;
    state.btcPriceUsd = null;
    state.totalBtcPurchased = 0;
    state.bankBalance = 7500000;
    state.savingsBalance = 500000;
    state.bankTransactions = [];
    state.proofOfStolenDataEmailSent = false;
    state.proofOfDecryptionEmailSent = false;
    updateBankBalanceDisplay();
    var walletIcon = $('#wallet-icon');
    if (walletIcon) walletIcon.removeAttribute('hidden');
    updateWalletBalanceDisplay();

    // Start negotiation phase immediately when chat is accessed via Tor
    runNegotiationPhase(NEGOTIATION_PHASE_1, 1);
    saveState();
  }

  function startFinalAssessment() {
    state.phase = 'assessment';
    state.quizPhase = 'assessment';
    state.quizQuestions = typeof ASSESSMENT_QUESTIONS !== 'undefined' && ASSESSMENT_QUESTIONS.length
      ? ASSESSMENT_QUESTIONS
      : [];
    state.quizIndex = 0;
    state.assessmentScore = 0;
    showSectionLabel('Assessment — Ransomware incident response knowledge');
    if (!state.quizQuestions.length) {
      var outcome = computeOutcomeScore();
      state.outcomeScore = outcome.total;
      state.assessmentScore = 0;
      showResults();
      return;
    }
    showQuizPopup();
    renderQuizQuestion();
  }

  function showQuizPopup() {
    const overlay = $('#quiz-overlay');
    const popup = $('#quiz-popup');
    if (overlay && popup) {
      overlay.hidden = false;
      overlay.removeAttribute('aria-hidden');
      popup.classList.remove('quiz-popup-visible');
      requestAnimationFrame(function () {
        popup.classList.add('quiz-popup-visible');
      });
    }
  }

  function hideQuizPopup() {
    const overlay = $('#quiz-overlay');
    const popup = $('#quiz-popup');
    if (overlay && popup) {
      popup.classList.remove('quiz-popup-visible');
      setTimeout(function () {
        overlay.hidden = true;
        overlay.setAttribute('aria-hidden', 'true');
      }, 300);
    }
  }

  function renderQuizQuestion() {
    const questions = state.quizQuestions;
    const q = questions[state.quizIndex];
    const container = $('#quiz-popup-content');
    if (!container) return;
    if (!q) {
      hideQuizPopup();
      if (state.phase === 'assessment') {
        var outcome = computeOutcomeScore();
        state.outcomeScore = outcome.total;
        showResults();
      }
      return;
    }
    const progress = 'Question ' + (state.quizIndex + 1) + ' of ' + questions.length;
    let body = '';
    if (q.type === 'select') {
      const opts = shuffleArray(q.options);
      body = opts
        .map(function (o) {
          const idx = q.options.indexOf(o);
          return (
            '<label class="quiz-option">' +
            '<input type="radio" name="quiz-' +
            q.id +
            '" value="' +
            idx +
            '" />' +
            '<span>' +
            escapeHtml(o.text) +
            '</span></label>'
          );
        })
        .join('');
    }
    container.innerHTML =
      '<div class="quiz-card">' +
      '<p class="quiz-progress">' +
      progress +
      '</p>' +
      '<h3 class="quiz-title">' +
      escapeHtml(q.title) +
      '</h3>' +
      '<p class="quiz-desc">' +
      escapeHtml(q.description) +
      '</p>' +
      '<div class="quiz-options">' +
      body +
      '</div>' +
      '<button type="button" class="btn btn-primary quiz-next" data-action="quiz-next">Next</button>' +
      '</div>';
    var nextBtn = container.querySelector('[data-action="quiz-next"]');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        checkQuizAndNext(q);
      });
    }
  }

  function checkQuizAndNext(q) {
    const container = $('#quiz-popup-content');
    const selected = container ? container.querySelector('input[name="quiz-' + q.id + '"]:checked') : null;
    if (!selected && q.options && q.options.length > 1) return;
    var score = 0;
    if (q.type === 'select' && q.options && q.options.length) {
      var idx = selected ? parseInt(selected.value, 10) : 0;
      var opt = q.options[idx];
      score = opt ? opt.score : 0;
    }
    if (state.quizPhase === 'assessment') {
      state.assessmentScore = (state.assessmentScore || 0) + score;
    }

    state.quizIndex++;
    if (state.quizIndex >= state.quizQuestions.length) {
      hideQuizPopup();
      if (state.phase === 'assessment') {
        var outcome = computeOutcomeScore();
        state.outcomeScore = outcome.total;
        state.assessmentScore = Math.round((state.assessmentScore || 0) / state.quizQuestions.length);
        if (state.assessmentScore > 100) state.assessmentScore = 100;
        showResults();
      }
      return;
    }
    renderQuizQuestion();
  }

  function showResults() {
    state.phase = 'results';
    saveState();
    var gw = $('#game-window');
    if (gw) {
      gw.removeAttribute('hidden');
      gw.classList.remove('game-window-leaderboard-only');
    }
    showSectionLabel('');
    $$('[data-view]').forEach(function (v) {
      v.classList.toggle('active', v.dataset.view === 'results');
    });

    var outcome = computeOutcomeScore();
    if (state.outcomeScore == null) state.outcomeScore = outcome.total;
    var assessment = state.assessmentScore != null ? state.assessmentScore : 0;
    var totalScore = state.outcomeScore + assessment;

    var finalRansom = state.ransomBtcAmount != null ? Number(state.ransomBtcAmount).toFixed(2) : '2.50';
    var finalHours = state.ransomDeadlineGameHours != null ? state.ransomDeadlineGameHours : 72;
    var proofTheftLabel = state.proofOfStolenDataEmailSent ? 'Proof of theft requested' : 'Proof of theft not requested';
    var proofDecryptLabel = state.proofOfDecryptionEmailSent ? 'Proof of decryption requested' : 'Proof of decryption not requested';

    const container = $('#results-content');
    if (!container) return;
    container.innerHTML =
      '<div class="results-card">' +
      '<h2>Incident summary</h2>' +
      '<p class="results-intro">Your score reflects how well you negotiated: asking for proof of stolen data, proof the decryptor works, lowering the ransom, and securing extra time. Plus your knowledge of incident response best practices.</p>' +
      '<div class="score-grid">' +
      '<div class="score-box"><span class="score-label">' + proofTheftLabel + '</span><span class="score-value">' + outcome.proofTheft + ' / 15 pts</span></div>' +
      '<div class="score-box"><span class="score-label">' + proofDecryptLabel + '</span><span class="score-value">' + outcome.proofDecrypt + ' / 15 pts</span></div>' +
      '<div class="score-box"><span class="score-label">Ransom negotiated</span><span class="score-value">' + finalRansom + ' BTC — ' + outcome.ransom + ' / 35 pts</span></div>' +
      '<div class="score-box"><span class="score-label">Extra time negotiated</span><span class="score-value">' + finalHours + 'h — ' + outcome.time + ' / 35 pts</span></div>' +
      '<div class="score-box"><span class="score-label">Negotiation total</span><span class="score-value">' + state.outcomeScore + ' / 100</span></div>' +
      '<div class="score-box"><span class="score-label">Knowledge (assessment)</span><span class="score-value">' + assessment + ' / 100</span></div>' +
      '<div class="score-box total"><span class="score-label">Total score</span><span class="score-value">' + totalScore + ' / 200</span></div>' +
      '</div>' +
      '<p class="results-copy">Submit your score to the leaderboard (optional).</p>' +
      '<form id="leaderboard-form" class="leaderboard-form">' +
      '<input type="text" name="playerName" placeholder="Your name or handle" maxlength="50" value="' + escapeHtml(state.sessionUsername || '') + '" required />' +
      '<input type="hidden" name="totalScore" value="' + totalScore + '" />' +
      '<input type="hidden" name="outcomeScore" value="' + state.outcomeScore + '" />' +
      '<input type="hidden" name="assessmentScore" value="' + assessment + '" />' +
      '<button type="submit" class="btn btn-primary">Submit score</button>' +
      '</form>' +
      '<div class="results-actions">' +
      '<button type="button" class="btn btn-secondary" data-action="play-again">Play again</button>' +
      '<button type="button" class="btn btn-secondary" data-action="show-leaderboard">View leaderboard</button>' +
      '</div>' +
      '</div>';

    container.querySelector('#leaderboard-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const form = e.target;
      const data = {
        playerName: form.playerName.value.trim(),
        totalScore: parseInt(form.totalScore.value, 10),
        outcomeScore: parseInt(form.outcomeScore.value, 10),
        assessmentScore: parseInt(form.assessmentScore.value, 10),
        negotiationScore: parseInt(form.outcomeScore.value, 10),
      };
      try {
        const res = await fetch(API_BASE + '/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          form.querySelector('button[type="submit"]').textContent = 'Submitted!';
          form.querySelector('button[type="submit"]').disabled = true;
        } else {
          const err = await res.json().catch(function () {
            return {};
          });
          alert(err.error || 'Failed to submit score.');
        }
      } catch (err) {
        alert('Network error. Try again or view leaderboard later.');
      }
    });

    container.querySelector('[data-action="play-again"]').addEventListener('click', function () {
      try {
        if (state.sessionUsername) localStorage.removeItem(getStateKey(state.sessionUsername));
      } catch (e) {}
      state.started = false;
      state.phase = 'intro';
      state.ransomTrackerShownOnFirstReadme = false;
      state.chatMessages = [];
      state.flags = {};
      $('#chat-panel').setAttribute('hidden', 'true');
      $('#chat-panel-messages').innerHTML = '';
      var inp = $('#chat-panel-input');
      if (inp) inp.value = '';
      $('#game-window').setAttribute('hidden', 'true');
      var readmeIcon = $('#readme-icon');
      var readmeWindow = $('#readme-window');
      if (readmeIcon) {
        readmeIcon.removeAttribute('hidden');
        readmeIcon.classList.remove('readme-icon-hidden');
      }
      if (readmeWindow) {
        readmeWindow.setAttribute('hidden', 'true');
        readmeWindow.classList.remove('readme-window-open');
      }
      var walletIcon = $('#wallet-icon');
      var walletWindow = $('#wallet-window');
      if (walletIcon) walletIcon.removeAttribute('hidden');
      if (walletWindow) {
        walletWindow.setAttribute('hidden', 'true');
        walletWindow.classList.remove('wallet-window-open');
      }
      state.walletBalance = 0;
      state.ransomPayments = [];
      state.negotiationStartTime = null;
      state.btcPriceUsd = null;
      state.totalBtcPurchased = 0;
      state.bmailEmails = [];
      state.filesDecrypted = false;
      state.decryptorAgreed = false;
      state.proofOfStolenDataEmailSent = false;
      state.proofOfDecryptionEmailSent = false;
      state.bankBalance = 7500000;
      state.savingsBalance = 500000;
      state.bankTransactions = [];
      var bankWindowEl = $('#bank-window');
      if (bankWindowEl) {
        bankWindowEl.setAttribute('hidden', 'true');
        bankWindowEl.classList.remove('bank-window-open');
      }
      if (state.bmailPopupTimeout) clearTimeout(state.bmailPopupTimeout);
      var bmailPopup = $('#bmail-new-message-popup');
      if (bmailPopup) bmailPopup.setAttribute('hidden', 'true');
      var bmailWindow = $('#bmail-window');
      if (bmailWindow) {
        bmailWindow.setAttribute('hidden', 'true');
        bmailWindow.classList.remove('bmail-window-open');
      }
      var fileViewerWindow = $('#file-viewer-window');
      if (fileViewerWindow) {
        fileViewerWindow.setAttribute('hidden', 'true');
        fileViewerWindow.classList.remove('file-viewer-open');
      }
      renderDesktopFakeFiles();
      $('#results-content').innerHTML = '';
      var desktopContent = document.querySelector('.desktop-content');
      if (desktopContent) desktopContent.classList.remove('game-started');
      $$('[data-view]').forEach(function (v) {
        v.classList.remove('active');
      });
      saveState();
    });

    container.querySelector('[data-action="show-leaderboard"]').addEventListener('click', function () {
      openLeaderboardWindow();
    });
  }

  function closeLeaderboardWindow() {
    var win = document.getElementById('leaderboard-window');
    if (win) {
      win.classList.remove('leaderboard-window-open');
      win.setAttribute('hidden', 'true');
    }
  }

  function openLeaderboardWindow() {
    var win = document.getElementById('leaderboard-window');
    if (!win) return;
    win.removeAttribute('hidden');
    requestAnimationFrame(function () {
      win.classList.add('leaderboard-window-open');
    });
    loadLeaderboardIntoWindow();
  }

  async function loadLeaderboardIntoWindow() {
    var container = document.getElementById('leaderboard-window-content');
    if (!container) return;
    container.innerHTML = '<p class="leaderboard-window-empty">Loading…</p>';
    try {
      var res = await fetch(API_BASE + '/api/leaderboard');
      var scores = await res.json();
      var rows = '';
      if (scores.length === 0) {
        rows = '<tr><td colspan="5" class="leaderboard-window-empty">No scores yet. Be the first!</td></tr>';
      } else {
        rows = scores
          .map(function (s, i) {
            return (
              '<tr><td>' +
              (i + 1) +
              '</td><td>' +
              escapeHtml(s.playerName) +
              '</td><td>' +
              (s.totalScore != null ? s.totalScore : s.score != null ? s.score : '—') +
              '</td><td>' +
              (s.outcomeScore != null ? s.outcomeScore : '—') +
              '</td><td>' +
              (s.assessmentScore != null ? s.assessmentScore : '—') +
              '</td></tr>'
            );
          })
          .join('');
      }
      container.innerHTML =
        '<h2 class="leaderboard-window-heading">🏆 Hall of Fame</h2>' +
        '<table class="leaderboard-window-table">' +
        '<thead><tr><th>Rank</th><th>Player</th><th>Total</th><th>Outcome</th><th>Knowledge</th></tr></thead>' +
        '<tbody>' +
        rows +
        '</tbody></table>' +
        '<button type="button" class="leaderboard-window-close-btn" id="leaderboard-window-close-btn">Close</button>';
      var closeBtn = document.getElementById('leaderboard-window-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', closeLeaderboardWindow);
    } catch (err) {
      container.innerHTML =
        '<p class="leaderboard-window-empty">Could not load leaderboard.</p>' +
        '<button type="button" class="leaderboard-window-close-btn" id="leaderboard-window-close-btn">Close</button>';
      var closeBtn = document.getElementById('leaderboard-window-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', closeLeaderboardWindow);
    }
  }

  async function loadLeaderboard() {
    const container = $('#leaderboard-content');
    if (!container) return;
    try {
      const res = await fetch(API_BASE + '/api/leaderboard');
      const scores = await res.json();
      var rows = '';
      if (scores.length === 0) {
        rows = '<tr><td colspan="5">No scores yet. Be the first!</td></tr>';
      } else {
        rows = scores
          .map(function (s, i) {
            return (
              '<tr><td>' +
              (i + 1) +
              '</td><td>' +
              escapeHtml(s.playerName) +
              '</td><td>' +
              (s.totalScore != null ? s.totalScore : s.score != null ? s.score : '—') +
              '</td><td>' +
              (s.outcomeScore != null ? s.outcomeScore : '—') +
              '</td><td>' +
              (s.assessmentScore != null ? s.assessmentScore : '—') +
              '</td></tr>'
            );
          })
          .join('');
      }
      container.innerHTML =
        '<div class="leaderboard-card">' +
        '<h2>Leaderboard</h2>' +
        '<table class="leaderboard-table">' +
        '<thead><tr><th>Rank</th><th>Player</th><th>Total</th><th>Outcome</th><th>Knowledge</th></tr></thead>' +
        '<tbody>' +
        rows +
        '</tbody></table>' +
        '<button type="button" class="btn btn-secondary" data-action="back-from-leaderboard">Back to results</button>' +
        '</div>';
      container.querySelector('[data-action="back-from-leaderboard"]').addEventListener('click', function () {
        $$('[data-view]').forEach(function (v) {
          v.classList.toggle('active', v.dataset.view === 'results');
        });
      });
    } catch (err) {
      container.innerHTML =
        '<div class="leaderboard-card"><p>Could not load leaderboard.</p><button type="button" class="btn btn-secondary" data-action="back-from-leaderboard">Back</button></div>';
      container.querySelector('[data-action="back-from-leaderboard"]').addEventListener('click', function () {
        $$('[data-view]').forEach(function (v) {
          v.classList.toggle('active', v.dataset.view === 'results');
        });
      });
    }
  }

  function initWindowDragging() {
    var container = document.getElementById('desktop-windows');
    if (!container) return;
    var dragState = { windowEl: null, offsetX: 0, offsetY: 0 };
    function onMouseMove(e) {
      if (!dragState.windowEl) return;
      var cr = container.getBoundingClientRect();
      var left = e.clientX - cr.left - dragState.offsetX;
      var top = e.clientY - cr.top - dragState.offsetY;
      dragState.windowEl.style.left = left + 'px';
      dragState.windowEl.style.top = top + 'px';
      dragState.windowEl.style.transform = 'none';
    }
    function onMouseUp() {
      dragState.windowEl = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
    container.addEventListener('mousedown', function (e) {
      var titleBar = e.target.closest('.window-title-bar');
      if (!titleBar || e.target.closest('button')) return;
      var windowEl = titleBar.parentElement;
      if (!windowEl || windowEl.parentElement !== container) return;
      var cr = container.getBoundingClientRect();
      var wr = windowEl.getBoundingClientRect();
      dragState.offsetX = e.clientX - wr.left;
      dragState.offsetY = e.clientY - wr.top;
      dragState.windowEl = windowEl;
      windowEl.style.left = (wr.left - cr.left) + 'px';
      windowEl.style.top = (wr.top - cr.top) + 'px';
      windowEl.style.transform = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  function init() {
    var loginScreen = document.getElementById('login-screen');
    var username = null;
    try { username = localStorage.getItem(SESSION_STORAGE_KEY); } catch (e) {}
    var savedJson = null;
    if (username) {
      try { savedJson = localStorage.getItem(getStateKey(username)); } catch (e) {}
    }
    if (username && savedJson) {
      try {
        var parsed = JSON.parse(savedJson);
        if (parsed && (parsed.started != null || parsed.phase != null)) {
          state.sessionUsername = username;
          loadStateFromSaved(parsed);
          applyRestoredStateUI();
          if (loginScreen) loginScreen.setAttribute('hidden', 'true');
        }
      } catch (e) {}
    }
    if (state.sessionUsername && loginScreen) {
      loginScreen.setAttribute('hidden', 'true');
    }

    var gameWindowEl = document.getElementById('game-window');
    if (gameWindowEl) gameWindowEl.setAttribute('hidden', 'true');

    renderDesktopFakeFiles();
    initWindowDragging();

    var startMenu = document.getElementById('start-menu');
    var taskbarStart = document.getElementById('taskbar-start');
    var readmeIcon = document.getElementById('readme-icon');
    var readmeWindow = document.getElementById('readme-window');

    if (readmeIcon && readmeWindow) {
      readmeIcon.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        readmeIcon.classList.remove('attention');
        readmeWindow.removeAttribute('hidden');
        requestAnimationFrame(function () {
          readmeWindow.classList.add('readme-window-open');
          onReadmeOpened();
        });
      });
    }
    var readmeWindowClose = document.getElementById('readme-window-close');
    if (readmeWindowClose && readmeIcon && readmeWindow) {
      readmeWindowClose.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        readmeWindow.classList.remove('readme-window-open');
        readmeWindow.setAttribute('hidden', 'true');
        var gw = $('#game-window');
        if (gw) gw.setAttribute('hidden', 'true');
      });
    }

    var fileViewerWindow = document.getElementById('file-viewer-window');
    var fileViewerClose = document.getElementById('file-viewer-close');
    if (fileViewerClose && fileViewerWindow) {
      fileViewerClose.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        fileViewerWindow.classList.remove('file-viewer-open');
        fileViewerWindow.setAttribute('hidden', 'true');
      });
    }

    var bmailRunDecryptorBtn = document.getElementById('bmail-run-decryptor-btn');
    if (bmailRunDecryptorBtn) {
      bmailRunDecryptorBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        runDecryptor();
      });
    }

    var walletIcon = document.getElementById('wallet-icon');
    var walletWindow = document.getElementById('wallet-window');
    var walletWindowClose = document.getElementById('wallet-window-close');
    if (walletIcon && walletWindow) {
      walletIcon.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeAllAppWindows();
        walletWindow.removeAttribute('hidden');
        requestAnimationFrame(function () {
          walletWindow.classList.add('wallet-window-open');
        });
        updateWalletBalanceDisplay();
        updateBuyPreview();
        startWalletPriceRefresh();
        if (typeof loadBtcPriceChart === 'function') loadBtcPriceChart(state.walletChartRange || '6h');
      });
    }
    if (walletWindowClose && walletWindow) {
      walletWindowClose.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        walletWindow.classList.remove('wallet-window-open');
        walletWindow.setAttribute('hidden', 'true');
        stopWalletPriceRefresh();
      });
    }

    var bankIcon = document.getElementById('bank-icon');
    var bankWindow = document.getElementById('bank-window');
    var bankWindowClose = document.getElementById('bank-window-close');
    if (bankIcon && bankWindow) {
      bankIcon.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeAllAppWindows();
        bankWindow.removeAttribute('hidden');
        requestAnimationFrame(function () {
          bankWindow.classList.add('bank-window-open');
        });
        updateBankBalanceDisplay();
      });
    }
    if (bankWindowClose && bankWindow) {
      bankWindowClose.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        bankWindow.classList.remove('bank-window-open');
        bankWindow.setAttribute('hidden', 'true');
      });
    }

    (function initBankTabs() {
      var navItems = $$('.bank-nav-item', bankWindow);
      var panels = {
        balance: $('#bank-panel-balance', bankWindow),
        transfer: $('#bank-panel-transfer', bankWindow),
        billpay: $('#bank-panel-billpay', bankWindow),
        history: $('#bank-panel-history', bankWindow),
      };
      navItems.forEach(function (item) {
        item.addEventListener('click', function () {
          var tab = item.getAttribute('data-tab');
          if (!tab || !panels[tab]) return;
          navItems.forEach(function (n) {
            n.classList.toggle('active', n.getAttribute('data-tab') === tab);
            n.setAttribute('aria-selected', n.getAttribute('data-tab') === tab ? 'true' : 'false');
          });
          Object.keys(panels).forEach(function (k) {
            var el = panels[k];
            if (el) el.classList.toggle('hidden', k !== tab);
          });
          if (tab === 'history') renderBankHistory();
          if (tab === 'billpay') showBankBillPayBroken();
        });
      });
    })();

    (function initBankTransfer() {
      var fromSelect = $('#bank-transfer-from', bankWindow);
      var toSelect = $('#bank-transfer-to', bankWindow);
      var amountInput = $('#bank-transfer-amount', bankWindow);
      var submitBtn = $('#bank-transfer-submit', bankWindow);
      var statusEl = $('#bank-transfer-status', bankWindow);
      if (!submitBtn || !amountInput) return;
      submitBtn.addEventListener('click', function () {
        var from = fromSelect ? fromSelect.value : 'checking';
        var to = toSelect ? toSelect.value : 'savings';
        if (from === to) {
          if (statusEl) { statusEl.textContent = 'From and To must be different.'; statusEl.className = 'bank-status bank-status-error'; }
          return;
        }
        var amount = parseFloat(String(amountInput.value).replace(/,/g, ''), 10);
        if (isNaN(amount) || amount <= 0) {
          if (statusEl) { statusEl.textContent = 'Enter a valid amount.'; statusEl.className = 'bank-status bank-status-error'; }
          return;
        }
        var checking = state.bankBalance || 0;
        var savings = state.savingsBalance || 0;
        if (from === 'checking' && amount > checking) {
          if (statusEl) { statusEl.textContent = 'Insufficient funds in Checking.'; statusEl.className = 'bank-status bank-status-error'; }
          return;
        }
        if (from === 'savings' && amount > savings) {
          if (statusEl) { statusEl.textContent = 'Insufficient funds in Savings.'; statusEl.className = 'bank-status bank-status-error'; }
          return;
        }
        if (from === 'checking') {
          state.bankBalance = checking - amount;
          state.savingsBalance = (savings || 0) + amount;
        } else {
          state.savingsBalance = savings - amount;
          state.bankBalance = (checking || 0) + amount;
        }
        addBankTransaction({ type: 'transfer', from: from, to: to, amount: amount });
        updateBankBalanceDisplay();
        if (amountInput) amountInput.value = '';
        if (statusEl) { statusEl.textContent = 'Transfer complete.'; statusEl.className = 'bank-status bank-status-success'; }
        setTimeout(function () { if (statusEl) statusEl.textContent = ''; }, 3000);
      });
    })();

    function renderBankHistory() {
      var list = $('#bank-history-list', bankWindow);
      var emptyEl = $('#bank-history-empty', bankWindow);
      if (!list) return;
      var tx = state.bankTransactions || [];
      list.innerHTML = '';
      if (tx.length === 0) {
        if (emptyEl) { emptyEl.classList.remove('hidden'); }
        return;
      }
      if (emptyEl) emptyEl.classList.add('hidden');
      var reversed = tx.slice().reverse();
      reversed.forEach(function (r) {
        var row = document.createElement('div');
        row.className = 'bank-history-row';
        var desc = '';
        var amt = r.amount != null ? r.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
        if (r.type === 'bitcoin_purchase') {
          desc = 'Bitcoin purchase — $' + amt + ' from Checking';
        } else if (r.type === 'transfer' && r.from && r.to) {
          desc = 'Transfer — $' + amt + ' from ' + (r.from === 'checking' ? 'Checking' : 'Savings') + ' to ' + (r.to === 'checking' ? 'Checking' : 'Savings');
        } else {
          desc = 'Transaction — $' + amt;
        }
        var dateStr = r.date ? new Date(r.date).toLocaleString() : '';
        row.innerHTML = '<span class="bank-history-desc">' + escapeHtml(desc) + '</span><span class="bank-history-date">' + escapeHtml(dateStr) + '</span>';
        list.appendChild(row);
      });
    }

    function showBankBillPayBroken() {
      var loadingEl = $('#bank-billpay-loading', bankWindow);
      var errorEl = $('#bank-billpay-error', bankWindow);
      if (!loadingEl || !errorEl) return;
      loadingEl.classList.remove('hidden');
      errorEl.classList.add('hidden');
      clearTimeout(state.bankBillPayTimeout);
      state.bankBillPayTimeout = setTimeout(function () {
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
      }, 1800);
    }

    var torIcon = document.getElementById('tor-icon');
    var torWindow = document.getElementById('tor-window');
    var torWindowClose = document.getElementById('tor-window-close');
    var torUrlBar = document.getElementById('tor-url-bar');
    var torGoBtn = document.getElementById('tor-go-btn');
    var torContent = document.getElementById('tor-content');
    var torRefresh = document.getElementById('tor-refresh');

    if (torContent) {
      torContent.addEventListener('click', function(e) {
        var sendBtn = e.target && e.target.closest && e.target.closest('#tor-chat-send');
        if (!sendBtn) return;
        e.preventDefault();
        e.stopPropagation();
        var input = document.getElementById('tor-chat-input');
        if (!input) return;
        var text = (input.value || '').trim();
        if (!text) return;
        sendNegotiationMessageInTor(text);
      });
      torContent.addEventListener('keydown', function(e) {
        if (e.target && e.target.id === 'tor-chat-input' && e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          var input = document.getElementById('tor-chat-input');
          if (!input) return;
          var text = (input.value || '').trim();
          if (!text) return;
          sendNegotiationMessageInTor(text);
        }
      });
    }

    function renderRansomSite() {
      if (!torContent) return;
      var showChat = state.torCurrentPage === 'ransom-chat';
      
      if (!showChat) {
        // Show login form
        torContent.innerHTML = `
          <div class="ransom-site">
            <div class="ransom-site-header">
              <h1 class="ransom-site-logo">⚡ BLACKOUT ⚡</h1>
              <p class="ransom-site-tagline">Secure Payment & Recovery Portal</p>
            </div>
            <div class="ransom-site-body">
              <div class="ransom-site-section">
                <h3>⚡ Your Network Has Been Encrypted</h3>
                <p>All your files, databases, and backups have been encrypted with military-grade AES-256 encryption. Additionally, we have exfiltrated sensitive data from your network.</p>
                <p>Without our decryption key, your files are permanently inaccessible. Attempting to decrypt them yourself will result in permanent data loss.</p>
              </div>
              <div class="ransom-site-section">
                <h3>🔑 How to Recover Your Data</h3>
                <p><strong>Payment Required:</strong> ${(state.ransomBtcAmount != null ? state.ransomBtcAmount : 2.5)} BTC (<span id="ransom-btc-usd">~$— USD</span> at current rates)</p>
                <p><strong>Bitcoin Address:</strong></p>
                <div class="ransom-site-id-box">
                  <code style="word-break: break-all; font-size: 0.85rem;">${state.ransomBtcAddress || ''}</code>
                </div>
                <p><strong>Time Remaining:</strong> 72 hours from initial encryption</p>
              </div>
              <div class="ransom-site-section">
                <h3>💬 Access Secure Chat</h3>
                <p>To negotiate or confirm payment, enter your Personal ID from the README file:</p>
                <div class="ransom-site-login-form">
                  <input type="text" id="tor-victim-id" class="ransom-site-input" placeholder="Enter your Personal ID (e.g., MRH-7f3a9b2e-4c1d)" />
                  <button type="button" id="tor-start-chat-btn" class="ransom-site-btn">Access Chat</button>
                  <p class="ransom-site-login-error" id="tor-login-error" style="display: none;"></p>
                </div>
                <div class="ransom-site-warning">
                  <p><strong>⚠ NOTE:</strong> Your Personal ID is located in the README.txt file on your desktop. You must enter it to access the secure negotiation chat.</p>
                </div>
              </div>
              <div class="ransom-site-section">
                <h3>📋 Guarantees</h3>
                <p>• We have successfully decrypted files for over 1,000 organizations</p>
                <p>• Our reputation is our business - we always provide working decryptors after payment</p>
                <p>• Your data will be permanently deleted from our servers after decryption</p>
                <p>• We will provide proof of deletion upon request</p>
              </div>
              <div class="ransom-site-section">
                <h3>⛔ Do NOT:</h3>
                <p>• Contact law enforcement - this will result in immediate data leak</p>
                <p>• Attempt to restore from backups - we have likely encrypted those too</p>
                <p>• Try to decrypt files yourself - this will corrupt them permanently</p>
                <p>• Ignore this message - your data will be published on our leak site</p>
              </div>
              <div class="ransom-site-footer">
                <p>⚡ Blackout • Secure Onion Service • All communications are encrypted and anonymous</p>
              </div>
            </div>
          </div>
        `;
        var btcAmount = state.ransomBtcAmount != null ? state.ransomBtcAmount : 2.5;
        function setRansomBtcUsd(usdPerBtc) {
          var el = document.getElementById('ransom-btc-usd');
          if (el && usdPerBtc > 0) {
            el.textContent = '~$' + (btcAmount * usdPerBtc).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' USD ';
          }
        }
        if (state.btcPriceUsd != null && state.btcPriceUsd > 0) {
          setRansomBtcUsd(state.btcPriceUsd);
        } else {
          fetch(API_BASE + '/api/btc-price')
            .then(function (r) { return r.json(); })
            .then(function (data) {
              var usd = typeof data.usd === 'number' && data.usd > 0 ? data.usd : 97000;
              state.btcPriceUsd = usd;
              setRansomBtcUsd(usd);
            })
            .catch(function () {
              state.btcPriceUsd = 97000;
              setRansomBtcUsd(97000);
            });
        }
        // Add event listener for the chat button
        var startChatBtn = document.getElementById('tor-start-chat-btn');
        var victimIdInput = document.getElementById('tor-victim-id');
        var loginError = document.getElementById('tor-login-error');
        
        if (startChatBtn && victimIdInput) {
          startChatBtn.addEventListener('click', function() {
            var enteredId = (victimIdInput.value || '').trim();
            var expectedId = (state.personalId || '').toLowerCase();
            if (expectedId && (enteredId.toLowerCase().includes(expectedId) || enteredId.toLowerCase() === expectedId)) {
              state.torChatStarted = true;
              if (state.ransomDeadlineStartRealTime == null) {
                state.ransomDeadlineStartRealTime = Date.now();
                state.ransomDeadlineGameHours = 72;
              }
              torNavigateTo('ransom-chat');
              if (!state.started) startGame();
              var trackerWin = document.getElementById('ransom-tracker-window');
              if (trackerWin) {
                trackerWin.removeAttribute('hidden');
                requestAnimationFrame(function() { trackerWin.classList.add('ransom-tracker-open'); });
                updateRansomTrackerDisplay();
                if (state.ransomTrackerTickId != null) clearInterval(state.ransomTrackerTickId);
                state.ransomTrackerTickId = setInterval(updateRansomTrackerDisplay, 1000);
              }
            } else {
              if (loginError) {
                loginError.textContent = 'Invalid Personal ID. Please check your README.txt file and try again.';
                loginError.style.display = 'block';
              }
            }
          });
          victimIdInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
              startChatBtn.click();
            }
          });
        }
      } else {
        renderRansomSiteWithChat();
      }
    }

    function renderTorPageById(pageId) {
      if (!torContent) return;
      if (pageId === 'start') {
        state.torCurrentPage = 'start';
        renderTorStartPage();
      } else if (pageId === 'ransom-login') {
        state.torCurrentPage = 'ransom-login';
        renderRansomSite();
      } else if (pageId === 'ransom-chat') {
        state.torCurrentPage = 'ransom-chat';
        renderRansomSiteWithChat();
      }
      updateTorNavButtons();
    }

    function torNavigateTo(pageId) {
      if (state.torHistoryList && state.torHistoryList.length > 0 && state.torHistoryList[state.torHistoryIndex] === pageId) {
        return;
      }
      if (!state.torHistoryList || state.torHistoryList.length === 0) {
        state.torHistoryList = [state.torCurrentPage || 'start'];
        state.torHistoryIndex = 0;
      }
      if (state.torHistoryIndex < state.torHistoryList.length - 1) {
        state.torHistoryList = state.torHistoryList.slice(0, state.torHistoryIndex + 1);
      }
      state.torHistoryList.push(pageId);
      state.torHistoryIndex = state.torHistoryList.length - 1;
      renderTorPageById(pageId);
    }

    function goTorBack() {
      if (state.torHistoryIndex <= 0) return;
      state.torHistoryIndex--;
      renderTorPageById(state.torHistoryList[state.torHistoryIndex]);
    }

    function goTorForward() {
      if (state.torHistoryIndex < 0 || state.torHistoryIndex >= state.torHistoryList.length - 1) return;
      state.torHistoryIndex++;
      renderTorPageById(state.torHistoryList[state.torHistoryIndex]);
    }

    function updateTorNavButtons() {
      var backBtn = document.getElementById('tor-back');
      var forwardBtn = document.getElementById('tor-forward');
      var canBack = state.torHistoryList && state.torHistoryList.length > 0 && state.torHistoryIndex > 0;
      var canForward = state.torHistoryList && state.torHistoryList.length > 0 && state.torHistoryIndex >= 0 && state.torHistoryIndex < state.torHistoryList.length - 1;
      if (backBtn) backBtn.disabled = !canBack;
      if (forwardBtn) forwardBtn.disabled = !canForward;
    }
    
    function renderRansomSiteWithChat() {
      if (!torContent) return;
      torContent.innerHTML = `
        <div class="ransom-site ransom-site-with-chat">
          <div class="ransom-site-header-compact">
            <h2 class="ransom-site-logo-compact">⚡ Blackout</h2>
            <div class="ransom-site-status">
              <span class="ransom-site-status-label">Personal ID:</span>
              <span class="ransom-site-status-value">${state.personalId || ''}</span>
            </div>
          </div>
          <div class="ransom-site-chat-container">
            <div class="ransom-site-chat-header">
              <span class="ransom-site-chat-title">💬 Secure Negotiation Chat</span>
              <div class="ransom-site-chat-header-actions">
                <button type="button" class="ransom-site-tracker-btn" id="tor-open-tracker-btn" aria-label="Open payment tracker">📋 Payment tracker</button>
                <span class="ransom-site-chat-status">🟢 Operator Online</span>
              </div>
            </div>
            <div class="ransom-site-chat-messages" id="tor-chat-messages"></div>
            <div class="ransom-site-chat-input-wrap">
              <div class="ransom-site-chat-input-row">
                <textarea id="tor-chat-input" class="ransom-site-chat-input" rows="2" placeholder="Type your message…" maxlength="500"></textarea>
                <button type="button" class="ransom-site-chat-send" id="tor-chat-send">Send</button>
              </div>
              <button type="button" class="ransom-site-suggestions-toggle" id="tor-suggestions-toggle" aria-expanded="false">💡 Suggestions</button>
            </div>
            <div class="ransom-site-suggestions-drawer" id="tor-suggestions-drawer" style="display: none;">
              <div class="ransom-site-suggestions-content" id="tor-suggestions-content"></div>
            </div>
          </div>
        </div>
      `;
      
      // Copy existing chat messages to the new chat container
      var torChatMessages = document.getElementById('tor-chat-messages');
      if (torChatMessages && state.chatMessages) {
        state.chatMessages.forEach(function(msg) {
          var msgEl = document.createElement('div');
          msgEl.className = 'ransom-site-chat-msg ransom-site-chat-msg-' + msg.role;
          msgEl.innerHTML =
            '<span class="ransom-site-chat-sender">' +
            escapeHtml(msg.role === 'operator' ? 'Blackout_Op' : 'You') +
            '</span><span class="ransom-site-chat-time">' +
            escapeHtml(msg.time) +
            '</span><div class="ransom-site-chat-text">' +
            escapeHtml(msg.text) +
            '</div>';
          torChatMessages.appendChild(msgEl);
        });
        torChatMessages.scrollTop = torChatMessages.scrollHeight;
      }
      
      // Send/Enter are handled by event delegation on torContent (no duplicate handlers)
      var torSuggestionsToggle = document.getElementById('tor-suggestions-toggle');
      var torSuggestionsDrawer = document.getElementById('tor-suggestions-drawer');
      
      if (torSuggestionsToggle && torSuggestionsDrawer) {
        torSuggestionsToggle.addEventListener('click', function() {
          var isOpen = torSuggestionsDrawer.style.display !== 'none';
          torSuggestionsDrawer.style.display = isOpen ? 'none' : 'block';
          torSuggestionsToggle.setAttribute('aria-expanded', String(!isOpen));
        });
      }
      var torOpenTrackerBtn = document.getElementById('tor-open-tracker-btn');
      if (torOpenTrackerBtn) {
        torOpenTrackerBtn.addEventListener('click', function() {
          openRansomTracker();
        });
      }
      
      // Render suggestions if available
      renderTorChatSuggestions();
    }
    
    function sendNegotiationMessageInTor(userText) {
      var phaseNum = state.negPhaseNum;
      var phaseSteps = state.negPhaseSteps;
      var callback = state.negotiationSendCallback;
      if (!phaseNum || !phaseSteps || !callback) {
        runNegotiationPhase(phaseSteps || NEGOTIATION_PHASE_1, phaseNum || 1);
        phaseNum = state.negPhaseNum;
        phaseSteps = state.negPhaseSteps;
        callback = state.negotiationSendCallback;
      }
      if (!phaseNum || !phaseSteps || state.negStep >= phaseSteps.length || !callback) return;
      
      var inputEl = document.getElementById('tor-chat-input');
      var sendBtn = document.getElementById('tor-chat-send');
      if (inputEl) inputEl.disabled = true;
      if (sendBtn) sendBtn.disabled = true;
      
      appendChatMessageInTor('user', userText);
      setFlagsFromMessage(userText);
      
      var messagesContainer = document.getElementById('tor-chat-messages');
      var loadingEl = document.createElement('p');
      loadingEl.className = 'ransom-site-chat-loading';
      loadingEl.textContent = 'Blackout_Op is typing…';
      loadingEl.setAttribute('data-loading', '1');
      
      var typingDelayMs = 300 + Math.random() * 3700;
      var typingTimeout = setTimeout(function() {
        if (loadingEl.parentNode) return;
        if (messagesContainer) {
          messagesContainer.appendChild(loadingEl);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, typingDelayMs);
      
      if (!state.negotiationStartTime) state.negotiationStartTime = Date.now();
      var lastPayment = state.ransomPayments.length > 0 ? state.ransomPayments[state.ransomPayments.length - 1] : null;
      var paymentMade = lastPayment != null;
      var lastPaymentAmount = lastPayment ? lastPayment.amount : 0;
      var paymentCorrect = paymentMade && typeof RANSOM_BTC_AMOUNT !== 'undefined' && lastPaymentAmount >= RANSOM_BTC_AMOUNT;
      var step = phaseSteps[state.negStep];
      var initialOperatorMessage = (!state.conversationId && step && step.operatorMessage) ? step.operatorMessage : null;
      
      var exchangeNum = state.negStep + 1;
      var totalInPhase = phaseSteps.length;
      var isLastExchange = state.negStep >= totalInPhase - 1;
      var gameContext = '';
      if (phaseNum === 1) {
        gameContext = 'GAME CONTEXT — Phase 1: Initial contact. This is exchange ' + exchangeNum + ' of ' + totalInPhase + '. Guide the conversation so the victim can demonstrate: asking for proof of stolen data, proof of decryption, and willingness to negotiate.';
        if (isLastExchange) gameContext += ' This is the last exchange of this phase. Wrap up naturally; the next section (buying time) will follow.';
      } else if (phaseNum === 2) {
        gameContext = 'GAME CONTEXT — Phase 2: Buying time. This is exchange ' + exchangeNum + ' of ' + totalInPhase + '. Guide the conversation so they can ask for an extension, ask to lower the ransom, and stay professional.';
        if (isLastExchange) gameContext += ' This is the last exchange of this phase. Wrap up naturally; the final negotiation section will follow.';
      } else if (phaseNum === 3) {
        gameContext = 'GAME CONTEXT — Phase 3: Final negotiation. This is exchange ' + exchangeNum + ' of ' + totalInPhase + '. After this phase the victim will see their results.';
        if (isLastExchange) gameContext += ' This is the last exchange. Wrap up naturally; they will see their summary and assessment next.';
      }
      gameContext += ' Keep replies short (1-3 sentences).';
      
      fetch(API_BASE + '/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: phaseNum,
          stepIndex: state.negStep,
          totalStepsInPhase: totalInPhase,
          gameContext: gameContext,
          userMessage: userText,
          conversationId: state.conversationId,
          initialOperatorMessage: initialOperatorMessage,
          paymentMade: paymentMade,
          lastPaymentAmount: lastPaymentAmount,
          paymentCorrect: paymentCorrect,
          negotiationStartTime: state.negotiationStartTime,
          proofOfStolenDataEmailSent: !!state.proofOfStolenDataEmailSent,
          proofOfDecryptionEmailSent: !!state.proofOfDecryptionEmailSent,
        }),
      })
        .then(function(res) {
          return res.json().then(function(data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function(result) {
          if (result.ok && result.data.conversationId) {
            state.conversationId = result.data.conversationId;
          }
          var reply;
          if (result.ok && result.data.reply) {
            reply = result.data.reply;
          } else if (result.data && result.data.error) {
            reply = 'Error: ' + result.data.error;
          } else {
            reply = 'No response.';
          }
          appendChatMessageInTor('operator', reply);
          if (result.ok && (result.data.trackerRansomBtc != null || result.data.trackerDeadlineHours != null)) {
            applyTrackerFromApi(result.data);
          } else {
            parseOperatorReplyForRansom(reply);
            updateRansomTrackerDisplay();
          }
          if (!state.decryptorAgreed && result.ok && result.data.decryptorAgreed === true) {
            state.decryptorAgreed = true;
            addBmailEmail(
              'Your decryptor is ready',
              'Payment confirmed. Your decryptor is ready.\n\nClick the link below to download and run the decryption tool. It will restore your encrypted files.\n\n— Blackout_Op',
              'Blackout_Op <noreply@blackout.onion>',
              true
            );
            showBmailNewMessagePopup();
          }
          if (result.ok && result.data.proofOfStolenDataSent === true && !state.proofOfStolenDataEmailSent) {
            state.proofOfStolenDataEmailSent = true;
            var piiEncrypted = typeof PII_ATTACHMENT_FILENAME !== 'undefined' && typeof PII_SPREADSHEET_ENCRYPTED !== 'undefined' && typeof PII_SPREADSHEET_DECRYPTED !== 'undefined';
            addBmailEmail(
              'Proof of data — sample attached',
              'You asked for proof we have your data. See the attached file. It is encrypted so you cannot read it yet — pay and we send the decryptor. Do not contact law enforcement.\n\n— Blackout_Op',
              'Blackout_Op <noreply@blackout.onion>',
              false,
              piiEncrypted ? { name: PII_ATTACHMENT_FILENAME, encryptedContent: PII_SPREADSHEET_ENCRYPTED, decryptedContent: PII_SPREADSHEET_DECRYPTED, showDecrypted: false } : undefined
            );
            showBmailNewMessagePopup();
            appendChatMessageInTor('operator', "One moment — sending that now.\n\nI've sent you an email with a sample of the data. Check your inbox.");
          }
          if (result.ok && result.data.proofOfDecryptionSent === true && !state.proofOfDecryptionEmailSent) {
            state.proofOfDecryptionEmailSent = true;
            var piiDecrypted = typeof PII_ATTACHMENT_FILENAME !== 'undefined' && typeof PII_SPREADSHEET_ENCRYPTED !== 'undefined' && typeof PII_SPREADSHEET_DECRYPTED !== 'undefined';
            addBmailEmail(
              'Proof of decryption — one file decrypted',
              'You asked for proof our decryptor works. See the attached file — same data, decrypted. Pay and we send the full decryptor.\n\n— Blackout_Op',
              'Blackout_Op <noreply@blackout.onion>',
              false,
              piiDecrypted ? { name: PII_ATTACHMENT_FILENAME, encryptedContent: PII_SPREADSHEET_ENCRYPTED, decryptedContent: PII_SPREADSHEET_DECRYPTED, showDecrypted: true } : undefined
            );
            showBmailNewMessagePopup();
            appendChatMessageInTor('operator', "One moment — sending that now.\n\nI've sent you an email with the decrypted file. Check your inbox.");
          }
          state.negStep += 1;
          saveState();
          callback();
        })
        .catch(function() {
          appendChatMessageInTor('operator', 'Connection error. Try again.');
          state.negStep += 1;
          saveState();
          callback();
        })
        .finally(function() {
          clearTimeout(typingTimeout);
          if (loadingEl && loadingEl.parentNode) loadingEl.remove();
          if (inputEl) {
            inputEl.disabled = false;
            inputEl.value = '';
          }
          if (sendBtn) sendBtn.disabled = false;
        });
    }

    function renderTorStartPage() {
      if (!torContent) return;
      state.torCurrentPage = 'start';
      if (!state.torHistoryList || state.torHistoryList.length === 0) {
        state.torHistoryList = ['start'];
        state.torHistoryIndex = 0;
        updateTorNavButtons();
      }
      torContent.innerHTML = `
        <div class="tor-start-page">
          <div class="tor-logo">🧅</div>
          <h2>Welcome to Tor Browser</h2>
          <p>Your connection is secure and anonymous.</p>
          <p class="tor-hint">Enter a .onion address in the URL bar above to access the dark web.</p>
        </div>
      `;
    }

    function navigateToUrl(url) {
      if (!url || !torContent) return;
      var cleanUrl = url.trim().toLowerCase();
      
      // Check if it's the ransom .onion address
      var onionAddr = state.ransomOnionAddress || '';
      if (onionAddr && (cleanUrl.includes(onionAddr) || cleanUrl === onionAddr)) {
        torNavigateTo('ransom-login');
        if (torUrlBar) torUrlBar.value = 'http://' + onionAddr;
      } else if (cleanUrl === '' || cleanUrl === 'about:blank') {
        torNavigateTo('start');
        if (torUrlBar) torUrlBar.value = '';
      } else {
        // Invalid address
        torContent.innerHTML = `
          <div class="tor-start-page">
            <div class="tor-logo">⚠️</div>
            <h2>Unable to Connect</h2>
            <p style="color: var(--danger);">The .onion address could not be reached.</p>
            <p class="tor-hint">Please check the address and try again. Only valid .onion addresses can be accessed through Tor Browser.</p>
          </div>
        `;
      }
    }

    if (torIcon && torWindow) {
      torIcon.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeAllAppWindows();
        torWindow.removeAttribute('hidden');
        requestAnimationFrame(function () {
          torWindow.classList.add('tor-window-open');
          updateTorNavButtons();
        });
      });
    }

    if (torWindowClose && torWindow) {
      torWindowClose.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        torWindow.classList.remove('tor-window-open');
        torWindow.setAttribute('hidden', 'true');
      });
    }

    if (torGoBtn && torUrlBar) {
      torGoBtn.addEventListener('click', function () {
        navigateToUrl(torUrlBar.value);
      });
    }

    if (torUrlBar) {
      torUrlBar.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          navigateToUrl(torUrlBar.value);
        }
      });
    }

    if (torRefresh) {
      torRefresh.addEventListener('click', function () {
        if (torUrlBar && torUrlBar.value) {
          navigateToUrl(torUrlBar.value);
        } else {
          renderTorStartPage();
        }
      });
    }

    var torBack = document.getElementById('tor-back');
    if (torBack) {
      torBack.addEventListener('click', function () {
        goTorBack();
      });
    }
    var torForward = document.getElementById('tor-forward');
    if (torForward) {
      torForward.addEventListener('click', function () {
        goTorForward();
      });
    }

    var readmeOnionLink = document.getElementById('readme-onion-link');
    if (readmeOnionLink && torWindow && torUrlBar) {
      readmeOnionLink.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var onionUrl = state.ransomOnionAddress ? 'http://' + state.ransomOnionAddress : 'http://example.onion';
        closeAllAppWindows();
        torWindow.removeAttribute('hidden');
        requestAnimationFrame(function () {
          torWindow.classList.add('tor-window-open');
          if (torUrlBar) torUrlBar.value = onionUrl;
          navigateToUrl(onionUrl);
        });
      });
    }

    var ransomTrackerWindow = document.getElementById('ransom-tracker-window');
    var ransomTrackerClose = document.getElementById('ransom-tracker-close');
    if (ransomTrackerClose && ransomTrackerWindow) {
      ransomTrackerClose.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        ransomTrackerWindow.classList.remove('ransom-tracker-open');
        ransomTrackerWindow.setAttribute('hidden', 'true');
        if (state.ransomTrackerTickId != null) {
          clearInterval(state.ransomTrackerTickId);
          state.ransomTrackerTickId = null;
        }
      });
    }

    var walletTabs = $$('.wallet-tab');
    var walletPanelBuy = $('#wallet-panel-buy');
    var walletPanelSend = $('#wallet-panel-send');
    var walletBtcChartEl = $('#wallet-btc-chart');
    var walletChartTfButtons = $$('.wallet-chart-tf');
    walletTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var t = tab.getAttribute('data-tab');
        walletTabs.forEach(function (x) {
          x.classList.toggle('active', x.getAttribute('data-tab') === t);
          x.setAttribute('aria-selected', x.getAttribute('data-tab') === t);
        });
        if (walletPanelBuy) walletPanelBuy.classList.toggle('hidden', t !== 'buy');
        if (walletPanelSend) walletPanelSend.classList.toggle('hidden', t !== 'send');
        if (t === 'buy') loadBtcPriceChart(state.walletChartRange || '6h');
      });
    });

    if (walletChartTfButtons && walletChartTfButtons.length) {
      walletChartTfButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var range = btn.getAttribute('data-range');
          if (!range) return;
          walletChartTfButtons.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          state.walletChartRange = range;
          loadBtcPriceChart(range);
        });
      });
    }

    var walletBuyUsd = $('#wallet-buy-usd');
    var walletBtcPreviewValue = $('#wallet-btc-preview-value');
    var walletBtcRate = $('#wallet-btc-rate');
    var walletBuyConfirm = $('#wallet-buy-confirm');
    var walletBuyStatus = $('#wallet-buy-status');
    var walletPriceDisplay = $('#wallet-price-display');
    var walletPriceMeta = $('#wallet-price-meta');
    var walletPriceBadge = $('#wallet-price-badge');

    var MIN_CHART_POINTS = 5;

    function drawBtcChart(canvas, prices) {
      if (!canvas || !Array.isArray(prices) || prices.length < 2) return;
      var sorted = prices.slice().sort(function (a, b) { return a[0] - b[0]; });
      var ctx = canvas.getContext('2d');
      var w = canvas.width;
      var h = canvas.height;
      var padding = { top: 8, right: 8, bottom: 8, left: 8 };
      var plotLeft = padding.left;
      var plotRight = w - padding.right;
      var plotTop = padding.top;
      var plotBottom = h - padding.bottom;
      var plotW = plotRight - plotLeft;
      var plotH = plotBottom - plotTop;
      var minP = Infinity;
      var maxP = -Infinity;
      for (var i = 0; i < sorted.length; i++) {
        var p = sorted[i][1];
        if (p < minP) minP = p;
        if (p > maxP) maxP = p;
      }
      if (minP >= maxP) { minP = minP - 1; maxP = maxP + 1; }
      var range = maxP - minP;
      var pad = range * 0.05 || 1;
      minP -= pad;
      maxP += pad;
      var minT = sorted[0][0];
      var maxT = sorted[sorted.length - 1][0];
      var timeRange = maxT - minT || 1;
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      for (var j = 0; j < sorted.length; j++) {
        var t = sorted[j][0];
        var p = sorted[j][1];
        var x = plotLeft + ((t - minT) / timeRange) * plotW;
        var y = plotBottom - ((p - minP) / (maxP - minP)) * plotH;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(63, 185, 80, 0.9)';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    /** Generate fake chart data locally (no API). Uses current price or fallback; chart is for display only. */
    function makeFakeChartPrices(range) {
      var base = (state.btcPriceUsd != null && state.btcPriceUsd > 0) ? state.btcPriceUsd : 97000;
      var hours = range === '7d' ? 7 * 24 : range === '24h' ? 24 : range === '12h' ? 12 : 6;
      var points = Math.min(48, Math.max(12, hours * 2));
      var stepMs = (hours * 3600000) / (points - 1) || 3600000;
      return Array.from({ length: points }, function (_, i) {
        var t = Date.now() - (points - 1 - i) * stepMs;
        var wave = Math.sin((i / points) * Math.PI * 2) * 800 + Math.sin((i / points) * Math.PI * 5) * 300;
        return [t, Math.round(base + wave)];
      });
    }

    function loadBtcPriceChart(range) {
      if (!walletBtcChartEl) return;
      range = range || (state.walletChartRange || '6h');
      state.walletChartRange = range;
      var prices = makeFakeChartPrices(range);
      drawBtcChart(walletBtcChartEl, prices);
    }

    function fetchBtcPriceThen(cb) {
      if (state.btcPriceUsd != null && state.btcPriceUsd > 0) {
        cb(state.btcPriceUsd);
        return;
      }
      fetch(API_BASE + '/api/btc-price')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          state.btcPriceUsd = typeof data.usd === 'number' && data.usd > 0 ? data.usd : 97000;
          cb(state.btcPriceUsd);
        })
        .catch(function () {
          state.btcPriceUsd = 97000;
          cb(state.btcPriceUsd);
        });
    }

    function fetchBtcPriceAndUpdate(cb) {
      fetch(API_BASE + '/api/btc-price')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var usd = typeof data.usd === 'number' && data.usd > 0 ? data.usd : (state.btcPriceUsd || 97000);
          state.btcPriceUsd = usd;
          if (typeof cb === 'function') cb(usd);
        })
        .catch(function () {
          if (state.btcPriceUsd != null && state.btcPriceUsd > 0 && typeof cb === 'function') cb(state.btcPriceUsd);
        });
    }

    function updateWalletPriceHero(usdPerBtc) {
      if (!usdPerBtc) return;
      if (walletPriceDisplay) walletPriceDisplay.textContent = '$' + usdPerBtc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (walletPriceMeta) walletPriceMeta.textContent = '1 BTC · Live price';
      if (walletPriceBadge) {
        walletPriceBadge.textContent = 'Live';
        walletPriceBadge.classList.remove('wallet-price-badge-pulse');
        requestAnimationFrame(function () { if (walletPriceBadge) walletPriceBadge.classList.add('wallet-price-badge-pulse'); });
      }
    }

    function updateBuyPreview() {
      fetchBtcPriceThen(function (usdPerBtc) {
        updateWalletPriceHero(usdPerBtc);
        if (walletBtcRate) walletBtcRate.textContent = '1 BTC = $' + usdPerBtc.toLocaleString();
        var usd = parseFloat(String(walletBuyUsd ? walletBuyUsd.value : '').replace(/,/g, ''), 10);
        if (!isNaN(usd) && usd > 0 && walletBtcPreviewValue) {
          var btc = usd / usdPerBtc;
          walletBtcPreviewValue.textContent = btc.toFixed(8) + ' BTC';
        } else if (walletBtcPreviewValue) {
          walletBtcPreviewValue.textContent = '— BTC';
        }
      });
    }

    var walletBtcPriceIntervalId = null;
    function startWalletPriceRefresh() {
      if (walletBtcPriceIntervalId) return;
      updateBuyPreview();
      walletBtcPriceIntervalId = setInterval(function () {
        var panel = $('#wallet-panel-buy');
        if (!panel || panel.classList.contains('hidden')) return;
        fetchBtcPriceAndUpdate(function (usdPerBtc) {
          updateWalletPriceHero(usdPerBtc);
          if (walletBtcRate) walletBtcRate.textContent = '1 BTC = $' + usdPerBtc.toLocaleString();
          var usd = parseFloat(String(walletBuyUsd ? walletBuyUsd.value : '').replace(/,/g, ''), 10);
          if (!isNaN(usd) && usd > 0 && walletBtcPreviewValue) {
            walletBtcPreviewValue.textContent = (usd / usdPerBtc).toFixed(8) + ' BTC';
          }
        });
      }, 60000);
    }
    function stopWalletPriceRefresh() {
      if (walletBtcPriceIntervalId) {
        clearInterval(walletBtcPriceIntervalId);
        walletBtcPriceIntervalId = null;
      }
    }
    if (walletBuyUsd) {
      walletBuyUsd.addEventListener('input', updateBuyPreview);
      walletBuyUsd.addEventListener('change', updateBuyPreview);
    }
    if (walletBuyConfirm) {
      walletBuyConfirm.addEventListener('click', function () {
        var usd = parseFloat(String(walletBuyUsd ? walletBuyUsd.value : '').replace(/,/g, ''), 10);
        if (isNaN(usd) || usd < 1) {
          if (walletBuyStatus) {
            walletBuyStatus.textContent = 'Enter a valid USD amount (at least $1).';
            walletBuyStatus.className = 'wallet-status error';
          }
          return;
        }
        fetchBtcPriceThen(function (usdPerBtc) {
          var btc = usd / usdPerBtc;
          var totalAfter = (state.totalBtcPurchased || 0) + btc;
          if (totalAfter > 1000) {
            if (walletBuyStatus) {
              walletBuyStatus.textContent = '.......we know you aren\'t that rich, breh. Buy less.';
              walletBuyStatus.className = 'wallet-status error';
            }
            setTimeout(function () {
              if (walletBuyStatus) walletBuyStatus.textContent = '';
            }, 5000);
            return;
          }
          var bankBal = state.bankBalance != null ? state.bankBalance : 7500000;
          if (bankBal < usd) {
            if (walletBuyStatus) {
              walletBuyStatus.textContent = 'Insufficient funds in linked account. Available: $' + bankBal.toLocaleString() + '.';
              walletBuyStatus.className = 'wallet-status error';
            }
            setTimeout(function () {
              if (walletBuyStatus) walletBuyStatus.textContent = '';
            }, 5000);
            return;
          }
          state.bankBalance = bankBal - usd;
          addBankTransaction({ type: 'bitcoin_purchase', from: 'checking', amount: usd });
          updateBankBalanceDisplay();
          state.totalBtcPurchased = totalAfter;
          state.walletBalance = (state.walletBalance || 0) + btc;
          updateWalletBalanceDisplay();
          if (walletBuyUsd) walletBuyUsd.value = '';
          updateBuyPreview();
          if (walletBuyStatus) {
            walletBuyStatus.textContent = 'Purchase complete. +' + btc.toFixed(8) + ' BTC added to wallet.';
            walletBuyStatus.className = 'wallet-status success';
          }
          setTimeout(function () {
            if (walletBuyStatus) walletBuyStatus.textContent = '';
          }, 4000);
          var cardEl = $('#wallet-card-number');
          var cardVal = cardEl ? String(cardEl.value).replace(/\D/g, '') : '4242';
          var last4 = cardVal.slice(-4);
          var last4Display = last4.length === 4 ? 'x' + last4 : 'xXXXX';
          addBmailEmail(
            'Withdrawal – $' + usd.toLocaleString() + ' USD',
            'Transaction: Bitcoin purchase\nAmount: $' + usd.toLocaleString() + ' USD\nCard: ' + last4Display + '\nBTC received: ' + btc.toFixed(8) + ' BTC\n\nNew checking balance: $' + state.bankBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD\n\nDate: ' + new Date().toLocaleString() + '\n\n— BNC',
            'BNC <alerts@bnc.bank>'
          );
          addBmailEmail(
            'Your Bitcoin purchase is complete',
            'You purchased ' + btc.toFixed(8) + ' BTC.\n\nAmount charged: $' + usd.toLocaleString() + ' USD\nPayment method: ' + last4Display + '\n\nYour new balance has been updated in your wallet.\n\n— Bitmonster - BTC Wallet',
            'Bitmonster - BTC Wallet <noreply@bitmonster.bmail>'
          );
          showBmailNewMessagePopup();
        });
      });
    }

    var walletSendAmount = $('#wallet-send-amount');
    var walletSendAddress = $('#wallet-send-address');
    var walletSendPasteRansom = $('#wallet-send-paste-ransom');
    var walletSendConfirm = $('#wallet-send-confirm');
    var walletSendStatus = $('#wallet-send-status');
    if (walletSendPasteRansom) {
      walletSendPasteRansom.addEventListener('click', function () {
        if (walletSendAddress && state.ransomBtcAddress) walletSendAddress.value = state.ransomBtcAddress;
      });
    }
    if (walletSendConfirm) {
      walletSendConfirm.addEventListener('click', function () {
        var amount = parseFloat(String(walletSendAmount ? walletSendAmount.value : '').replace(/,/g, ''), 10);
        var addr = walletSendAddress ? String(walletSendAddress.value).trim() : '';
        if (isNaN(amount) || amount <= 0) {
          if (walletSendStatus) {
            walletSendStatus.textContent = 'Enter a valid BTC amount.';
            walletSendStatus.className = 'wallet-status error';
          }
          return;
        }
        var balance = state.walletBalance || 0;
        if (amount > balance) {
          if (walletSendStatus) {
            walletSendStatus.textContent = 'Insufficient balance. You have ' + balance.toFixed(8) + ' BTC.';
            walletSendStatus.className = 'wallet-status error';
          }
          return;
        }
        if (!addr || addr.length < 20) {
          if (walletSendStatus) {
            walletSendStatus.textContent = 'Enter a valid recipient address (or use "Use ransom address").';
            walletSendStatus.className = 'wallet-status error';
          }
          return;
        }
        state.walletBalance = balance - amount;
        state.ransomPayments.push({
          amount: amount,
          to: addr,
          at: Date.now(),
        });
        updateWalletBalanceDisplay();
        if (walletSendAmount) walletSendAmount.value = '';
        if (walletSendAddress) walletSendAddress.value = '';
        if (walletSendStatus) {
          walletSendStatus.textContent = 'Sent ' + amount.toFixed(8) + ' BTC. The operator will see this payment.';
          walletSendStatus.className = 'wallet-status success';
        }
        setTimeout(function () {
          if (walletSendStatus) walletSendStatus.textContent = '';
        }, 5000);
        addBmailEmail(
          'Bitcoin sent – ' + amount.toFixed(8) + ' BTC',
          'You sent ' + amount.toFixed(8) + ' BTC to:\n' + addr + '\n\nTransaction completed. (Training simulation)\n\n— Bitmonster - BTC Wallet',
          'Bitmonster - BTC Wallet <noreply@bitmonster.bmail>'
        );
        showBmailNewMessagePopup();
        saveState();
      });
    }

    var bmailWindow = document.getElementById('bmail-window');
    var bmailWindowClose = document.getElementById('bmail-window-close');
    var bmailIcon = document.getElementById('bmail-icon');

    function openBmailWindow() {
      closeAllAppWindows();
      if (!bmailWindow) return;
      bmailWindow.removeAttribute('hidden');
      requestAnimationFrame(function () {
        bmailWindow.classList.add('bmail-window-open');
      });
      var bmailView = $('#bmail-view');
      if (bmailView) bmailView.setAttribute('hidden', 'true');
      renderBmailInbox();
    }

    if (bmailIcon && bmailWindow) {
      bmailIcon.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openBmailWindow();
      });
    }
    if (bmailWindowClose && bmailWindow) {
      bmailWindowClose.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        bmailWindow.classList.remove('bmail-window-open');
        bmailWindow.setAttribute('hidden', 'true');
      });
    }

    var bmailPopupReadBtn = document.getElementById('bmail-popup-read-btn');
    if (bmailPopupReadBtn) {
      bmailPopupReadBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        clearTimeout(state.bmailPopupTimeout);
        var popup = $('#bmail-new-message-popup');
        if (popup) popup.setAttribute('hidden', 'true');
        openBmailAndShowLatestEmail();
      });
    }

    var startMenuLeaderboard = document.getElementById('start-menu-leaderboard');
    if (startMenuLeaderboard && startMenu) {
      startMenuLeaderboard.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openLeaderboardWindow();
        startMenu.hidden = true;
        startMenu.setAttribute('aria-hidden', 'true');
      });
    }

    var leaderboardWindow = document.getElementById('leaderboard-window');
    var leaderboardWindowClose = document.getElementById('leaderboard-window-close');
    if (leaderboardWindowClose && leaderboardWindow) {
      leaderboardWindowClose.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeLeaderboardWindow();
      });
    }

    var desktopWindows = document.getElementById('desktop-windows');
    if (desktopWindows) {
      desktopWindows.addEventListener('click', function (e) {
        var closeBtn = e.target && e.target.closest && e.target.closest('.fake-app-window-close');
        if (!closeBtn) return;
        var windowId = closeBtn.getAttribute('data-window');
        if (windowId) {
          e.preventDefault();
          e.stopPropagation();
          closeFakeAppWindow(windowId);
        }
      });
    }

    (function initFileExplorer() {
      var sidebar = document.querySelector('.file-explorer-window .file-explorer-sidebar');
      if (sidebar) {
        sidebar.querySelectorAll('.file-explorer-folder').forEach(function (btn) {
          var folderId = btn.getAttribute('data-folder');
          btn.addEventListener('click', function () { setFileExplorerFolder(folderId); });
          btn.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            btn.classList.add('file-explorer-drop-target');
          });
          btn.addEventListener('dragleave', function () { btn.classList.remove('file-explorer-drop-target'); });
          btn.addEventListener('drop', function (e) { handleFileExplorerDrop(e, folderId); });
        });
      }
      var main = document.getElementById('file-explorer-main');
      if (main) {
        main.addEventListener('dragover', function (e) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          main.classList.add('file-explorer-drop-target');
        });
        main.addEventListener('dragleave', function () { main.classList.remove('file-explorer-drop-target'); });
        main.addEventListener('drop', function (e) { handleFileExplorerDrop(e, state.fileExplorerSelectedFolder); });
      main.addEventListener('contextmenu', function (e) {
        if (!e.target.closest || !e.target.closest('.file-explorer-item')) {
          e.preventDefault();
          state.fileExplorerContextItem = null;
          state.fileExplorerContextFolder = null;
          showFileExplorerContextMenu(e.clientX, e.clientY);
        }
      });
      }
      var contextMenu = document.getElementById('file-explorer-context-menu');
      if (contextMenu) {
        contextMenu.querySelector('[data-action="copy"]').addEventListener('click', function () {
          if (state.fileExplorerContextItem && state.fileExplorerContextFolder !== undefined) {
            state.fileExplorerClipboard = { item: state.fileExplorerContextItem, folderId: state.fileExplorerContextFolder, cut: false };
            contextMenu.setAttribute('hidden', 'true');
          }
        });
        contextMenu.querySelector('[data-action="paste"]').addEventListener('click', function () {
          if (!state.fileExplorerClipboard) return;
          var toFolder = state.fileExplorerSelectedFolder;
          if (toFolder === 'desktop') { contextMenu.setAttribute('hidden', 'true'); return; }
          addItemToFolder(toFolder, state.fileExplorerClipboard.item);
          if (state.fileExplorerClipboard.cut) removeItemFromFolder(state.fileExplorerClipboard.folderId, state.fileExplorerClipboard.item.id);
          state.fileExplorerClipboard = null;
          setFileExplorerFolder(toFolder);
          saveState();
          contextMenu.setAttribute('hidden', 'true');
        });
      }
      document.addEventListener('click', function () {
        var cm = document.getElementById('file-explorer-context-menu');
        if (cm && !cm.hidden) cm.setAttribute('hidden', 'true');
      });
    })();

    (function initEdgeBrowser() {
      var addressInput = document.getElementById('edge-address-input');
      var goBtn = document.getElementById('edge-go-btn');
      var homePage = document.getElementById('edge-home');
      var firewallBlock = document.getElementById('edge-firewall-block');
      var onionBlock = document.getElementById('edge-onion-block');
      var blockedUrlEl = document.getElementById('edge-blocked-url');
      var onionUrlEl = document.getElementById('edge-onion-url');

      function showEdgePage(which) {
        if (homePage) homePage.classList.toggle('hidden', which !== 'home');
        if (firewallBlock) firewallBlock.classList.toggle('hidden', which !== 'firewall');
        if (onionBlock) onionBlock.classList.toggle('hidden', which !== 'onion');
      }

      function tryNavigate() {
        var url = (addressInput && addressInput.value) ? addressInput.value.trim() : '';
        if (!url) {
          showEdgePage('home');
          return;
        }
        var lower = url.toLowerCase();
        if (lower.indexOf('.onion') !== -1) {
          if (onionUrlEl) onionUrlEl.textContent = url;
          showEdgePage('onion');
        } else {
          if (blockedUrlEl) blockedUrlEl.textContent = url;
          showEdgePage('firewall');
        }
      }

      if (goBtn) goBtn.addEventListener('click', tryNavigate);
      if (addressInput) {
        addressInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            tryNavigate();
          }
        });
      }
    })();

    var startMenuTiles = [
      { tile: 'start-menu-file-explorer', window: 'file-explorer-window', folder: null },
      { tile: 'start-menu-leaderboard', window: 'leaderboard-window', folder: null },
      { tile: 'start-menu-edge', window: 'edge-window', folder: null },
      { tile: 'start-menu-calendar', window: 'calendar-window', folder: null },
      { tile: 'start-menu-calculator', window: 'calculator-window', folder: null },
      { tile: 'start-menu-documents', window: 'file-explorer-window', folder: 'documents' },
      { tile: 'start-menu-pictures', window: 'file-explorer-window', folder: 'pictures' },
      { tile: 'start-menu-music', window: 'file-explorer-window', folder: 'music' },
      { tile: 'start-menu-videos', window: 'file-explorer-window', folder: 'videos' }
    ];
    startMenuTiles.forEach(function (item) {
      var el = document.getElementById(item.tile);
      if (el && startMenu) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (item.window === 'leaderboard-window') {
            openLeaderboardWindow();
          } else if (item.window === 'file-explorer-window') {
            openFakeAppWindow('file-explorer-window');
            if (item.folder && window.setFileExplorerFolder) setFileExplorerFolder(item.folder);
          } else {
            openFakeAppWindow(item.window);
          }
          startMenu.hidden = true;
          startMenu.setAttribute('aria-hidden', 'true');
        });
      }
    });

    (function initCalculator() {
      var display = document.getElementById('calculator-display');
      if (!display) return;
      var calcState = { current: '0', prev: null, op: null, fresh: true };
      function updateDisplay() {
        display.textContent = calcState.current;
      }
      function inputDigit(d) {
        if (calcState.fresh) {
          calcState.current = d === '.' ? '0.' : d;
          calcState.fresh = false;
        } else {
          if (d === '.' && calcState.current.indexOf('.') !== -1) return;
          if (d === '.') calcState.current += '.';
          else calcState.current += d;
        }
        updateDisplay();
      }
      function inputOp(op) {
        var num = parseFloat(calcState.current);
        if (calcState.prev !== null && calcState.op !== null) {
          var prev = calcState.prev;
          if (calcState.op === '+') num = prev + num;
          else if (calcState.op === '-') num = prev - num;
          else if (calcState.op === '*') num = prev * num;
          else if (calcState.op === '/') num = prev / num;
          else if (calcState.op === '%') num = prev % num;
          calcState.current = String(num);
          updateDisplay();
        }
        calcState.prev = parseFloat(calcState.current);
        calcState.op = op === '±' ? null : op;
        calcState.fresh = true;
        if (op === '±') {
          calcState.current = String(-parseFloat(calcState.current));
          updateDisplay();
          calcState.fresh = true;
        }
      }
      function doEquals() {
        if (calcState.op === null) return;
        var num = parseFloat(calcState.current);
        var prev = calcState.prev !== null ? calcState.prev : num;
        var result = prev;
        if (calcState.op === '+') result = prev + num;
        else if (calcState.op === '-') result = prev - num;
        else if (calcState.op === '*') result = prev * num;
        else if (calcState.op === '/') result = num !== 0 ? prev / num : 'Error';
        else if (calcState.op === '%') result = num !== 0 ? prev % num : 'Error';
        calcState.current = String(result);
        calcState.prev = null;
        calcState.op = null;
        calcState.fresh = true;
        updateDisplay();
      }
      function doClear() {
        calcState.current = '0';
        calcState.prev = null;
        calcState.op = null;
        calcState.fresh = true;
        updateDisplay();
      }
      document.querySelectorAll('.calculator-btn-num').forEach(function (btn) {
        btn.addEventListener('click', function () { inputDigit(btn.getAttribute('data-num')); });
      });
      var dotBtn = document.getElementById('calculator-dot');
      if (dotBtn) dotBtn.addEventListener('click', function () { inputDigit('.'); });
      document.querySelectorAll('.calculator-btn-op').forEach(function (btn) {
        btn.addEventListener('click', function () { inputOp(btn.getAttribute('data-op')); });
      });
      var eqBtn = document.getElementById('calculator-equals');
      if (eqBtn) eqBtn.addEventListener('click', doEquals);
      var clearBtn = document.getElementById('calculator-clear');
      if (clearBtn) clearBtn.addEventListener('click', doClear);
    })();

    (function initCalendar() {
      var prevBtn = document.getElementById('calendar-prev-month');
      var nextBtn = document.getElementById('calendar-next-month');
      var addBtn = document.getElementById('calendar-add-event');
      var dateInput = document.getElementById('calendar-event-date');
      if (prevBtn) prevBtn.addEventListener('click', function () {
        state.calendarViewMonth--;
        if (state.calendarViewMonth < 0) { state.calendarViewMonth = 11; state.calendarViewYear--; }
        renderCalendar();
      });
      if (nextBtn) nextBtn.addEventListener('click', function () {
        state.calendarViewMonth++;
        if (state.calendarViewMonth > 11) { state.calendarViewMonth = 0; state.calendarViewYear++; }
        renderCalendar();
      });
      if (addBtn) addBtn.addEventListener('click', addCalendarEvent);
      if (dateInput && !dateInput.value) dateInput.value = toDateKey(new Date());
    })();

    var gameWindowClose = document.getElementById('game-window-close');
    if (gameWindowClose) {
      gameWindowClose.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var gameWindow = $('#game-window');
        if (gameWindow) gameWindow.setAttribute('hidden', 'true');
      });
    }

    document.addEventListener('click', function (e) {
      if (startMenu && !startMenu.hidden) {
        startMenu.hidden = true;
        startMenu.setAttribute('aria-hidden', 'true');
      }
    });

    if (taskbarStart && startMenu) {
      taskbarStart.addEventListener('click', function (e) {
        e.stopPropagation();
        startMenu.hidden = !startMenu.hidden;
        startMenu.setAttribute('aria-hidden', String(startMenu.hidden));
        if (!startMenu.hidden && typeof updateStartMenuUsername === 'function') updateStartMenuUsername();
      });
    }
    if (startMenu) {
      startMenu.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
    var chatPanelSend = document.getElementById('chat-panel-send');
    var chatPanelInput = document.getElementById('chat-panel-input');
    if (chatPanelSend && chatPanelInput) {
      chatPanelSend.addEventListener('click', function () {
        var text = (chatPanelInput.value || '').trim();
        if (!text) return;
        sendNegotiationMessage(text);
      });
      chatPanelInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          var text = (chatPanelInput.value || '').trim();
          if (!text) return;
          sendNegotiationMessage(text);
        }
      });
    }
    var chatSuggestionsToggle = document.getElementById('chat-suggestions-toggle');
    var chatSuggestionsDrawer = document.getElementById('chat-suggestions-drawer');
    var chatPanelEl = document.getElementById('chat-panel');
    if (chatSuggestionsToggle && chatSuggestionsDrawer) {
      chatSuggestionsToggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (chatSuggestionsDrawer.hasAttribute('hidden')) return;
        var open = chatSuggestionsDrawer.classList.toggle('open');
        chatSuggestionsToggle.setAttribute('aria-expanded', String(open));
        if (chatPanelEl) chatPanelEl.classList.toggle('chat-panel-suggestions-open', open);
      });
    }
    var chatPanelOpenTracker = document.getElementById('chat-panel-open-tracker');
    if (chatPanelOpenTracker) {
      chatPanelOpenTracker.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openRansomTracker();
      });
    }
    var chatPanel = document.getElementById('chat-panel');
    var chatPanelToggle = document.getElementById('chat-panel-toggle');
    if (chatPanel && chatPanelToggle) {
      chatPanelToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var minimized = chatPanel.classList.toggle('chat-panel-minimized');
        chatPanelToggle.textContent = minimized ? '\u25A1' : '\u2212';
        chatPanelToggle.setAttribute('aria-label', minimized ? 'Restore chat' : 'Minimize chat');
      });
      chatPanel.querySelector('.chat-panel-header').addEventListener('click', function (e) {
        if (e.target === chatPanelToggle || chatPanelToggle.contains(e.target)) return;
        if (chatPanel.classList.contains('chat-panel-minimized')) {
          chatPanel.classList.remove('chat-panel-minimized');
          chatPanelToggle.textContent = '\u2212';
          chatPanelToggle.setAttribute('aria-label', 'Minimize chat');
        }
      });
    }
    var navLb = $('#nav-leaderboard');
    if (navLb) {
      navLb.addEventListener('click', function (e) {
        e.preventDefault();
        openLeaderboardWindow();
      });
    }

    var startMenuLogoff = document.getElementById('start-menu-logoff');
    if (startMenuLogoff && startMenu) {
      startMenuLogoff.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        startMenu.hidden = true;
        startMenu.setAttribute('aria-hidden', 'true');
        state.sessionUsername = null;
        closeAllAppWindows();
        var gw = $('#game-window');
        if (gw) gw.setAttribute('hidden', 'true');
        var loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.removeAttribute('hidden');
      });
    }

    var startMenuPower = document.getElementById('start-menu-power');
    if (startMenuPower && startMenu) {
      startMenuPower.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var powerOff = window.confirm('Do you want to power off the PC?');
        if (powerOff) {
          startMenu.hidden = true;
          startMenu.setAttribute('aria-hidden', 'true');
          var un = state.sessionUsername;
          state.sessionUsername = null;
          try {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            if (un) localStorage.removeItem(getStateKey(un));
          } catch (e) {}
          state.chatMessages = [];
          state.torHistoryStack = [];
          state.torHistoryList = [];
          state.torHistoryIndex = -1;
          state.torCurrentPage = 'start';
          state.torChatStarted = false;
          if (torContent) renderTorStartPage();
          closeAllAppWindows();
          var gw = $('#game-window');
          if (gw) gw.setAttribute('hidden', 'true');
          var loginScreen = document.getElementById('login-screen');
          if (loginScreen) loginScreen.removeAttribute('hidden');
        }
      });
    }

    window.addEventListener('beforeunload', saveState);
    window.addEventListener('pagehide', saveState);

    var loginFormEl = document.getElementById('login-form');
    var loginUsernameEl = document.getElementById('login-username');
    if (loginFormEl && loginUsernameEl && loginScreen) {
      loginFormEl.addEventListener('submit', function (e) {
        e.preventDefault();
        var raw = (loginUsernameEl.value || '').trim();
        if (raw.length < 1 || raw.length > 50) return;
        state.sessionUsername = raw;
        if (typeof updateStartMenuUsername === 'function') updateStartMenuUsername();
        try { localStorage.setItem(SESSION_STORAGE_KEY, raw); } catch (err) {}
        var savedForUser = null;
        try { savedForUser = localStorage.getItem(getStateKey(raw)); } catch (err) {}
        if (savedForUser) {
          try {
            var parsed = JSON.parse(savedForUser);
            if (parsed && (parsed.started != null || parsed.phase != null)) {
              loadStateFromSaved(parsed);
              applyRestoredStateUI();
            } else {
              generateSessionRansomValues();
              updateRansomNoteContent();
              startGame();
              if (torContent) renderTorStartPage();
              var readmeIconNew = document.getElementById('readme-icon');
              if (readmeIconNew) readmeIconNew.classList.add('attention');
            }
          } catch (err) {
            generateSessionRansomValues();
            updateRansomNoteContent();
            startGame();
            if (torContent) renderTorStartPage();
            var readmeIconNew = document.getElementById('readme-icon');
            if (readmeIconNew) readmeIconNew.classList.add('attention');
          }
        } else {
          generateSessionRansomValues();
          updateRansomNoteContent();
          startGame();
          if (torContent) renderTorStartPage();
          var readmeIconNew = document.getElementById('readme-icon');
          if (readmeIconNew) readmeIconNew.classList.add('attention');
        }
        loginScreen.setAttribute('hidden', 'true');
        saveState();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
