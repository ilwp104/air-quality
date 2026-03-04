# 한국 미세먼지 실시간 대시보드 (air-quality)

## 개요
한국 전역의 미세먼지(PM2.5/PM10) 및 대기질 정보를 실시간으로 보여주는 웹 대시보드.
사용자의 현재 위치 기반으로 지역 대기질, 날씨, 행정구역별 색상 지도를 제공한다.
미세먼지 교육 가이드, 사이트 소개, 개인정보처리방침, 이용약관 등 다중 페이지 구성.

## 기술 스택
| 구분 | 기술 |
|------|------|
| 서버 | Node.js + Express (포트 3000) |
| 프론트엔드 | Vanilla HTML/CSS/JS (다중 정적 페이지, 프레임워크 없음) |
| 지도 | D3.js + TopoJSON (행정구역 지도), Leaflet (마커 지도) |
| 배포 | Docker (node:20-alpine) |
| 수익화 | Google AdSense (`ca-pub-2601124884291683`) |

## 프로젝트 구조
```
air-quality/
├── server.js              # Express 백엔드 (API 프록시 + 정적 파일 서빙)
├── index.html             # 프론트엔드 v1 (Leaflet 지도 + WAQI API, 레거시)
├── public/
│   ├── index.html         # 메인 대시보드 (D3 행정구역 지도 + 에어코리아 API)
│   ├── guide.html         # 미세먼지 완벽 가이드 (교육 콘텐츠)
│   ├── about.html         # 사이트 소개
│   ├── privacy.html       # 개인정보처리방침
│   ├── terms.html         # 이용약관
│   ├── common.css         # 공통 스타일 (nav, footer, base)
│   └── ads.txt            # AdSense 광고 인증
├── geo-cache.json         # TopoJSON 행정구역 지도 로컬 캐시
├── package.json           # 의존성 (express만 사용)
├── Dockerfile             # Docker 배포 설정
└── PROJECT.md             # 이 문서
```

## 페이지 구성

| 경로 | 파일 | 설명 |
|------|------|------|
| `/` | `public/index.html` | 메인 대시보드 (실시간 대기질 + 지도 + 날씨) |
| `/guide.html` | `public/guide.html` | 미세먼지 완벽 가이드 (2000+ 단어 교육 콘텐츠) |
| `/about.html` | `public/about.html` | 사이트 소개 (목적, 데이터 출처, 기술 특징) |
| `/privacy.html` | `public/privacy.html` | 개인정보처리방침 |
| `/terms.html` | `public/terms.html` | 이용약관 |

모든 페이지에 공통 네비게이션 바와 4컬럼 푸터 적용 (`common.css`).

## 서버 API 엔드포인트 (server.js)

| 엔드포인트 | 설명 | 외부 API |
|------------|------|----------|
| `GET /api/realtime/:sidoName` | 시도별 실시간 측정 데이터 | 에어코리아 `getCtprvnRltmMesureDnsty` |
| `GET /api/realtime-bulk?sido=서울,부산,...` | 여러 시도 한번에 조회 | 에어코리아 (병렬 호출) |
| `GET /api/geodata` | 한국 행정구역 TopoJSON 지도 | GitHub (southkorea-maps) → 로컬 캐시 |
| `GET /api/station-list/:sidoName` | 시도별 측정소 목록 (주소 포함) | 에어코리아 `getMsrstnList` |
| `GET /api/weather?lat=&lng=` | 날씨 (기온/습도/풍속/강수/하늘/체감온도/UV) | 기상청 초단기실황+예보, 생활기상지수 |

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

### 미세먼지 가이드 (`/guide.html`)
- PM2.5/PM10 정의 및 발생원
- 건강 영향 (단기/장기, 취약계층)
- 4단계 등급별 상세 행동 요령
- 마스크 선택 및 착용법 (KF80/KF94/KF99)
- 실내 공기질 관리 (환기 타이밍, 공기청정기, 생활 팁)
- 계절별 미세먼지 패턴 (봄 황사, 겨울 정체, 여름 양호)
- 측정 방법과 관측소 설명

## 대기질 등급 (한국 환경부 기준, 4단계)
| 등급 | PM2.5 | PM10 |
|------|-------|------|
| 좋음 | 0~15 | 0~30 |
| 보통 | 16~35 | 31~80 |
| 나쁨 | 36~75 | 81~150 |
| 매우나쁨 | 76+ | 151+ |

## 광고 정책 (AdSense)
- **메인 대시보드**: 콘텐츠 로딩 완료 후에만 광고 표시 (지연 로딩)
- **가이드/소개 페이지**: 정적 콘텐츠와 함께 광고 배치
- **법적 페이지** (privacy, terms): 광고 없음

## UI/디자인
- 다크 테마 (`#1a1a2e` → `#16213e` → `#0f3460`)
- 글래스모피즘 카드 (`backdrop-filter: blur(10px)`)
- 공통 네비게이션 (sticky, 모바일 햄버거 메뉴)
- 4컬럼 그리드 푸터 (페이지 링크, 법적 고지, 데이터 출처)
- SEO 메타태그 (Open Graph, Twitter Card, description, keywords)
- 반응형: 600px 브레이크포인트

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
