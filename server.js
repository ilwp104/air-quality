const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// ─── 에어코리아 API 설정 ───
const SERVICE_KEY = '6876dc6d3d742353d4859ae7c1734a0eeda47e675688ee99a37c26cd977132fc';
const API_BASE = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc';

// ─── 캐시 (시도별 데이터, 10분 유효) ───
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
}

// ─── 정적 파일 서빙 ───
app.use(express.static(path.join(__dirname, 'public')));

// ─── API: 시도별 실시간 측정정보 ───
app.get('/api/realtime/:sidoName', async (req, res) => {
  const { sidoName } = req.params;
  const cacheKey = `sido_${sidoName}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const url = `${API_BASE}/getCtprvnRltmMesureDnsty`
      + `?serviceKey=${SERVICE_KEY}`
      + `&returnType=json&numOfRows=200&pageNo=1`
      + `&sidoName=${encodeURIComponent(sidoName)}&ver=1.3`;

    const response = await fetch(url);
    const text = await response.text();
    const json = JSON.parse(text);

    if (json.response?.header?.resultCode !== '00') {
      return res.status(500).json({ error: json.response?.header?.resultMsg || 'API 오류' });
    }

    const items = json.response?.body?.items || [];
    setCache(cacheKey, items);
    res.json(items);
  } catch (err) {
    console.error(`시도별 데이터 조회 실패 [${sidoName}]:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── API: 여러 시도 한번에 조회 (효율적) ───
app.get('/api/realtime-bulk', async (req, res) => {
  const sidoNames = (req.query.sido || '').split(',').filter(Boolean);
  if (sidoNames.length === 0) return res.status(400).json({ error: 'sido 파라미터 필요' });

  const results = {};

  await Promise.all(
    sidoNames.map(async (sidoName) => {
      const cacheKey = `sido_${sidoName}`;
      const cached = getCached(cacheKey);
      if (cached) {
        results[sidoName] = cached;
        return;
      }

      try {
        const url = `${API_BASE}/getCtprvnRltmMesureDnsty`
          + `?serviceKey=${SERVICE_KEY}`
          + `&returnType=json&numOfRows=200&pageNo=1`
          + `&sidoName=${encodeURIComponent(sidoName)}&ver=1.3`;

        const response = await fetch(url);
        const text = await response.text();
        const json = JSON.parse(text);

        if (json.response?.header?.resultCode === '00') {
          const items = json.response?.body?.items || [];
          setCache(cacheKey, items);
          results[sidoName] = items;
        } else {
          results[sidoName] = [];
        }
      } catch (err) {
        console.error(`시도 데이터 조회 실패 [${sidoName}]:`, err.message);
        results[sidoName] = [];
      }
    })
  );

  res.json(results);
});

// ─── API: 한국 행정구역 지도 데이터 (TopoJSON) ───
const fs = require('fs');
const GEO_CACHE_FILE = path.join(__dirname, 'geo-cache.json');
const GEO_SOURCE = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-topo.json';

app.get('/api/geodata', async (req, res) => {
  // 로컬 캐시 파일 확인
  if (fs.existsSync(GEO_CACHE_FILE)) {
    try {
      const data = fs.readFileSync(GEO_CACHE_FILE, 'utf-8');
      res.set('Content-Type', 'application/json');
      return res.send(data);
    } catch {}
  }

  // 외부에서 가져오기
  try {
    console.log('행정구역 지도 데이터 다운로드 중...');
    const response = await fetch(GEO_SOURCE);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    fs.writeFileSync(GEO_CACHE_FILE, text);
    console.log('행정구역 지도 데이터 캐시 완료');
    res.set('Content-Type', 'application/json');
    res.send(text);
  } catch (err) {
    console.error('지도 데이터 다운로드 실패:', err.message);
    res.status(500).json({ error: '지도 데이터를 불러올 수 없습니다' });
  }
});

// ─── API: 측정소 목록 (주소 포함) ───
const STATION_API_BASE = 'https://apis.data.go.kr/B552584/MsrstnInfoInqireSvc';

app.get('/api/station-list/:sidoName', async (req, res) => {
  const { sidoName } = req.params;
  const cacheKey = `stlist_${sidoName}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const SIDO_FULL = {
    '서울':'서울','부산':'부산','대구':'대구','인천':'인천','광주':'광주',
    '대전':'대전','울산':'울산','세종':'세종','경기':'경기',
    '강원':'강원','충북':'충북','충남':'충남',
    '전북':'전북','전남':'전남','경북':'경북','경남':'경남','제주':'제주'
  };

  try {
    const addr = SIDO_FULL[sidoName] || sidoName;
    const url = `${STATION_API_BASE}/getMsrstnList`
      + `?serviceKey=${SERVICE_KEY}`
      + `&returnType=json&numOfRows=500&pageNo=1`
      + `&addr=${encodeURIComponent(addr)}`;

    const response = await fetch(url);
    const text = await response.text();
    const json = JSON.parse(text);

    if (json.response?.header?.resultCode === '00') {
      const items = json.response?.body?.items || [];
      setCache(cacheKey, items);
      res.json(items);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error(`측정소 목록 조회 실패 [${sidoName}]:`, err.message);
    res.json([]);
  }
});

// ─── 시작 ───
app.listen(PORT, () => {
  console.log(`\n  미세먼지 대시보드 서버 시작!`);
  console.log(`  http://localhost:${PORT}\n`);
});
