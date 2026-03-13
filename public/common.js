/**
 * common.js — 미세먼지 정보 포털 공통 기능
 * 모든 페이지에서 <script src="/common.js"></script>로 로드
 */
(function () {
  'use strict';

  // ─── 유틸리티 ───
  var PATH = location.pathname.replace(/\/index\.html$/, '/');
  var IS_HOME = PATH === '/';
  var CONTENT_PAGES = ['/guide.html', '/faq.html', '/about.html', '/health.html', '/seasonal.html', '/purifier.html', '/comparison.html'];
  var NON_SHARE_PAGES = ['/', '/index.html', '/privacy.html', '/terms.html'];
  var IS_CONTENT = CONTENT_PAGES.indexOf(PATH) !== -1;
  var IS_SHAREABLE = NON_SHARE_PAGES.indexOf(PATH) === -1;

  var PAGE_NAMES = {
    '/': '실시간 현황',
    '/index.html': '실시간 현황',
    '/guide.html': '미세먼지 가이드',
    '/faq.html': '자주 묻는 질문',
    '/about.html': '사이트 소개',
    '/health.html': '취약계층 건강 가이드',
    '/seasonal.html': '계절별 대처법',
    '/purifier.html': '공기청정기 가이드',
    '/comparison.html': '국내외 기준 비교',
    '/privacy.html': '개인정보처리방침',
    '/terms.html': '이용약관'
  };

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function ce(tag, attrs, html) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    if (html) el.innerHTML = html;
    return el;
  }

  // ─── CSS 주입 ───
  var css = '';

  // --- 1. 쿠키 동의 배너 ---
  css += '\
.cjs-cookie-banner{\
  position:fixed;bottom:0;left:0;right:0;z-index:9990;\
  background:rgba(26,26,46,0.92);backdrop-filter:blur(16px);\
  border-top:1px solid rgba(255,255,255,0.1);\
  padding:16px 20px;display:flex;align-items:center;justify-content:center;\
  gap:16px;flex-wrap:wrap;font-size:0.85rem;color:rgba(255,255,255,0.8);\
  animation:cjsSlideUp .3s ease-out;\
}\
.cjs-cookie-banner a{color:#90caf9;text-decoration:underline;}\
.cjs-cookie-banner button{\
  padding:8px 20px;border:none;border-radius:8px;\
  background:linear-gradient(135deg,#64b5f6,#42a5f5);color:#fff;\
  font-weight:600;font-size:0.85rem;cursor:pointer;white-space:nowrap;\
  transition:transform .15s,box-shadow .15s;\
}\
.cjs-cookie-banner button:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(100,181,246,0.4);}\
@keyframes cjsSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}\
';

  // --- 2. 맨 위로 버튼 ---
  css += '\
.cjs-top-btn{\
  position:fixed;bottom:24px;right:24px;z-index:9980;\
  width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);\
  background:rgba(26,26,46,0.85);backdrop-filter:blur(10px);\
  color:rgba(255,255,255,0.7);font-size:1rem;cursor:pointer;\
  display:flex;align-items:center;justify-content:center;\
  opacity:0;pointer-events:none;\
  transition:opacity .3s,transform .2s,background .2s;\
  box-shadow:0 4px 16px rgba(0,0,0,0.3);\
}\
.cjs-top-btn.visible{opacity:1;pointer-events:auto;}\
.cjs-top-btn:hover{background:rgba(100,181,246,0.3);color:#fff;transform:translateY(-2px);}\
';

  // --- 3. 읽기 진행률 ---
  css += '\
.cjs-progress-bar{\
  position:fixed;top:56px;left:0;right:0;z-index:999;height:3px;\
  background:transparent;pointer-events:none;\
}\
.cjs-progress-bar .bar{\
  height:100%;width:0;transition:width .1s linear;\
  background:linear-gradient(90deg,#42a5f5,#64b5f6,#90caf9);\
  border-radius:0 2px 2px 0;\
}\
';

  // --- 4. 경로 탐색 ---
  css += '\
.cjs-breadcrumb{\
  display:flex;align-items:center;gap:6px;margin-bottom:16px;\
  font-size:0.78rem;color:rgba(255,255,255,0.4);flex-wrap:wrap;\
}\
.cjs-breadcrumb a{color:rgba(255,255,255,0.5);text-decoration:none;transition:color .2s;}\
.cjs-breadcrumb a:hover{color:#90caf9;}\
.cjs-breadcrumb .sep{color:rgba(255,255,255,0.25);}\
.cjs-breadcrumb .current{color:rgba(255,255,255,0.7);}\
';

  // --- 5. 공유 버튼 ---
  css += '\
.cjs-share{\
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;\
  margin:24px 0 8px;padding:18px 0 0;\
  border-top:1px solid rgba(255,255,255,0.08);\
}\
.cjs-share-label{font-size:0.82rem;color:rgba(255,255,255,0.5);font-weight:600;}\
.cjs-share a,.cjs-share button{\
  display:inline-flex;align-items:center;gap:6px;\
  padding:8px 16px;border-radius:8px;font-size:0.8rem;font-weight:500;\
  text-decoration:none;cursor:pointer;transition:all .2s;\
  border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);\
  color:rgba(255,255,255,0.7);\
}\
.cjs-share a:hover,.cjs-share button:hover{\
  background:rgba(100,181,246,0.2);border-color:rgba(100,181,246,0.3);color:#fff;\
  transform:translateY(-1px);\
}\
.cjs-share .kakao{border-color:rgba(254,229,0,0.3);color:#fee500;}\
.cjs-share .kakao:hover{background:rgba(254,229,0,0.15);}\
.cjs-share .twitter{border-color:rgba(29,161,242,0.3);color:#1da1f2;}\
.cjs-share .twitter:hover{background:rgba(29,161,242,0.15);}\
.cjs-share .facebook{border-color:rgba(24,119,242,0.3);color:#1877f2;}\
.cjs-share .facebook:hover{background:rgba(24,119,242,0.15);}\
';

  // --- 6. 카드 리빌 애니메이션 ---
  css += '\
.card{opacity:0;transform:translateY(20px);transition:opacity .5s ease-out,transform .5s ease-out;}\
.card-revealed{opacity:1;transform:translateY(0);}\
';

  // --- 7. 목차 ---
  css += '\
.cjs-toc{\
  background:rgba(255,255,255,0.06);backdrop-filter:blur(10px);\
  border:1px solid rgba(255,255,255,0.1);border-radius:16px;\
  padding:20px 28px;margin-bottom:20px;\
}\
.cjs-toc .toc-title{\
  font-size:0.95rem;font-weight:700;color:#fff;margin-bottom:12px;\
  display:flex;align-items:center;gap:8px;\
}\
.cjs-toc ol{margin:0;padding-left:20px;}\
.cjs-toc li{\
  margin-bottom:6px;font-size:0.85rem;line-height:1.6;\
  color:rgba(255,255,255,0.6);\
}\
.cjs-toc a{\
  color:rgba(255,255,255,0.7);text-decoration:none;transition:color .2s;\
}\
.cjs-toc a:hover{color:#90caf9;}\
';

  // --- 8. 글꼴 크기 조절 ---
  css += '\
.cjs-font-ctrl{\
  position:fixed;bottom:76px;right:24px;z-index:9980;\
  display:flex;flex-direction:column;gap:4px;\
}\
.cjs-font-ctrl button{\
  width:36px;height:30px;border-radius:6px;\
  border:1px solid rgba(255,255,255,0.12);background:rgba(26,26,46,0.85);\
  backdrop-filter:blur(10px);color:rgba(255,255,255,0.65);\
  font-size:0.72rem;font-weight:600;cursor:pointer;\
  display:flex;align-items:center;justify-content:center;\
  transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,0.2);\
}\
.cjs-font-ctrl button:hover{background:rgba(100,181,246,0.25);color:#fff;}\
.cjs-font-ctrl button.active{background:rgba(100,181,246,0.35);border-color:#64b5f6;color:#fff;}\
';

  // --- 9. 다크/라이트 모드 ---
  css += '\
.cjs-theme-toggle{\
  background:none;border:1px solid rgba(255,255,255,0.15);border-radius:8px;\
  padding:4px 10px;color:rgba(255,255,255,0.65);font-size:0.9rem;\
  cursor:pointer;transition:all .2s;margin-left:8px;line-height:1;\
}\
.cjs-theme-toggle:hover{background:rgba(255,255,255,0.1);color:#fff;}\
body.light-mode{\
  background:linear-gradient(135deg,#e8eaf6 0%,#f5f5f5 50%,#e3f2fd 100%) !important;\
  color:#333 !important;\
}\
body.light-mode .card{\
  background:rgba(255,255,255,0.85) !important;\
  border-color:rgba(0,0,0,0.1) !important;\
}\
body.light-mode .card h2{color:#1a1a2e !important;}\
body.light-mode .content-body p,body.light-mode .content-body li,\
body.light-mode .edu-content p{color:rgba(0,0,0,0.75) !important;}\
body.light-mode .content-body h3,body.light-mode .edu-section h3{color:#0277bd !important;}\
body.light-mode .content-body strong{color:#1a1a2e !important;}\
body.light-mode .site-nav{background:rgba(255,255,255,0.95) !important;border-bottom-color:rgba(0,0,0,0.1) !important;}\
body.light-mode .nav-logo{color:#1a1a2e !important;}\
body.light-mode .nav-links a{color:rgba(0,0,0,0.5) !important;}\
body.light-mode .nav-links a:hover,body.light-mode .nav-links a.active{color:#1a1a2e !important;}\
body.light-mode .nav-toggle{color:#1a1a2e !important;}\
body.light-mode .site-footer{border-top-color:rgba(0,0,0,0.1) !important;}\
body.light-mode .footer-col h4{color:#1a1a2e !important;}\
body.light-mode .footer-col p,body.light-mode .footer-col a,body.light-mode .footer-bottom p{color:rgba(0,0,0,0.5) !important;}\
body.light-mode .cjs-top-btn,body.light-mode .cjs-font-ctrl button{\
  background:rgba(255,255,255,0.85) !important;border-color:rgba(0,0,0,0.12) !important;\
  color:rgba(0,0,0,0.6) !important;\
}\
body.light-mode .cjs-breadcrumb{color:rgba(0,0,0,0.4) !important;}\
body.light-mode .cjs-breadcrumb a{color:rgba(0,0,0,0.5) !important;}\
body.light-mode .cjs-breadcrumb .current{color:rgba(0,0,0,0.7) !important;}\
body.light-mode .cjs-breadcrumb .sep{color:rgba(0,0,0,0.25) !important;}\
body.light-mode .cjs-toc{background:rgba(255,255,255,0.8) !important;border-color:rgba(0,0,0,0.1) !important;}\
body.light-mode .cjs-toc .toc-title{color:#1a1a2e !important;}\
body.light-mode .cjs-toc a{color:rgba(0,0,0,0.6) !important;}\
body.light-mode .cjs-share a,body.light-mode .cjs-share button{\
  border-color:rgba(0,0,0,0.12) !important;background:rgba(0,0,0,0.04) !important;\
  color:rgba(0,0,0,0.6) !important;\
}\
body.light-mode .cjs-share-label{color:rgba(0,0,0,0.5) !important;}\
body.light-mode .cjs-cookie-banner{\
  background:rgba(255,255,255,0.95) !important;border-top-color:rgba(0,0,0,0.1) !important;\
  color:rgba(0,0,0,0.7) !important;\
}\
body.light-mode .cjs-theme-toggle{border-color:rgba(0,0,0,0.15) !important;color:rgba(0,0,0,0.6) !important;}\
body.light-mode .links a{background:rgba(0,0,0,0.04) !important;border-color:rgba(0,0,0,0.1) !important;color:#333 !important;}\
body.light-mode .links a:hover{background:rgba(102,126,234,0.15) !important;}\
body.light-mode .links a small{color:rgba(0,0,0,0.45) !important;}\
body.light-mode .highlight-box{background:rgba(100,181,246,0.1) !important;color:rgba(0,0,0,0.7) !important;}\
body.light-mode .warning-box{background:rgba(244,67,54,0.08) !important;color:rgba(0,0,0,0.7) !important;}\
body.light-mode .cjs-updated,body.light-mode .cjs-visit-count{color:rgba(0,0,0,0.35) !important;}\
';

  // --- 10. 인쇄 스타일 ---
  css += '\
@media print{\
  .site-nav,.site-footer,.ad-container,.cjs-cookie-banner,.cjs-top-btn,\
  .cjs-font-ctrl,.cjs-share,.cjs-theme-toggle,.cjs-progress-bar,\
  .cjs-toc,.cjs-visit-count,.nav-toggle,ins.adsbygoogle{display:none !important;}\
  body{background:#fff !important;color:#000 !important;padding:20px !important;}\
  .card{background:#fff !important;border:1px solid #ddd !important;color:#000 !important;opacity:1 !important;transform:none !important;}\
  .card h2{color:#000 !important;}\
  .content-body p,.content-body li,.content-body h3,\
  .edu-content p,.edu-section h3{color:#000 !important;}\
  .content-body strong{color:#000 !important;}\
  .highlight-box,.warning-box{background:#f5f5f5 !important;color:#000 !important;border-color:#999 !important;}\
  .cjs-breadcrumb{color:#666 !important;}\
  .cjs-breadcrumb a,.cjs-breadcrumb .current{color:#333 !important;}\
  .cjs-updated{color:#666 !important;}\
}\
';

  // --- 11. 최종 업데이트 ---
  css += '\
.cjs-updated{\
  text-align:center;font-size:0.72rem;color:rgba(255,255,255,0.3);\
  margin:20px 0 4px;padding-top:12px;\
}\
';

  // --- 12. 조회수 ---
  css += '\
.cjs-visit-count{\
  text-align:center;font-size:0.68rem;color:rgba(255,255,255,0.2);\
  margin:4px 0 16px;\
}\
';

  // --- 13. 토스트 ---
  css += '\
.cjs-toast{\
  position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);\
  z-index:99999;padding:12px 24px;border-radius:10px;\
  background:rgba(26,26,46,0.92);backdrop-filter:blur(12px);\
  border:1px solid rgba(255,255,255,0.12);\
  color:rgba(255,255,255,0.9);font-size:0.85rem;font-weight:500;\
  box-shadow:0 8px 32px rgba(0,0,0,0.4);\
  opacity:0;pointer-events:none;\
  transition:opacity .3s,transform .3s;\
}\
.cjs-toast.show{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto;}\
';

  // --- 반응형 보정 ---
  css += '\
@media(max-width:600px){\
  .cjs-top-btn{bottom:16px;right:16px;width:40px;height:40px;}\
  .cjs-font-ctrl{bottom:64px;right:16px;}\
  .cjs-font-ctrl button{width:32px;height:26px;font-size:0.65rem;}\
  .cjs-share{gap:8px;}\
  .cjs-share a,.cjs-share button{padding:6px 12px;font-size:0.75rem;}\
  .cjs-cookie-banner{font-size:0.78rem;padding:12px 14px;gap:10px;}\
}\
';

  // 스타일 태그 삽입
  var styleEl = ce('style', { id: 'cjs-styles' }, css);
  (document.head || document.documentElement).appendChild(styleEl);

  // ─── 토스트 시스템 (먼저 초기화, 다른 기능에서 사용) ───
  var toastEl = ce('div', { 'class': 'cjs-toast' });
  document.body.appendChild(toastEl);
  var toastTimer = null;

  function showToast(msg, duration) {
    duration = duration || 2000;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, duration);
  }

  // ─── DOMContentLoaded 후 실행 ───
  function initAll() {

    // ============================================================
    // 1. 쿠키 동의 배너
    // ============================================================
    if (!localStorage.getItem('cookieConsent')) {
      var banner = ce('div', { 'class': 'cjs-cookie-banner' });
      banner.innerHTML = '\
        <span>이 사이트는 더 나은 서비스 제공을 위해 쿠키를 사용합니다. 사이트 이용 시 쿠키 사용에 동의하게 됩니다. \
        <a href="/privacy.html">자세히 보기</a></span>\
        <button id="cjs-cookie-accept">동의합니다</button>\
      ';
      document.body.appendChild(banner);
      qs('#cjs-cookie-accept').addEventListener('click', function () {
        localStorage.setItem('cookieConsent', 'accepted');
        banner.style.animation = 'none';
        banner.style.transition = 'transform .3s,opacity .3s';
        banner.style.transform = 'translateY(100%)';
        banner.style.opacity = '0';
        setTimeout(function () { banner.remove(); }, 300);
      });
    }

    // ============================================================
    // 2. 맨 위로 버튼
    // ============================================================
    var topBtn = ce('button', {
      'class': 'cjs-top-btn',
      'aria-label': '맨 위로',
      'title': '맨 위로'
    }, '&#9650;');
    document.body.appendChild(topBtn);

    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ============================================================
    // 3. 읽기 진행률 바
    // ============================================================
    var progressBar = null;
    var progressInner = null;
    if (qs('.content-body')) {
      progressBar = ce('div', { 'class': 'cjs-progress-bar' });
      progressInner = ce('div', { 'class': 'bar' });
      progressBar.appendChild(progressInner);
      document.body.appendChild(progressBar);
    }

    // 스크롤 이벤트 (맨위로 + 진행률)
    var scrollTicking = false;
    window.addEventListener('scroll', function () {
      if (!scrollTicking) {
        requestAnimationFrame(function () {
          var scrollY = window.pageYOffset || document.documentElement.scrollTop;

          // 맨 위로 버튼 표시/숨김
          if (scrollY > 300) {
            topBtn.classList.add('visible');
          } else {
            topBtn.classList.remove('visible');
          }

          // 진행률
          if (progressInner) {
            var docH = document.documentElement.scrollHeight - window.innerHeight;
            var pct = docH > 0 ? Math.min((scrollY / docH) * 100, 100) : 0;
            progressInner.style.width = pct + '%';
          }

          scrollTicking = false;
        });
        scrollTicking = true;
      }
    });

    // ============================================================
    // 4. 경로 탐색 (Breadcrumb)
    // ============================================================
    if (!IS_HOME) {
      var container = qs('.container');
      if (container) {
        var pageName = PAGE_NAMES[PATH] || document.title.split(' - ')[0] || PATH;
        var bcNav = ce('nav', { 'class': 'cjs-breadcrumb', 'aria-label': '경로 탐색' });
        bcNav.innerHTML = '<a href="/">홈</a><span class="sep">&gt;</span><span class="current">' + pageName + '</span>';
        container.insertBefore(bcNav, container.firstChild);

        // schema.org BreadcrumbList JSON-LD
        var bcSchema = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': '홈',
              'item': location.origin + '/'
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': pageName,
              'item': location.origin + PATH
            }
          ]
        };
        var bcScript = ce('script', { 'type': 'application/ld+json' }, JSON.stringify(bcSchema));
        document.head.appendChild(bcScript);
      }
    }

    // ============================================================
    // 5. 공유 버튼
    // ============================================================
    if (IS_SHAREABLE) {
      var shareContainer = qs('.container');
      var footer = qs('.site-footer');
      if (shareContainer) {
        var pageUrl = encodeURIComponent(location.href);
        var pageTitle = encodeURIComponent(document.title);
        var shareDiv = ce('div', { 'class': 'cjs-share' });
        shareDiv.innerHTML = '\
          <span class="cjs-share-label">공유하기</span>\
          <a class="kakao" href="https://story.kakao.com/share?url=' + pageUrl + '" target="_blank" rel="noopener">카카오톡</a>\
          <a class="twitter" href="https://twitter.com/intent/tweet?url=' + pageUrl + '&text=' + pageTitle + '" target="_blank" rel="noopener">X (트위터)</a>\
          <a class="facebook" href="https://www.facebook.com/sharer/sharer.php?u=' + pageUrl + '" target="_blank" rel="noopener">페이스북</a>\
          <button class="cjs-copy-link" type="button">URL 복사</button>\
        ';

        // 인쇄 버튼 (콘텐츠 페이지만)
        if (IS_CONTENT) {
          var printBtn = ce('button', { 'class': 'cjs-print-btn', 'type': 'button' }, '인쇄하기');
          shareDiv.appendChild(printBtn);
          printBtn.addEventListener('click', function () { window.print(); });
        }

        // .container의 마지막 자식 뒤에 (footer 앞에) 삽입
        shareContainer.appendChild(shareDiv);

        // URL 복사 버튼
        qs('.cjs-copy-link').addEventListener('click', function () {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(location.href).then(function () {
              showToast('링크가 복사되었습니다!');
            }).catch(function () {
              fallbackCopy();
            });
          } else {
            fallbackCopy();
          }
        });

        function fallbackCopy() {
          var ta = ce('textarea');
          ta.value = location.href;
          ta.style.cssText = 'position:fixed;left:-9999px;';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); showToast('링크가 복사되었습니다!'); } catch (e) { showToast('복사에 실패했습니다.'); }
          document.body.removeChild(ta);
        }
      }
    }

    // ============================================================
    // 6. 카드 리빌 애니메이션 (Scroll Reveal)
    // ============================================================
    var cards = qsa('.card');
    if (cards.length > 0 && 'IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('card-revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

      cards.forEach(function (card) {
        revealObserver.observe(card);
      });
    } else {
      // IntersectionObserver 미지원 시 즉시 표시
      cards.forEach(function (card) {
        card.classList.add('card-revealed');
      });
    }

    // ============================================================
    // 7. 자동 목차 (Table of Contents)
    // ============================================================
    var tocHeadings = qsa('.content-body h2, .card > h2');
    // .card > h2 중 content-body 또는 card 내부의 실제 콘텐츠 h2만 수집
    var contentH2s = [];
    qsa('.content-body h2').forEach(function (h) { contentH2s.push(h); });
    // .card > h2 (섹션 제목)도 수집 — content-body 밖의 h2들
    var cardH2s = qsa('.card > h2');
    // 콘텐츠 페이지에서 .card > h2가 3개 이상이면 목차 생성
    if (cardH2s.length >= 3 && IS_CONTENT) {
      var allCards = qsa('.card');
      var insertAfter = allCards.length > 0 ? allCards[0] : null;

      if (insertAfter) {
        var tocDiv = ce('div', { 'class': 'cjs-toc' });
        var tocHtml = '<div class="toc-title">목차</div><ol>';

        cardH2s.forEach(function (h2, i) {
          var id = h2.id || ('cjs-heading-' + i);
          h2.id = id;
          var text = h2.textContent.replace(/\s+/g, ' ').trim();
          tocHtml += '<li><a href="#' + id + '">' + text + '</a></li>';
        });

        tocHtml += '</ol>';
        tocDiv.innerHTML = tocHtml;

        insertAfter.parentNode.insertBefore(tocDiv, insertAfter.nextSibling);

        // 부드러운 스크롤
        qsa('.cjs-toc a').forEach(function (link) {
          link.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.getElementById(this.getAttribute('href').slice(1));
            if (target) {
              var offset = target.getBoundingClientRect().top + window.pageYOffset - 70;
              window.scrollTo({ top: offset, behavior: 'smooth' });
            }
          });
        });
      }
    }

    // ============================================================
    // 8. 글꼴 크기 조절
    // ============================================================
    var fontCtrl = ce('div', { 'class': 'cjs-font-ctrl' });
    var fontSizes = [
      { label: 'A-', size: '14px', key: 'small' },
      { label: 'A', size: '16px', key: 'default' },
      { label: 'A+', size: '18px', key: 'large' }
    ];

    var savedFontSize = localStorage.getItem('fontSize') || 'default';

    fontSizes.forEach(function (fs) {
      var btn = ce('button', {
        'type': 'button',
        'title': fs.label === 'A-' ? '작게' : fs.label === 'A' ? '기본' : '크게',
        'data-size': fs.key
      }, fs.label);
      if (fs.key === savedFontSize) btn.classList.add('active');
      btn.addEventListener('click', function () {
        document.body.style.fontSize = fs.size;
        localStorage.setItem('fontSize', fs.key);
        qsa('.cjs-font-ctrl button').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        showToast('글꼴 크기: ' + (fs.label === 'A-' ? '작게' : fs.label === 'A' ? '기본' : '크게'));
      });
      fontCtrl.appendChild(btn);
    });

    document.body.appendChild(fontCtrl);

    // 저장된 글꼴 크기 복원
    var fontMap = { small: '14px', default: '16px', large: '18px' };
    if (fontMap[savedFontSize]) {
      document.body.style.fontSize = fontMap[savedFontSize];
    }

    // ============================================================
    // 9. 다크/라이트 모드 토글
    // ============================================================
    var navInner = qs('.nav-inner');
    if (navInner) {
      var savedTheme = localStorage.getItem('themeMode') || 'dark';
      var themeBtn = ce('button', {
        'class': 'cjs-theme-toggle',
        'type': 'button',
        'title': '테마 변경',
        'aria-label': '테마 변경'
      });

      function applyTheme(mode) {
        if (mode === 'light') {
          document.body.classList.add('light-mode');
          themeBtn.innerHTML = '&#9728;'; // 해 아이콘
          themeBtn.title = '다크 모드로 전환';
        } else {
          document.body.classList.remove('light-mode');
          themeBtn.innerHTML = '&#9790;'; // 달 아이콘
          themeBtn.title = '라이트 모드로 전환';
        }
      }

      applyTheme(savedTheme);

      themeBtn.addEventListener('click', function () {
        var current = document.body.classList.contains('light-mode') ? 'light' : 'dark';
        var next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('themeMode', next);
        showToast(next === 'light' ? '라이트 모드로 전환되었습니다' : '다크 모드로 전환되었습니다');
      });

      // nav-toggle 앞에 삽입
      var navToggle = qs('.nav-toggle', navInner);
      if (navToggle) {
        navInner.insertBefore(themeBtn, navToggle);
      } else {
        navInner.appendChild(themeBtn);
      }
    }

    // ============================================================
    // 11. 최종 업데이트 표시
    // ============================================================
    if (IS_CONTENT) {
      var ctnr = qs('.container');
      if (ctnr) {
        var updatedEl = ce('div', { 'class': 'cjs-updated' }, '최종 업데이트: 2025년 6월');
        ctnr.appendChild(updatedEl);
      }
    }

    // ============================================================
    // 12. 페이지 조회 카운터
    // ============================================================
    (function () {
      var key = 'pageVisit_' + PATH;
      var count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
      localStorage.setItem(key, String(count));

      var ctnr = qs('.container');
      if (ctnr) {
        var visitEl = ce('div', { 'class': 'cjs-visit-count' }, '이 페이지 조회: ' + count + '회');
        ctnr.appendChild(visitEl);
      }
    })();

  } // end initAll

  // ─── 실행 ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})();
