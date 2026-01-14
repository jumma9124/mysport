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
    const response = await fetch('/data/season-config.json');
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

// 메인 페이지에서 어떤 스포츠가 1번 영역에 와야 하는지 결정
export const getMainAreaSport = (): SportType => {
  const internationalStatus = getSeasonStatus('international');
  
  // 국제스포츠가 시즌 중이면 무조건 1번
  if (internationalStatus === 'in-season' || internationalStatus === 'pre-season') {
    return 'international';
  }
  
  const baseballStatus = getSeasonStatus('baseball');
  const volleyballStatus = getSeasonStatus('volleyball');
  
  // 야구 시즌 중이면 야구
  if (baseballStatus === 'in-season' || baseballStatus === 'pre-season') {
    return 'baseball';
  }
  
  // 배구 시즌 중이면 배구
  if (volleyballStatus === 'in-season' || volleyballStatus === 'pre-season') {
    return 'volleyball';
  }
  
  // 기본값은 야구
  return 'baseball';
};

// 데이터 업데이트 주기 결정
export const getUpdateSchedule = (sport: SportType): string[] => {
  const status = getSeasonStatus(sport);
  
  if (status === 'in-season') {
    return ['10:00', '22:00']; // 오전 10시, 오후 10시
  }
  
  return ['weekly']; // 일주일에 한번
};