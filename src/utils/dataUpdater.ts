import { BaseballData, VolleyballData, InternationalSportsData } from '@/types';
import { getSeasonStatus } from './seasonManager';

// 기본 URL 경로 설정
const getBasePath = () => {
  // 프로덕션 환경에서는 /mysport/, 개발 환경에서는 /
  return window.location.pathname.includes('/mysport/') ? '/mysport/' : '/';
};

// 폴백 데이터
const getDefaultBaseballData = (): BaseballData => ({
  team: '한화 이글스',
  seasonStatus: getSeasonStatus('baseball'),
  currentRank: 5,
  record: {
    wins: 70,
    losses: 74,
    draws: 0,
    winRate: 0.486,
  },
  leagueStandings: [],
  pitchers: [],
  batters: [],
  headToHead: [],
});

const getDefaultVolleyballData = (): VolleyballData => ({
  team: '현대캐피탈 스카이워커스',
  seasonStatus: getSeasonStatus('volleyball'),
  currentRank: 3,
  record: {
    wins: 20,
    losses: 10,
    points: 60,
    setRate: 1.25,
  },
  leagueStandings: [],
  recentMatches: [],
});

const getDefaultInternationalSportsData = (): InternationalSportsData => ({
  name: '주요 스포츠 이벤트',
  seasonStatus: getSeasonStatus('international'),
  data: {},
});

// JSON 파일에서 야구 데이터 로드
export const fetchBaseballData = async (): Promise<BaseballData> => {
  try {
    // sports.json에서 기본 정보 로드
    const sportsResponse = await fetch(`${getBasePath()}data/sports.json`);
    if (!sportsResponse.ok) throw new Error('Failed to fetch sports.json');
    const sportsData = await sportsResponse.json();
    const baseballData = sportsData.baseball || {};

    // baseball-detail.json에서 상세 정보 로드
    const detailResponse = await fetch(`${getBasePath()}data/baseball-detail.json`);
    if (!detailResponse.ok) throw new Error('Failed to fetch baseball-detail.json');
    const detailData = await detailResponse.json();

    return {
      ...baseballData,
      leagueStandings: detailData.leagueStandings || [],
      pitchers: detailData.pitchers || [],
      batters: detailData.batters || [],
      headToHead: detailData.headToHead || [],
      lastSeries: detailData.lastSeries,
      currentSeries: detailData.currentSeries,
      seasonStatus: getSeasonStatus('baseball'),
      seasonStartDate: detailData.seasonStartDate,
    };
  } catch (error) {
    console.error('Failed to fetch baseball data:', error);
    return getDefaultBaseballData();
  }
};

// 배구 데이터 로드 (실시간 크롤링 또는 JSON 파일)
export const fetchVolleyballData = async (useRealtime = true): Promise<VolleyballData> => {
  try {
    // 개발 환경(localhost)에서만 실시간 크롤링 시도
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         import.meta.env.DEV;
    
    if (useRealtime && isDevelopment) {
      try {
        const crawlResponse = await fetch('/api/crawl-volleyball', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (crawlResponse.ok) {
          const crawlData = await crawlResponse.json();
          return {
            ...crawlData,
            seasonStatus: getSeasonStatus('volleyball'),
          };
        } else {
          // 404 등 HTTP 에러는 조용히 폴백
          console.warn(`Real-time crawl returned ${crawlResponse.status}, falling back to JSON`);
        }
      } catch (crawlError) {
        console.warn('Real-time crawl failed, falling back to JSON:', crawlError);
        // 실시간 크롤링 실패 시 JSON 파일로 폴백
      }
    }

    // JSON 파일에서 로드 (폴백)
    const sportsResponse = await fetch(`${getBasePath()}data/sports.json`);
    if (!sportsResponse.ok) throw new Error('Failed to fetch sports.json');
    const sportsData = await sportsResponse.json();
    const volleyballData = sportsData.volleyball || {};

    const detailResponse = await fetch(`${getBasePath()}data/volleyball-detail.json`);
    if (!detailResponse.ok) throw new Error('Failed to fetch volleyball-detail.json');
    const detailData = await detailResponse.json();

    return {
      ...volleyballData,
      leagueStandings: detailData.leagueStandings || [],
      recentMatches: detailData.recentMatches || [],
      upcomingMatch: detailData.upcomingMatch,
      attackers: detailData.attackers,
      seasonStatus: getSeasonStatus('volleyball'),
      seasonStartDate: detailData.seasonStartDate,
    };
  } catch (error) {
    console.error('Failed to fetch volleyball data:', error);
    return getDefaultVolleyballData();
  }
};

// JSON 파일에서 국제스포츠 데이터 로드
export const fetchInternationalSportsData = async (): Promise<InternationalSportsData> => {
  try {
    const response = await fetch(`${getBasePath()}data/major-events.json`);
    if (!response.ok) throw new Error('Failed to fetch major-events.json');
    const events = await response.json();

    return {
      name: '주요 스포츠 이벤트',
      seasonStatus: getSeasonStatus('international'),
      data: { events },
    };
  } catch (error) {
    console.error('Failed to fetch international sports data:', error);
    return getDefaultInternationalSportsData();
  }
};