import { SeasonStatus, SportType } from '@/types';

// 시즌 날짜 설정 (JSON에서 로드)
let SEASON_DATES: Record<SportType, { start: Date; end: Date }> | null = null;

// 기본값 (폴백)
const DEFAULT_SEASON_DATES: Record<SportType, { start: Date; end: Date }> = {
  baseball: {
    start: new Date('2026-03-23'),
    end: new Date('2026-10-31'),
  },
  volleyball: {
    start: new Date('2025-10-15'),
    end: new Date('2026-03-31'),
  },
  international: {
    start: new Date('2026-06-15'),
    end: new Date('2026-07-15'),
  },
};

// season-config.json에서 시즌 설정 로드
export const loadSeasonConfig = async (): Promise<void> => {
  try {
    const baseUrl = window.location.pathname.includes('/mysport/') ? '/mysport/' : '/';
    const response = await fetch(`${baseUrl}data/season-config.json`);
    if (!response.ok) throw new Error('Failed to fetch season-config.json');
    const config = await response.json();

    SEASON_DATES = {
      baseball: {
        start: new Date(config.baseball.start),
        end: new Date(config.baseball.end),
      },
      volleyball: {
        start: new Date(config.volleyball.start),
        end: new Date(config.volleyball.end),
      },
      international: {
        start: new Date(config.international.start),
        end: new Date(config.international.end),
      },
    };
  } catch (error) {
    console.error('Failed to load season config:', error);
    // 기본값 사용
    SEASON_DATES = DEFAULT_SEASON_DATES;
  }
};

// 시즌 날짜 가져오기 (로드되지 않았으면 기본값 사용)
const getSeasonDates = (sport: SportType): { start: Date; end: Date } => {
  return SEASON_DATES?.[sport] || DEFAULT_SEASON_DATES[sport];
};

export const getSeasonStatus = (sport: SportType): SeasonStatus => {
  const now = new Date();
  const season = getSeasonDates(sport);
  
  const weekBeforeStart = new Date(season.start);
  weekBeforeStart.setDate(weekBeforeStart.getDate() - 7);
  
  if (now < weekBeforeStart) return 'off-season';
  if (now >= weekBeforeStart && now < season.start) return 'pre-season';
  if (now >= season.start && now <= season.end) return 'in-season';
  return 'off-season';
};

export const getDaysUntilSeasonStart = (sport: SportType): number | null => {
  const season = getSeasonDates(sport);
  const now = new Date();
  const start = new Date(season.start);
  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : null;
};

export const getSeasonStartDate = (sport: SportType): Date | null => {
  return getSeasonDates(sport).start || null;
};

// 시즌 중인지 확인 (in-season 또는 pre-season)
export const isInSeason = (sport: SportType): boolean => {
  const status = getSeasonStatus(sport);
  return status === 'in-season' || status === 'pre-season';
};

// 메인 페이지 스포츠 정렬 (시즌 중인 것 먼저, 그 중 국제대회 > 야구 > 배구 순)
export const getSortedSports = (): { sport: SportType; inSeason: boolean }[] => {
  const sports: SportType[] = ['international', 'baseball', 'volleyball'];

  // 각 스포츠의 시즌 상태 확인
  const sportsWithStatus = sports.map(sport => ({
    sport,
    inSeason: isInSeason(sport)
  }));

  // 시즌 중인 것 먼저, 그 다음 기본 우선순위 (국제대회 > 야구 > 배구)
  const inSeasonSports = sportsWithStatus.filter(s => s.inSeason);
  const offSeasonSports = sportsWithStatus.filter(s => !s.inSeason);

  // 오프시즌 스포츠는 야구 > 배구 > 국제대회 순으로 정렬
  const offSeasonOrder: SportType[] = ['baseball', 'volleyball', 'international'];
  offSeasonSports.sort((a, b) =>
    offSeasonOrder.indexOf(a.sport) - offSeasonOrder.indexOf(b.sport)
  );

  return [...inSeasonSports, ...offSeasonSports];
};

// 메인 페이지에서 어떤 스포츠가 1번 영역에 와야 하는지 결정
export const getMainAreaSport = (): SportType => {
  return getSortedSports()[0].sport;
};

// 데이터 업데이트 주기 결정
export const getUpdateSchedule = (sport: SportType): string[] => {
  const status = getSeasonStatus(sport);
  
  if (status === 'in-season') {
    return ['10:00', '22:00']; // 오전 10시, 오후 10시
  }
  
  return ['weekly']; // 일주일에 한번
};