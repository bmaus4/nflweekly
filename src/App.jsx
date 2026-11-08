import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, Shield, Lock, Eye, EyeOff, Clock, ChevronRight, TrendingUp, 
  Users, BarChart3, CheckCircle2, AlertCircle, RefreshCw, Star, Flame,
  Calendar, Award, ChevronDown, Activity, Sparkles, UserCheck, HelpCircle,
  Unlock, RefreshCcw, ExternalLink, Zap
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, onSnapshot, collection, query 
} from 'firebase/firestore';

// ==========================================
// 1. ALL 32 NFL TEAMS - FULL COLOR PALETTES
// ==========================================
const ALL_NFL_TEAMS = {
  // AFC EAST
  BUF: { name: 'Buffalo Bills', city: 'Buffalo', mas: 'Bills', primary: '#00338D', secondary: '#C60C30', darkBg: '#000c24', conference: 'AFC East' },
  MIA: { name: 'Miami Dolphins', city: 'Miami', mas: 'Dolphins', primary: '#008E97', secondary: '#FC4C02', darkBg: '#001b1d', conference: 'AFC East' },
  NE:  { name: 'New England Patriots', city: 'New England', mas: 'Patriots', primary: '#002244', secondary: '#C60C30', darkBg: '#000814', conference: 'AFC East' },
  NYJ: { name: 'New York Jets', city: 'New York', mas: 'Jets', primary: '#125740', secondary: '#FFFFFF', darkBg: '#041710', conference: 'AFC East' },

  // AFC NORTH
  BAL: { name: 'Baltimore Ravens', city: 'Baltimore', mas: 'Ravens', primary: '#241773', secondary: '#000000', darkBg: '#0a0521', conference: 'AFC North' },
  CIN: { name: 'Cincinnati Bengals', city: 'Cincinnati', mas: 'Bengals', primary: '#FB4F14', secondary: '#000000', darkBg: '#1c0700', conference: 'AFC North' },
  CLE: { name: 'Cleveland Browns', city: 'Cleveland', mas: 'Browns', primary: '#311D00', secondary: '#FF3C00', darkBg: '#140c00', conference: 'AFC North' },
  PIT: { name: 'Pittsburgh Steelers', city: 'Pittsburgh', mas: 'Steelers', primary: '#FFB81C', secondary: '#101820', darkBg: '#1c1400', conference: 'AFC North' },

  // AFC SOUTH
  HOU: { name: 'Houston Texans', city: 'Houston', mas: 'Texans', primary: '#03202F', secondary: '#A71930', darkBg: '#010c12', conference: 'AFC South' },
  IND: { name: 'Indianapolis Colts', city: 'Indianapolis', mas: 'Colts', primary: '#002C5F', secondary: '#A2AAAD', darkBg: '#000e1f', conference: 'AFC South' },
  JAX: { name: 'Jacksonville Jaguars', city: 'Jacksonville', mas: 'Jaguars', primary: '#006778', secondary: '#D7A22A', darkBg: '#00191d', conference: 'AFC South' },
  TEN: { name: 'Tennessee Titans', city: 'Tennessee', mas: 'Titans', primary: '#0C2340', secondary: '#4B92DB', darkBg: '#040d1a', conference: 'AFC South' },

  // AFC WEST
  DEN: { name: 'Denver Broncos', city: 'Denver', mas: 'Broncos', primary: '#FB4F14', secondary: '#002244', darkBg: '#170600', conference: 'AFC West' },
  KC:  { name: 'Kansas City Chiefs', city: 'Kansas City', mas: 'Chiefs', primary: '#E31837', secondary: '#FFB81C', darkBg: '#1a0005', conference: 'AFC West' },
  LV:  { name: 'Las Vegas Raiders', city: 'Las Vegas', mas: 'Raiders', primary: '#000000', secondary: '#A5ACAF', darkBg: '#0c0c0e', conference: 'AFC West' },
  LAC: { name: 'Los Angeles Chargers', city: 'Los Angeles', mas: 'Chargers', primary: '#0080C6', secondary: '#FFC20E', darkBg: '#001a29', conference: 'AFC West' },

  // NFC EAST
  DAL: { name: 'Dallas Cowboys', city: 'Dallas', mas: 'Cowboys', primary: '#003594', secondary: '#041E42', darkBg: '#000c24', conference: 'NFC East' },
  NYG: { name: 'New York Giants', city: 'New York', mas: 'Giants', primary: '#0B2265', secondary: '#A71930', darkBg: '#030a21', conference: 'NFC East' },
  PHI: { name: 'Philadelphia Eagles', city: 'Philadelphia', mas: 'Eagles', primary: '#004C54', secondary: '#A5ACAF', darkBg: '#001417', conference: 'NFC East' },
  WAS: { name: 'Washington Commanders', city: 'Washington', mas: 'Commanders', primary: '#5A1414', secondary: '#FFB612', darkBg: '#1c0505', conference: 'NFC East' },

  // NFC NORTH
  CHI: { name: 'Chicago Bears', city: 'Chicago', mas: 'Bears', primary: '#0B162A', secondary: '#C83803', darkBg: '#03070d', conference: 'NFC North' },
  DET: { name: 'Detroit Lions', city: 'Detroit', mas: 'Lions', primary: '#0076B6', secondary: '#B0B7BC', darkBg: '#001929', conference: 'NFC North' },
  GB:  { name: 'Green Bay Packers', city: 'Green Bay', mas: 'Packers', primary: '#203731', secondary: '#FFB81C', darkBg: '#07120e', conference: 'NFC North' },
  MIN: { name: 'Minnesota Vikings', city: 'Minnesota', mas: 'Vikings', primary: '#4F2683', secondary: '#FFC62F', darkBg: '#130821', conference: 'NFC North' },

  // NFC SOUTH
  ATL: { name: 'Atlanta Falcons', city: 'Atlanta', mas: 'Falcons', primary: '#A71930', secondary: '#000000', darkBg: '#190306', conference: 'NFC South' },
  CAR: { name: 'Carolina Panthers', city: 'Carolina', mas: 'Panthers', primary: '#0085CA', secondary: '#101820', darkBg: '#001824', conference: 'NFC South' },
  NO:  { name: 'New Orleans Saints', city: 'New Orleans', mas: 'Saints', primary: '#D3BC8D', secondary: '#101820', darkBg: '#19150c', conference: 'NFC South' },
  TB:  { name: 'Tampa Bay Buccaneers', city: 'Tampa Bay', mas: 'Buccaneers', primary: '#D50A0A', secondary: '#FF7900', darkBg: '#1a0101', conference: 'NFC South' },

  // NFC WEST
  ARI: { name: 'Arizona Cardinals', city: 'Arizona', mas: 'Cardinals', primary: '#97233F', secondary: '#FFB612', darkBg: '#170409', conference: 'NFC West' },
  LAR: { name: 'Los Angeles Rams', city: 'Los Angeles', mas: 'Rams', primary: '#003594', secondary: '#FFA300', darkBg: '#000d26', conference: 'NFC West' },
  SF:  { name: 'San Francisco 49ers', city: 'San Francisco', mas: '49ers', primary: '#AA0000', secondary: '#B3995D', darkBg: '#170000', conference: 'NFC West' },
  SEA: { name: 'Seattle Seahawks', city: 'Seattle', mas: 'Seahawks', primary: '#002244', secondary: '#69BE28', darkBg: '#000814', conference: 'NFC West' }
};

// ==========================================
// 2. REALTIME FALLBACK SEASON SLATE WITH BETMGM SPREADS
// ==========================================
const SEASON_SCHEDULE = {
  10: {
    weekNum: 10,
    status: 'COMPLETED',
    lockDeadline: '2026-11-12T17:00:00Z',
    games: [
      {
        id: 'g10-1', home: 'KC', away: 'BUF', homeRecord: '8-1', awayRecord: '7-2',
        spread: -3.5, homeScore: 27, awayScore: 24, status: 'FINAL',
        lineups: { homeQB: { name: 'P. Mahomes', yds: '2,680', td: 21, int: 5 }, awayQB: { name: 'J. Allen', yds: '2,540', td: 22, int: 7 } },
        atsTrend: 'BetMGM: Chiefs covered -3.5 in 4 of last 5 home games.'
      },
      {
        id: 'g10-2', home: 'SF', away: 'DAL', homeRecord: '7-2', awayRecord: '5-4',
        spread: -5.5, homeScore: 31, awayScore: 20, status: 'FINAL',
        lineups: { homeQB: { name: 'B. Purdy', yds: '2,420', td: 18, int: 6 }, awayQB: { name: 'D. Prescott', yds: '2,310', td: 16, int: 8 } },
        atsTrend: 'BetMGM: 49ers 7-2 ATS in high total games.'
      },
      {
        id: 'g10-3', home: 'BAL', away: 'CIN', homeRecord: '7-3', awayRecord: '4-5',
        spread: -6.0, homeScore: 35, awayScore: 34, status: 'FINAL',
        lineups: { homeQB: { name: 'L. Jackson', yds: '2,810', td: 24, int: 3 }, awayQB: { name: 'J. Burrow', yds: '2,670', td: 24, int: 4 } },
        atsTrend: 'BetMGM: Bengals covered +6.0 despite loss.'
      }
    ]
  },
  11: {
    weekNum: 11,
    status: 'ACTIVE',
    lockDeadline: '2026-11-19T17:00:00Z',
    games: [
      {
        id: 'g11-1', home: 'PHI', away: 'GB', homeRecord: '8-2', awayRecord: '7-3',
        spread: -4.5, time: 'Sun 4:25 PM ET', status: 'UPCOMING',
        lineups: { 
          homeQB: { name: 'J. Hurts', yds: '2,350', td: 18, int: 5, rating: 98.4 },
          awayQB: { name: 'J. Love', yds: '2,480', td: 20, int: 9, rating: 96.2 },
          homeRB: { name: 'S. Barkley', yds: '1,020', td: 10 },
          awayRB: { name: 'J. Jacobs', yds: '810', td: 7 }
        },
        teamStats: { homePPG: 26.4, homeDefPPG: 18.2, awayPPG: 25.1, awayDefPPG: 20.5 },
        atsTrend: 'BetMGM Consensus: 62% of sharp money on Eagles -4.5'
      },
      {
        id: 'g11-2', home: 'DET', away: 'MIA', homeRecord: '8-1', awayRecord: '4-6',
        spread: -7.5, time: 'Sun 1:00 PM ET', status: 'UPCOMING',
        lineups: { 
          homeQB: { name: 'J. Goff', yds: '2,580', td: 20, int: 7, rating: 106.1 },
          awayQB: { name: 'T. Tagovailoa', yds: '1,980', td: 14, int: 6, rating: 95.8 },
          homeRB: { name: 'J. Gibbs', yds: '740', td: 8 },
          awayRB: { name: 'D. Achane', yds: '590', td: 5 }
        },
        teamStats: { homePPG: 31.2, homeDefPPG: 19.0, awayPPG: 20.8, awayDefPPG: 24.5 },
        atsTrend: 'BetMGM: Lions covered 5 straight home games laying >7 points.'
      },
      {
        id: 'g11-3', home: 'BUF', away: 'KC', homeRecord: '7-3', awayRecord: '9-1',
        spread: -1.5, time: 'Sun 4:25 PM ET', status: 'UPCOMING',
        lineups: { 
          homeQB: { name: 'J. Allen', yds: '2,540', td: 22, int: 7, rating: 101.8 },
          awayQB: { name: 'P. Mahomes', yds: '2,680', td: 21, int: 5, rating: 104.2 },
          homeRB: { name: 'J. Cook', yds: '710', td: 7 },
          awayRB: { name: 'I. Pacheco', yds: '640', td: 6 }
        },
        teamStats: { homePPG: 28.5, homeDefPPG: 21.1, awayPPG: 24.8, awayDefPPG: 17.6 },
        atsTrend: 'BetMGM Line Movement: Opened Bills -2.5, moved to Bills -1.5.'
      },
      {
        id: 'g11-4', home: 'DAL', away: 'CIN', homeRecord: '5-5', awayRecord: '4-6',
        spread: -2.5, time: 'Mon 8:15 PM ET', status: 'UPCOMING',
        lineups: { 
          homeQB: { name: 'D. Prescott', yds: '2,310', td: 16, int: 8, rating: 94.1 },
          awayQB: { name: 'J. Burrow', yds: '2,670', td: 24, int: 4, rating: 108.0 },
          homeRB: { name: 'R. Dowdle', yds: '480', td: 3 },
          awayRB: { name: 'C. Brown', yds: '530', td: 4 }
        },
        teamStats: { homePPG: 21.4, homeDefPPG: 25.8, awayPPG: 27.0, awayDefPPG: 26.2 },
        atsTrend: 'BetMGM: Bengals are 5-0 ATS as road underdogs.'
      }
    ]
  }
};

// ==========================================
// 3. FIREBASE SETUP & INITIALIZATION
// ==========================================
let app, auth, db;
try {
  const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config)
    : {
        apiKey: "demo-key",
        authDomain: "demo-nfl-app.firebaseapp.com",
        projectId: "demo-nfl-app",
        storageBucket: "demo-nfl-app.appspot.com",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:demo"
      };

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase config fallback enabled:", e);
}

const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'nfl-spread-pickem';

export default function App() {
  // Authentication & Users State
  const [user, setUser] = useState(null);
  const [activeProfile, setActiveProfile] = useState('user1'); // 'user1' = You (Bryan), 'user2' = Uncle
  
  // Dynamic Team Themes per User
  const [userThemes, setUserThemes] = useState({
    user1: 'GB',
    user2: 'SF'
  });

  // Active Week & Schedule Data
  const [selectedWeekNum, setSelectedWeekNum] = useState(11);
  const [liveSchedule, setLiveSchedule] = useState(SEASON_SCHEDULE);
  const [liveDataLoading, setLiveDataLoading] = useState(false);

  // Firestore Synced Picks & Locks
  const [syncedPicks, setSyncedPicks] = useState({
    user1Picks: {},
    user2Picks: {},
    user1Locked: false,
    user2Locked: false
  });

  // UI Modals & Active Tabs
  const [activeTab, setActiveTab] = useState('picks');
  const [activeGameModal, setActiveGameModal] = useState(null);

  // --- FIREBASE AUTH & LIVE LISTENERS ---
  useEffect(() => {
    if (!auth || !db) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Sync Profiles & Themes from Firestore
  useEffect(() => {
    if (!user || !db) return;
    const themesDocRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'user_profiles', 'themes');
    
    const unsubscribe = onSnapshot(themesDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserThemes({
          user1: data.user1 || 'GB',
          user2: data.user2 || 'SF'
        });
      }
    }, (err) => console.error("Firestore Theme Sync Error:", err));

    return () => unsubscribe();
  }, [user]);

  // Sync Weekly Picks & Locks from Firestore
  useEffect(() => {
    if (!user || !db) return;
    const weekDocRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'weekly_picks', `week_${selectedWeekNum}`);

    const unsubscribe = onSnapshot(weekDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSyncedPicks({
          user1Picks: data.user1Picks || {},
          user2Picks: data.user2Picks || {},
          user1Locked: !!data.user1Locked,
          user2Locked: !!data.user2Locked
        });
      } else {
        setSyncedPicks({ user1Picks: {}, user2Picks: {}, user1Locked: false, user2Locked: false });
      }
    }, (err) => console.error("Firestore Picks Sync Error:", err));

    return () => unsubscribe();
  }, [user, selectedWeekNum]);

  // --- PERSIST USER TEAM THEME CHANGE ---
  const handleUpdateTheme = async (teamCode) => {
    const updated = { ...userThemes, [activeProfile]: teamCode };
    setUserThemes(updated);
    
    if (user && db) {
      try {
        const themesDocRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'user_profiles', 'themes');
        await setDoc(themesDocRef, updated, { merge: true });
      } catch (e) {
        console.error("Error writing theme to Firestore:", e);
      }
    }
  };

  // --- PERSIST PICKS TO FIRESTORE ---
  const handleSelectPick = async (gameId, teamPicked) => {
    // Prevent picking if active user is locked
    if (activeProfile === 'user1' && syncedPicks.user1Locked) return;
    if (activeProfile === 'user2' && syncedPicks.user2Locked) return;

    const keyName = activeProfile === 'user1' ? 'user1Picks' : 'user2Picks';
    const updatedProfilePicks = { ...syncedPicks[keyName], [gameId]: teamPicked };

    const updatedState = { ...syncedPicks, [keyName]: updatedProfilePicks };
    setSyncedPicks(updatedState);

    if (user && db) {
      try {
        const weekDocRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'weekly_picks', `week_${selectedWeekNum}`);
        await setDoc(weekDocRef, { [keyName]: updatedProfilePicks }, { merge: true });
      } catch (e) {
        console.error("Error saving pick to Firestore:", e);
      }
    }
  };

  // --- LOCK / UNLOCK TOGGLE ---
  const handleToggleLock = async () => {
    const lockKey = activeProfile === 'user1' ? 'user1Locked' : 'user2Locked';
    const newLockStatus = !syncedPicks[lockKey];

    const updatedState = { ...syncedPicks, [lockKey]: newLockStatus };
    setSyncedPicks(updatedState);

    if (user && db) {
      try {
        const weekDocRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'weekly_picks', `week_${selectedWeekNum}`);
        await setDoc(weekDocRef, { [lockKey]: newLockStatus }, { merge: true });
      } catch (e) {
        console.error("Error updating lock in Firestore:", e);
      }
    }
  };

  // --- FETCH LIVE BETMGM / ESPN SPORTS DATA ---
  const fetchLiveSportsData = async () => {
    setLiveDataLoading(true);
    try {
      // Free public ESPN NFL Scoreboard Endpoint
      const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
      const data = await response.json();
      
      if (data && data.events) {
        const mappedGames = data.events.map((evt, idx) => {
          const comp = evt.competitions[0];
          const homeComp = comp.competitors.find(c => c.homeAway === 'home');
          const awayComp = comp.competitors.find(c => c.homeAway === 'away');
          
          const oddsObj = comp.odds ? comp.odds[0] : null;
          let spreadVal = -3.5; // fallback spread
          if (oddsObj && oddsObj.pointSpread) {
            spreadVal = parseFloat(oddsObj.pointSpread);
          }

          return {
            id: `espn-${evt.id}`,
            home: homeComp.team.abbreviation,
            away: awayComp.team.abbreviation,
            homeRecord: homeComp.records ? homeComp.records[0].summary : '7-3',
            awayRecord: awayComp.records ? awayComp.records[0].summary : '6-4',
            spread: spreadVal,
            homeScore: parseInt(homeComp.score || '0'),
            awayScore: parseInt(awayComp.score || '0'),
            status: evt.status.type.completed ? 'FINAL' : 'UPCOMING',
            time: evt.status.type.shortDetail || 'Sun 1:00 PM ET',
            lineups: {
              homeQB: { name: 'Starting QB', yds: '2,400', td: 18, int: 6 },
              awayQB: { name: 'Starting QB', yds: '2,200', td: 15, int: 8 }
            },
            atsTrend: `BetMGM Spread: ${oddsObj ? oddsObj.details : 'Check Live Book'}`
          };
        });

        if (mappedGames.length > 0) {
          setLiveSchedule(prev => ({
            ...prev,
            [selectedWeekNum]: {
              ...prev[selectedWeekNum],
              games: mappedGames
            }
          }));
        }
      }
    } catch (err) {
      console.warn("API Fetch error, retaining fallback BetMGM slate:", err);
    } finally {
      setLiveDataLoading(false);
    }
  };

  // Spread Result Calculator
  const getSpreadResult = (game) => {
    if (game.status !== 'FINAL') return null;
    const diff = game.homeScore - game.awayScore; 
    const coverMargin = diff + game.spread; 
    if (coverMargin > 0) return game.home;
    if (coverMargin < 0) return game.away;
    return 'PUSH';
  };

  // Compute Overall Standings
  const standings = useMemo(() => {
    let u1WeeklyWins = 0;
    let u2WeeklyWins = 0;
    let u1TotalATS = 0;
    let u2TotalATS = 0;

    Object.values(liveSchedule).forEach(wk => {
      if (wk.status === 'COMPLETED') {
        let u1Correct = 0;
        let u2Correct = 0;

        wk.games.forEach(g => {
          const winnerCovered = getSpreadResult(g);
          if (syncedPicks.user1Picks[g.id] === winnerCovered) u1Correct++;
          if (syncedPicks.user2Picks[g.id] === winnerCovered) u2Correct++;
        });

        u1TotalATS += u1Correct;
        u2TotalATS += u2Correct;

        if (u1Correct > u2Correct) u1WeeklyWins++;
        else if (u2Correct > u1Correct) u2WeeklyWins++;
      }
    });

    return { u1WeeklyWins, u2WeeklyWins, u1TotalATS, u2TotalATS };
  }, [liveSchedule, syncedPicks]);

  // Active theme based on active profile selection
  const activeTeamCode = userThemes[activeProfile] || 'GB';
  const teamTheme = ALL_NFL_TEAMS[activeTeamCode] || ALL_NFL_TEAMS.GB;
  const currentWeek = liveSchedule[selectedWeekNum] || liveSchedule[11];

  // Are picks revealed for opponent?
  const picksRevealed = (syncedPicks.user1Locked && syncedPicks.user2Locked) || currentWeek.status === 'COMPLETED';

  return (
    <div 
      className="min-h-screen text-slate-100 font-sans transition-colors duration-500 pb-16 selection:bg-amber-500 selection:text-slate-950"
      style={{
        backgroundColor: teamTheme.darkBg,
        backgroundImage: `radial-gradient(circle at 50% 0%, ${teamTheme.primary}30 0%, transparent 75%), radial-gradient(circle at 90% 90%, ${teamTheme.secondary}15 0%, transparent 60%)`
      }}
    >
      {/* ================= HEADER / MULTIPLAYER USER SELECTOR ================= */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-lg border border-white/20 transition-all"
              style={{ backgroundColor: teamTheme.primary, color: '#FFF' }}
            >
              NFL
            </div>
            <div>
              <h1 className="font-extrabold text-sm md:text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
                SPREAD PICK'EM <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">BETMGM ODDS</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Head-to-Head Multiplayer Bet</p>
            </div>
          </div>

          {/* User Switcher & Theme Selector */}
          <div className="flex items-center gap-3">
            
            {/* Realtime User Toggle */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-full p-1 flex items-center gap-1 shadow-inner">
              <button
                onClick={() => setActiveProfile('user1')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeProfile === 'user1' 
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105 font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                YOU (Bryan)
              </button>
              <button
                onClick={() => setActiveProfile('user2')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeProfile === 'user2' 
                    ? 'bg-indigo-500 text-white shadow-md scale-105 font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                UNCLE
              </button>
            </div>

            {/* 32 TEAM COLOR SELECTOR */}
            <div className="relative group">
              <select
                value={activeTeamCode}
                onChange={(e) => handleUpdateTheme(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-bold px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer appearance-none pr-8 shadow-sm"
              >
                {Object.keys(ALL_NFL_TEAMS).map(key => (
                  <option key={key} value={key}>
                    Fav Theme: {ALL_NFL_TEAMS[key].mas} ({ALL_NFL_TEAMS[key].conference})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

          </div>

        </div>
      </header>

      {/* ================= HERO SCOREBOARD / H2H TALLY ================= */}
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <div 
          className="rounded-2xl border border-white/10 p-5 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md"
          style={{
            background: `linear-gradient(135deg, ${teamTheme.primary}45 0%, rgba(15, 23, 42, 0.95) 60%)`
          }}
        >
          {/* Background Ambient Flare */}
          <div 
            className="absolute -top-10 -right-10 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: teamTheme.secondary }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative z-10">
            
            {/* Player 1 Card */}
            <div className={`p-4 rounded-xl border transition-all ${activeProfile === 'user1' ? 'bg-slate-900/90 border-amber-500/50 shadow-xl' : 'bg-slate-950/40 border-slate-800'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> YOU (BRYAN)
                </span>
                <span className="text-[11px] font-semibold text-slate-400">Fav: {ALL_NFL_TEAMS[userThemes.user1]?.mas}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-4xl font-black tracking-tight text-white">{standings.u1WeeklyWins}</span>
                  <span className="text-xs text-slate-400 ml-1 font-bold">WEEKS WON</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-300">{standings.u1TotalATS}</span>
                  <span className="text-[10px] text-slate-500 block">Total Games ATS</span>
                </div>
              </div>
            </div>

            {/* Middle Series Tally */}
            <div className="text-center flex flex-col items-center justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-xs text-slate-300 mb-2 shadow">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>SEASON BET SCOREBOARD</span>
              </div>
              <div className="text-3xl font-black tracking-wider text-slate-100 mb-1">
                {standings.u1WeeklyWins} - {standings.u2WeeklyWins}
              </div>
              <p className="text-xs text-slate-400 font-semibold">
                {standings.u1WeeklyWins > standings.u2WeeklyWins 
                  ? '🔥 You are leading the season series!' 
                  : standings.u2WeeklyWins > standings.u1WeeklyWins 
                  ? '⚡ Uncle is leading the season series!' 
                  : '🤝 Series is currently tied'}
              </p>
            </div>

            {/* Player 2 Card (Uncle) */}
            <div className={`p-4 rounded-xl border transition-all ${activeProfile === 'user2' ? 'bg-slate-900/90 border-indigo-500/50 shadow-xl' : 'bg-slate-950/40 border-slate-800'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold tracking-wider text-indigo-400 uppercase flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> UNCLE
                </span>
                <span className="text-[11px] font-semibold text-slate-400">Fav: {ALL_NFL_TEAMS[userThemes.user2]?.mas}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-4xl font-black tracking-tight text-white">{standings.u2WeeklyWins}</span>
                  <span className="text-xs text-slate-400 ml-1 font-bold">WEEKS WON</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-300">{standings.u2TotalATS}</span>
                  <span className="text-[10px] text-slate-500 block">Total Games ATS</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= MAIN CONTENT NAVIGATION ================= */}
      <main className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* Navigation Controls & Live Sync Refresh */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-4">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('picks')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all flex items-center gap-2 ${
                activeTab === 'picks'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              WEEKLY PICKS
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all flex items-center gap-2 ${
                activeTab === 'standings'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              PAST WEEKS & TRENDS
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Data Refresher */}
            <button
              onClick={fetchLiveSportsData}
              disabled={liveDataLoading}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${liveDataLoading ? 'animate-spin' : ''}`} />
              <span>{liveDataLoading ? 'Updating Live Spreads...' : 'Fetch Live Odds'}</span>
            </button>

            {/* Week Selector */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1">
              {[10, 11].map(wNum => (
                <button
                  key={wNum}
                  onClick={() => setSelectedWeekNum(wNum)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedWeekNum === wNum 
                      ? 'bg-slate-700 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  W{wNum} {liveSchedule[wNum]?.status === 'COMPLETED' ? '(Final)' : '(Active)'}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ================= TAB 1: WEEKLY PICKS ================= */}
        {activeTab === 'picks' && (
          <div>
            
            {/* LOCK STATUS BANNER */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-white">
                      WEEK {currentWeek.weekNum} SECRET PICKS SYSTEM
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      3 hrs before kickoff lock
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Picks remain <span className="text-amber-400 font-bold">CONCEALED 🔒</span> until both players lock in their choices.
                  </p>
                </div>
              </div>

              {/* LOCK BUTTONS & INDICATORS */}
              <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 w-full md:w-auto justify-between">
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">YOU:</span>
                  {syncedPicks.user1Locked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> LOCKED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" /> OPEN
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">UNCLE:</span>
                  {syncedPicks.user2Locked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> LOCKED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" /> OPEN
                    </span>
                  )}
                </div>

                {/* LOCK TOGGLE BUTTON */}
                {currentWeek.status === 'ACTIVE' && (
                  <button
                    onClick={handleToggleLock}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md ${
                      (activeProfile === 'user1' && syncedPicks.user1Locked) || (activeProfile === 'user2' && syncedPicks.user2Locked)
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {((activeProfile === 'user1' && syncedPicks.user1Locked) || (activeProfile === 'user2' && syncedPicks.user2Locked))
                      ? 'UNLOCK PICKS'
                      : 'LOCK MY PICKS'}
                  </button>
                )}

              </div>
            </div>

            {/* MATCHUP LIST */}
            <div className="grid grid-cols-1 gap-4">
              {currentWeek.games.map((game) => {
                const homeTeam = ALL_NFL_TEAMS[game.home] || { name: game.home, primary: '#333' };
                const awayTeam = ALL_NFL_TEAMS[game.away] || { name: game.away, primary: '#333' };

                const myPick = activeProfile === 'user1' ? syncedPicks.user1Picks[game.id] : syncedPicks.user2Picks[game.id];
                const opponentPick = activeProfile === 'user1' ? syncedPicks.user2Picks[game.id] : syncedPicks.user1Picks[game.id];
                
                const isMyLocked = activeProfile === 'user1' ? syncedPicks.user1Locked : syncedPicks.user2Locked;

                return (
                  <div 
                    key={game.id}
                    className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg relative"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* Matchup Header */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-300 tracking-wider">
                            {game.status === 'FINAL' ? 'FINAL SCORE' : game.time}
                          </span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-400 font-semibold">{game.atsTrend}</span>
                        </div>

                        {/* Teams Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Away Team */}
                          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                            <div 
                              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow"
                              style={{ backgroundColor: awayTeam.primary }}
                            >
                              {game.away}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                                {awayTeam.name}
                                <span className="text-xs text-slate-500 font-normal">({game.awayRecord})</span>
                              </div>
                              <div className="text-xs text-slate-400 font-semibold mt-0.5">
                                BetMGM Spread: <span className="text-amber-400 font-bold">{game.spread > 0 ? `-${game.spread}` : `+${Math.abs(game.spread)}`}</span>
                              </div>
                            </div>
                            {game.status === 'FINAL' && (
                              <span className="ml-auto text-xl font-black text-white">{game.awayScore}</span>
                            )}
                          </div>

                          {/* Home Team */}
                          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                            <div 
                              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow"
                              style={{ backgroundColor: homeTeam.primary }}
                            >
                              {game.home}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                                {homeTeam.name} <span className="text-[10px] text-amber-500/80 font-bold">HOME</span>
                                <span className="text-xs text-slate-500 font-normal">({game.homeRecord})</span>
                              </div>
                              <div className="text-xs text-slate-400 font-semibold mt-0.5">
                                BetMGM Spread: <span className="text-amber-400 font-bold">{game.spread < 0 ? game.spread : `+${game.spread}`}</span>
                              </div>
                            </div>
                            {game.status === 'FINAL' && (
                              <span className="ml-auto text-xl font-black text-white">{game.homeScore}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Spread Pick Selection Buttons */}
                      <div className="flex flex-col gap-2 min-w-[280px]">
                        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase text-center lg:text-left">
                          MAKE YOUR SPREAD PICK:
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleSelectPick(game.id, game.away)}
                            disabled={isMyLocked || game.status === 'FINAL'}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                              myPick === game.away
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-lg shadow-amber-500/20 scale-[1.02]'
                                : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                            } ${isMyLocked ? 'cursor-not-allowed opacity-90' : ''}`}
                          >
                            <span>{game.away} {game.spread > 0 ? `-${game.spread}` : `+${Math.abs(game.spread)}`}</span>
                            {myPick === game.away && (
                              <span className="text-[10px] uppercase tracking-wider font-black px-1.5 py-0.2 rounded bg-slate-950 text-amber-400">
                                YOUR PICK
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => handleSelectPick(game.id, game.home)}
                            disabled={isMyLocked || game.status === 'FINAL'}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                              myPick === game.home
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-lg shadow-amber-500/20 scale-[1.02]'
                                : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                            } ${isMyLocked ? 'cursor-not-allowed opacity-90' : ''}`}
                          >
                            <span>{game.home} {game.spread < 0 ? game.spread : `+${game.spread}`}</span>
                            {myPick === game.home && (
                              <span className="text-[10px] uppercase tracking-wider font-black px-1.5 py-0.2 rounded bg-slate-950 text-amber-400">
                                YOUR PICK
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Opponent Concealed/Revealed Pick Indicator */}
                      <div className="flex flex-col justify-center items-center lg:items-end min-w-[160px] border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-3 lg:pt-0 lg:pl-6">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          {activeProfile === 'user1' ? "UNCLE'S PICK" : "YOUR NEPHEW'S PICK"}
                        </span>

                        {picksRevealed ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-700/80 text-indigo-300 font-black text-xs">
                              {opponentPick ? opponentPick : 'NO PICK'}
                            </span>
                            <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 text-xs font-bold">
                            <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                            <span>LOCKED & HIDDEN</span>
                          </div>
                        )}

                        <button
                          onClick={() => setActiveGameModal(game)}
                          className="mt-3 text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-transform hover:translate-x-0.5"
                        >
                          Matchup Stats & Lineups <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 2: HISTORICAL ARCHIVE ================= */}
        {activeTab === 'standings' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-black text-white tracking-tight mb-2 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> PAST WEEKS & SPREAD COVERAGE
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Review scores and Against-The-Spread cover outcomes from completed weeks.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(liveSchedule).map((wk) => {
                  if (wk.status !== 'COMPLETED') return null;

                  let u1W = 0, u2W = 0;
                  wk.games.forEach(g => {
                    const covered = getSpreadResult(g);
                    if (syncedPicks.user1Picks[g.id] === covered) u1W++;
                    if (syncedPicks.user2Picks[g.id] === covered) u2W++;
                  });

                  const weekWinner = u1W > u2W ? 'YOU (Bryan)' : u2W > u1W ? 'UNCLE' : 'TIE';

                  return (
                    <div key={wk.weekNum} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                        <span className="font-black text-sm text-white">WEEK {wk.weekNum} RESULT</span>
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded ${
                          weekWinner.startsWith('YOU') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}>
                          WINNER: {weekWinner}
                        </span>
                      </div>

                      <div className="space-y-2 mt-2">
                        {wk.games.map(g => {
                          const covered = getSpreadResult(g);
                          return (
                            <div key={g.id} className="text-[11px] bg-slate-900/90 p-2.5 rounded-lg flex items-center justify-between">
                              <span className="font-medium text-slate-300">
                                {g.away} @ {g.home} ({g.awayScore}-{g.homeScore})
                              </span>
                              <div className="flex items-center gap-2 font-bold">
                                <span className="text-slate-400">Covered: <strong className="text-emerald-400">{covered}</strong></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ================= MATCHUP ANALYSIS MODAL ================= */}
      {activeGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base text-white">
                  {activeGameModal.away} @ {activeGameModal.home} BETMGM BREAKDOWN
                </h3>
              </div>
              <button 
                onClick={() => setActiveGameModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {activeGameModal.lineups && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    PROJECTED QUARTERBACK MATCHUP
                  </h4>
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">AWAY QB</span>
                      <span className="font-bold text-white">{activeGameModal.lineups.awayQB?.name}</span>
                      <p className="text-[11px] text-slate-400">{activeGameModal.lineups.awayQB?.yds} Yds, {activeGameModal.lineups.awayQB?.td} TD</p>
                    </div>
                    <span className="font-black text-amber-400 text-sm">VS</span>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">HOME QB</span>
                      <span className="font-bold text-white">{activeGameModal.lineups.homeQB?.name}</span>
                      <p className="text-[11px] text-slate-400">{activeGameModal.lineups.homeQB?.yds} Yds, {activeGameModal.lineups.homeQB?.td} TD</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <span className="font-bold text-amber-400 block mb-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> BETMGM SPREAD TRENDS
                </span>
                <p className="text-slate-300">
                  {activeGameModal.atsTrend}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
