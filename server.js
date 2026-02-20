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

// ─── 기상청 날씨 API 설정 ───
const WEATHER_API_BASE = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
const UV_API_BASE = 'https://apis.data.go.kr/1360000/LivingWthrIdxServiceV4';

// 위경도 → 기상청 격자좌표 변환 (Lambert Conformal Conic Projection)
function latLngToGrid(lat, lng) {
  const RE = 6371.00877, GRID = 5.0, SLAT1 = 30.0, SLAT2 = 60.0;
  const OLON = 126.0, OLAT = 38.0, XO = 43, YO = 136;
  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD, slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD, olat = OLAT * DEGRAD;
  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;
  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

// 체감온도 계산 (기온 10°C 이하 + 풍속 4.8km/h 이상)
function calcWindChill(temp, windSpeedMs) {
  const v = windSpeedMs * 3.6;
  if (temp <= 10 && v >= 4.8) {
    return Math.round((13.12 + 0.6215 * temp - 11.37 * Math.pow(v, 0.16) + 0.3965 * temp * Math.pow(v, 0.16)) * 10) / 10;
  }
  return temp;
}

// 시도 → 생활기상지수 행정구역코드
const SIDO_UV_CODES = {
  '서울':'1100000000','부산':'2600000000','대구':'2200000000','인천':'2800000000',
  '광주':'2900000000','대전':'3000000000','울산':'3100000000','세종':'3611000000',
  '경기':'4100000000','강원':'4200000000','충북':'4300000000','충남':'4400000000',
  '전북':'4500000000','전남':'4600000000','경북':'4700000000','경남':'4800000000',
  '제주':'5000000000',
};

// 위경도 → 가장 가까운 시도명
const SIDO_CENTER_LIST = [
  {n:'서울',la:37.5665,lo:126.978},{n:'부산',la:35.1796,lo:129.0756},
  {n:'대구',la:35.8714,lo:128.6014},{n:'인천',la:37.4563,lo:126.7052},
  {n:'광주',la:35.1595,lo:126.8526},{n:'대전',la:36.3504,lo:127.3845},
  {n:'울산',la:35.5384,lo:129.3114},{n:'세종',la:36.48,lo:127.289},
  {n:'경기',la:37.275,lo:127.0094},{n:'강원',la:37.8228,lo:128.1555},
  {n:'충북',la:36.6357,lo:127.4913},{n:'충남',la:36.5184,lo:126.8},
  {n:'전북',la:35.7175,lo:127.153},{n:'전남',la:34.8679,lo:126.991},
  {n:'경북',la:36.4919,lo:128.8889},{n:'경남',la:35.4606,lo:128.2132},
  {n:'제주',la:33.4996,lo:126.5312},
];

function nearestSido(lat, lng) {
  let min = Infinity, r = '서울';
  for (const s of SIDO_CENTER_LIST) {
    const d = (s.la - lat) ** 2 + (s.lo - lng) ** 2;
    if (d < min) { min = d; r = s.n; }
  }
  return r;
}

// ─── API: 날씨 정보 ───
app.get('/api/weather', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'lat, lng 파라미터 필요' });

  const { nx, ny } = latLngToGrid(lat, lng);
  const cacheKey = `weather_${nx}_${ny}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  // KST 시간 계산
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const ky = kst.getUTCFullYear(), km = kst.getUTCMonth(), kd = kst.getUTCDate();
  const kh = kst.getUTCHours(), kmin = kst.getUTCMinutes();

  // 초단기실황 base: 매시 정각, 40분 후 제공
  const ncstT = new Date(Date.UTC(ky, km, kd, kh));
  if (kmin < 40) ncstT.setTime(ncstT.getTime() - 3600000);
  const ncstDate = ncstT.toISOString().slice(0, 10).replace(/-/g, '');
  const ncstTime = String(ncstT.getUTCHours()).padStart(2, '0') + '00';

  // 초단기예보 base: 매시 30분, 45분 후 제공
  const fcstT = new Date(Date.UTC(ky, km, kd, kh));
  if (kmin < 45) fcstT.setTime(fcstT.getTime() - 3600000);
  const fcstDate = fcstT.toISOString().slice(0, 10).replace(/-/g, '');
  const fcstTime = String(fcstT.getUTCHours()).padStart(2, '0') + '30';

  const result = {
    temperature: null, humidity: null, windSpeed: null, windDirection: null,
    precipitation: '0', precipitationType: '없음', sky: '맑음',
    windChill: null, uvIndex: null, uvGrade: null,
    baseTime: ncstTime.slice(0, 2) + ':' + ncstTime.slice(2),
  };

  try {
    // 1) 초단기실황 (T1H, RN1, REH, PTY, WSD, VEC)
    const ncstUrl = `${WEATHER_API_BASE}/getUltraSrtNcst?serviceKey=${SERVICE_KEY}`
      + `&dataType=JSON&numOfRows=60&pageNo=1`
      + `&base_date=${ncstDate}&base_time=${ncstTime}&nx=${nx}&ny=${ny}`;
    const ncstRes = await fetch(ncstUrl);
    const ncstJson = JSON.parse(await ncstRes.text());

    if (ncstJson.response?.header?.resultCode === '00') {
      for (const item of (ncstJson.response?.body?.items?.item || [])) {
        switch (item.category) {
          case 'T1H': result.temperature = parseFloat(item.obsrValue); break;
          case 'RN1': result.precipitation = item.obsrValue; break;
          case 'REH': result.humidity = parseInt(item.obsrValue); break;
          case 'PTY': {
            const m = {0:'없음',1:'비',2:'비/눈',3:'눈',5:'빗방울',6:'빗방울눈날림',7:'눈날림'};
            result.precipitationType = m[parseInt(item.obsrValue)] || '없음';
            break;
          }
          case 'WSD': result.windSpeed = parseFloat(item.obsrValue); break;
          case 'VEC': result.windDirection = parseInt(item.obsrValue); break;
        }
      }
    }

    // 2) 초단기예보 (SKY 하늘상태)
    const fcstUrl = `${WEATHER_API_BASE}/getUltraSrtFcst?serviceKey=${SERVICE_KEY}`
      + `&dataType=JSON&numOfRows=60&pageNo=1`
      + `&base_date=${fcstDate}&base_time=${fcstTime}&nx=${nx}&ny=${ny}`;
    const fcstRes = await fetch(fcstUrl);
    const fcstJson = JSON.parse(await fcstRes.text());

    if (fcstJson.response?.header?.resultCode === '00') {
      const skyItem = (fcstJson.response?.body?.items?.item || []).find(i => i.category === 'SKY');
      if (skyItem) {
        result.sky = {'1':'맑음','3':'구름많음','4':'흐림'}[skyItem.fcstValue] || '맑음';
      }
    }

    // PTY가 있으면 sky를 강수 상태로 덮어쓰기
    if (result.precipitationType !== '없음') result.sky = result.precipitationType;

    // 3) 체감온도
    if (result.temperature !== null && result.windSpeed !== null) {
      result.windChill = calcWindChill(result.temperature, result.windSpeed);
    }

    // 4) 자외선지수 (실패해도 무시)
    try {
      const sido = nearestSido(lat, lng);
      const areaNo = SIDO_UV_CODES[sido];
      if (areaNo) {
        const uvDateStr = kst.toISOString().slice(0, 10).replace(/-/g, '');
        const uvUrl = `${UV_API_BASE}/getUVIdxV4?serviceKey=${SERVICE_KEY}`
          + `&dataType=JSON&numOfRows=10&pageNo=1`
          + `&areaNo=${areaNo}&time=${uvDateStr + String(kh).padStart(2, '0')}`;
        const uvRes = await fetch(uvUrl);
        const uvJson = JSON.parse(await uvRes.text());
        if (uvJson.response?.header?.resultCode === '00') {
          const uvItems = uvJson.response?.body?.items?.item;
          if (uvItems?.length) {
            const uv = parseInt(uvItems[0].h0 || uvItems[0].h3 || '0');
            if (!isNaN(uv)) {
              result.uvIndex = uv;
              result.uvGrade = uv <= 2 ? '낮음' : uv <= 5 ? '보통' : uv <= 7 ? '높음' : uv <= 10 ? '매우높음' : '위험';
            }
          }
        }
      }
    } catch (e) { console.error('자외선지수 조회 실패:', e.message); }

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('날씨 데이터 조회 실패:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── 시작 ───
app.listen(PORT, () => {
  console.log(`\n  미세먼지 대시보드 서버 시작!`);
  console.log(`  http://localhost:${PORT}\n`);
});
