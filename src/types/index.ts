// 시즌 상태
export type SeasonStatus = 'in-season' | 'off-season' | 'pre-season';

// 스포츠 타입
export type SportType = 'baseball' | 'volleyball' | 'international';

// 야구 관련 타입
export interface BaseballTeam {
  name: string;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  rank: number;
}

export interface BaseballPlayer {
  name: string;
  position: string;
  stats: Record<string, number | string>;
}

export interface BaseballPitcher {
  name: string;
  team?: string; // 팀 정보 추가
  rank?: number; // 순위 정보
  era: number;
  wins: number;
  losses: number;
  so: number;
}

export interface BaseballBatter {
  name: string;
  team?: string; // 팀 정보 추가
  rank?: number; // 순위 정보
  avg: number;
  hits: number;
  hr: number;
  rbi: number;
}

export interface BaseballSeries {
  opponent: string;
  date: string;
  result?: 'win' | 'loss' | 'draw'; // 완료된 시리즈에만 존재
  wins?: number; // 진행 중인 시리즈용
  losses?: number; // 진행 중인 시리즈용
  score?: string;
  games?: Array<{
    date: string;
    result: 'win' | 'loss' | 'draw';
    score: string;
    innings?: Array<{
      inning: number;
      ourScore: number;
      opponentScore: number;
    }>;
    ourTeamStats?: {
      hits: number;
      errors: number;
      homeRuns: number;
    };
    opponentStats?: {
      hits: number;
      errors: number;
      homeRuns: number;
    };
  }>;
}

export interface BaseballData {
  team: string;
  seasonStatus: SeasonStatus;
  seasonStartDate?: string;
  currentRank: number;
  record: {
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  };
  leagueStandings: BaseballTeam[];
  pitchers: BaseballPitcher[];
  batters: BaseballBatter[];
  headToHead: Array<{
    opponent: string;
    wins: number;
    losses: number;
    draws: number;
  }>;
  currentSeries?: BaseballSeries;
  lastSeries?: BaseballSeries;
  nextSeries?: {
    opponent: string;
    date: string;
  };
}

// 배구 관련 타입
export interface VolleyballPlayer {
  name: string;
  position: string;
  stats: Record<string, number | string>;
  rank?: number;
}

export interface VolleyballTeam {
  name: string;
  wins: number;
  losses: number;
  setWins: number;
  setLosses: number;
  setRate: number;
  rank: number;
  points: number; // 승점
}

export interface VolleyballMatch {
  date: string;
  opponent: string;
  venue: string;
  result: 'win' | 'loss';
  score: string;
  sets: Array<{
    setNumber: number;
    ourScore: number;
    opponentScore: number;
  }>;
}

export interface VolleyballData {
  team: string;
  seasonStatus: SeasonStatus;
  seasonStartDate?: string;
  currentRank: number;
  record: {
    wins: number;
    losses: number;
    points: number;
    setRate: number;
  };
  leagueStandings: VolleyballTeam[];
  leagueStandingsWomen?: VolleyballTeam[]; // 여자부 순위
  recentMatches: VolleyballMatch[];
  attackers?: VolleyballPlayer[]; // 공격수 순위 (시즌 종료 후 표시)
  upcomingMatch?: {
    date: string;
    time?: string;
    opponent: string;
    venue: string;
  };
}

// 동계올림픽 타입
export interface WinterOlympicsData {
  lastUpdate: string;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
  allCountriesMedals: Array<{
    rank: number;
    nation: string;
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  }>;
  koreaMedalists: Array<{
    name: string;
    medalType: 'gold' | 'silver' | 'bronze';
    discipline: string;
    date: string;
  }>;
  todaySchedule: Array<{
    time: string;
    discipline: string;
    status: string;
    players?: string[] | null;
  }>;
  upcomingSchedule: Array<{
    date: string;
    time: string;
    discipline: string;
    status: string;
  }>;
  disciplineSchedules?: Record<string, {
    name: string;
    games: Array<{
      date: string;
      time: string;
      disciplineDetail: string;
      status: string;
      players?: string[] | null;
      scores?: string[] | null;
      result?: string | null;
    }>;
  }>;
}

// 국제스포츠 이벤트 타입
export interface MajorEvent {
  name: string;
  date: string;
  endDate?: string;
  icon: string;
}

// 국제스포츠 타입
export interface InternationalSportsData {
  name: string;
  seasonStatus: SeasonStatus;
  seasonStartDate?: string;
  data: { events: MajorEvent[] };
  winterOlympics?: WinterOlympicsData;
}

// 영역 위치 타입
export type AreaPosition = 1 | 2 | 3 | 4;