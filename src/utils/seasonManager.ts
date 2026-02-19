import { SeasonStatus, SportType } from '@/types';

// 시즌 날짜 설정 (JSON에서 로드)
let SEASON_DATES: Record<SportType, { start: Date; end: Date }> | null = null;

// 국제 스포츠 이벤트 목록 (major-events.json에서 로드)
let MAJOR_EVENTS: { name: string; date: string; endDate?: string; icon: string }[] = [];

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
    // 기본값은 사용하지 않음 - MAJOR_EVENTS 기반으로 자동 판단
    start: new Date('2026-01-01'),
    end: new Date('2026-01-01'),
  },
};

// season-config.json에서 시즌 설정 로드
export const loadSeasonConfig = async (): Promise<void> => {
  try {
    const baseUrl = import.meta.env.BASE_URL;

    // season-config.json 로드
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
        // international은 MAJOR_EVENTS 기반으로 자동 판단하므로 여기서는 의미 없음
        start: new Date(config.international?.start || '2026-01-01'),
        end: new Date(config.international?.end || '2026-01-01'),
      },
    };

    // major-events.json 로드 (국제대회 시즌 자동 판단용)
    try {
      const eventsResponse = await fetch(`${baseUrl}data/major-events.json`);
      if (eventsResponse.ok) {
        MAJOR_EVENTS = await eventsResponse.json();
      }
    } catch (eventsError) {
      console.warn('Failed to load major-events.json:', eventsError);
    }
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
  now.setHours(0, 0, 0, 0); // 시간 제거하고 날짜만 비교

  // 국제대회는 major-events.json 기반으로 자동 판단
  if (sport === 'international') {
    for (const event of MAJOR_EVENTS) {
      const startDate = new Date(event.date);
      startDate.setHours(0, 0, 0, 0);

      // 종료일이 있으면 사용, 없으면 시작일 + 14일
      const endDate = event.endDate
        ? new Date(event.endDate)
        : new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      endDate.setHours(23, 59, 59, 999);

      // 시작 7일 전
      const weekBeforeStart = new Date(startDate);
      weekBeforeStart.setDate(weekBeforeStart.getDate() - 7);

      // pre-season: 시작 7일 전 ~ 시작일
      if (now >= weekBeforeStart && now < startDate) {
        return 'pre-season';
      }
      // in-season: 시작일 ~ 종료일
      if (now >= startDate && now <= endDate) {
        return 'in-season';
      }
    }
    return 'off-season';
  }

  // 야구, 배구는 기존 로직
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