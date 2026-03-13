# 한국 미세먼지 실시간 대시보드 (air-quality)

## 개요
한국 전역의 미세먼지(PM2.5/PM10) 및 대기질 정보를 실시간으로 보여주는 웹 대시보드.
사용자의 현재 위치 기반으로 지역 대기질, 날씨, 행정구역별 색상 지도를 제공한다.
미세먼지 교육 가이드 8개 페이지, 사이트 소개, 개인정보처리방침, 이용약관 등 총 10개 콘텐츠 페이지 구성.

## 기술 스택
| 구분 | 기술 |
|------|------|
| 서버 | Node.js + Express (포트 3000) |
| 프론트엔드 | Vanilla HTML/CSS/JS (다중 정적 페이지, 프레임워크 없음) |
| 지도 | D3.js + TopoJSON (행정구역 지도), Leaflet (마커 지도) |
| 배포 | Docker (node:20-alpine) |
| 수익화 | Google AdSense (`ca-pub-2601124884291683`) |
| SEO | JSON-LD 구조화 데이터, sitemap.xml, robots.txt |
| PWA | manifest.json, SVG 아이콘 |

## 프로젝트 구조
```
air-quality/
├── server.js              # Express 백엔드 (API 프록시 + 정적 파일 서빙 + 404 핸들링)
├── index.html             # 프론트엔드 v1 (Leaflet 지도 + WAQI API, 레거시)
├── public/
│   ├── index.html         # 메인 대시보드 (D3 행정구역 지도 + 에어코리아 API)
│   ├── guide.html         # 미세먼지 완벽 가이드 (교육 콘텐츠)
│   ├── faq.html           # 자주 묻는 질문 (20개 Q&A, FAQPage 스키마)
│   ├── health.html        # 취약계층별 건강 가이드
│   ├── seasonal.html      # 계절별 미세먼지 대처법
│   ├── purifier.html      # 공기청정기 선택 & 실내 공기질 관리 가이드
│   ├── comparison.html    # 국내외 대기질 기준 비교 분석
│   ├── about.html         # 사이트 소개
│   ├── privacy.html       # 개인정보처리방침
│   ├── terms.html         # 이용약관
│   ├── 404.html           # 커스텀 404 에러 페이지
│   ├── common.css         # 공통 스타일 (nav, footer, base, 콘텐츠 페이지)
│   ├── common.js          # 공통 인터랙티브 기능 (13개)
│   ├── ads.txt            # AdSense 광고 인증
│   ├── sitemap.xml        # XML 사이트맵 (10개 페이지)
│   ├── robots.txt         # 크롤러 가이드
│   ├── manifest.json      # PWA 매니페스트
│   └── icons/
│       └── icon.svg       # 파비콘 + PWA 아이콘
├── geo-cache.json         # TopoJSON 행정구역 지도 로컬 캐시
├── package.json           # 의존성 (express만 사용)
├── Dockerfile             # Docker 배포 설정
└── PROJECT.md             # 이 문서
```

## 페이지 구성 (10개 콘텐츠 + 1개 에러)

| 경로 | 파일 | 설명 |
|------|------|------|
| `/` | `public/index.html` | 메인 대시보드 (실시간 대기질 + 지도 + 날씨) |
| `/guide.html` | `public/guide.html` | 미세먼지 완벽 가이드 (정의, 건강영향, 등급, 마스크, 실내관리, 계절, 측정) |
| `/faq.html` | `public/faq.html` | 자주 묻는 질문 20선 (아코디언 UI, FAQPage JSON-LD) |
| `/health.html` | `public/health.html` | 취약계층 건강 가이드 (어린이/노인/임산부/호흡기/심혈관/야외근무자) |
| `/seasonal.html` | `public/seasonal.html` | 계절별 대처법 (봄·여름·가을·겨울 + 12개월 캘린더) |
| `/purifier.html` | `public/purifier.html` | 공기청정기 가이드 (원리, 선택, 사용법, 실내오염원, 환기, 식물, 측정기) |
| `/comparison.html` | `public/comparison.html` | 국내외 기준 비교 (한국/WHO/미국/중국/일본/EU + 비교표) |
| `/about.html` | `public/about.html` | 사이트 소개 (목적, 기능, 데이터출처, 기술, 연락처) |
| `/privacy.html` | `public/privacy.html` | 개인정보처리방침 |
| `/terms.html` | `public/terms.html` | 이용약관 |
| 404 | `public/404.html` | 커스텀 에러 페이지 (주요 페이지 바로가기) |

모든 페이지에 공통 네비게이션 바, 4컬럼 푸터, 파비콘, PWA 매니페스트, common.js 적용.

## 서버 API 엔드포인트 (server.js)

| 엔드포인트 | 설명 | 외부 API |
|------------|------|----------|
| `GET /api/realtime/:sidoName` | 시도별 실시간 측정 데이터 | 에어코리아 `getCtprvnRltmMesureDnsty` |
| `GET /api/realtime-bulk?sido=서울,부산,...` | 여러 시도 한번에 조회 | 에어코리아 (병렬 호출) |
| `GET /api/geodata` | 한국 행정구역 TopoJSON 지도 | GitHub (southkorea-maps) → 로컬 캐시 |
| `GET /api/station-list/:sidoName` | 시도별 측정소 목록 (주소 포함) | 에어코리아 `getMsrstnList` |
| `GET /api/weather?lat=&lng=` | 날씨 (기온/습도/풍속/강수/하늘/체감온도/UV) | 기상청 초단기실황+예보, 생활기상지수 |
| `404 fallback` | 존재하지 않는 경로 → 404.html | - |

## 캐싱 전략
- **서버 인메모리 캐시**: `Map` 기반, TTL 10분 (시도별 데이터, 날씨, 측정소 목록)
- **지도 데이터**: `geo-cache.json` 파일로 영구 캐시 (최초 1회 GitHub에서 다운로드)

## 주요 기능

### 메인 대시보드 (`/`)
- 위치 기반 내 지역 대기질 (PM2.5/PM10/O3/NO2/CO)
- D3.js 행정구역별 색상 지도 (측정소→구역 매핑)
- 기상청 날씨 정보 (기온, 습도, 풍속, 강수, 체감온도, UV)
- 12개 주요 도시 대기질 카드 그리드
- F1 더블클릭 지역 선택 오버레이
- 1시간 자동 갱신
- 가이드 모음 내부 링크 섹션

### 콘텐츠 페이지 (7개 가이드)
- 미세먼지 완벽 가이드 (3000+ 단어)
- 자주 묻는 질문 20개 (아코디언 UI)
- 취약계층 건강 가이드 (6개 그룹별 상세)
- 계절별 대처법 (4계절 + 월별 캘린더)
- 공기청정기 가이드 (7개 섹션)
- 국내외 기준 비교 (9개 섹션, 비교표 다수)
- 각 페이지 간 내부 링크로 상호 연결

### 공통 인터랙티브 기능 (common.js - 13개)
1. **쿠키 동의 배너** — GDPR/AdSense 준수, localStorage 기반
2. **맨 위로 버튼** — 스크롤 300px 이상 시 표시
3. **읽기 진행률 바** — 콘텐츠 페이지 상단 파란 바
4. **브레드크럼 네비게이션** — 자동 생성, BreadcrumbList JSON-LD
5. **소셜 공유** — 카카오톡, 트위터, 페이스북, 링크복사
6. **스크롤 애니메이션** — 카드 요소 IntersectionObserver 기반 페이드인
7. **자동 목차** — h2 3개 이상 페이지에 목차 자동 생성
8. **글꼴 크기 조절** — A-/A/A+ 3단계, localStorage 저장
9. **다크/라이트 모드** — 토글 버튼, localStorage 저장
10. **인쇄 버튼** — @media print 스타일 포함
11. **최종 업데이트 표시** — 콘텐츠 페이지 하단
12. **페이지 조회수** — localStorage 기반
13. **토스트 알림** — 링크복사/설정변경 피드백

## 대기질 등급 (한국 환경부 기준, 4단계)
| 등급 | PM2.5 | PM10 |
|------|-------|------|
| 좋음 | 0~15 | 0~30 |
| 보통 | 16~35 | 31~80 |
| 나쁨 | 36~75 | 81~150 |
| 매우나쁨 | 76+ | 151+ |

## 광고 정책 (AdSense)
- 페이지당 최대 1개 광고 단위
- **메인 대시보드**: 콘텐츠 로딩 완료 후에만 광고 표시 (지연 로딩)
- **콘텐츠 페이지**: 콘텐츠 중간에 1개 배치
- **법적 페이지** (privacy, terms): 광고 없음
- **404 페이지**: 광고 없음

## SEO 최적화
- JSON-LD 구조화 데이터 (WebApplication, Article, FAQPage, AboutPage, BreadcrumbList)
- sitemap.xml (10개 페이지, 우선순위/갱신주기 설정)
- robots.txt (Googlebot, AdsBot-Google 허용)
- Open Graph / Twitter Card 메타태그
- meta description 전 페이지 적용
- 내부 링크 풍부한 상호 연결

## UI/디자인
- 다크 테마 (`#1a1a2e` → `#16213e` → `#0f3460`) + 라이트 모드 전환
- 글래스모피즘 카드 (`backdrop-filter: blur(10px)`)
- 공통 네비게이션 (sticky, 모바일 햄버거 메뉴)
- 4컬럼 그리드 푸터 (서비스, 건강 가이드, 법적 고지)
- 반응형: 600px 브레이크포인트
- 스크롤 애니메이션, 읽기 진행률 바

## 실행 방법
```bash
npm install
npm start
# → http://localhost:3000
```

## 의존성
- **런타임**: `express@^4.21.0` (유일한 npm 의존성)
- **CDN**: D3.js v7, TopoJSON Client 3, Leaflet 1.9.4
- **외부 서비스**: 에어코리아 API, 기상청 API, Nominatim (역지오코딩), GitHub Raw (지도 데이터)
