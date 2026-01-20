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
  result: 'win' | 'loss' | 'draw';
  score: string;
  games: Array<{
    date: string;
    result: 'win' | 'loss' | 'draw';
    score: string;
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
}

// 배구 관련 타입
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

export interface VolleyballPlayer {
  name: string;
  position: string;
  stats: Record<string, number | string>;
  rank?: number;
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
  upcomingMatch?: {
    date: string;
    opponent: string;
    venue: string;
  };
  attackers?: VolleyballPlayer[];
}

// 국제스포츠 타입
export interface InternationalSportsData {
  name: string;
  seasonStatus: SeasonStatus;
  seasonStartDate?: string;
  data: any; // 국제스포츠는 나중에 확장
}

// 영역 위치 타입
export type AreaPosition = 1 | 2 | 3 | 4;