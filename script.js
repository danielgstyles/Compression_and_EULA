/* =========================================================================
   Lessons 9-10 — Data Compression and Terms of Use/EULA (self-paced site) v2
   Vanilla JS, single IIFE, no dependencies, no build step, no network calls
   except the YouTube thumbnail image in Section 3. All state lives in
   localStorage on this device and browser only.
   ========================================================================= */
(function () {
  'use strict';

  var STORE = 'ct-lesson9-10-compression-eula-selfpaced-v2';

  /* ---------------- state schema + persistence ---------------- */
  var DEFAULT_STATE = {
    commitText: '', committed: false,
    hookRevealed: {},
    qc: {},
    songOrder: null, songOrderChecked: false, songOrderCorrect: false,
    rle1: { value: '', checked: false, correct: false },
    rle2: { value: '', checked: false, correct: false },
    s3d: {},
    s3e: { selected: [], checked: false },
    s4cat: {}, s4catChecked: false,
    s5: {},
    s6a: { row1: null, row2: null, checked: false },
    s6b: { value: '', checked: false, correct: false },
    s6c: { blanks: [null, null, null, null], checked: false },
    s6d: { selected: [], checked: false },
    s6e: { blanks: [null, null, null, null], checked: false },
    s6fOrder: null, s6fOrderChecked: false, s6fOrderCorrect: false,
    s6fProse: '', s6fProseSaved: false, s6fTicks: [false, false, false],
    exitFormats: { lossless: '', lossy: '', checked: false },
    exitDefs: { lossless: '', lossy: '', saved: false, ticks: [false, false, false] },
    s7e: { blanks: [null, null, null, null], checked: false },
    s7f: { selected: [], checked: false },
    s8match: {}, s8matchChecked: false,
    s8leftover: {},
    s9a: {},
    s9b: { doneIds: [], streak: 0, queue: null, current: null, currentChecked: false, currentCorrect: null },
    s10: { app: '', clauses: '', meaning: '', surprise: '', saved: false, ticks: [false, false, false, false, false, false, false, false, false] },
    s11aSide: null,
    s11aEvidence: { selected: [], checked: false },
    s11aProse: '', s11aProseSaved: false, s11aTicks: [false, false],
    s11b: { f1: '', f2: '', f3: '', saved: false, ticks: [false, false, false] },
    sections: [],
    studentName: '', studentClass: '', summaryPrinted: false
  };

  function mergeDefaults(def, saved) {
    if (saved === undefined || saved === null) return def;
    if (Array.isArray(def)) return Array.isArray(saved) ? saved : def;
    if (def !== null && typeof def === 'object') {
      var out = {};
      // Copy every saved key first — this matters for dictionary-style state
      // (e.g. s4cat, s8match, s3d, qc, hookRevealed) whose DEFAULT_STATE entry
      // is an empty {} with no fixed keys, so merging by the default's own
      // keys alone would silently discard everything saved under it.
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        Object.keys(saved).forEach(function (k) { out[k] = saved[k]; });
      }
      // Then ensure every schema key from the default is present/merged
      // (fills in missing fields on fixed-shape objects like s6a, s10, exitFormats).
      Object.keys(def).forEach(function (k) { out[k] = mergeDefaults(def[k], saved ? saved[k] : undefined); });
      return out;
    }
    return saved;
  }

  var state = DEFAULT_STATE;

  function load() {
    try {
      var raw = window.localStorage.getItem(STORE);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      state = mergeDefaults(DEFAULT_STATE, parsed);
    } catch (e) { /* storage unavailable — the page works fine without it */ }
  }

  function save() {
    try { window.localStorage.setItem(STORE, JSON.stringify(state)); }
    catch (e) { /* ignore */ }
  }

  function markSection(n) {
    if (state.sections.indexOf(n) === -1) {
      state.sections.push(n);
      save();
    }
    renderProgress();
  }

  /* ---------------- progress tracker ---------------- */
  function renderProgress() {
    var links = document.querySelectorAll('[data-progress-step]');
    Array.prototype.forEach.call(links, function (a) {
      var n = parseInt(a.getAttribute('data-progress-step'), 10);
      var done = state.sections.indexOf(n) !== -1;
      a.classList.toggle('done', done);
      a.setAttribute('aria-label', 'Section ' + n + (done ? ' — finished' : ' — not finished yet'));
      var sec = document.querySelector('.section[data-section="' + n + '"]');
      if (sec) sec.classList.toggle('section-done', done);
    });
    var count = document.getElementById('progress-count');
    if (count) count.textContent = state.sections.length + ' of 12 sections finished';
  }

  function markCurrentSection() {
    var secs = document.querySelectorAll('.section[data-section]');
    var best = null, bestTop = -Infinity;
    Array.prototype.forEach.call(secs, function (s) {
      var top = s.getBoundingClientRect().top - 160;
      if (top <= 0 && top > bestTop) { bestTop = top; best = s; }
    });
    var links = document.querySelectorAll('[data-progress-step]');
    Array.prototype.forEach.call(links, function (a) {
      a.classList.toggle('current', !!best && a.getAttribute('data-progress-step') === best.getAttribute('data-section'));
    });
  }

  /* ---------------- generic helpers ---------------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function $(id) { return document.getElementById(id); }

  // Fisher-Yates shuffle, returns a new array — used to stop the option
  // order matching the item order in a fixed-option-set classify list
  // (e.g. "Which trick would help?", where every item offered the same
  // three options in the same order and the correct answer walked
  // straight down the list: item 1 -> option 1, item 2 -> option 2...).
  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function setsEqual(a, b) {
    if (a.length !== b.length) return false;
    var sa = a.slice().sort(), sb = b.slice().sort();
    for (var i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
    return true;
  }

  /* =========================================================================
     GENERIC WIDGET BUILDERS (shared across sections)
     ========================================================================= */

  /* ---- generic single-select "classify" list (per-item, own Check button) ---- */
  function classifyFeedback(item, chosen) {
    if (item.correct === null) {
      var opening = (item.neutralOpenings && item.neutralOpenings[chosen]) || '';
      return { kind: 'neutral', html: '<p class="verdict-open">' + opening + '</p>' + item.neutralBody, label: item.neutralLabel ? item.neutralLabel(chosen) : 'No single correct answer' };
    }
    var isRight = chosen === item.correct;
    if (isRight) return { kind: 'good', html: '<p>' + item.good + '</p>' };
    var wrongText = (item.wrong && item.wrong[chosen]) || item.wrongDefault || 'Not quite — have another look and try again.';
    return { kind: 'bad', html: '<p>' + wrongText + '</p>' };
  }

  function buildClassifyList(containerId, items, bucket, validationMsg, onUpdate, opts) {
    var wrap = $(containerId);
    if (!wrap) return;
    opts = opts || {};
    items.forEach(function (item) {
      var elCard = el('article', 'classify-item');
      elCard.setAttribute('data-item', item.id);
      var optionList = item.options || ['Lossless', 'Lossy'];
      var html = '';
      if (item.name) html += '<h3>' + item.name + '</h3>';
      if (opts.showClauseText && item.text) html += '<p class="classify-clause-text">“' + item.text + '”</p>';
      else if (item.desc) html += '<p class="classify-desc">' + item.desc + '</p>';
      html += '<div class="classify-options" role="group" aria-label="Options">';
      optionList.forEach(function (opt) {
        html += '<button type="button" class="btn btn-option" aria-pressed="false" data-opt="' + escapeHtml(opt) + '">' + escapeHtml(opt) + '</button>';
      });
      html += '</div>';
      html += '<div class="btn-row"><button type="button" class="btn btn-primary check-btn">Check</button>' +
              '<button type="button" class="btn btn-ghost retry-btn" hidden>Try again</button></div>';
      html += '<div class="item-feedback" hidden aria-live="polite"></div>';
      elCard.innerHTML = html;
      wrap.appendChild(elCard);

      var fb = elCard.querySelector('.item-feedback');
      var checkBtn = elCard.querySelector('.check-btn');
      var retryBtn = elCard.querySelector('.retry-btn');

      function selected() {
        var b = elCard.querySelector('.btn-option[aria-pressed="true"]');
        return b ? b.getAttribute('data-opt') : null;
      }
      function setSelected(value) {
        Array.prototype.forEach.call(elCard.querySelectorAll('.btn-option'), function (b) {
          b.setAttribute('aria-pressed', b.getAttribute('data-opt') === value ? 'true' : 'false');
        });
      }
      Array.prototype.forEach.call(elCard.querySelectorAll('.btn-option'), function (b) {
        b.addEventListener('click', function () {
          var on = b.getAttribute('aria-pressed') === 'true';
          Array.prototype.forEach.call(elCard.querySelectorAll('.btn-option'), function (opt) {
            opt.setAttribute('aria-pressed', 'false');
            opt.classList.remove('picked-correct', 'picked-wrong', 'picked-neutral');
          });
          b.setAttribute('aria-pressed', on ? 'false' : 'true');
        });
      });

      function check(chosen, persist) {
        if (!chosen) {
          fb.className = 'item-feedback bad';
          fb.innerHTML = '<p class="fb-head">' + validationMsg + '</p>';
          fb.hidden = false;
          return;
        }
        var result = classifyFeedback(item, chosen);
        var head = result.kind === 'good' ? 'Correct' : (result.kind === 'neutral' ? (result.label || 'No single correct answer') : 'Have another look');
        fb.className = 'item-feedback ' + (result.kind === 'good' ? 'good' : (result.kind === 'neutral' ? 'neutral' : 'bad'));
        if (result.kind === 'neutral') fb.setAttribute('data-label', result.label || 'No single correct answer');
        fb.innerHTML = (result.kind === 'neutral' ? result.html : '<p class="fb-head">' + head + '</p>' + result.html);
        fb.hidden = false;
        elCard.classList.remove('done-correct', 'done-wrong', 'done-neutral');
        if (result.kind === 'good') elCard.classList.add('done-correct');
        else if (result.kind === 'neutral') elCard.classList.add('done-neutral');
        else elCard.classList.add('done-wrong');
        retryBtn.hidden = false;
        Array.prototype.forEach.call(elCard.querySelectorAll('.btn-option'), function (b) {
          b.classList.remove('picked-correct', 'picked-wrong', 'picked-neutral');
          if (b.getAttribute('data-opt') === chosen) {
            b.classList.add(result.kind === 'good' ? 'picked-correct' : (result.kind === 'neutral' ? 'picked-neutral' : 'picked-wrong'));
          }
        });
        if (persist !== false) {
          bucket[item.id] = { chosen: chosen, correct: result.kind === 'good', neutral: result.kind === 'neutral' };
          save();
          onUpdate();
        }
      }
      checkBtn.addEventListener('click', function () { check(selected(), true); });
      retryBtn.addEventListener('click', function () {
        fb.hidden = true; fb.innerHTML = ''; retryBtn.hidden = true;
        elCard.classList.remove('done-correct', 'done-wrong', 'done-neutral');
        Array.prototype.forEach.call(elCard.querySelectorAll('.btn-option'), function (b) {
          b.classList.remove('picked-correct', 'picked-wrong', 'picked-neutral');
        });
        setSelected(null);
        elCard.querySelector('.btn-option').focus();
      });

      var prior = bucket[item.id];
      if (prior && prior.chosen) { setSelected(prior.chosen); check(prior.chosen, false); }
    });
  }

  /* ---- generic multi-select ("select all that apply") ---- */
  function buildMultiSelect(containerId, options, bucket, cfg) {
    // options: [{text}]; cfg: {isCorrect(selectedArr), noteFor(index1based, isSelected), resultFor(selectedArr), checkLabel, validationMsg, onChecked}
    var wrap = $(containerId);
    if (!wrap) return;
    var checkLabel = cfg.checkLabel || 'Check my selections';
    var validationMsg = cfg.validationMsg || 'Select at least one first, then press Check.';
    var html = '<ul class="ms-list">';
    options.forEach(function (opt, i) {
      html += '<li><div class="ms-option-row"><button type="button" class="ms-toggle" aria-pressed="false" data-idx="' + (i + 1) + '">' + (i + 1) + '</button>' +
        '<span class="ms-option-text">' + opt.text + '</span></div><div class="ms-note" hidden></div></li>';
    });
    html += '</ul><div class="btn-row"><button type="button" class="btn btn-primary check-btn">' + checkLabel + '</button></div>' +
      '<p class="hint" hidden></p><div class="ms-result" hidden></div>';
    wrap.innerHTML = html;

    var hint = wrap.querySelector('.hint');
    var result = wrap.querySelector('.ms-result');
    var lis = wrap.querySelectorAll('.ms-list > li');

    function selectedArr() {
      var arr = [];
      Array.prototype.forEach.call(wrap.querySelectorAll('.ms-toggle'), function (b) {
        if (b.getAttribute('aria-pressed') === 'true') arr.push(parseInt(b.getAttribute('data-idx'), 10));
      });
      return arr;
    }
    function setSelected(arr) {
      Array.prototype.forEach.call(wrap.querySelectorAll('.ms-toggle'), function (b) {
        var idx = parseInt(b.getAttribute('data-idx'), 10);
        b.setAttribute('aria-pressed', arr.indexOf(idx) !== -1 ? 'true' : 'false');
      });
    }
    Array.prototype.forEach.call(wrap.querySelectorAll('.ms-toggle'), function (b) {
      b.addEventListener('click', function () {
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      });
    });

    function check(persist) {
      var sel = selectedArr();
      if (!sel.length) { hint.hidden = false; hint.textContent = validationMsg; return; }
      hint.hidden = true;
      Array.prototype.forEach.call(lis, function (li, i) {
        var note = li.querySelector('.ms-note');
        var isSelected = sel.indexOf(i + 1) !== -1;
        var info = cfg.noteFor(i + 1, isSelected);
        note.className = 'ms-note ' + info.cls;
        note.innerHTML = info.text;
        note.hidden = false;
      });
      var r = cfg.resultFor(sel);
      result.className = 'ms-result ' + (r.good ? 'good' : 'bad');
      result.innerHTML = (r.good ? 'Correct — ' : 'Have another look — ') + r.text;
      result.hidden = false;
      if (persist !== false) {
        // Persist the computed result itself, not just the raw selection —
        // any later reader (the work summary) must not recompute correctness
        // against a fixed index set of its own, since option order can be
        // shuffled per render and selected indices are only meaningful
        // against the order shown at the time they were picked.
        bucket.selected = sel; bucket.checked = true; bucket.correct = r.good;
        save();
        if (cfg.onChecked) cfg.onChecked(r.good, sel);
      }
    }
    wrap.querySelector('.check-btn').addEventListener('click', function () { check(true); });

    if (bucket.checked && bucket.selected && bucket.selected.length) {
      setSelected(bucket.selected);
      check(false);
    }
  }

  /* ---- generic cloze (word-bank fill, per-blank <select>) ---- */
  function buildCloze(containerId, wordbank, template, correctWords, feedbackFn, bucket, cfg) {
    // template: array of strings/blank-markers, e.g. ['To make the JPEG eight times ', {blank:0}, ' than the RAW...']
    cfg = cfg || {};
    var wrap = $(containerId);
    if (!wrap) return;
    var html = '<div class="wordbank-display">';
    wordbank.forEach(function (w) { html += '<span class="wordbank-chip">' + escapeHtml(w) + '</span>'; });
    html += '</div><p class="cloze-sentence">';
    template.forEach(function (part) {
      if (typeof part === 'string') html += part;
      else {
        html += '<select class="cloze-select" data-blank="' + part.blank + '"><option value="">— choose —</option>';
        wordbank.forEach(function (w) { html += '<option value="' + escapeHtml(w) + '">' + escapeHtml(w) + '</option>'; });
        html += '</select>';
      }
    });
    html += '</p><div class="btn-row"><button type="button" class="btn btn-primary check-btn">' + (cfg.checkLabel || 'Check my answer') + '</button></div>' +
      '<p class="hint" hidden></p><div class="cloze-notes" hidden></div>';
    wrap.innerHTML = html;

    var selects = wrap.querySelectorAll('.cloze-select');
    var hint = wrap.querySelector('.hint');
    var notes = wrap.querySelector('.cloze-notes');

    function values() {
      var v = [];
      selects.forEach(function (s) { v[parseInt(s.getAttribute('data-blank'), 10)] = s.value; });
      return v;
    }

    function check(persist) {
      var vals = values();
      if (vals.some(function (v) { return !v; })) {
        hint.hidden = false; hint.textContent = cfg.validationMsg || 'Fill all the gaps first, then press Check.';
        return;
      }
      hint.hidden = true;
      var allCorrect = true;
      var noteHtml = '';
      selects.forEach(function (s) {
        var i = parseInt(s.getAttribute('data-blank'), 10);
        var isRight = vals[i].toLowerCase() === correctWords[i].toLowerCase();
        s.classList.remove('blank-correct', 'blank-wrong');
        s.classList.add(isRight ? 'blank-correct' : 'blank-wrong');
        if (!isRight) {
          allCorrect = false;
          noteHtml += '<div class="cloze-note bad">Blank ' + (i + 1) + ': ' + feedbackFn(i, vals[i]) + '</div>';
        }
      });
      if (allCorrect) noteHtml = '<div class="cloze-note ok">' + cfg.successText + '</div>';
      notes.innerHTML = noteHtml;
      notes.hidden = false;
      if (persist !== false) {
        bucket.blanks = vals; bucket.checked = true; bucket.correct = allCorrect;
        save();
        if (cfg.onChecked) cfg.onChecked(allCorrect);
      }
    }
    wrap.querySelector('.check-btn').addEventListener('click', function () { check(true); });

    if (bucket.checked && bucket.blanks && bucket.blanks.length) {
      selects.forEach(function (s) {
        var i = parseInt(s.getAttribute('data-blank'), 10);
        if (bucket.blanks[i]) s.value = bucket.blanks[i];
      });
      check(false);
    }
  }

  /* ---- generic numeric/typed-answer item ---- */
  function buildTypedItem(containerId, cfg) {
    // cfg: {promptHtml, placeholder, buttonLabel, validationMsg, checkFn(rawValue) -> {correct, html}, bucket, numeric, onChecked}
    var wrap = $(containerId);
    if (!wrap) return;
    var html = (cfg.promptHtml || '') +
      '<div class="typed-row"><input type="text" class="' + (cfg.numeric ? 'numeric-input' : '') + '" placeholder="' + escapeHtml(cfg.placeholder || '') + '">' +
      '<button type="button" class="btn btn-primary check-btn">' + (cfg.buttonLabel || 'Check') + '</button></div>' +
      '<p class="hint" hidden></p><div class="item-feedback" hidden aria-live="polite"></div>';
    wrap.innerHTML = html;
    var input = wrap.querySelector('input');
    var hint = wrap.querySelector('.hint');
    var fb = wrap.querySelector('.item-feedback');

    function check(persist) {
      var v = input.value.trim();
      if (!v) { hint.hidden = false; hint.textContent = cfg.validationMsg; return; }
      hint.hidden = true;
      var result = cfg.checkFn(v);
      fb.className = 'item-feedback ' + (result.correct ? 'good' : 'bad');
      fb.innerHTML = '<p class="fb-head">' + (result.correct ? 'Correct' : 'Have another look') + '</p>' + result.html;
      fb.hidden = false;
      wrap.classList.toggle('done-correct', result.correct);
      wrap.classList.toggle('done-wrong', !result.correct);
      if (persist !== false) {
        cfg.bucket.value = v; cfg.bucket.checked = true; cfg.bucket.correct = result.correct;
        save();
        if (cfg.onChecked) cfg.onChecked(result.correct);
      }
    }
    wrap.querySelector('.check-btn').addEventListener('click', function () { check(true); });

    if (cfg.bucket.checked && cfg.bucket.value) { input.value = cfg.bucket.value; check(false); }
  }

  /* ---- generic drag-to-order widget ---- */
  function buildOrderWidget(containerId, items, initialOrder, correctOrder, checkFn, successHtml, bucketOrderGetter, bucketOrderSetter, onCorrect) {
    // items: {id: {label, sub}}; initialOrder/correctOrder: arrays of ids
    var wrap = $(containerId);
    if (!wrap) return;
    var order = bucketOrderGetter() || initialOrder.slice();

    function render() {
      var html = '<ul class="order-list">';
      order.forEach(function (id, i) {
        var it = items[id];
        html += '<li class="order-item" draggable="true" data-id="' + id + '">' +
          '<span class="order-handle">⠿</span>' +
          '<span class="order-body"><span class="order-label">' + escapeHtml(it.label) + '</span>' +
          (it.sub ? '<span class="order-sub">' + escapeHtml(it.sub) + '</span>' : '') + '</span>' +
          '<span class="order-updown"><button type="button" class="btn-up" aria-label="Move up" ' + (i === 0 ? 'disabled' : '') + '>▲</button>' +
          '<button type="button" class="btn-down" aria-label="Move down" ' + (i === order.length - 1 ? 'disabled' : '') + '>▼</button></span>' +
          '</li>';
      });
      html += '</ul><div class="btn-row"><button type="button" class="btn btn-primary check-btn">Check my order</button></div>' +
        '<p class="hint" hidden></p><div class="order-feedback" hidden></div>';
      wrap.innerHTML = html;
      attachHandlers();
    }

    function attachHandlers() {
      var list = wrap.querySelector('.order-list');
      Array.prototype.forEach.call(list.querySelectorAll('.order-item'), function (li) {
        li.addEventListener('dragstart', function (e) {
          li.classList.add('dragging');
          e.dataTransfer.setData('text/plain', li.getAttribute('data-id'));
        });
        li.addEventListener('dragend', function () { li.classList.remove('dragging'); });
        li.addEventListener('dragover', function (e) { e.preventDefault(); li.classList.add('drag-over'); });
        li.addEventListener('dragleave', function () { li.classList.remove('drag-over'); });
        li.addEventListener('drop', function (e) {
          e.preventDefault();
          li.classList.remove('drag-over');
          var draggedId = e.dataTransfer.getData('text/plain');
          var targetId = li.getAttribute('data-id');
          if (draggedId === targetId) return;
          var from = order.indexOf(draggedId), to = order.indexOf(targetId);
          order.splice(from, 1);
          order.splice(to, 0, draggedId);
          render();
        });
        li.querySelector('.btn-up').addEventListener('click', function () {
          var idx = order.indexOf(li.getAttribute('data-id'));
          if (idx > 0) { var t = order[idx - 1]; order[idx - 1] = order[idx]; order[idx] = t; render(); }
        });
        li.querySelector('.btn-down').addEventListener('click', function () {
          var idx = order.indexOf(li.getAttribute('data-id'));
          if (idx < order.length - 1) { var t = order[idx + 1]; order[idx + 1] = order[idx]; order[idx] = t; render(); }
        });
      });
      wrap.querySelector('.check-btn').addEventListener('click', function () { doCheck(true); });
    }

    function doCheck(persist) {
      var fb = wrap.querySelector('.order-feedback');
      var isCorrect = order.join(',') === correctOrder.join(',');
      fb.className = 'order-feedback ' + (isCorrect ? 'good' : 'bad');
      fb.innerHTML = isCorrect ? successHtml : checkFn(order);
      fb.hidden = false;
      if (persist !== false) {
        bucketOrderSetter(order, true, isCorrect);
        save();
        if (isCorrect && onCorrect) onCorrect();
      }
    }

    render();
    if (bucketOrderGetter() && bucketOrderGetter().length) doCheck(false);
  }

  /* ---- generic drag-to-categorise widget (chips into bins) ---- */
  function buildCategoriseWidget(containerId, chips, bins, feedbackFn, bucket, counterEl, onAllPlaced) {
    var wrap = $(containerId);
    if (!wrap) return;
    var assign = bucket.assign || {};

    function chipHtml(chip) {
      var binBtns = bins.map(function (b) {
        return '<button type="button" class="btn btn-small btn-ghost bin-assign" data-chip="' + chip.id + '" data-bin="' + b.id + '">→ ' + b.label + '</button>';
      }).join('');
      return '<div class="cat-chip" draggable="true" data-id="' + chip.id + '">' +
        '<span class="chip-name">' + escapeHtml(chip.name) + '</span>' +
        '<span class="chip-desc">' + chip.desc + '</span>' +
        '<div class="chip-bin-btns">' + binBtns + '</div>' +
        '<div class="chip-feedback-inline" hidden></div>' +
        '</div>';
    }

    function render() {
      var trayChips = chips.filter(function (c) { return !assign[c.id]; });
      var html = '<div class="cat-tray" data-zone="tray">';
      trayChips.forEach(function (c) { html += chipHtml(c); });
      html += '</div><div class="cat-bins">';
      bins.forEach(function (b) {
        html += '<div class="cat-bin" data-zone="' + b.id + '"><span class="cat-bin-label">' + b.label + '</span><span class="cat-bin-sub">' + b.sub + '</span>';
        chips.filter(function (c) { return assign[c.id] === b.id; }).forEach(function (c) { html += chipHtml(c); });
        html += '</div>';
      });
      html += '</div><div class="btn-row"><button type="button" class="btn btn-primary check-btn">Check my sort</button>' +
        '<button type="button" class="btn btn-ghost retry-btn" hidden>Try again</button></div>' +
        '<p class="hint" hidden></p><div class="cat-feedback-list" hidden></div>';
      wrap.innerHTML = html;
      attachHandlers();
      updateCounter();
    }

    function updateCounter() {
      if (!counterEl) return;
      var n = Object.keys(assign).filter(function (k) { return assign[k]; }).length;
      counterEl.textContent = n + ' of ' + chips.length + ' placed';
    }

    function attachHandlers() {
      Array.prototype.forEach.call(wrap.querySelectorAll('.cat-chip'), function (chipEl) {
        chipEl.addEventListener('dragstart', function (e) {
          chipEl.classList.add('dragging');
          e.dataTransfer.setData('text/plain', chipEl.getAttribute('data-id'));
        });
        chipEl.addEventListener('dragend', function () { chipEl.classList.remove('dragging'); });
      });
      Array.prototype.forEach.call(wrap.querySelectorAll('.bin-assign'), function (btn) {
        btn.addEventListener('click', function () {
          assign[btn.getAttribute('data-chip')] = btn.getAttribute('data-bin');
          bucket.assign = assign; save();
          render();
        });
      });
      Array.prototype.forEach.call(wrap.querySelectorAll('[data-zone]'), function (zone) {
        zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', function () { zone.classList.remove('drag-over'); });
        zone.addEventListener('drop', function (e) {
          e.preventDefault();
          zone.classList.remove('drag-over');
          var id = e.dataTransfer.getData('text/plain');
          var z = zone.getAttribute('data-zone');
          assign[id] = z === 'tray' ? null : z;
          bucket.assign = assign; save();
          render();
        });
      });
      wrap.querySelector('.check-btn').addEventListener('click', function () { doCheck(true); });
      var retryBtn = wrap.querySelector('.retry-btn');
      if (retryBtn) retryBtn.addEventListener('click', function () {
        wrap.querySelector('.cat-feedback-list').hidden = true;
        Array.prototype.forEach.call(wrap.querySelectorAll('.cat-chip'), function (c) {
          c.classList.remove('chip-correct', 'chip-wrong', 'chip-neutral-good');
          var inline = c.querySelector('.chip-feedback-inline');
          if (inline) { inline.hidden = true; inline.innerHTML = ''; }
        });
        retryBtn.hidden = true;
      });
    }

    function doCheck(persist) {
      var hint = wrap.querySelector('.hint');
      var unplaced = chips.filter(function (c) { return !assign[c.id]; });
      if (unplaced.length) {
        hint.hidden = false;
        hint.textContent = 'Put all ' + chips.length + ' chips into a bin first, then press Check my sort.';
        return;
      }
      hint.hidden = true;
      var listHtml = '';
      var allCorrect = true;
      chips.forEach(function (c) {
        var binId = assign[c.id];
        var r = feedbackFn(c, binId);
        allCorrect = allCorrect && r.correct !== false;
        var chipEl = wrap.querySelector('.cat-chip[data-id="' + c.id + '"]');
        if (chipEl) {
          chipEl.classList.remove('chip-correct', 'chip-wrong', 'chip-neutral-good');
          chipEl.classList.add(r.cls);
          var inline = chipEl.querySelector('.chip-feedback-inline');
          inline.innerHTML = '<span class="chip-state-label">' + r.label + '</span>';
          inline.hidden = false;
        }
        listHtml += '<div class="cat-feedback-item"><p><strong class="fb-name">' + escapeHtml(c.name) + '</strong> — ' + r.label + '. ' + r.html + '</p></div>';
      });
      wrap.querySelector('.cat-feedback-list').innerHTML = listHtml;
      wrap.querySelector('.cat-feedback-list').hidden = false;
      wrap.querySelector('.retry-btn').hidden = false;
      if (persist !== false) {
        bucket.assign = assign; bucket.checked = true;
        save();
        if (onAllPlaced) onAllPlaced();
      }
    }

    render();
    if (bucket.checked) doCheck(false);
  }

  /* ---- generic click-the-phrase widget ---- */
  function buildPhraseWidget(containerId, items, bucket, counterEl, onAllDone) {
    var wrap = $(containerId);
    if (!wrap) return;
    var html = '';
    items.forEach(function (item, idx) {
      html += '<article class="typed-item phrase-item" data-idx="' + idx + '"><p class="phrase-clause">';
      item.phrases.forEach(function (p, pi) {
        html += '<button type="button" class="phrase-btn" aria-pressed="false" data-pi="' + pi + '">' + p.text + '</button> ';
      });
      html += '</p><div class="btn-row"><button type="button" class="btn btn-primary check-btn">Check</button></div>' +
        '<p class="hint" hidden></p><div class="item-feedback" hidden></div></article>';
    });
    wrap.innerHTML = html;

    function updateCounter() {
      if (!counterEl) return;
      var n = Object.keys(bucket).length;
      counterEl.textContent = n + ' of ' + items.length + ' checked';
      if (n >= items.length && onAllDone) onAllDone();
    }

    Array.prototype.forEach.call(wrap.querySelectorAll('.phrase-item'), function (card) {
      var idx = parseInt(card.getAttribute('data-idx'), 10);
      var item = items[idx];
      var hint = card.querySelector('.hint');
      var fb = card.querySelector('.item-feedback');

      function selectedIdx() {
        var b = card.querySelector('.phrase-btn[aria-pressed="true"]');
        return b ? parseInt(b.getAttribute('data-pi'), 10) : null;
      }
      function setSelected(pi) {
        Array.prototype.forEach.call(card.querySelectorAll('.phrase-btn'), function (b) {
          b.setAttribute('aria-pressed', parseInt(b.getAttribute('data-pi'), 10) === pi ? 'true' : 'false');
        });
      }
      Array.prototype.forEach.call(card.querySelectorAll('.phrase-btn'), function (b) {
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(card.querySelectorAll('.phrase-btn'), function (o) { o.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
        });
      });

      function check(persist) {
        var pi = selectedIdx();
        if (pi === null) { hint.hidden = false; hint.textContent = 'Click a phrase first, then press Check.'; return; }
        hint.hidden = true;
        var isCorrect = item.phrases[pi].correct;
        Array.prototype.forEach.call(card.querySelectorAll('.phrase-btn'), function (b) {
          b.classList.remove('correct-phrase', 'wrong-phrase');
        });
        var chosenBtn = card.querySelector('.phrase-btn[data-pi="' + pi + '"]');
        chosenBtn.classList.add(isCorrect ? 'correct-phrase' : 'wrong-phrase');
        fb.className = 'item-feedback ' + (isCorrect ? 'good' : 'bad');
        fb.innerHTML = '<p class="fb-head">' + (isCorrect ? 'Correct' : 'Have another look') + '</p><p>' + item.feedback[pi] + '</p>';
        fb.hidden = false;
        card.classList.toggle('done-correct', isCorrect);
        card.classList.toggle('done-wrong', !isCorrect);
        if (persist !== false) {
          bucket[idx] = { chosen: pi, correct: isCorrect };
          save();
          updateCounter();
        }
      }
      card.querySelector('.check-btn').addEventListener('click', function () { check(true); });

      var prior = bucket[idx];
      if (prior) { setSelected(prior.chosen); check(false); }
    });
    updateCounter();
  }

  /* ---- matching widget (Section 8: five clauses -> six categories, one-to-one) ---- */
  function buildMatchWidget(containerId, categories, clauses, bucket, counterEl, onAllCorrect) {
    var wrap = $(containerId);
    if (!wrap) return;
    var assign = bucket.assign || {}; // clauseId -> category

    function usedBy(cat) {
      return Object.keys(assign).filter(function (cid) { return assign[cid] === cat; })[0];
    }

    function render() {
      var usedCats = {};
      Object.keys(assign).forEach(function (cid) { if (assign[cid]) usedCats[assign[cid]] = cid; });
      var html = '<div class="match-tray">';
      categories.forEach(function (cat) {
        var used = !!usedCats[cat];
        html += '<span class="match-chip' + (used ? ' used' : '') + '" draggable="' + (!used) + '" data-cat="' + escapeHtml(cat) + '">' + escapeHtml(cat) + '</span>';
      });
      html += '</div><div class="match-cards">';
      clauses.forEach(function (cl) {
        html += '<div class="match-card" data-clause="' + cl.id + '"><p class="match-card-text">“' + cl.text + '”</p>' +
          '<div class="match-controls"><select class="match-select" data-clause="' + cl.id + '"><option value="">— choose a category —</option>';
        categories.forEach(function (cat) { html += '<option value="' + escapeHtml(cat) + '"' + (assign[cl.id] === cat ? ' selected' : '') + '>' + escapeHtml(cat) + '</option>'; });
        html += '</select><div class="match-dropzone" data-clause="' + cl.id + '">' + (assign[cl.id] ? escapeHtml(assign[cl.id]) : 'or drag a category chip here') + '</div></div>' +
          '<p class="match-hint" hidden></p><div class="item-feedback" hidden></div></div>';
      });
      html += '</div><div class="btn-row"><button type="button" class="btn btn-primary check-btn">Check my matches</button>' +
        '<button type="button" class="btn btn-ghost retry-btn" hidden>Try again</button></div><p class="hint" hidden></p>';
      wrap.innerHTML = html;
      attachHandlers();
      updateCounter();
    }

    function setAssign(clauseId, cat) {
      // one-to-one: if this category is already used elsewhere, clear that clause first
      var priorHolder = usedBy(cat);
      var movedNote = null;
      if (priorHolder && priorHolder !== clauseId) {
        var priorIdx = clauses.map(function (c) { return c.id; }).indexOf(priorHolder);
        movedNote = 'Each category is used once. Moving it here takes it off Clause ' + (priorIdx + 1) + '.';
        assign[priorHolder] = null;
      }
      assign[clauseId] = cat;
      bucket.assign = assign; save();
      render();
      if (movedNote) {
        var hint = wrap.querySelector('.hint');
        hint.hidden = false; hint.textContent = movedNote;
      }
    }

    function attachHandlers() {
      Array.prototype.forEach.call(wrap.querySelectorAll('.match-chip:not(.used)'), function (chip) {
        chip.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', chip.getAttribute('data-cat')); });
      });
      Array.prototype.forEach.call(wrap.querySelectorAll('.match-select'), function (sel) {
        sel.addEventListener('change', function () {
          if (sel.value) setAssign(sel.getAttribute('data-clause'), sel.value);
        });
      });
      Array.prototype.forEach.call(wrap.querySelectorAll('.match-card, .match-dropzone'), function (zone) {
        zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', function () { zone.classList.remove('drag-over'); });
        zone.addEventListener('drop', function (e) {
          e.preventDefault();
          zone.classList.remove('drag-over');
          var cat = e.dataTransfer.getData('text/plain');
          var clauseId = zone.getAttribute('data-clause') || zone.closest('.match-card').getAttribute('data-clause');
          if (cat) setAssign(clauseId, cat);
        });
      });
      wrap.querySelector('.check-btn').addEventListener('click', function () { doCheck(true); });
      var retryBtn = wrap.querySelector('.retry-btn');
      if (retryBtn) retryBtn.addEventListener('click', function () {
        Array.prototype.forEach.call(wrap.querySelectorAll('.match-card'), function (c) {
          c.classList.remove('done-correct', 'done-wrong');
          var fb = c.querySelector('.item-feedback'); fb.hidden = true; fb.innerHTML = '';
        });
        retryBtn.hidden = true;
      });
    }

    function updateCounter() {
      if (!counterEl) return;
      var n = Object.keys(assign).filter(function (k) { return assign[k]; }).length;
      counterEl.textContent = n + ' of ' + clauses.length + ' matched';
    }

    function doCheck(persist) {
      var hint = wrap.querySelector('.hint');
      var unfilled = clauses.filter(function (c) { return !assign[c.id]; });
      if (unfilled.length) { hint.hidden = false; hint.textContent = 'Match all five clauses first, then press Check my matches.'; return; }
      hint.hidden = true;
      var allCorrect = true;
      clauses.forEach(function (cl) {
        var chosen = assign[cl.id];
        var isRight = chosen === cl.correct;
        allCorrect = allCorrect && isRight;
        var card = wrap.querySelector('.match-card[data-clause="' + cl.id + '"]');
        card.classList.toggle('done-correct', isRight);
        card.classList.toggle('done-wrong', !isRight);
        var fb = card.querySelector('.item-feedback');
        var text = isRight ? cl.good : ((cl.wrong && cl.wrong[chosen]) || 'Not quite — have another look.');
        fb.className = 'item-feedback ' + (isRight ? 'good' : 'bad');
        fb.innerHTML = '<p class="fb-head">' + (isRight ? 'Correct' : 'Have another look') + '</p><p>' + text + '</p>';
        fb.hidden = false;
      });
      wrap.querySelector('.retry-btn').hidden = false;
      if (persist !== false) {
        bucket.assign = assign; bucket.checked = true;
        save();
        if (allCorrect && onAllCorrect) onAllCorrect();
      }
    }

    render();
    if (bucket.checked) doCheck(false);
  }

  /* ---- streak-based rapid practice widget (Section 9b) ---- */
  function buildStreakWidget(containerId, clauses, bucket, onAllDone) {
    var wrap = $(containerId);
    if (!wrap) return;
    var categories = clauses.reduce(function (acc, c) { if (acc.indexOf(c.correct) === -1) acc.push(c.correct); return acc; }, []);
    var queue = bucket.queue || clauses.map(function (c) { return c.id; });
    var doneIds = bucket.doneIds || [];
    var streak = bucket.streak || 0;

    function byId(id) { return clauses.filter(function (c) { return c.id === id; })[0]; }

    function persistState() {
      bucket.queue = queue; bucket.doneIds = doneIds; bucket.streak = streak;
      save();
    }

    function render() {
      if (doneIds.length >= clauses.length) {
        wrap.innerHTML = '<div class="streak-display"><span class="streak-count">Streak: ' + streak + '</span></div>' +
          '<div class="streak-done-box">All six done. Six in a row means you can do this on a real document.</div>';
        if (onAllDone) onAllDone();
        return;
      }
      var curId = queue[0];
      var item = byId(curId);
      var html = '<div class="streak-display"><span class="streak-count">Streak: ' + streak + '</span>' +
        '<span class="streak-sub">Six in a row means you can do this on a real document.</span></div>';
      html += '<div class="streak-card"><p class="streak-clause-text">“' + item.text + '”</p><div class="streak-options">';
      categories.forEach(function (cat) {
        html += '<button type="button" class="btn btn-option" aria-pressed="false" data-cat="' + escapeHtml(cat) + '">' + escapeHtml(cat) + '</button>';
      });
      html += '</div><div class="btn-row"><button type="button" class="btn btn-primary check-btn">Check</button>' +
        '<button type="button" class="btn btn-ghost next-btn" hidden>Next clause</button></div>' +
        '<p class="hint" hidden></p><div class="item-feedback" hidden></div>' +
        '<p class="streak-progress">' + doneIds.length + ' of ' + clauses.length + ' clauses mastered</p></div>';
      wrap.innerHTML = html;

      var card = wrap.querySelector('.streak-card');
      var hint = card.querySelector('.hint');
      var fb = card.querySelector('.item-feedback');
      var checkBtn = card.querySelector('.check-btn');
      var nextBtn = card.querySelector('.next-btn');

      Array.prototype.forEach.call(card.querySelectorAll('.btn-option'), function (b) {
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(card.querySelectorAll('.btn-option'), function (o) { o.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
        });
      });

      checkBtn.addEventListener('click', function () {
        var chosenBtn = card.querySelector('.btn-option[aria-pressed="true"]');
        if (!chosenBtn) { hint.hidden = false; hint.textContent = 'Pick a category first, then press Check.'; return; }
        hint.hidden = true;
        var chosen = chosenBtn.getAttribute('data-cat');
        var isRight = chosen === item.correct;
        fb.className = 'item-feedback ' + (isRight ? 'good' : 'bad');
        var text = isRight ? item.good : ((item.wrong && item.wrong[chosen]) || item.wrongDefault);
        fb.innerHTML = '<p class="fb-head">' + (isRight ? 'Correct' : 'Have another look') + '</p><p>' + text + '</p>';
        fb.hidden = false;
        checkBtn.hidden = true;
        nextBtn.hidden = false;
        if (isRight) { streak++; doneIds.push(curId); queue.shift(); }
        else { streak = 0; queue.shift(); queue.push(curId); }
        persistState();
      });
      nextBtn.addEventListener('click', function () { render(); });
    }
    render();
  }

  /* =========================================================================
     SECTION 1 — hook: commit box + three commit-then-reveal cards
     ========================================================================= */
  var cardsWrap = $('hook-cards');
  var HOOK_ANSWERS = { resize: 'no', zip: 'no', lossy: 'yes' };

  function unlockCards() {
    cardsWrap.classList.remove('locked');
    Array.prototype.forEach.call(cardsWrap.querySelectorAll('.btn-choice'), function (b) {
      var card = b.closest('.hook-card');
      if (!state.hookRevealed[card.getAttribute('data-card')]) b.disabled = false;
    });
    $('unlock-copy').hidden = false;
  }

  function showCommitted() {
    $('your-answer-text').textContent = state.commitText;
    $('your-answer').hidden = false;
    $('commit-input').value = state.commitText;
    unlockCards();
  }

  function initCommit() {
    var input = $('commit-input'), btn = $('commit-btn'), hint = $('commit-hint');
    btn.addEventListener('click', function () {
      var text = input.value.trim();
      if (!text) { hint.hidden = false; input.focus(); return; }
      hint.hidden = true;
      state.commitText = text; state.committed = true; save();
      showCommitted();
    });
    if (state.committed && state.commitText) showCommitted();
  }

  function revealCard(card, choice) {
    var key = card.getAttribute('data-card');
    state.hookRevealed[key] = choice; save();
    var isCorrect = choice === HOOK_ANSWERS[key];
    card.classList.add('revealed');
    card.classList.toggle('card-correct', isCorrect);
    card.classList.toggle('card-incorrect', !isCorrect);
    var verdict = card.querySelector('.verdict');
    verdict.querySelector('.verdict-open').textContent = isCorrect ? 'Correct — and here’s why.' : 'Not quite — here’s what’s actually going on.';
    verdict.hidden = false;
    Array.prototype.forEach.call(card.querySelectorAll('.btn-choice'), function (b) {
      b.disabled = true;
      b.classList.toggle('chosen', b.getAttribute('data-choice') === choice);
    });
    checkHookComplete();
  }

  function checkHookComplete() {
    if (Object.keys(state.hookRevealed).length >= 3) {
      $('hook-key-idea').hidden = false;
      markSection(1);
    }
  }

  function initHookCards() {
    Array.prototype.forEach.call(cardsWrap.querySelectorAll('.hook-card'), function (card) {
      Array.prototype.forEach.call(card.querySelectorAll('.btn-choice'), function (b) {
        b.addEventListener('click', function () { if (!cardsWrap.classList.contains('locked')) revealCard(card, b.getAttribute('data-choice')); });
      });
      var prior = state.hookRevealed[card.getAttribute('data-card')];
      if (prior) revealCard(card, prior);
    });
    checkHookComplete();
  }

  /* =========================================================================
     QUICK CHECKS (generic — Sections 2, 7) — single-select, 4 options
     ========================================================================= */
  function initQuickChecks() {
    Array.prototype.forEach.call(document.querySelectorAll('.quickcheck'), function (qc) {
      var id = qc.getAttribute('data-quickcheck');
      var correct = qc.getAttribute('data-correct');
      var fb = qc.querySelector('.qc-feedback');
      var texts = qc.querySelector('.qc-texts');
      function textFor(value) { var p = texts.querySelector('p[data-for="' + value + '"]'); return p ? p.innerHTML : ''; }
      function answer(value) {
        var isRight = value === correct;
        Array.prototype.forEach.call(qc.querySelectorAll('.btn-option'), function (b) {
          var v = b.getAttribute('data-value');
          b.classList.toggle('picked-correct', isRight && v === value);
          b.classList.toggle('picked-wrong', !isRight && v === value);
          b.classList.toggle('show-answer', !isRight && v === correct);
        });
        fb.innerHTML = textFor(value);
        fb.className = 'qc-feedback ' + (isRight ? 'good' : 'bad');
        fb.hidden = false;
        state.qc[id] = value; save();
        onQuickCheckAnswered(id);
      }
      Array.prototype.forEach.call(qc.querySelectorAll('.btn-option'), function (b) {
        b.addEventListener('click', function () { answer(b.getAttribute('data-value')); });
      });
      if (state.qc[id]) answer(state.qc[id]);
    });
  }

  function onQuickCheckAnswered(id) {
    if (id === 'qc-compression') checkSection2Complete();
    if (id === 'qc-clause') checkSection7Complete();
  }

  /* ---- Section 2: song-size drag-to-order ---- */
  var SONG_ITEMS = {
    wav: { label: 'WAV', sub: 'Not compressed at all' },
    flac: { label: 'FLAC', sub: 'Lossless compression' },
    mp3_320: { label: 'MP3 at 320 kbps', sub: 'Lossy compression, high quality setting' },
    mp3_128: { label: 'MP3 at 128 kbps', sub: 'Lossy compression, small-file setting' }
  };
  var SONG_INITIAL = ['mp3_128', 'wav', 'mp3_320', 'flac'];
  var SONG_CORRECT = ['wav', 'flac', 'mp3_320', 'mp3_128'];
  var SONG_SUCCESS = '<p>Correct. Two big ideas are sitting inside that order.</p>' +
    '<p><strong>Uncompressed is bigger than lossless, and lossless is bigger than lossy.</strong> FLAC really is compressed — meaningfully smaller than the WAV — but it can never get as small as an MP3, because it isn’t allowed to throw anything away.</p>' +
    '<p><strong>Within one lossy format, how hard you compress is a setting, not a fixed fact.</strong> 320 kbps keeps more of the sound than 128 kbps does. Same format, same song, different amount thrown away. "Is it lossy?" and "how lossy?" are two separate questions.</p>';

  function songCheckFn(order) {
    if (order.indexOf('wav') !== 0) {
      return '<p>Not quite — start with <strong>WAV</strong>. It isn’t compressed at all, so it’s always the biggest of the four. Nothing has been removed from it, cleverly or otherwise.</p>';
    }
    var flacIdx = order.indexOf('flac'), mp3aIdx = order.indexOf('mp3_320'), mp3bIdx = order.indexOf('mp3_128');
    if (flacIdx > mp3aIdx || flacIdx > mp3bIdx) {
      return '<p>Not quite — <strong>FLAC</strong> belongs above both MP3s, and this is the trap in this activity. FLAC <em>is</em> compressed, so it’s smaller than the WAV, but it’s <strong>lossless</strong> compression: it can only remove repetition, never information. An MP3 is allowed to delete things, so it can always get smaller. Lossless compression sits between "uncompressed" and "lossy," never below lossy.</p>';
    }
    if (mp3bIdx < mp3aIdx) {
      return '<p>Nearly — swap the two MP3s. <strong>320 kbps</strong> keeps more of the sound than <strong>128 kbps</strong>, and more kept means a bigger file. The number is roughly how many thousands of bits are spent on each second of audio, so a bigger number means more data kept.</p>';
    }
    return '<p>Not quite. Work from the top down: which one has had <strong>nothing</strong> removed? Then which has had only repetition removed? Then, between the two that had real sound removed, which had <strong>less</strong> removed?</p>';
  }

  function initSongOrder() {
    buildOrderWidget('order-song', SONG_ITEMS, SONG_INITIAL, SONG_CORRECT, songCheckFn, SONG_SUCCESS,
      function () { return state.songOrder; },
      function (order, checked, correct) { state.songOrder = order; state.songOrderChecked = checked; state.songOrderCorrect = correct; checkSection2Complete(); },
      function () {});
  }

  function checkSection2Complete() {
    if (state.qc['qc-compression'] && state.songOrderChecked) {
      $('section2-closing').hidden = false;
      markSection(2);
    }
  }

  /* =========================================================================
     SECTION 3 — how compression works: RLE, which-trick, multi-select
     ========================================================================= */
  function normalizeRLE(v) { return v.replace(/[\s,\-.]/g, '').toUpperCase(); }
  function parseRuns(str) {
    var re = /(\d+)([A-Z])/g, m, pairs = [], consumed = '';
    while ((m = re.exec(str))) { pairs.push({ count: parseInt(m[1], 10), letter: m[2] }); consumed += m[0]; }
    if (consumed !== str || !pairs.length) return null;
    return pairs;
  }

  function initRLE1() {
    buildTypedItem('rle-1', {
      promptHtml: '', placeholder: '7W...', buttonLabel: 'Check my encoding',
      validationMsg: 'Type an encoding first, then press Check my encoding.',
      bucket: state.rle1, numeric: false,
      checkFn: function (raw) {
        var norm = normalizeRLE(raw);
        if (norm === '7W3B10W') {
          return { correct: true, html: '<p>Correct — <strong>7W3B10W</strong>. Now count what you just did. The original row needed <strong>20 characters</strong>. Your version needs <strong>6</strong>. That’s a 70% saving, and it is completely reversible: 7W3B10W rebuilds that row exactly, pixel for pixel, with nothing missing. That’s lossless compression in full — no magic, just a better way of writing the same thing down.</p>' };
        }
        var pairs = parseRuns(norm);
        if (pairs && pairs.length === 3 && pairs[0].letter === 'W' && pairs[1].letter === 'B' && pairs[2].letter === 'W') {
          return { correct: false, html: '<p>Close — the structure is right, so just recount. Count each run separately, stopping every time the colour changes: whites until it changes (<strong>7</strong>), then blacks until it changes back (<strong>3</strong>), then whites to the end (<strong>10</strong>).</p>' };
        }
        if (pairs && pairs.length < 3) {
          return { correct: false, html: '<p>You’ve merged two runs. The white pixels come in <strong>two separate runs</strong> — seven at the start and ten at the end — with black pixels in between. They can’t be added together, because run-length encoding only ever counts one <strong>unbroken</strong> run at a time. Three runs means three pairs.</p>' };
        }
        return { correct: false, html: '<p>Not quite. The format is: how many, then which letter, for each run in order — like <code>7W</code> for seven whites. Read the row left to right and write a new pair every time the colour changes.</p>' };
      },
      onChecked: function (correct) { if (correct) { $('rle-2').hidden = false; } checkSection3Complete(); }
    });
  }

  function initRLE2() {
    buildTypedItem('rle-2', {
      promptHtml: '<p><strong>Now try this one.</strong> Twelve pixels:</p><p class="mono-row">BBWWBBWWBBWW</p>',
      placeholder: '2B...', buttonLabel: 'Check my encoding',
      validationMsg: 'Type an encoding first, then press Check my encoding.',
      bucket: state.rle2, numeric: false,
      checkFn: function (raw) {
        var norm = normalizeRLE(raw);
        if (norm === '2B2W2B2W2B2W') {
          return { correct: true, html: '<p>Correct — <strong>2B2W2B2W2B2W</strong>. Now count again, and notice what happened. The original was <strong>12 characters</strong>. Your encoding is <strong>12 characters</strong>. You saved <strong>nothing at all</strong>.</p><p>That is the honest limit of lossless compression, and it’s worth more than the first answer was. Run-length encoding only helps when there are <strong>long runs</strong>. On data that keeps alternating, every run costs you a count as well as the thing itself, and the file can come out <strong>bigger</strong> than it started. A photograph of a real beach is much more like this row than like the first one — which is exactly why photos need lossy compression and screenshots don’t.</p>' };
        }
        return { correct: false, html: '<p>Not quite, and this one is fiddly on purpose. There are <strong>six</strong> runs here, not three: two blacks, two whites, two blacks, two whites, two blacks, two whites. The colour changes every second pixel, so every pair is its own run. Write a number-letter pair for each of the six.</p>' };
      },
      onChecked: function () { checkSection3Complete(); }
    });
    if (state.rle1.checked && state.rle1.correct) $('rle-2').hidden = false;
  }

  var SECTION3D_ITEMS = [
    { id: 'd1', name: 'A screenshot of a document, with a large plain white margin down both sides.', options: ['Run-length encoding', 'Dictionary / Huffman coding', 'Perceptual coding (throwing detail away)'], correct: 'Run-length encoding',
      good: 'Yes. Hundreds of identical white pixels in a row are exactly what run-length encoding is for — store the count instead of the pixels. This is why PNG handles screenshots so efficiently, and why you’re told to save screenshots as PNG rather than JPEG.',
      wrong: {
        'Dictionary / Huffman coding': 'A dictionary would help a little, but the obvious win here is the <strong>runs</strong> — hundreds of identical pixels one after another. Counting them is far more effective than coding them. <strong>Run-length encoding.</strong>',
        'Perceptual coding (throwing detail away)': 'Nothing needs to be thrown away here, and you wouldn’t want it to be — a document’s text edges are the last thing you want blurred. The margin is genuinely repetitive, so it can be stored perfectly <strong>and</strong> much more compactly. <strong>Run-length encoding.</strong>'
      } },
    { id: 'd2', name: 'An English text file, in which the letter "e" appears far more often than the letter "z".', options: ['Run-length encoding', 'Dictionary / Huffman coding', 'Perceptual coding (throwing detail away)'], correct: 'Dictionary / Huffman coding',
      good: 'Yes. Give "e" a very short code and "z" a long one and the whole file shrinks, because you spend your short codes on the things you use most. Nothing is lost — the dictionary rebuilds the original exactly.',
      wrong: {
        'Run-length encoding': 'Run-length encoding needs <strong>runs</strong> — "eeeeeee" in a row. English almost never repeats a letter more than twice. What English does have is very <strong>uneven frequencies</strong>, and that is what dictionary coding exploits.',
        'Perceptual coding (throwing detail away)': 'Never do this to text. Perceptual coding throws information away on the bet that you won’t notice — fine for a photograph, disastrous for a document, where a single deleted letter is a visible error. Text uses <strong>dictionary coding</strong>, which loses nothing.'
      } },
    { id: 'd3', name: 'A photograph of a beach, in which almost no two pixels are exactly the same colour.', options: ['Run-length encoding', 'Dictionary / Huffman coding', 'Perceptual coding (throwing detail away)'], correct: 'Perceptual coding (throwing detail away)',
      good: 'Yes. A photo has almost no exact repeats and no strongly lopsided frequencies, so both lossless tricks run out of room fast. To get a photo down to a few hundred kilobytes you have to <strong>delete</strong> detail — and JPEG deletes the kind eyes are worst at spotting.',
      wrong: {
        'Run-length encoding': 'There are no runs to count. In a real photo, even a stretch of "the same" blue sky is thousands of very slightly different blues, so run-length encoding would find almost nothing to shorten. Photos need <strong>perceptual coding</strong>.',
        'Dictionary / Huffman coding': 'Dictionary coding does help photos a little, and JPEG genuinely uses some of it — but it can’t take you from 8 MB to 350 KB on its own. The big saving comes from <strong>throwing detail away</strong>: perceptual coding.'
      } }
  ];

  function updateSection3dCounter() {
    var n = Object.keys(state.s3d).length;
    $('section3d-counter').textContent = n + ' of 3 checked';
    checkSection3Complete();
  }

  var SECTION3E_STATEMENTS = [
    { text: 'Lossless compression works by finding things the file says more than once.', truth: true,
      note: '<strong>True.</strong> That repetition is called <em>redundancy</em>, and removing it is the whole of lossless compression.' },
    { text: 'Once a lossy format has thrown detail away, better software can recover it later.', truth: false,
      note: '<strong>False.</strong> The discarded detail isn’t hidden, encrypted or stored anywhere — it is not in the file at all, so there is nothing for any software to recover it from. This is the single most important thing to be sure of about lossy compression.' },
    { text: 'Run-length encoding can sometimes make a file bigger.', truth: true,
      note: '<strong>True</strong>, and you proved it yourself two activities ago. On data that keeps alternating, every one-item "run" costs you a count as well as the item, so the encoding comes out longer than the original.' },
    { text: 'MP3 discards sounds that louder sounds are drowning out.', truth: true,
      note: '<strong>True.</strong> That’s perceptual coding — compressing against what human hearing can’t pick up, rather than against the data.' },
    { text: 'Lossless compression can shrink any file as far as you want, given enough time.', truth: false,
      note: '<strong>False.</strong> Lossless compression can only remove repetition and uneven frequencies. Once those are gone there is nothing left to remove, and no amount of time or cleverness changes that. That limit is the entire reason lossy formats exist.' },
    { text: 'JPEG throws away more colour detail than brightness detail, because eyes notice brightness more.', truth: true,
      note: '<strong>True.</strong> It’s the clearest single example of a format designed around a specific known weakness in human perception.' }
  ];

  function initSection3e() {
    buildMultiSelect('ms-3e', SECTION3E_STATEMENTS, state.s3e, {
      checkLabel: 'Check my selections',
      validationMsg: 'Select at least one statement first, then press Check my selections.',
      noteFor: function (i, selected) {
        var s = SECTION3E_STATEMENTS[i - 1];
        var good = (s.truth && selected) || (!s.truth && !selected);
        // Only reveal the explanation for rows the student got right — a
        // wrong row just says so, so re-checking after fixing a selection
        // still requires thinking about it, not just reading the answer.
        return { cls: good ? 'correct' : 'incorrect', correct: good, text: good ? s.note : 'Incorrect — have another look at this one.' };
      },
      resultFor: function (sel) {
        var correctSet = [1, 3, 4, 6];
        var good = setsEqual(sel, correctSet);
        return { good: good, text: good ? 'statements 1, 3, 4 and 6 are the true ones.' : 'compare your selections against the notes below and try again.' };
      },
      onChecked: function () { checkSection3Complete(); }
    });
  }

  function checkSection3Complete() {
    var rleDone = state.rle1.checked && state.rle1.correct && state.rle2.checked;
    var dDone = Object.keys(state.s3d).length >= 3;
    var eDone = state.s3e.checked;
    if (rleDone && dDone && eDone) {
      $('section3-closing').hidden = false;
      markSection(3);
    }
  }

  /* =========================================================================
     SECTION 4 — drag-to-categorise (8 chips, 3 bins) — practice, ungraded
     ========================================================================= */
  var CAT_BINS = [
    { id: 'lossless', label: 'Lossless', sub: 'Nothing is thrown away' },
    { id: 'lossy', label: 'Lossy', sub: 'Something is permanently deleted' },
    { id: 'complicated', label: "It's complicated", sub: 'Experts genuinely disagree' }
  ];

  var GIF_NEUTRAL_BODY = '<p><strong>The case for calling GIF lossless:</strong> Once a GIF has picked which colours it’s going to use, its compression step throws away <strong>no pixel data at all</strong>. Decompress the GIF and you get back exactly the pixels that were stored. By the strict technical definition — does the compression algorithm discard information? — GIF is lossless, and that is why textbooks list it as a lossless format. (Its compression step is a dictionary method, the second trick from Section 3.)</p>' +
    '<p><strong>The case for calling GIF lossy:</strong> But GIF can only hold <strong>256 colours at once</strong>. Save a photograph as a GIF and thousands of the original colours have to be thrown out before the compression even starts, and it looks visibly worse. From the user’s point of view, information was permanently lost. Calling that "lossless" feels like a technicality.</p>' +
    '<p><strong>So which is it?</strong> Both, depending on what you’re asking. The words <em>lossy</em> and <em>lossless</em> describe <strong>how the compression step works</strong>, not always <strong>how the final result looks</strong>. GIF’s compression step is genuinely lossless; GIF’s 256-colour limit is a separate, genuinely lossy step that happens first. Experts disagree about which of those should decide the label, and there is <strong>no single correct answer</strong> here — this one is on the page precisely because recognising a real grey area is a more useful skill than memorising a category.</p>' +
    '<p><strong>Want to argue it properly?</strong> Section 11 lets you build the argument and checks whether your evidence actually supports the side you picked.</p>';

  var CAT_CHIPS = [
    { id: 'zip', name: 'ZIP', desc: 'A folder of documents packed into one file', correctBin: 'lossless',
      fb: { lossless: 'Yes — lossless. ZIP is the textbook case: it spots repetition and stores it more efficiently, and unzipping gives you back every original file, byte for byte. It has to be lossless — imagine unzipping an essay and finding the computer had "helpfully" thrown away some words it thought you wouldn’t miss.',
        lossy: 'Not quite — ZIP belongs in <strong>Lossless</strong>. Think about what it’s usually used for: documents, spreadsheets, code, installers. A format that quietly deleted parts of your assignment to save space would be useless. ZIP shrinks by storing repetition efficiently and gives back exactly what you put in.',
        complicated: 'Not quite — there’s nothing complicated about ZIP. It is unambiguously <strong>lossless</strong>, and it’s the clearest example on the page of "compressed" not meaning "something was lost." Move it to Lossless.' } },
    { id: 'png', name: 'PNG', desc: 'Logos, screenshots and graphics with sharp edges', correctBin: 'lossless',
      fb: { lossless: 'Yes — lossless. PNG is why screenshots and logos stay crisp: nothing is discarded, so text edges and flat areas of colour stay razor-sharp instead of getting fuzzy. It’s also the format that gets the most out of run-length encoding from Section 3.',
        lossy: 'Not quite — PNG belongs in <strong>Lossless</strong>, and it’s the usual reason people are told to save screenshots and logos as PNG rather than JPEG. Because nothing is thrown away, sharp edges and text stay clean. The trade-off is that PNG files are bigger than the JPEG equivalent.',
        complicated: 'Not quite — PNG is straightforwardly <strong>lossless</strong>. You may be thinking of GIF, which has a colour limit PNG doesn’t have. PNG can hold millions of colours and discards none of them.' } },
    { id: 'jpeg', name: 'JPEG', desc: 'The standard format for photos from phones and cameras', correctBin: 'lossy',
      fb: { lossy: 'Yes — lossy. JPEG is the format Section 1’s 350 KB photo was in. It permanently discards detail your eye is bad at noticing — that’s perceptual coding from Section 3 — and it’s exactly how it gets photos so small.',
        lossless: 'Not quite — JPEG belongs in <strong>Lossy</strong>, and it’s the most-used lossy format on earth. It’s how Section 1’s photo went from 8 MB to 350 KB, and it’s why a photo that’s been shared and re-shared several times ends up looking blocky — each save discards a bit more.',
        complicated: 'Not quite — JPEG is unambiguously <strong>lossy</strong>. (There is an obscure lossless JPEG mode almost nobody uses, but the JPEG you meet every day throws detail away every single time it saves.)' } },
    { id: 'mp3', name: 'MP3', desc: 'Compressed music and audio', correctBin: 'lossy',
      fb: { lossy: 'Yes — lossy. MP3 throws away sounds that louder sounds are drowning out at the same moment, and frequencies most people can’t hear well. That’s how an album fits on a phone.',
        lossless: 'Not quite — MP3 belongs in <strong>Lossy</strong>. It works by discarding parts of the sound most listeners won’t notice — very high frequencies, and quiet sounds masked by loud ones happening at the same time. The audio you get back is genuinely not the original recording.',
        complicated: 'Not quite — MP3 is unambiguously <strong>lossy</strong>. What <em>is</em> variable is <em>how much</em> it throws away (that’s the 320 kbps / 128 kbps difference from Section 2), but it always throws something away.' } },
    { id: 'flac', name: 'FLAC', desc: 'A music format for people who want the full-quality original', correctBin: 'lossless',
      fb: { lossless: 'Yes — lossless. FLAC stands for Free <strong>Lossless</strong> Audio Codec — the name literally says it. It’s meaningfully smaller than an uncompressed WAV but recovers to exactly the same audio.',
        lossy: 'Not quite — FLAC belongs in <strong>Lossless</strong>; the L in the name stands for exactly that. It’s the format people choose when they specifically don’t want MP3’s discarded detail. It’s still compressed and still smaller than the raw recording — it just doesn’t throw anything away to get there.',
        complicated: 'Not quite — FLAC is one of the least complicated items here. Its own name declares it <strong>lossless</strong>, and it is.' } },
    { id: 'mp4', name: 'MP4 / H.264', desc: 'The standard format for video', correctBin: 'lossy',
      fb: { lossy: 'Yes — lossy. Video is the most aggressively compressed thing you use daily. Without lossy compression, streaming a film over an ordinary connection would be impossible.',
        lossless: 'Not quite — MP4/H.264 belongs in <strong>Lossy</strong>, and heavily so. Uncompressed video is enormous — far too big to stream. H.264 discards a great deal of detail, especially in fast movement, which is why a fast-panning scene on a weak connection goes briefly blocky.',
        complicated: 'Not quite — the everyday MP4 is unambiguously <strong>lossy</strong>. The .mp4 extension is technically a container that could in principle hold other things, but every MP4 you have ever streamed or downloaded holds lossy video.' } },
    { id: 'wav', name: 'WAV', desc: 'Raw, uncompressed audio, the kind a studio starts with', correctBin: 'lossless',
      fb: { lossless: 'Yes — lossless. WAV is the extreme end of the same idea: it isn’t compressed at all, so nothing can have been thrown away. Everything the microphone captured is still in there — which is why WAV files are so big, and why it sat at the top of Section 2’s ordering task.',
        lossy: 'Not quite — WAV belongs in <strong>Lossless</strong>, and it’s the easiest one to reason about: WAV is normally stored completely <strong>uncompressed</strong>, so there was no compression step in which anything could have been discarded. Nothing thrown away means lossless, by definition. The cost is size — a few minutes of WAV can be bigger than a whole album of MP3s.',
        complicated: 'Not quite — WAV is the simplest case on the board. No compression happened at all, so nothing was lost. <strong>Lossless.</strong>' } },
    { id: 'gif', name: 'GIF', desc: 'Short looping animations and old-style web images', correctBin: null,
      neutralGood: 'good call', neutralOther: 'worth reading both sides' }
  ];

  function categoriseFeedback(chip, binId) {
    if (chip.correctBin === null) {
      var isComplicated = binId === 'complicated';
      var label = isComplicated ? 'Good call' : 'Worth reading both sides';
      var opening = isComplicated ? 'That’s the most honest answer of the three. Here’s why.' : 'That’s a defensible answer — and so is the opposite. Here’s both sides.';
      return { correct: undefined, cls: 'chip-neutral-good', label: label, html: '<span class="verdict-open">' + opening + '</span>' + GIF_NEUTRAL_BODY };
    }
    var isRight = binId === chip.correctBin;
    return { correct: isRight, cls: isRight ? 'chip-correct' : 'chip-wrong', label: isRight ? 'Correct' : 'Have another look', html: chip.fb[binId] || chip.fb[chip.correctBin] };
  }

  function initSection4() {
    buildCategoriseWidget('categorise-4', CAT_CHIPS, CAT_BINS, categoriseFeedback, state.s4cat, $('section4-counter'), function () {
      $('section4-closing').hidden = false;
      markSection(4);
    });
  }

  function initSection3d() {
    // Shuffle each item's own option order independently (not just the
    // item order) — otherwise the correct answer sits in the same position
    // (1st, 2nd, 3rd) every item offers the same three options in the same
    // order, so the position alone gives the answer away without reasoning.
    var items = SECTION3D_ITEMS.map(function (item) {
      var copy = {};
      for (var k in item) { if (item.hasOwnProperty(k)) copy[k] = item[k]; }
      copy.options = shuffled(item.options);
      return copy;
    });
    buildClassifyList('section3d-classifier', items, state.s3d, 'Pick one of the three first, then press Check.', updateSection3dCounter);
    updateSection3dCounter();
  }

  /* =========================================================================
     SECTION 5 — Question 1: classify these six (graded, single-select each)
     ========================================================================= */
  var SECTION5_ITEMS = [
    { id: 'bmp', name: 'BMP (uncompressed bitmap image)', correct: 'Lossless',
      good: 'Yes — Lossless. BMP normally isn’t compressed at all, so there was no step in which anything could have been thrown away. Nothing discarded means lossless. (Same reasoning as WAV in the last section — the uncompressed formats are the easiest ones to be sure about.)',
      wrong: { Lossy: 'Not quite — BMP is <strong>Lossless</strong>. Read its description again: <em>uncompressed</em>. If a file isn’t compressed at all, no compression step happened, so nothing could have been discarded during one. An uncompressed format is always lossless — that’s what makes BMP files so large.' } },
    { id: 'mp3', name: 'MP3 (compressed audio)', correct: 'Lossy',
      good: 'Yes — Lossy. Same answer as Section 4: MP3 discards sounds most listeners won’t notice, and they’re not recoverable.',
      wrong: { Lossless: 'Not quite — MP3 is <strong>Lossy</strong>, and you met it in Section 4. It permanently discards parts of the sound — very high frequencies, and quiet sounds masked by louder ones. That’s how a whole album fits in the space of a few minutes of WAV.' } },
    { id: 'raw', name: 'RAW (uncompressed camera photo format)', correct: 'Lossless',
      good: 'Yes — Lossless. RAW is what a camera sensor actually recorded, kept whole. It’s the 24 MB file you’ll meet in Section 6 — big precisely because nothing has been thrown away.',
      wrong: { Lossy: 'Not quite — RAW is <strong>Lossless</strong>. The clue is the same word as BMP: <em>uncompressed</em>. RAW keeps everything the camera’s sensor captured, which is exactly why photographers use it when they plan to edit heavily — and exactly why a RAW file is eight times bigger than the JPEG of the same photo.' } },
    { id: 'h264', name: 'H.264 / MP4 (compressed video)', correct: 'Lossy',
      good: 'Yes — Lossy. Video compression is the most aggressive kind you use every day, and it works by discarding a lot of detail permanently.',
      wrong: { Lossless: 'Not quite — H.264/MP4 is <strong>Lossy</strong>, and you met it in Section 4. Uncompressed video is far too big to stream, so H.264 throws away a great deal, especially in fast-moving scenes. That blockiness on a weak connection is the loss becoming visible.' } },
    { id: 'zip', name: 'ZIP (compressed archive)', correct: 'Lossless',
      good: 'Yes — Lossless. ZIP is compressed, but it discards nothing — the two things aren’t the same. It’s the clearest example of "compressed" not meaning "lossy."',
      wrong: { Lossy: 'Not quite — ZIP is <strong>Lossless</strong>, and you met it in Section 4. Careful with the reasoning here: ZIP genuinely <strong>is</strong> compressed, so "it’s compressed, therefore something was lost" is the trap. Compression and loss are two separate things. ZIP shrinks files by storing repetition efficiently — the dictionary trick from Section 3 — and gives back every byte exactly.' } },
    { id: 'webp', name: 'WebP in lossy mode (a compressed web image format)', correct: 'Lossy',
      good: 'Yes — Lossy. The format’s own name for this setting says so. WebP can do both — it has a lossless mode too — and the mode you pick is what decides the answer, not the format name.',
      wrong: { Lossless: 'Not quite — this one is <strong>Lossy</strong>, and the answer is written into the question: <em>WebP in lossy mode</em>. WebP is unusual because it can do <strong>both</strong> — there’s a lossless WebP as well — so for this format the answer depends entirely on which mode was used. Read the setting, not the file extension.' } }
  ];

  function updateSection5Counter() {
    var n = Object.keys(state.s5).length;
    $('section5-counter').textContent = n + ' of 6 done';
    if (n >= SECTION5_ITEMS.length) { $('section5-closing').hidden = false; markSection(5); }
  }

  function initSection5() {
    buildClassifyList('section5-classifier', SECTION5_ITEMS, state.s5, 'Choose Lossless or Lossy first, then press Check.', updateSection5Counter);
    updateSection5Counter();
  }

  /* =========================================================================
     SECTION 6 — Questions 2 & 3 (these count)
     ========================================================================= */

  /* ---- 6a: two linked single-selects ---- */
  function initSection6a() {
    var wrap = $('linked-6a');
    var html = '<div class="typed-item">' +
      '<div class="btn-row"><span style="min-width:220px;display:inline-block;">The 24 MB RAW file is...</span>' +
      '<button type="button" class="btn btn-option" data-row="1" data-val="Lossless" aria-pressed="false">Lossless</button>' +
      '<button type="button" class="btn btn-option" data-row="1" data-val="Lossy" aria-pressed="false">Lossy</button></div>' +
      '<div class="btn-row"><span style="min-width:220px;display:inline-block;">The 3 MB JPEG file is...</span>' +
      '<button type="button" class="btn btn-option" data-row="2" data-val="Lossless" aria-pressed="false">Lossless</button>' +
      '<button type="button" class="btn btn-option" data-row="2" data-val="Lossy" aria-pressed="false">Lossy</button></div>' +
      '<div class="btn-row"><button type="button" class="btn btn-primary check-btn">Check both</button></div>' +
      '<p class="hint" hidden></p><div class="item-feedback" hidden></div></div>';
    wrap.innerHTML = html;
    Array.prototype.forEach.call(wrap.querySelectorAll('.btn-option'), function (b) {
      b.addEventListener('click', function () {
        var row = b.getAttribute('data-row');
        Array.prototype.forEach.call(wrap.querySelectorAll('.btn-option[data-row="' + row + '"]'), function (o) { o.setAttribute('aria-pressed', 'false'); o.classList.remove('picked-correct','picked-wrong'); });
        b.setAttribute('aria-pressed', 'true');
      });
    });
    function rowVal(row) { var b = wrap.querySelector('.btn-option[data-row="' + row + '"][aria-pressed="true"]'); return b ? b.getAttribute('data-val') : null; }
    function setRow(row, val) { if (!val) return; wrap.querySelector('.btn-option[data-row="' + row + '"][data-val="' + val + '"]').click(); }
    function check(persist) {
      var r1 = rowVal('1'), r2 = rowVal('2');
      var hint = wrap.querySelector('.hint'), fb = wrap.querySelector('.item-feedback');
      if (!r1 || !r2) { hint.hidden = false; hint.textContent = 'Answer both rows first, then press Check both.'; return; }
      hint.hidden = true;
      var c1 = r1 === 'Lossless', c2 = r2 === 'Lossy';
      var text, good;
      if (c1 && c2) { good = true; text = 'Correct — RAW is <strong>lossless</strong>, JPEG is <strong>lossy</strong>. RAW is the sensor’s own recording kept whole, so nothing has been discarded. JPEG got to 3 MB by permanently deleting detail. The size difference is the evidence: no lossless method could ever take a photo down that far.'; }
      else if (r1 === 'Lossy' && r2 === 'Lossless') { good = false; text = 'Have another look — you’ve got them the exact way round from the answer, which means you’ve got the idea and just placed the labels backwards. The <strong>big</strong> one is the one that kept everything: 24 MB RAW is <strong>lossless</strong>. The <strong>small</strong> one is the one that threw detail away: 3 MB JPEG is <strong>lossy</strong>. When compression is this dramatic, the smaller file is always the lossy one.'; }
      else if (c1 && !c2) { good = false; text = 'Half right — RAW is <strong>lossless</strong>, yes. But the JPEG can’t also be lossless: going from 24 MB to 3 MB is an eight-fold reduction, and lossless compression can’t get anywhere near that on a photo, because a photo has almost no exact repetition to remove (Section 3, item 3). JPEG is <strong>lossy</strong>.'; }
      else { good = false; text = 'Half right — JPEG is <strong>lossy</strong>, yes. But RAW is <strong>lossless</strong>: it’s the uncompressed sensor data, so no compression step happened and nothing could have been discarded in one. That’s exactly why it’s 24 MB.'; }
      fb.className = 'item-feedback ' + (good ? 'good' : 'bad');
      fb.innerHTML = '<p class="fb-head">' + (good ? 'Correct' : 'Have another look') + '</p><p>' + text + '</p>';
      fb.hidden = false;
      Array.prototype.forEach.call(wrap.querySelectorAll('.btn-option[aria-pressed="true"]'), function (b) { b.classList.add(good ? 'picked-correct' : 'picked-wrong'); });
      if (persist !== false) { state.s6a = { row1: r1, row2: r2, checked: true }; save(); check6Complete(); }
    }
    wrap.querySelector('.check-btn').addEventListener('click', function () { check(true); });
    if (state.s6a.checked) { setRow('1', state.s6a.row1); setRow('2', state.s6a.row2); check(false); }
  }

  /* ---- 6b: numeric entry ---- */
  function initSection6b() {
    buildTypedItem('numeric-6b', {
      placeholder: 'a number', buttonLabel: 'Check', numeric: true,
      validationMsg: 'Type a number first, then press Check.', bucket: state.s6b,
      checkFn: function (raw) {
        var stripped = raw.toLowerCase().replace(/\s+/g, '');
        if (stripped === '1/8') return { correct: false, html: '<p>Nearly — that’s the JPEG as a <strong>fraction</strong> of the RAW, which is correct arithmetic answering a slightly different question. "How many times smaller" wants the whole number: 24 ÷ 3 = <strong>8</strong>.</p>' };
        var v = stripped.replace(/times$/, '').replace(/[x×]$/, '');
        var num = parseFloat(v);
        if (v !== '' && !isNaN(num) && Math.abs(num - 8) < 0.001) {
          return { correct: true, html: '<p>Correct — <strong>eight times smaller</strong>. 24 ÷ 3 = 8. That single number is the whole of Question 2: seven-eighths of that file is simply not there any more, and at normal viewing size you would struggle to tell which one you were looking at.</p>' };
        }
        if (num === 21) return { correct: false, html: '<p>Not quite — 21 MB is how much <strong>bigger</strong> the RAW is, which is a subtraction. The question asks how many <strong>times</strong> smaller, which is a division: 24 ÷ 3.</p>' };
        if (Math.abs(num - 0.125) < 0.0001) return { correct: false, html: '<p>Nearly — that’s the JPEG as a <strong>fraction</strong> of the RAW, which is correct arithmetic answering a slightly different question. "How many times smaller" wants the whole number: 24 ÷ 3 = <strong>8</strong>.</p>' };
        return { correct: false, html: '<p>Not quite. Divide the big number by the small one: 24 ÷ 3.</p>' };
      },
      onChecked: function () { check6Complete(); }
    });
  }

  /* ---- 6c: cloze — what happened to the JPEG ---- */
  var CLOZE_6C_BANK = ['bigger', 'smaller', 'hidden', 'discarded', 'repetition', 'information', 'speed', 'quality'];
  var CLOZE_6C_CORRECT = ['smaller', 'discarded', 'information', 'quality'];
  function cloze6cFeedback(i, chosen) {
    var c = chosen.toLowerCase();
    if (i === 0) return c === 'bigger' ? 'The JPEG is 3 MB and the RAW is 24 MB, so the JPEG is the <strong>smaller</strong> one. Read the sentence back to yourself with your word in it — it says the opposite of what the file sizes say.' : 'Blank 1 needs a comparison word — the JPEG is eight times <em>what</em> compared to the RAW? <strong>smaller</strong>.';
    if (i === 1) return c === 'hidden' ? 'This is the single most important word in the sentence and it is not "hidden." Nothing is hidden in a JPEG — hidden things can be found again. The camera <strong>discarded</strong> it: deleted, gone, not stored anywhere in the file.' : 'Blank 2 is a verb — what did the camera <em>do</em> to make it smaller? It <strong>discarded</strong> something.';
    if (i === 2) return c === 'repetition' ? 'Careful — removing <strong>repetition</strong> is what <em>lossless</em> compression does, and it doesn’t lose anything. This sentence is about a lossy JPEG, which removes actual <strong>information</strong> the file only said once.' : 'Blank 3 is what got discarded. Not repetition, not speed — <strong>information</strong>.';
    return c === 'speed' ? 'Speed isn’t reduced by compression; if anything a smaller file is <em>faster</em> to send. What gets slightly reduced is image <strong>quality</strong>.' : 'Blank 4 is what the discarding costs you: image <strong>quality</strong>.';
  }
  function initSection6c() {
    var template = ['To make the JPEG eight times ', { blank: 0 }, ' than the RAW file, the camera ', { blank: 1 }, ' some ', { blank: 2 }, ' permanently — this can slightly reduce image ', { blank: 3 }, ' in a way you might not notice.'];
    buildCloze('cloze-6c', CLOZE_6C_BANK, template, CLOZE_6C_CORRECT, cloze6cFeedback, state.s6c, {
      checkLabel: 'Check my answer', validationMsg: 'Fill all four gaps first, then press Check my answer.',
      successText: 'Correct — smaller · discarded · information · quality. That sentence is the whole of Question 2b, and the word that carries it is <strong>discarded</strong>. Not compressed, not hidden, not packed — discarded. Seven-eighths of that file was deleted on the bet that your eye wouldn’t miss it.',
      onChecked: function () { check6Complete(); }
    });
  }

  /* ---- 6d: multi-select — when you'd want the RAW ---- */
  // Correct/incorrect deliberately NOT in a fixed pattern across this array —
  // shuffled again at render time (see initSection6d) so the position alone
  // never gives the answer away.
  var MS_6D_ITEMS = [
    { correct: true, text: "You're going to edit the photo heavily — brighten shadows, recover a blown-out sky, change the colours.",
      note: 'Yes — and this is the strongest reason of the six. Editing is where discarded detail is missed: brightening a dark corner of a JPEG shows blocky mush, because the detail that would have been there was deleted. RAW still has it.' },
    { correct: false, text: 'You want to post it to Instagram straight from your phone.',
      note: 'No. Instagram is going to compress it hard anyway, so the extra 21 MB buys you nothing and costs you upload time and data. This is a case <em>for</em> the JPEG.' },
    { correct: true, text: "It's a photo that matters and you want an archive copy with nothing thrown away.",
      note: 'Yes. An archive copy is a copy you might use for something you haven’t thought of yet, which means you want everything kept. This is the same reasoning as choosing FLAC over MP3.' },
    { correct: false, text: 'You want the photo to look better on a phone screen at normal size.',
      note: 'No — and this is the answer the question is designed to catch. At normal size on a phone screen, the RAW and the JPEG look the same. "Better quality" on its own isn’t a reason; you have to say <strong>for what purpose</strong> the extra quality is needed. The other correct options each name a purpose. This one doesn’t.' },
    { correct: true, text: "You're going to print it very large, where missing fine detail would show.",
      note: 'Yes. Big prints are where fine detail actually becomes visible again. Detail JPEG could safely throw away for a phone screen is detail you can see on an A2 print.' },
    { correct: false, text: 'You want to email it to someone on a slow connection.',
      note: 'No. A slow connection is a reason to want the file <strong>smaller</strong>, not bigger. This is a case for the JPEG.' }
  ];
  function initSection6d() {
    var items = shuffled(MS_6D_ITEMS);
    var options = items.map(function (it) { return { text: it.text }; });
    buildMultiSelect('ms-6d', options, state.s6d, {
      checkLabel: 'Check my selections', validationMsg: 'Select at least one reason first, then press Check my selections.',
      noteFor: function (i, selected) {
        var it = items[i - 1], good = it.correct;
        return { cls: (good && selected) ? 'true-selected' : (good ? 'true-unselected' : (selected ? 'false-selected' : 'false-unselected')), text: it.note };
      },
      resultFor: function (sel) {
        var correctIdx = []; items.forEach(function (it, idx) { if (it.correct) correctIdx.push(idx + 1); });
        var good = setsEqual(sel, correctIdx);
        return { good: good, text: good ? 'Editing heavily, keeping an archive copy, and printing very large. Notice what those three have in common and the phone-screen one doesn’t: each names a <strong>purpose</strong> that needs the extra data.' : 'have another look at the notes below.' };
      },
      onChecked: function () { check6Complete(); }
    });
  }

  /* ---- 6e: cloze — why streaming uses lossy ---- */
  var CLOZE_6E_BANK = ['lossless', 'lossy', 'storage', 'bandwidth', 'slower', 'faster', 'cheaper', 'larger'];
  var CLOZE_6E_CORRECT = ['lossy', 'bandwidth', 'faster', 'cheaper'];
  function cloze6eFeedback(i, chosen) {
    var c = chosen.toLowerCase();
    if (i === 0) return c === 'lossless' ? 'The wrong way round. Lossless can’t shrink audio or video anywhere near enough to stream — that’s why FLAC is far bigger than MP3. Streaming needs <strong>lossy</strong>.' : 'Blank 1 is the kind of compression streaming uses: <strong>lossy</strong>.';
    if (i === 1) return c === 'storage' ? 'Close, and storage does matter to a streaming company — but the sentence says "to send," and the word for how much data a connection can carry is <strong>bandwidth</strong>. Storage is about keeping data; bandwidth is about moving it.' : 'Blank 2 is the resource used up by <em>sending</em> — <strong>bandwidth</strong>.';
    if (i === 2) return c === 'slower' ? 'A smaller file loads <strong>faster</strong>, not slower. That’s the whole point. This is the misconception the scaffolded worksheet’s True/False check targets too.' : 'Blank 3 is what a smaller file does to loading time: <strong>faster</strong>.';
    return c === 'larger' ? '"Larger to run" doesn’t mean anything, and larger is the opposite of what compression does. Less bandwidth used means <strong>cheaper</strong> to run.' : 'Blank 4 is the money side of using less bandwidth: <strong>cheaper</strong>.';
  }
  function initSection6e() {
    var template = ['Streaming services almost always use ', { blank: 0 }, ' compression because it makes files much smaller, so they need less ', { blank: 1 }, ' (internet data) to send — meaning the stream is ', { blank: 2 }, ' to load and ', { blank: 3 }, ' to run.'];
    buildCloze('cloze-6e', CLOZE_6E_BANK, template, CLOZE_6E_CORRECT, cloze6eFeedback, state.s6e, {
      checkLabel: 'Check my answer', validationMsg: 'Fill all four gaps first, then press Check my answer.',
      successText: 'Correct — lossy · bandwidth · faster · cheaper. Those four words are the whole answer, and the chain runs one way: lossy → smaller files → less bandwidth → faster for you and cheaper for them. If you can say that chain out loud you have full marks on this question.',
      onChecked: function () { check6Complete(); }
    });
  }

  /* ---- 6f: drag-to-order (5 steps) + prose commit-reveal ---- */
  var ORDER6F_ITEMS = {
    c1: { label: 'The photo is saved as a JPEG in the first place, so some detail is thrown away straight away.' },
    c2: { label: 'The original poster uploads it, and Instagram compresses it again to save bandwidth.' },
    c3: { label: 'Your friend downloads that copy — the only copy they can get, already compressed twice.' },
    c4: { label: 'Your friend re-uploads it, and Instagram compresses it a third time.' },
    c5: { label: 'Each round throws detail away from an already-damaged copy, so the picture visibly falls apart.' }
  };
  var ORDER6F_INITIAL = ['c3', 'c5', 'c1', 'c4', 'c2'];
  var ORDER6F_CORRECT = ['c1', 'c2', 'c3', 'c4', 'c5'];
  var ORDER6F_SUCCESS = '<p>Correct. Read your own chain back and notice the thing that makes this question work: <strong>there is no step where the lost detail comes back.</strong> Every step either removes detail or passes along a copy that has already lost some. That’s what "lossy compression stacks" means.</p>';
  function order6fCheckFn(order) {
    if (order.indexOf('c1') !== 0) return '<p>Not quite — start earlier than you think. Before Instagram touched it at all, the camera already saved it as a <strong>JPEG</strong>, and that first save already threw detail away. Everything after that is happening to an already-lossy file.</p>';
    if (order.indexOf('c3') < order.indexOf('c2')) return '<p>Not quite — your friend can only download what’s already on Instagram, so the original poster’s upload has to come first. Your friend never sees the original file; they only ever get the copy Instagram made.</p>';
    if (order.indexOf('c5') !== 4) return '<p>Nearly — the visible damage is the <strong>result</strong>, so it belongs at the end. It isn’t a step in the process; it’s what you notice after the steps have happened.</p>';
    return '<p>Not quite. Work forwards from the very beginning: what happened to this photo <em>before</em> anybody uploaded anything? Then who uploaded it first? Then who downloaded it? Then who re-uploaded it? Then what do you see?</p>';
  }
  function initOrder6f() {
    buildOrderWidget('order-6f', ORDER6F_ITEMS, ORDER6F_INITIAL, ORDER6F_CORRECT, order6fCheckFn, ORDER6F_SUCCESS,
      function () { return state.s6fOrder; },
      function (order, checked, correct) { state.s6fOrder = order; state.s6fOrderChecked = checked; state.s6fOrderCorrect = correct; save(); if (correct) $('prose-6f').hidden = false; check6Complete(); },
      function () {});
    if (state.s6fOrderChecked) $('prose-6f').hidden = false;
  }

  function initProse6f() {
    var input = $('prose-6f-input'), btn = $('prose-6f-btn'), hint = $('prose-6f-hint'), reveal = $('prose-6f-reveal'), selfcheck = $('selfcheck-6f');
    input.value = state.s6fProse;
    if (state.s6fProseSaved) { reveal.hidden = false; selfcheck.hidden = false; }
    [1, 2, 3].forEach(function (i) { var cb = $('tick-6f-' + i); cb.checked = !!state.s6fTicks[i - 1]; cb.addEventListener('change', function () { state.s6fTicks[i - 1] = cb.checked; save(); }); });
    btn.addEventListener('click', function () {
      var text = input.value.trim();
      if (!text) { hint.hidden = false; return; }
      hint.hidden = true;
      state.s6fProse = text; state.s6fProseSaved = true; save();
      reveal.hidden = false; selfcheck.hidden = false;
      check6Complete();
    });
  }

  /* ---- Period 1 exit ticket: formats + definitions ---- */
  var LOSSLESS_LIST = ['zip', 'png', 'flac', 'wav', 'bmp', 'raw', '7z', 'rar', 'gzip', 'gz', 'tiff', 'tif', 'alac', 'apng', 'webplossless', 'losslesswebp'];
  var LOSSY_LIST = ['jpeg', 'jpg', 'mp3', 'mp4', 'h264', 'h.264', 'aac', 'm4a', 'ogg', 'opus', 'webm', 'wma', 'avif', 'heic', 'webplossy', 'lossywebp', 'webp'];
  function normFormat(v) { return v.trim().toLowerCase().replace(/^\./, '').replace(/[\s\/]/g, ''); }

  function initExitFormats() {
    var wrap = $('exit-formats');
    wrap.innerHTML = '<label class="field-label" for="exit-lossless">A lossless format:</label>' +
      '<input type="text" id="exit-lossless" class="field-input" placeholder="e.g. a format that keeps everything">' +
      '<label class="field-label" for="exit-lossy">A lossy format:</label>' +
      '<input type="text" id="exit-lossy" class="field-input" placeholder="e.g. a format that throws detail away">' +
      '<div class="btn-row"><button type="button" class="btn btn-primary check-btn">Check my two formats</button></div>' +
      '<p class="hint" hidden></p><div class="item-feedback" hidden></div>';
    var losslessInput = $('exit-lossless'), lossyInput = $('exit-lossy');
    var hint = wrap.querySelector('.hint'), fb = wrap.querySelector('.item-feedback');
    losslessInput.value = state.exitFormats.lossless; lossyInput.value = state.exitFormats.lossy;

    function check(persist) {
      var a = losslessInput.value, b = lossyInput.value;
      if (!a.trim() || !b.trim()) { hint.hidden = false; hint.textContent = 'Fill in both boxes first, then press Check my two formats.'; return; }
      hint.hidden = true;
      var na = normFormat(a), nb = normFormat(b);
      var good = false, text;
      if (na === 'gif' || nb === 'gif') { text = 'You’ve picked the one format on this page that genuinely can’t settle the argument — see Section 4’s GIF card. Pick a format that isn’t disputed, so the exit ticket has a clean answer.'; }
      else if (LOSSY_LIST.indexOf(na) !== -1) { text = 'Have another look at the first box — that one is a <strong>lossy</strong> format. Something in it was permanently discarded, so it can’t go in the lossless box. Try ZIP, PNG, FLAC or WAV.'; }
      else if (LOSSLESS_LIST.indexOf(nb) !== -1) { text = 'Have another look at the second box — that one is a <strong>lossless</strong> format; nothing was thrown away. Try JPEG, MP3 or MP4.'; }
      else if (LOSSLESS_LIST.indexOf(na) === -1 || LOSSY_LIST.indexOf(nb) === -1) { text = 'That isn’t a format this page recognises. It might still be a real one — but for this check, use something from the lesson: ZIP, PNG, FLAC, WAV, BMP or RAW for lossless; JPEG, MP3, MP4 or AAC for lossy.'; }
      else { good = true; text = 'Correct — both boxes hold a real format of the right kind. That’s the naming half of the exit ticket done.'; }
      fb.className = 'item-feedback ' + (good ? 'good' : 'bad');
      fb.innerHTML = '<p class="fb-head">' + (good ? 'Correct' : 'Have another look') + '</p><p>' + text + '</p>';
      fb.hidden = false;
      if (persist !== false) { state.exitFormats = { lossless: a, lossy: b, checked: true }; save(); $('exit-defs').hidden = false; check6Complete(); }
    }
    wrap.querySelector('.check-btn').addEventListener('click', function () { check(true); });
    if (state.exitFormats.checked) { check(false); $('exit-defs').hidden = false; }
  }

  function initExitDefs() {
    var lossless = $('exit-def-lossless'), lossy = $('exit-def-lossy'), btn = $('exit-def-btn'), reveal = $('exit-def-reveal'), selfcheck = $('selfcheck-exit');
    lossless.value = state.exitDefs.lossless; lossy.value = state.exitDefs.lossy;
    if (state.exitDefs.saved) { reveal.hidden = false; selfcheck.hidden = false; }
    [1, 2, 3].forEach(function (i) { var cb = $('tick-exit-' + i); cb.checked = !!state.exitDefs.ticks[i - 1]; cb.addEventListener('change', function () { state.exitDefs.ticks[i - 1] = cb.checked; save(); }); });
    btn.addEventListener('click', function () {
      state.exitDefs.lossless = lossless.value; state.exitDefs.lossy = lossy.value; state.exitDefs.saved = true; save();
      reveal.hidden = false; selfcheck.hidden = false;
      check6Complete();
    });
  }

  function check6Complete() {
    var autoMarked = state.s6a.checked && state.s6b.checked && state.s6c.checked && state.s6d.checked && state.s6e.checked && state.s6fOrderChecked;
    var exitDone = state.exitFormats.checked;
    if (autoMarked && exitDone) { $('section6-closing').hidden = false; markSection(6); }
  }

  /* =========================================================================
     SECTION 7 — what's in a terms of use policy
     ========================================================================= */
  var CLOZE_7E_BANK = ['agreement', 'receipt', 'hardware', 'software', 'rules', 'settings', 'agree', 'download'];
  var CLOZE_7E_CORRECT = ['agreement', 'software', 'rules', 'agree'];
  function cloze7eFeedback(i, chosen) {
    var c = chosen.toLowerCase();
    if (i === 0) return c === 'receipt' ? 'A receipt is a record of something that already happened. A EULA is something you enter into — a legal <strong>agreement</strong>, binding on both sides, from the moment you accept it.' : 'Blank 1 is what kind of legal thing it is. Two parties, both bound: an <strong>agreement</strong>.';
    if (i === 1) return c === 'hardware' ? 'Careful — a EULA is about the <strong>software</strong>, not the physical device. You can own a phone outright and still only have a licence to use the apps on it. That distinction is most of what a EULA exists to state.' : 'Blank 2 is what kind of company writes one: a <strong>software</strong> company.';
    if (i === 2) return c === 'settings' ? 'Settings are things you choose. A EULA sets out <strong>rules</strong> you agree to be bound by — that’s a different thing entirely, and you don’t get to change them.' : 'Blank 3 is what the agreement sets out: the <strong>rules</strong> for using the product.';
    return c === 'download' ? 'Downloading isn’t the legal step — you can download something without accepting anything. The legal step is the moment you click "I <strong>agree</strong>."' : 'Blank 4 is the word on the button you click without reading: "I <strong>agree</strong>."';
  }
  function initSection7e() {
    var template = ['A terms of use policy or EULA (End User Licence Agreement) is a legal ', { blank: 0 }, ' between you and a ', { blank: 1 }, ' company, setting out the ', { blank: 2 }, ' for using their product. Clicking "I ', { blank: 3 }, '" is a real legal step.'];
    buildCloze('cloze-7e', CLOZE_7E_BANK, template, CLOZE_7E_CORRECT, cloze7eFeedback, state.s7e, {
      checkLabel: 'Check my answer', validationMsg: 'Fill all four gaps first, then press Check my answer.',
      successText: 'Correct — agreement · software · rules · agree. Read the last sentence again, because it’s the one that matters: <em>clicking "I agree" is a real legal step.</em> Not a formality, not a pop-up to dismiss. A contract, agreed to by almost everyone who has never read it.',
      onChecked: function () { checkSection7Complete(); }
    });
  }

  var MS_7F_OPTIONS = [
    { text: 'What information the app collects about you' },
    { text: 'Whether your data can be shared with or sold to other companies' },
    { text: "How much the app costs and when you'll be billed" },
    { text: 'Who owns the photos and posts you upload' },
    { text: 'The minimum phone specifications the app needs to run' },
    { text: "The rules for what you're allowed to do with the product" },
    { text: "How to reset your password if you forget it" },
    { text: "What the company is and isn't responsible for if something goes wrong" },
    { text: 'Whether you can join a class action or must go to individual arbitration' },
    { text: "How fast the app's servers are guaranteed to respond" }
  ];
  var MS_7F_NOTES = [
    'Yes — Data collection. The first of the six, and usually the longest section in a real policy.',
    'Yes — Data use and sharing. The one most worth reading carefully, because "third-party partners" is often left deliberately unnamed.',
    'No. Pricing and billing live in a separate purchase agreement or in the app store’s own terms. It’s a reasonable guess, but it isn’t one of the six.',
    'Yes — Content ownership. And the answer is usually more complicated than "you do."',
    'No. That’s a technical requirement in the app store listing, not a legal clause. Nobody’s rights depend on it.',
    'Yes — Acceptable use. The only one of the six that puts rules on <strong>you</strong> rather than describing what the company may do. Worth noticing.',
    'No. That’s a help article. A terms of use policy is about rights and obligations, not instructions.',
    'Yes — Liability. Almost always written as broadly as the law allows.',
    'Yes — Dispute resolution. The one almost nobody reads and one of the most consequential.',
    'No. A guaranteed response time is a service level agreement, which is a business-to-business thing. Consumer terms almost always say the opposite — that the service is provided "as is," with nothing guaranteed.'
  ];
  var MS_7F_CORRECT = [1, 2, 4, 6, 8, 9];
  function initSection7f() {
    buildMultiSelect('ms-7f', MS_7F_OPTIONS, state.s7f, {
      checkLabel: 'Check my selections', validationMsg: 'Select at least one first, then press Check my selections.',
      noteFor: function (i, selected) { var good = MS_7F_CORRECT.indexOf(i) !== -1; return { cls: (good && selected) ? 'true-selected' : (good ? 'true-unselected' : (selected ? 'false-selected' : 'false-unselected')), text: MS_7F_NOTES[i - 1] }; },
      resultFor: function (sel) { var good = setsEqual(sel, MS_7F_CORRECT); return { good: good, text: good ? '1, 2, 4, 6, 8 and 9 — the six categories from the table above, in order. The four wrong ones were all about <strong>how the product works</strong>; the six real ones are all about <strong>rights</strong>.' : 'compare your selections against the notes below and try again.' }; },
      onChecked: function () { checkSection7Complete(); }
    });
  }

  function checkSection7Complete() {
    if (state.qc['qc-clause'] && state.s7e.checked && state.s7f.checked) {
      $('section7-closing').hidden = false;
      markSection(7);
    }
  }

  /* =========================================================================
     SECTION 8 — Part B matching widget + leftover question
     ========================================================================= */
  var MATCH_CATEGORIES = ['Liability', 'Data collection', 'Acceptable use', 'Dispute resolution', 'Content ownership', 'Data use and sharing'];
  var MATCH_CLAUSES = [
    { id: 'cl1', text: 'By creating an account, you agree that we may collect your name, email address, location data, and information about how you use the App.', correct: 'Data collection',
      good: 'Yes — <strong>Data collection</strong>. This clause is a list of what they gather about you, and nothing else. Note how much is on the list: not just the obvious account details, but where you are and how you use the app.',
      wrong: {
        'Data use and sharing': 'Close — this is the mix-up worth getting straight, and it’s the pair this excerpt is built to test. This clause only says what they <strong>collect</strong>. It says nothing at all about what they then do with it or who else sees it — that’s clause 3’s job. Collecting is <strong>Data collection</strong>.',
        'Content ownership': 'Not quite — content ownership is about things you <strong>create and upload</strong>, like a photo or a post. This clause is about information gathered <strong>about you</strong> — your name, your location, your usage. That’s <strong>Data collection</strong>.',
        'Acceptable use': 'Not quite — acceptable use sets rules for what <strong>you</strong> are allowed to do with the app. This clause doesn’t restrict you at all; it lists what the company takes. That’s <strong>Data collection</strong>.',
        'Liability': 'Not quite — liability is about who’s responsible when something goes wrong. Nothing has gone wrong in this clause; it’s simply a list of what’s gathered about you. <strong>Data collection</strong>.',
        'Dispute resolution': 'Not quite — dispute resolution is about what happens when you and the company disagree. This clause is about what information they take when you sign up. <strong>Data collection</strong>.'
      } },
    { id: 'cl2', text: 'Content you upload remains yours, but you grant us a worldwide, royalty-free licence to use, reproduce, and display that content in connection with operating the App.', correct: 'Content ownership',
      good: 'Yes — <strong>Content ownership</strong>. And read what it actually does: it says the content stays yours, then grants the company a worldwide, unpaid right to use it anyway. Both halves are true at once. ("Royalty-free" means they never have to pay you for using it.) That combination is standard in real terms of use, and the first half is the part people remember.',
      wrong: {
        'Data use and sharing': 'Close, and this one is genuinely tricky. The distinction is <strong>what</strong> is being handled. <em>Data use and sharing</em> is about information <strong>about you</strong> — your location, your habits, your contacts. This clause is about things <strong>you made and uploaded</strong> — your photos, your posts. That’s <strong>Content ownership</strong>.',
        'Data collection': 'Not quite — this clause isn’t about what they gather about you. It’s about what rights they get over the things you <strong>upload</strong>. That’s <strong>Content ownership</strong>.',
        'Acceptable use': 'Not quite — acceptable use is rules for what you’re allowed to do. This clause is about who holds what rights over your uploads, which is <strong>Content ownership</strong>.',
        'Liability': 'Not quite — no blame or responsibility is being assigned here. This is about ownership of and rights over uploaded content: <strong>Content ownership</strong>.',
        'Dispute resolution': 'Not quite — nothing here is about disagreements or how they get settled. It’s about rights over your uploads: <strong>Content ownership</strong>.'
      } },
    { id: 'cl3', text: 'We may share your data with third-party partners for advertising purposes.', correct: 'Data use and sharing',
      good: 'Yes — <strong>Data use and sharing</strong>. Short clause, large consequence: "third-party partners" is deliberately unspecified, so this single sentence can cover companies you’ve never heard of and never interacted with.',
      wrong: {
        'Data collection': 'Close — and this is exactly the clause 1 / clause 3 pair the excerpt is testing. Clause 1 was what they <strong>collect</strong>. This clause is what they <strong>do with it and who else gets it</strong>. That’s <strong>Data use and sharing</strong>.',
        'Content ownership': 'Not quite — content ownership is about things you upload. This clause is about <strong>data about you</strong> going to other companies: <strong>Data use and sharing</strong>.',
        'Acceptable use': 'Not quite — this places no rules on you at all. It describes what the company does with your data: <strong>Data use and sharing</strong>.',
        'Liability': 'Not quite — nobody is being held responsible for anything here. Data is being passed to other companies: <strong>Data use and sharing</strong>.',
        'Dispute resolution': 'Not quite — no disagreement is involved. This is about your data reaching advertisers: <strong>Data use and sharing</strong>.'
      } },
    { id: 'cl4', text: 'We are not liable for any loss or damage arising from your use of the App.', correct: 'Liability',
      good: 'Yes — <strong>Liability</strong>. The word "liable" is right there, which makes this the easiest one in the excerpt. Worth noticing how broad it is: <em>any</em> loss or damage, from <em>any</em> use.',
      wrong: {
        'Dispute resolution': 'Close — these two often sit next to each other and get confused. <strong>Liability</strong> is about <strong>who is responsible</strong> when something goes wrong. <strong>Dispute resolution</strong> is about <strong>how an argument gets settled</strong>. This clause is about responsibility, so it’s <strong>Liability</strong>. Clause 5 is the dispute one — and because each category is used once, putting Dispute resolution here leaves you nothing for clause 5.',
        'Acceptable use': 'Not quite — acceptable use is rules for what <strong>you</strong> may do. This clause is about what the company is and isn’t answerable for: <strong>Liability</strong>.',
        'Data collection': 'Not quite — this clause isn’t about data or uploads at all. It’s about who’s responsible if something goes wrong, which is <strong>Liability</strong>. The word "liable" in the clause is the giveaway.',
        'Data use and sharing': 'Not quite — this clause isn’t about data or uploads at all. It’s about who’s responsible if something goes wrong, which is <strong>Liability</strong>. The word "liable" in the clause is the giveaway.',
        'Content ownership': 'Not quite — this clause isn’t about data or uploads at all. It’s about who’s responsible if something goes wrong, which is <strong>Liability</strong>. The word "liable" in the clause is the giveaway.'
      } },
    { id: 'cl5', text: 'Any dispute must be resolved through individual arbitration, not a court case or class action.', correct: 'Dispute resolution',
      good: 'Yes — <strong>Dispute resolution</strong>. And this is the clause worth understanding properly. <strong>Arbitration</strong> means the argument is settled privately rather than in court. <strong>"Individual"</strong> and <strong>"not a class action"</strong> mean you can’t join up with everyone else affected by the same problem. So if a company does something that harms a million users a small amount each, this clause means a million separate private cases instead of one large public one. Companies write this clause on purpose, and almost nobody reads it.',
      wrong: {
        'Liability': 'Close — these two go together and get confused. <strong>Liability</strong> is about <strong>who’s responsible</strong> (that was clause 4). <strong>Dispute resolution</strong> is about <strong>how a disagreement gets handled</strong> — which court, or no court at all. This clause is about the process, so it’s <strong>Dispute resolution</strong>.',
        'Acceptable use': 'Not quite — acceptable use is rules for using the product. This clause is about what happens when you and the company end up in an argument: <strong>Dispute resolution</strong>.',
        'Data collection': 'Not quite — no data or uploaded content is involved. This clause is entirely about how a disagreement gets settled: <strong>Dispute resolution</strong>.',
        'Data use and sharing': 'Not quite — no data or uploaded content is involved. This clause is entirely about how a disagreement gets settled: <strong>Dispute resolution</strong>.',
        'Content ownership': 'Not quite — no data or uploaded content is involved. This clause is entirely about how a disagreement gets settled: <strong>Dispute resolution</strong>.'
      } }
  ];

  function initSection8() {
    buildMatchWidget('match-8', MATCH_CATEGORIES, MATCH_CLAUSES, state.s8match, $('match8-counter'), function () {
      $('leftover-8a').hidden = false;
    });
    if (state.s8match.checked) {
      var allCorrect = MATCH_CLAUSES.every(function (c) { return state.s8match.assign && state.s8match.assign[c.id] === c.correct; });
      if (allCorrect) $('leftover-8a').hidden = false;
    }
  }

  function initLeftover8a() {
    var items = [{ id: 'leftover', name: '', options: MATCH_CATEGORIES, correct: 'Acceptable use',
      good: 'Yes — <strong>Acceptable use</strong>, the rules for what <strong>you’re</strong> allowed to do. All five clauses in this excerpt were about what the <strong>company</strong> may do. That’s not an accident of the example; it’s roughly the shape of real terms of use, and it’s a useful thing to notice when you read a real one in Section 10.',
      wrongDefault: 'Have another look — you assigned that one to a clause a moment ago, so it can’t be the leftover. The one you never used is <strong>Acceptable use</strong>: the rules for what <strong>you’re</strong> allowed to do with the product. Every clause in this excerpt was about what the <strong>company</strong> may do.' }];
    buildClassifyList('leftover-8a-classifier', items, state.s8leftover, 'Pick one of the six first, then press Check.', function () {
      if (state.s8leftover.leftover && state.s8leftover.leftover.correct) {
        $('section8-closing').hidden = false;
        markSection(8);
      }
    });
  }

  /* =========================================================================
     SECTION 9 — close reading: click-the-phrase + streak practice
     ========================================================================= */
  var PHRASE_ITEMS = [
    { phrases: [
        { text: 'Notwithstanding any other provision of these Terms,', correct: false },
        { text: 'and to the fullest extent permitted by applicable law,', correct: false },
        { text: 'we may transfer your personal information to our affiliates and service providers', correct: true },
        { text: 'in jurisdictions which may not offer the same level of data protection,', correct: false },
        { text: 'and you consent to such transfer.', correct: false }
      ],
      feedback: [
        '"Notwithstanding any other provision" means "even if something else in this document says otherwise." It’s a priority instruction, not the thing being done. Look for a phrase with a <strong>verb and an object</strong>: who does what, to what?',
        '"To the fullest extent permitted by applicable law" is a limit on how far the clause reaches. It appears in almost every category of clause, so it can’t tell you which one this is. Look for the phrase naming an action.',
        'Yes. Strip everything else away and the clause says: <strong>we may transfer your personal information to other companies.</strong> That’s <strong>Data use and sharing</strong>. Everything around it — "notwithstanding," "to the fullest extent permitted," "and you consent" — is legal padding that changes nothing about what is being done.',
        'That phrase tells you why the transfer matters — and it does matter — but it describes a <strong>consequence</strong> of the action, not the action. The action is in the phrase just before it.',
        '"You consent to such transfer" is you agreeing. The whole document is you agreeing; that’s what makes it an agreement. It doesn’t tell you what kind of clause this is. Find the phrase that says what the company <em>does</em>.'
      ] },
    { phrases: [
        { text: 'You agree that you will not,', correct: false },
        { text: 'and will not permit any third party to,', correct: false },
        { text: 'use the Service to upload, post or transmit any content that is unlawful, harassing or infringes the rights of others,', correct: true },
        { text: 'and we reserve the right to remove such content', correct: false },
        { text: 'and suspend the relevant account.', correct: false }
      ],
      feedback: [
        '"You agree that you will not" tells you the <em>shape</em> of the clause — you’re being restricted — but not what the restriction is about. You’re very close: the giveaway is the phrase that says what you must not do.',
        '"And will not permit any third party to" extends the same restriction to other people. It’s still not saying <strong>what</strong> the restriction is.',
        'Yes. This is the one category that never appeared in Part B’s excerpt, and here it is in the wild: a rule about what <strong>you</strong> are not allowed to do. <strong>Acceptable use.</strong> The tell is the subject of the sentence — "you agree that you will not." When the restricted party is you, it’s Acceptable use.',
        'Those two say what the company will do if you break the rule — remove content, suspend the account. That’s enforcement, which follows from the rule. The rule itself is the phrase before them, and it’s the phrase that names the category: <strong>Acceptable use</strong>.',
        'Those two say what the company will do if you break the rule — remove content, suspend the account. That’s enforcement, which follows from the rule. The rule itself is the phrase before them, and it’s the phrase that names the category: <strong>Acceptable use</strong>.'
      ] },
    { phrases: [
        { text: 'In no event shall the Company, its directors, employees or agents', correct: false },
        { text: 'be liable for any indirect, incidental or consequential damages arising out of your use of the Service,', correct: true },
        { text: 'including but not limited to loss of data, loss of profits, or business interruption,', correct: false },
        { text: 'whether based in contract, tort or otherwise,', correct: false },
        { text: 'even if advised of the possibility of such damages.', correct: false }
      ],
      feedback: [
        'That’s the list of <em>who</em> is protected — the company and everyone who works for it. It’s important, but it doesn’t tell you what kind of clause this is. What are all those people protected <strong>from</strong>?',
        'Yes — the word <strong>liable</strong> does the work, exactly as it did in Part B’s clause 4. <strong>Liability.</strong> Notice how much padding is stacked around one idea: five phrases to say "if something goes wrong, that’s not our problem."',
        'That’s a list of examples of the damages. Examples elaborate the idea; they aren’t the idea. The phrase before it contains the word that names the category.',
        '"Whether based in contract, tort or otherwise" is a list of legal grounds it applies to. It’s coverage, not content.',
        '"Even if advised of the possibility" closes a loophole — you can’t argue they should have known. It strengthens the clause without saying what the clause is about.'
      ] }
  ];

  function initSection9a() {
    buildPhraseWidget('phrase-9a', PHRASE_ITEMS, state.s9a, $('phrase-counter'), function () {
      $('section9a-closing').hidden = false;
      checkSection9Complete();
    });
  }

  var STREAK_CLAUSES = [
    { id: 'A', text: 'We collect device identifiers, IP address, and approximate location derived from your network connection.', correct: 'Data collection',
      good: 'Yes — <strong>Data collection</strong>. It’s a list of what’s gathered, and note that none of it is anything you typed in. You can hand over a great deal without filling in a single field.',
      wrongDefault: 'Have another look. Nothing here is being shared, owned, restricted or disputed — it’s a list of what the company <strong>gathers about you</strong>. That’s <strong>Data collection</strong>.' },
    { id: 'B', text: 'You may not reverse-engineer, decompile or attempt to extract the source code of the Software.', correct: 'Acceptable use',
      good: 'Yes — <strong>Acceptable use</strong>. The subject is "you," and it’s a rule about what you may not do with the product. That’s the tell.',
      wrongDefault: 'Have another look. Who is being restricted here? The sentence starts with "you may not" — it’s a rule about what <strong>you</strong> are allowed to do with the product, which is <strong>Acceptable use</strong>.' },
    { id: 'C', text: 'By submitting a review, you grant us a perpetual, irrevocable right to publish and adapt it in our marketing materials.', correct: 'Content ownership',
      good: 'Yes — <strong>Content ownership</strong>. You wrote the review; this clause is about what rights the company gets over the thing you made. "Perpetual" means forever and "irrevocable" means you can’t take it back.',
      wrong: { 'Data use and sharing': 'Close — the same trap as Part B’s clause 2. <em>Data use and sharing</em> is about information <strong>about you</strong>. This is about something <strong>you created and submitted</strong>: a review. Rights over things you make is <strong>Content ownership</strong>.' },
      wrongDefault: 'Have another look. Ask what the clause is about: a thing you <strong>made and submitted</strong>, and who may use it. That’s <strong>Content ownership</strong>.' },
    { id: 'D', text: 'Any claim arising under this agreement shall be brought exclusively in the courts of the state in which the Company is registered.', correct: 'Dispute resolution',
      good: 'Yes — <strong>Dispute resolution</strong>. It doesn’t mention arbitration, so it doesn’t look like Part B’s clause 5 — but it does the same job: it decides <strong>where and how</strong> an argument gets settled, in a place chosen by the company and probably nowhere near you.',
      wrong: { 'Liability': 'Close, and it’s the same pair as before. Liability is about <strong>who is responsible</strong>. This clause doesn’t say who’s at fault about anything — it says <strong>where an argument has to be taken</strong>. That’s <strong>Dispute resolution</strong>.' },
      wrongDefault: 'Have another look. A "claim arising under this agreement" is a disagreement, and this clause says where it must go. <strong>Dispute resolution</strong>.' },
    { id: 'E', text: 'We may disclose your information to law enforcement or other third parties where we believe in good faith that disclosure is necessary.', correct: 'Data use and sharing',
      good: 'Yes — <strong>Data use and sharing</strong>. Worth reading twice: the test isn’t a court order, it’s what the company itself <strong>believes in good faith</strong>. The company decides.',
      wrong: { 'Data collection': 'Close — the clause 1 / clause 3 pair again. Collection is what they <strong>gather</strong>. This is what they <strong>do with it and who else gets it</strong>. <strong>Data use and sharing</strong>.' },
      wrongDefault: 'Have another look. Your information is going to somebody else. Whenever data leaves the company, it’s <strong>Data use and sharing</strong>.' },
    { id: 'F', text: 'The Service is provided "as is", without warranty of any kind, and we accept no responsibility for any interruption or data loss.', correct: 'Liability',
      good: 'Yes — <strong>Liability</strong>. "As is" and "we accept no responsibility" are the two phrases to recognise; they’re saying if it breaks, that’s not on us. Almost every consumer service says a version of this.',
      wrong: { 'Dispute resolution': 'Close — this clause doesn’t say anything about <em>how</em> an argument gets settled. It says the company isn’t <strong>responsible</strong> in the first place. <strong>Liability</strong>.' },
      wrongDefault: 'Have another look. "We accept no responsibility" is the giveaway phrase, and responsibility for things going wrong is <strong>Liability</strong>.' }
  ];

  function initStreak9b() {
    buildStreakWidget('streak-9b', STREAK_CLAUSES, state.s9b, function () {
      $('section9-closing').hidden = false;
      checkSection9Complete();
    });
  }

  function checkSection9Complete() {
    var phraseDone = Object.keys(state.s9a).length >= PHRASE_ITEMS.length;
    var streakDone = state.s9b.doneIds && state.s9b.doneIds.length >= STREAK_CLAUSES.length;
    if (phraseDone && streakDone) markSection(9);
  }

  /* =========================================================================
     SECTION 10 — find a real one
     ========================================================================= */
  function initCopyLinks() {
    var hint = $('copy-hint');
    Array.prototype.forEach.call(document.querySelectorAll('.copy-text'), function (linkEl) {
      function doCopy() {
        var text = linkEl.getAttribute('data-copy');
        function shown() {
          if (!hint) return;
          hint.hidden = false;
          clearTimeout(hint._t);
          hint._t = setTimeout(function () { hint.hidden = true; }, 2500);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(shown, shown);
        else shown();
      }
      linkEl.addEventListener('click', doCopy);
      linkEl.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doCopy(); } });
    });
  }

  function initSection10() {
    var appInput = $('field-app'), clausesInput = $('field-clauses'), meaningInput = $('field-meaning'), surpriseInput = $('field-surprise');
    var btn = $('save-section10-btn'), hint = $('section10-hint'), confirm = $('section10-confirm'), reveal = $('section10-reveal');

    appInput.value = state.s10.app; clausesInput.value = state.s10.clauses;
    meaningInput.value = state.s10.meaning; surpriseInput.value = state.s10.surprise;
    if (state.s10.saved) { confirm.hidden = false; reveal.hidden = false; }

    for (var i = 1; i <= 9; i++) {
      (function (idx) {
        var cb = $('tick-10-' + idx);
        cb.checked = !!state.s10.ticks[idx - 1];
        cb.addEventListener('change', function () { state.s10.ticks[idx - 1] = cb.checked; save(); });
      })(i);
    }

    btn.addEventListener('click', function () {
      if (!appInput.value.trim()) { hint.hidden = false; return; }
      hint.hidden = true;
      state.s10.app = appInput.value; state.s10.clauses = clausesInput.value;
      state.s10.meaning = meaningInput.value; state.s10.surprise = surpriseInput.value;
      state.s10.saved = true; save();
      confirm.hidden = false; reveal.hidden = false;
      markSection(10);
    });
  }

  /* =========================================================================
     SECTION 11 — going further (optional)
     ========================================================================= */
  var GIF_SUPPORT = {
    yes: [1, 3, 4, 6],
    no: [2, 5],
    depends: [1, 2, 3, 4, 5, 6]
  };
  var MS_11A_OPTIONS = [
    { text: 'GIF’s compression step discards no pixel data at all.' },
    { text: 'A photo saved as a GIF visibly loses colour detail.' },
    { text: 'Decompressing a GIF returns exactly the pixels that were stored.' },
    { text: 'The 256-colour reduction happens before compression, not during it.' },
    { text: 'A user comparing the original to the GIF can see information is missing.' },
    { text: '"Lossless" is normally used to describe the compression algorithm, not the whole saving process.' }
  ];
  function ms11aNote(i) {
    var supportsYes = GIF_SUPPORT.yes.indexOf(i) !== -1;
    var supportsNo = GIF_SUPPORT.no.indexOf(i) !== -1;
    var tag = supportsYes ? 'Supports "lossless is fair" and "depends".' : (supportsNo ? 'Supports "it’s misleading" and "depends".' : '');
    return 'All six statements are true. ' + tag;
  }

  function initSection11a() {
    var sideWrap = $('side-11a'), sideConfirm = $('side-11a-confirm');
    Array.prototype.forEach.call(sideWrap.querySelectorAll('.btn-option'), function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(sideWrap.querySelectorAll('.btn-option'), function (o) { o.classList.remove('picked-correct'); o.setAttribute('aria-pressed', 'false'); });
        b.classList.add('picked-correct'); b.setAttribute('aria-pressed', 'true');
        state.s11aSide = b.getAttribute('data-value'); save();
        sideConfirm.hidden = false;
        $('evidence-11a').hidden = false;
        markSection(11);
      });
    });
    if (state.s11aSide) {
      var prior = sideWrap.querySelector('.btn-option[data-value="' + state.s11aSide + '"]');
      if (prior) prior.click();
    }

    buildMultiSelect('ms-11a', MS_11A_OPTIONS, state.s11aEvidence, {
      checkLabel: 'Check my evidence',
      validationMsg: 'Pick a side first, then select at least one statement, then press Check my evidence.',
      noteFor: function (i) { return { cls: 'true-selected', text: ms11aNote(i) }; },
      resultFor: function (sel) {
        var side = state.s11aSide || 'yes';
        var supportSet = GIF_SUPPORT[side];
        var allSupport = sel.every(function (i) { return supportSet.indexOf(i) !== -1; });
        var good = allSupport && sel.length >= 2;
        var text;
        if (!sel.length) text = 'select at least one statement.';
        else if (sel.length < 2) text = 'pick at least two. One fact isn’t an argument — an argument is at least two things that fit together.';
        else if (!allSupport) text = 'one or more of the statements you picked argues against you. Statements 2 and 5 are about what the <em>user sees</em> (supports "misleading"); statements 1, 3, 4 and 6 are about what the <em>algorithm does</em> (supports "lossless is fair"). Deselect the ones that aren’t on your side and check again.';
        else text = side === 'depends' ? 'every statement you picked argues for your side — you were allowed all six, because the "depends" position has to hold both halves at once.' : 'every statement you picked argues for your side, building one coherent case.';
        return { good: good, text: text };
      },
      onChecked: function () { $('prose-11a').hidden = false; }
    });
    if (state.s11aEvidence.checked) $('prose-11a').hidden = false;

    var input = $('prose-11a-input'), btn = $('prose-11a-btn'), hint = $('prose-11a-hint'), reveal = $('prose-11a-reveal'), selfcheck = $('selfcheck-11a');
    input.value = state.s11aProse;
    if (state.s11aProseSaved) { reveal.hidden = false; selfcheck.hidden = false; }
    [1, 2].forEach(function (i) { var cb = $('tick-11a-' + i); cb.checked = !!state.s11aTicks[i - 1]; cb.addEventListener('change', function () { state.s11aTicks[i - 1] = cb.checked; save(); }); });
    btn.addEventListener('click', function () {
      var text = input.value.trim();
      if (!text) { hint.hidden = false; return; }
      hint.hidden = true;
      state.s11aProse = text; state.s11aProseSaved = true; save();
      reveal.hidden = false; selfcheck.hidden = false;
    });
  }

  function initSection11b() {
    var f1 = $('ladder-1'), f2 = $('ladder-2'), f3 = $('ladder-3'), btn = $('ladder-save-btn'), confirm = $('ladder-confirm'), selfcheck = $('selfcheck-11b');
    f1.value = state.s11b.f1; f2.value = state.s11b.f2; f3.value = state.s11b.f3;
    if (state.s11b.saved) { confirm.hidden = false; selfcheck.hidden = false; }
    [1, 2, 3].forEach(function (i) { var cb = $('tick-11b-' + i); cb.checked = !!state.s11b.ticks[i - 1]; cb.addEventListener('change', function () { state.s11b.ticks[i - 1] = cb.checked; save(); }); });
    btn.addEventListener('click', function () {
      state.s11b.f1 = f1.value; state.s11b.f2 = f2.value; state.s11b.f3 = f3.value; state.s11b.saved = true; save();
      confirm.hidden = false; selfcheck.hidden = false;
      markSection(11);
    });
  }

  /* =========================================================================
     SECTION 12 — wrap-up, end observer, work summary (print/download)
     ========================================================================= */
  function initEndObserver() {
    var marker = $('section-12-marker');
    if (!marker || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { markSection(12); io.disconnect(); } });
    }, { threshold: 0.35 });
    io.observe(marker);
  }

  function yn(b) { return b ? '(correct)' : '(have another look)'; }

  function renderSummary() {
    var out = $('summary-content');
    if (!out) return;
    var who = escapeHtml(state.studentName || '(name not entered)') + (state.studentClass ? ' — ' + escapeHtml(state.studentClass) : '');
    var html = '<h4>' + who + '</h4>';
    html += '<p class="summary-meta">Lessons 9–10 — Data Compression and Terms of Use/EULA. Printed ' + new Date().toLocaleDateString('en-AU') +
      '. Questions 1, 2, 3, 4 and Part B below are complete. Questions 5 and 6 go on the Extended Response Sheet.</p>';

    // 3. commit answer
    html += '<h5>What did the computer do to the file? (your first answer)</h5><p>' + (state.commitText ? escapeHtml(state.commitText) : 'Not answered yet.') + '</p>';

    // 4. three hook guesses
    html += '<h5>Your three hook guesses (Section 1)</h5><ul class="summary-list">';
    Array.prototype.forEach.call(cardsWrap.querySelectorAll('.hook-card'), function (card) {
      var key = card.getAttribute('data-card'), label = card.querySelector('h3').textContent, choice = state.hookRevealed[key];
      if (!choice) { html += '<li>' + escapeHtml(label) + ': not answered yet</li>'; return; }
      var isCorrect = choice === HOOK_ANSWERS[key];
      html += '<li>' + escapeHtml(label) + ': you said ' + (choice === 'yes' ? 'Yes, that’s it' : 'No, that’s not it') + ' ' + yn(isCorrect) + '</li>';
    });
    html += '</ul>';

    // 5. Practice — how compression works (Section 3, not marked)
    html += '<h5>Practice — how compression works (Section 3, not marked)</h5><ul class="summary-list">';
    html += '<li>RLE 1: ' + (state.rle1.value ? escapeHtml(state.rle1.value) + ' ' + yn(state.rle1.correct) : 'not attempted yet') + '</li>';
    html += '<li>RLE 2: ' + (state.rle2.value ? escapeHtml(state.rle2.value) + ' ' + yn(state.rle2.correct) : 'not attempted yet') + '</li>';
    SECTION3D_ITEMS.forEach(function (item) {
      var entry = state.s3d[item.id];
      html += '<li>' + escapeHtml(item.name) + ': ' + (entry ? escapeHtml(entry.chosen) + ' ' + yn(entry.correct) : 'not attempted yet') + '</li>';
    });
    if (state.s3e.checked) {
      SECTION3E_STATEMENTS.forEach(function (s, i) {
        var selected = state.s3e.selected.indexOf(i + 1) !== -1;
        html += '<li>"' + escapeHtml(s.text) + '" — ' + (selected ? 'selected' : 'not selected') + ' (' + (s.truth ? 'true' : 'false') + ')</li>';
      });
    } else { html += '<li>Select-every-true-statement: not attempted yet</li>'; }
    html += '</ul>';

    // 6. Practice — sort the file types (Section 4, not marked)
    html += '<h5>Practice — sort the file types (Section 4, not marked)</h5><ul class="summary-list">';
    var assign4 = (state.s4cat && state.s4cat.assign) || {};
    CAT_CHIPS.forEach(function (c) {
      var bin = assign4[c.id];
      if (!bin) { html += '<li>' + c.name + ': not attempted yet</li>'; return; }
      var binLabel = CAT_BINS.filter(function (b) { return b.id === bin; })[0].label;
      if (c.correctBin === null) html += '<li>GIF: you put it in ' + binLabel + ' (no single correct answer — see the page)</li>';
      else html += '<li>' + c.name + ': you put it in ' + binLabel + ' ' + yn(bin === c.correctBin) + '</li>';
    });
    html += '</ul>';

    // 7. QUESTION 1
    html += '<h5 class="graded-heading-1">QUESTION 1 — Lossy or lossless? (6 marks, complete)</h5><ul class="summary-list">';
    SECTION5_ITEMS.forEach(function (item) {
      var entry = state.s5[item.id];
      html += '<li>' + escapeHtml(item.name) + ': ' + (entry ? escapeHtml(entry.chosen) + ' ' + yn(entry.correct) : 'not attempted yet') + '</li>';
    });
    html += '</ul>';

    // 8. QUESTION 2
    html += '<h5 class="graded-heading-1">QUESTION 2 — the RAW and the JPEG (5 marks, complete)</h5><ul class="summary-list">';
    if (state.s6a.checked) html += '<li>2a: RAW = ' + escapeHtml(state.s6a.row1) + ', JPEG = ' + escapeHtml(state.s6a.row2) + ' ' + yn(state.s6a.row1 === 'Lossless' && state.s6a.row2 === 'Lossy') + '</li>';
    else html += '<li>2a: not attempted yet</li>';
    html += '<li>How many times smaller (not part of the mark): ' + (state.s6b.checked ? escapeHtml(state.s6b.value) : 'not attempted yet') + '</li>';
    html += '<li>2b cloze: ' + (state.s6c.checked ? escapeHtml(state.s6c.blanks.join(' · ')) + ' ' + yn(state.s6c.correct) : 'not attempted yet') + '</li>';
    html += '<li>2c reasons selected: ' + (state.s6d.checked ? state.s6d.selected.length + ' selected ' + yn(state.s6d.correct) : 'not attempted yet') + '</li>';
    html += '</ul>';

    // 9. QUESTION 3
    html += '<h5 class="graded-heading-1">QUESTION 3 — compression and transmission (4 marks, complete)</h5><ul class="summary-list">';
    html += '<li>3a cloze: ' + (state.s6e.checked ? escapeHtml(state.s6e.blanks.join(' · ')) + ' ' + yn(state.s6e.correct) : 'not attempted yet') + '</li>';
    html += '<li>3b ordering: ' + (state.s6fOrderChecked ? yn(state.s6fOrderCorrect) : 'not attempted yet') + '</li>';
    html += '</ul>';
    html += '<p class="summary-subnote"><strong>3b written answer:</strong> ' + (state.s6fProse ? escapeHtml(state.s6fProse) : 'Not written yet.') + '</p>';
    html += '<ul class="summary-list">';
    ['ticked', 'not ticked'];
    state.s6fTicks.forEach(function (t, i) { html += '<li>Self-check ' + (i + 1) + ': ' + (t ? 'ticked' : 'not ticked') + '</li>'; });
    html += '</ul>';

    // 10. Period 1 exit ticket
    html += '<h5>Period 1 exit ticket</h5><ul class="summary-list">';
    html += '<li>Lossless format: ' + (state.exitFormats.lossless ? escapeHtml(state.exitFormats.lossless) : 'not answered') + '</li>';
    html += '<li>Lossy format: ' + (state.exitFormats.lossy ? escapeHtml(state.exitFormats.lossy) : 'not answered') + '</li>';
    html += '</ul>';
    html += '<p class="summary-subnote"><strong>Lossless definition:</strong> ' + (state.exitDefs.lossless ? escapeHtml(state.exitDefs.lossless) : 'Not written yet.') + '</p>';
    html += '<p class="summary-subnote"><strong>Lossy definition:</strong> ' + (state.exitDefs.lossy ? escapeHtml(state.exitDefs.lossy) : 'Not written yet.') + '</p>';
    html += '<ul class="summary-list">';
    state.exitDefs.ticks.forEach(function (t, i) { html += '<li>Self-check ' + (i + 1) + ': ' + (t ? 'ticked' : 'not ticked') + '</li>'; });
    html += '</ul>';

    // 11. QUESTION 4
    html += '<h5 class="graded-heading-2">QUESTION 4 — what\'s in a terms of use policy (5 marks, complete)</h5><ul class="summary-list">';
    html += '<li>4a cloze: ' + (state.s7e.checked ? escapeHtml(state.s7e.blanks.join(' · ')) + ' ' + yn(state.s7e.correct) : 'not attempted yet') + '</li>';
    html += '<li>4b selections: ' + (state.s7f.checked ? state.s7f.selected.length + ' selected ' + yn(state.s7f.correct) : 'not attempted yet') + '</li>';
    html += '</ul>';

    // 12. PART B
    html += '<h5 class="graded-heading-2">PART B — clause categories (5 marks, complete)</h5><ul class="summary-list">';
    var assign8 = (state.s8match && state.s8match.assign) || {};
    MATCH_CLAUSES.forEach(function (cl, i) {
      var chosen = assign8[cl.id];
      html += '<li>Clause ' + (i + 1) + ': ' + (chosen ? escapeHtml(chosen) + ' ' + yn(chosen === cl.correct) : 'not attempted yet') + '</li>';
    });
    if (state.s8leftover.leftover) html += '<li>Left over: ' + escapeHtml(state.s8leftover.leftover.chosen) + ' ' + yn(state.s8leftover.leftover.correct) + '</li>';
    else html += '<li>Left over: not attempted yet</li>';
    html += '</ul>';

    // 13. Practice — close reading (Section 9, not marked)
    html += '<h5>Practice — close reading (Section 9, not marked)</h5><ul class="summary-list">';
    for (var pi = 0; pi < PHRASE_ITEMS.length; pi++) {
      var pe = state.s9a[pi];
      html += '<li>Phrase item ' + (pi + 1) + ': ' + (pe ? yn(pe.correct) : 'not attempted yet') + '</li>';
    }
    html += '<li>Streak drill: ' + ((state.s9b.doneIds || []).length) + ' of ' + STREAK_CLAUSES.length + ' clauses answered correctly</li>';
    html += '</ul>';

    // 14. FOR YOUR EXTENDED RESPONSE SHEET
    html += '<h5 class="extended-heading">FOR YOUR EXTENDED RESPONSE SHEET — Questions 5 and 6 (10 marks, not marked here)</h5>';
    html += '<p class="summary-subnote"><strong>5a. Which app:</strong> ' + (state.s10.app ? escapeHtml(state.s10.app) : 'Not written yet.') + '</p>';
    html += '<p class="summary-subnote"><strong>5b. Two clauses:</strong> ' + (state.s10.clauses ? escapeHtml(state.s10.clauses) : 'Not written yet.') + '</p>';
    html += '<p class="summary-subnote"><strong>5c. What it could mean:</strong> ' + (state.s10.meaning ? escapeHtml(state.s10.meaning) : 'Not written yet.') + '</p>';
    html += '<p class="summary-subnote"><strong>6. A surprising clause:</strong> ' + (state.s10.surprise ? escapeHtml(state.s10.surprise) : 'Not written yet.') + '</p>';
    html += '<ul class="summary-list">';
    state.s10.ticks.forEach(function (t, i) { html += '<li>Self-check ' + (i + 1) + ': ' + (t ? 'ticked' : 'not ticked') + '</li>'; });
    html += '</ul>';

    // 15. Going further (optional)
    var attempted11 = state.s11aSide || state.s11aProseSaved || state.s11b.saved;
    if (attempted11) {
      html += '<h5>Going further (Section 11, optional, not marked)</h5>';
      html += '<p class="summary-subnote"><strong>GIF side chosen:</strong> ' + (state.s11aSide ? escapeHtml(state.s11aSide) : 'not chosen') + '</p>';
      html += '<p class="summary-subnote"><strong>Evidence check:</strong> ' + (state.s11aEvidence.checked ? state.s11aEvidence.selected.join(', ') : 'not attempted') + '</p>';
      html += '<p class="summary-subnote"><strong>GIF paragraph:</strong> ' + (state.s11aProse ? escapeHtml(state.s11aProse) : 'Not written yet.') + '</p>';
      html += '<p class="summary-subnote"><strong>Banned clause — step 1:</strong> ' + (state.s11b.f1 ? escapeHtml(state.s11b.f1) : 'Not written yet.') + '</p>';
      html += '<p class="summary-subnote"><strong>Banned clause — step 2:</strong> ' + (state.s11b.f2 ? escapeHtml(state.s11b.f2) : 'Not written yet.') + '</p>';
      html += '<p class="summary-subnote"><strong>Banned clause — step 3:</strong> ' + (state.s11b.f3 ? escapeHtml(state.s11b.f3) : 'Not written yet.') + '</p>';
    }

    // 16. closing note
    html += '<p class="summary-footer-note">Everything above except the last two sections is complete and marked. Copy the four answers under "FOR YOUR EXTENDED RESPONSE SHEET" onto that sheet in Canvas, and submit both.</p>';

    out.innerHTML = html;
  }

  function initSummary() {
    var printBtn = $('summary-print-btn');
    if (!printBtn) return;
    var nameInput = $('summary-name'), classInput = $('summary-class'), nameHint = $('summary-name-hint');

    function updatePrintGate() {
      var hasName = nameInput.value.trim().length > 0;
      printBtn.disabled = !hasName;
      nameHint.hidden = hasName;
    }

    function lockName() {
      nameInput.readOnly = true;
      nameHint.hidden = true;
      nameHint.textContent = 'Name locked — it can’t be changed once you’ve saved or printed your summary.';
      nameHint.hidden = false;
    }

    nameInput.value = state.studentName;
    nameInput.addEventListener('input', function () { state.studentName = nameInput.value; save(); updatePrintGate(); });
    classInput.value = state.studentClass;
    classInput.addEventListener('input', function () { state.studentClass = classInput.value; save(); });
    printBtn.addEventListener('click', function () {
      renderSummary();
      state.summaryPrinted = true; save();
      lockName();
      window.print();
    });

    if (state.summaryPrinted) lockName(); else updatePrintGate();
    renderSummary();
  }

  /* ---------------- reset ---------------- */
  function initReset() {
    $('reset-progress').addEventListener('click', function () {
      if (!window.confirm('Clear everything you have done on this page and start again? Nothing on this page is sent to Canvas automatically, so make sure you have downloaded your work summary first if you need it.')) return;
      try { window.localStorage.removeItem(STORE); } catch (e) { /* ignore */ }
      window.location.reload();
    });
  }

  /* ---------------- read aloud ---------------- */
  var SPEECH_PAUSE_MS = 450;

  function speakableParts(root, headingSelector) {
    var clone = root.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('.speak-btn, button, textarea, input, select, [hidden]'), function (e) { e.remove(); });
    var headingParts = [];
    if (headingSelector) {
      Array.prototype.forEach.call(clone.querySelectorAll(headingSelector), function (e) {
        var t = e.textContent.replace(/\s+/g, ' ').trim();
        if (t) headingParts.push(t);
        e.remove();
      });
    }
    return { heading: headingParts.join('. '), body: clone.textContent.replace(/\s+/g, ' ').trim() };
  }

  function resetSpeechButton(btn) {
    if (btn.dataset.pauseTimer) { clearTimeout(Number(btn.dataset.pauseTimer)); delete btn.dataset.pauseTimer; }
    btn.textContent = '🔊';
    btn.dataset.speaking = 'false';
    var label = btn.dataset.defaultLabel || btn.getAttribute('aria-label') || 'Read this aloud';
    btn.title = label; btn.setAttribute('aria-label', label);
  }

  function stopAllSpeech() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    Array.prototype.forEach.call(document.querySelectorAll('.speak-btn'), resetSpeechButton);
  }

  function initSpeechButtons() {
    var buttons = document.querySelectorAll('.speak-btn');
    if (!buttons.length) return;
    if (!('speechSynthesis' in window)) {
      Array.prototype.forEach.call(buttons, function (btn) {
        btn.disabled = true;
        btn.title = 'Read aloud isn’t supported in this browser';
        btn.setAttribute('aria-label', 'Read aloud isn’t supported in this browser');
      });
      return;
    }
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.dataset.defaultLabel = btn.getAttribute('aria-label') || 'Read this aloud';
      btn.dataset.speaking = 'false';
      btn.addEventListener('click', function () {
        var wasSpeaking = btn.dataset.speaking === 'true';
        stopAllSpeech();
        if (wasSpeaking) return;
        var root = btn.closest('.section');
        var parts = root ? speakableParts(root, '.section-tag, h2') : { heading: '', body: '' };
        if (!parts.heading && !parts.body) return;
        btn.textContent = '⏹'; btn.dataset.speaking = 'true';
        btn.title = 'Stop reading'; btn.setAttribute('aria-label', 'Stop reading');
        function speakBody() {
          if (!parts.body) { resetSpeechButton(btn); return; }
          var u = new SpeechSynthesisUtterance(parts.body);
          u.onend = function () { resetSpeechButton(btn); };
          u.onerror = function () { resetSpeechButton(btn); };
          window.speechSynthesis.speak(u);
        }
        if (parts.heading) {
          var hu = new SpeechSynthesisUtterance(parts.heading);
          hu.onerror = function () { resetSpeechButton(btn); };
          hu.onend = function () { btn.dataset.pauseTimer = setTimeout(speakBody, SPEECH_PAUSE_MS); };
          window.speechSynthesis.speak(hu);
        } else speakBody();
      });
    });
    window.addEventListener('beforeunload', function () { window.speechSynthesis.cancel(); });
  }

  /* ---------------- go ---------------- */
  load();
  initCommit();
  initHookCards();
  initQuickChecks();
  initSongOrder();
  initRLE1();
  initRLE2();
  initSection3d();
  initSection3e();
  initSection4();
  initSection5();
  initSection6a();
  initSection6b();
  initSection6c();
  initSection6d();
  initSection6e();
  initOrder6f();
  initProse6f();
  initExitFormats();
  initExitDefs();
  initSection7e();
  initSection7f();
  initSection8();
  initLeftover8a();
  initSection9a();
  initStreak9b();
  initCopyLinks();
  initSection10();
  initSection11a();
  initSection11b();
  initEndObserver();
  initSummary();
  initReset();
  initSpeechButtons();
  renderProgress();
  markCurrentSection();
  window.addEventListener('scroll', markCurrentSection, { passive: true });

})();
