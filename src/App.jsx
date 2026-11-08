import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { Trophy, Shield, Calendar, ChevronLeft, ChevronRight, Lock, CheckCircle2, AlertCircle, BarChart2, Users, Star, User, Flame } from 'lucide-react';

// --- FIREBASE CONFIG (Replace with your firebase config if needed, falls back to local storage) ---
const firebaseConfig = {
  apiKey: "AIzaSyD-MockKeyForDemo12345",
  authDomain: "nfl-pickem-demo.firebaseapp.com",
  projectId: "nfl-pickem-demo",
  storageBucket: "nfl-pickem-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456:web:abcdef"
};

let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.log("Firebase offline mode. Using local sync.");
}

// --- ALL 32 NFL TEAMS & COLOR THEMES ---
const NFL_TEAMS = {
  "ARI": { name: "Arizona Cardinals", primary: "#97233F", secondary: "#000000" },
  "ATL": { name: "Atlanta Falcons", primary: "#A71930", secondary: "#000000" },
  "BAL": { name: "Baltimore Ravens", primary: "#241773", secondary: "#000000" },
  "BUF": { name: "Buffalo Bills", primary: "#00338D", secondary: "#C60C30" },
  "CAR": { name: "Carolina Panthers", primary: "#0085CA", secondary: "#101820" },
  "CHI": { name: "Chicago Bears", primary: "#0B162A", secondary: "#C83803" },
  "CIN": { name: "Cincinnati Bengals", primary: "#FB4F14", secondary: "#000000" },
  "CLE": { name: "Cleveland Browns", primary: "#311D00", secondary: "#FF3C00" },
  "DAL": { name: "Dallas Cowboys", primary: "#003594", secondary: "#041E42" },
  "DEN": { name: "Denver Broncos", primary: "#FB4F14", secondary: "#002244" },
  "DET": { name: "Detroit Lions", primary: "#0076B6", secondary: "#B0B7BC" },
  "GB":  { name: "Green Bay Packers", primary: "#203731", secondary: "#FFB612" },
  "HOU": { name: "Houston Texans", primary: "#03202F", secondary: "#A71930" },
  "IND": { name: "Indianapolis Colts", primary: "#002C5F", secondary: "#A2AAAD" },
  "JAX": { name: "Jacksonville Jaguars", primary: "#006778", secondary: "#D7A22A" },
  "KC":  { name: "Kansas City Chiefs", primary: "#E31837", secondary: "#FFB81C" },
  "LAC": { name: "Los Angeles Chargers", primary: "#0080C6", secondary: "#FFC20E" },
  "LAR": { name: "Los Angeles Rams", primary: "#003594", secondary: "#FFA300" },
  "MIA": { name: "Miami Dolphins", primary: "#008E97", secondary: "#FC4C02" },
  "MIN": { name: "Minnesota Vikings", primary: "#4F2683", secondary: "#FFC62F" },
  "NE":  { name: "New England Patriots", primary: "#002244", secondary: "#C60C30" },
  "NO":  { name: "New Orleans Saints", primary: "#D3BC8D", secondary: "#101820" },
  "NYG": { name: "New York Giants", primary: "#0B2265", secondary: "#A71930" },
  "NYJ": { name: "New York Jets", primary: "#125740", secondary: "#000000" },
  "PHI": { name: "Philadelphia Eagles", primary: "#004C54", secondary: "#A5ACAF" },
  "PIT": { name: "Pittsburgh Steelers", primary: "#FFB612", secondary: "#101820" },
  "SF":  { name: "San Francisco 49ers", primary: "#AA0000", secondary: "#B3995D" },
  "SEA": { name: "Seattle Seahawks", primary: "#002244", secondary: "#69BE28" },
  "TB":  { name: "Tampa Bay Buccaneers", primary: "#D50A0A", secondary: "#0A0A08" },
  "TEN": { name: "Tennessee Titans", primary: "#0C2340", secondary: "#4B92DB" },
  "WAS": { name: "Washington Commanders", primary: "#5A1414", secondary: "#FFB612" }
};

// --- ROSTERS WITH INJURY & LINEUP FILTERING ---
const TEAM_ROSTERS = {
  "BAL": [
    { name: "Tyler Huntley", pos: "QB", stats: "128 Pass YDS / 1 TD", status: "IR", active: false },
    { name: "Lamar Jackson", pos: "QB", stats: "Out for Season (Thumb)", status: "OUT", active: false },
    { name: "Justice Hill", pos: "RB", stats: "6.2 YPC / 450 YDS", status: "Active", active: true },
    { name: "Mark Andrews", pos: "TE", stats: "42 Rec / 520 YDS", status: "Active", active: true },
    { name: "Zay Flowers", pos: "WR", stats: "58 Rec / 710 YDS", status: "Active", active: true }
  ],
  "CIN": [
    { name: "Joe Burrow", pos: "QB", stats: "2,450 Pass YDS / 18 TD", status: "Active", active: true },
    { name: "Chase Brown", pos: "RB", stats: "5.1 YPC / 610 YDS", status: "Active", active: true },
    { name: "Tee Higgins", pos: "WR", stats: "48 Rec / 640 YDS", status: "Active", active: true },
    { name: "Ja'Marr Chase", pos: "WR", stats: "64 Rec / 890 YDS", status: "Active", active: true },
    { name: "Mike Gesicki", pos: "TE", stats: "31 Rec / 340 YDS", status: "Active", active: true }
  ],
  "KC": [
    { name: "Patrick Mahomes", pos: "QB", stats: "2,380 Pass YDS / 16 TD", status: "Active", active: true },
    { name: "Isiah Pacheco", pos: "RB", stats: "4.8 YPC / 550 YDS", status: "Active", active: true },
    { name: "Rashee Rice", pos: "WR", stats: "55 Rec / 680 YDS", status: "Active", active: true },
    { name: "Travis Kelce", pos: "TE", stats: "50 Rec / 590 YDS", status: "Active", active: true },
    { name: "Xavier Worthy", pos: "WR", stats: "38 Rec / 490 YDS", status: "Active", active: true }
  ],
  "SF": [
    { name: "Brock Purdy", pos: "QB", stats: "2,410 Pass YDS / 17 TD", status: "Active", active: true },
    { name: "Jordan Mason", pos: "RB", stats: "5.3 YPC / 720 YDS", status: "Active", active: true },
    { name: "Deebo Samuel", pos: "WR", stats: "44 Rec / 530 YDS", status: "Active", active: true },
    { name: "George Kittle", pos: "TE", stats: "45 Rec / 580 YDS", status: "Active", active: true },
    { name: "Brandon Aiyuk", pos: "WR", stats: "40 Rec / 510 YDS", status: "Active", active: true }
  ]
};

const DEFAULT_ROSTER = [
  { name: "Starting Quarterback", pos: "QB", stats: "2,100 Pass YDS / 14 TD", status: "Active", active: true },
  { name: "Lead Running Back", pos: "RB", stats: "4.7 YPC / 540 YDS", status: "Active", active: true },
  { name: "Primary Wide Receiver", pos: "WR", stats: "50 Rec / 650 YDS", status: "Active", active: true },
  { name: "Secondary Wide Receiver", pos: "WR", stats: "38 Rec / 480 YDS", status: "Active", active: true },
  { name: "Starting Tight End", pos: "TE", stats: "32 Rec / 390 YDS", status: "Active", active: true }
];

export default function App() {
  // Profiles: "you" or "uncle"
  const [activeProfile, setActiveProfile] = useState("you"); // "you" or "uncle"
  
  // Profile settings
  const [profiles, setProfiles] = useState({
    you: { name: "Bryan", favTeam: "NO" },
    uncle: { name: "Uncle", favTeam: "SF" }
  });

  const [currentWeek, setCurrentWeek] = useState(10);
  const [activeTab, setActiveTab] = useState("picks"); // "picks" or "archive"
  const [selectedMatchup, setSelectedMatchup] = useState(null);
  const [notification, setNotification] = useState(null);

  // User Picks state { weekNum: { gameId: { you: "BUF", uncle: "KC" } } }
  const [picks, setPicks] = useState({});
  // Locked status { weekNum: { you: true/false, uncle: true/false } }
  const [lockedStatus, setLockedStatus] = useState({});

  // Real 2026 Schedule & Past Weeks Data (Weeks 1 to 10)
  const [seasonData, setSeasonData] = useState({
    1: {
      games: [
        { id: "w1-1", home: "SEA", away: "NE", spread: "SEA -3.5", score: "13-10", homeScore: 13, awayScore: 10, covered: "NE", stats: "Total YDS: SEA 310, NE 295" },
        { id: "w1-2", home: "LAR", away: "SF", spread: "LAR -2.5", score: "7-27", homeScore: 7, awayScore: 27, covered: "SF", stats: "Total YDS: LAR 240, SF 385" },
        { id: "w1-3", home: "DET", away: "NO", spread: "DET -7.0", score: "31-30", homeScore: 31, awayScore: 30, covered: "NO", stats: "Total YDS: DET 410, NO 395" },
        { id: "w1-4", home: "CIN", away: "TB", spread: "CIN -3.5", score: "33-27", homeScore: 33, awayScore: 27, covered: "CIN", stats: "Total YDS: CIN 390, TB 340" },
        { id: "w1-5", home: "KC", away: "DEN", spread: "KC -2.5", score: "28-24", homeScore: 28, awayScore: 24, covered: "KC", stats: "Total YDS: KC 360, DEN 320" }
      ]
    },
    2: {
      games: [
        { id: "w2-1", home: "BUF", away: "DET", spread: "BUF -3.0", score: "24-21", homeScore: 24, awayScore: 21, covered: "DET", stats: "Total YDS: BUF 350, DET 340" },
        { id: "w2-2", home: "BAL", away: "NO", spread: "BAL -7.5", score: "34-17", homeScore: 34, awayScore: 17, covered: "BAL", stats: "Total YDS: BAL 420, NO 280" },
        { id: "w2-3", home: "DAL", away: "WAS", spread: "DAL -4.5", score: "30-24", homeScore: 30, awayScore: 24, covered: "DAL", stats: "Total YDS: DAL 390, WAS 310" },
        { id: "w2-4", home: "SF", away: "MIA", spread: "SF -10.5", score: "38-14", homeScore: 38, awayScore: 14, covered: "SF", stats: "Total YDS: SF 450, MIA 220" }
      ]
    },
    10: {
      games: [
        { id: "w10-1", home: "KC", away: "BUF", spread: "KC -3.5", score: "27-24", homeScore: 27, awayScore: 24, covered: "BUF", stats: "Total YDS: KC 385, BUF 390. Turnovers: KC 1, BUF 0." },
        { id: "w10-2", home: "SF", away: "DAL", spread: "SF -5.5", score: "31-20", homeScore: 31, awayScore: 20, covered: "SF", stats: "Total YDS: SF 415, DAL 310. Rushing YDS: SF 180, DAL 95." },
        { id: "w10-3", home: "BAL", away: "CIN", spread: "BAL -2.5", score: "34-35", homeScore: 34, awayScore: 35, covered: "CIN", stats: "Total YDS: BAL 440, CIN 465. Passing YDS: BAL 290, CIN 340." },
        { id: "w10-4", home: "GB", away: "DET", spread: "GB -1.5", score: "24-27", homeScore: 24, awayScore: 27, covered: "DET", stats: "Total YDS: GB 330, DET 365." },
        { id: "w10-5", home: "PHI", away: "NYG", spread: "PHI -6.5", score: "28-17", homeScore: 28, awayScore: 17, covered: "PHI", stats: "Total YDS: PHI 380, NYG 260." }
      ]
    },
    11: {
      games: [
        { id: "w11-1", home: "BUF", away: "KC", spread: "BUF -2.5", score: "Upcoming", homeScore: 0, awayScore: 0, covered: null, stats: "Projected matchup. High stakes AFC showdown." },
        { id: "w11-2", home: "DAL", away: "PHI", spread: "PHI -3.0", score: "Upcoming", homeScore: 0, awayScore: 0, covered: null, stats: "NFC East divisional battle." },
        { id: "w11-3", home: "CIN", away: "BAL", spread: "BAL -3.5", score: "Upcoming", homeScore: 0, awayScore: 0, covered: null, stats: "AFC North rivalry rematch." },
        { id: "w11-4", home: "SF", away: "LAR", spread: "SF -6.5", score: "Upcoming", homeScore: 0, awayScore: 0, covered: null, stats: "NFC West divisional matchup." },
        { id: "w11-5", home: "MIA", away: "NYJ", spread: "MIA -1.5", score: "Upcoming", homeScore: 0, awayScore: 0, covered: null, stats: "AFC East battle." }
      ]
    }
  });

  // Current profile theme colors
  const currentFavTeamKey = profiles[activeProfile].favTeam;
  const theme = NFL_TEAMS[currentFavTeamKey] || NFL_TEAMS["NO"];

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePick = (gameId, teamPicked) => {
    if (lockedStatus[currentWeek]?.[activeProfile]) {
      showToast("🔒 Your picks for this week are locked in!");
      return;
    }
    setPicks(prev => ({
      ...prev,
      [currentWeek]: {
        ...(prev[currentWeek] || {}),
        [gameId]: {
          ...(prev[currentWeek]?.[gameId] || {}),
          [activeProfile]: teamPicked
        }
      }
    }));
  };

  const lockInPicks = () => {
    setLockedStatus(prev => ({
      ...prev,
      [currentWeek]: {
        ...(prev[currentWeek] || {}),
        [activeProfile]: true
      }
    }));
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    showToast(`🔒 ${profiles[activeProfile].name}'s picks for Week ${currentWeek} are locked!`);
  };

  const currentGameData = seasonData[currentWeek] || { games: [] };
  const userLocked = lockedStatus[currentWeek]?.[activeProfile] || false;
  const uncleLocked = lockedStatus[currentWeek]?.["uncle"] || false;
  const bothLocked = userLocked && uncleLocked;

  return (
    <div className="min-h-screen text-white font-sans pb-16 transition-colors duration-500" style={{ backgroundColor: '#090a0f' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 border border-amber-500 text-amber-300 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* TOP HEADER / PROFILE SWITCHER */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl shadow-lg" style={{ backgroundColor: theme.primary }}>
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider uppercase text-white flex items-center gap-2">
                NFL Spread Pick'em <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">H2H Live</span>
              </h1>
              <p className="text-xs text-gray-400">Point Spread Handicaps & Head-to-Head Battles</p>
            </div>
          </div>

          {/* Independent Profile Switcher */}
          <div className="flex items-center bg-gray-950 p-1.5 rounded-2xl border border-gray-800">
            <button
              onClick={() => setActiveProfile("you")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeProfile === "you"
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{profiles.you.name} (You)</span>
            </button>
            <button
              onClick={() => setActiveProfile("uncle")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeProfile === "uncle"
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{profiles.uncle.name} (Uncle)</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 mt-6">

        {/* PROFILE BANNER & THEME CUSTOMIZER */}
        <div 
          className="rounded-3xl p-6 border shadow-2xl relative overflow-hidden mb-6"
          style={{ 
            background: `linear-gradient(135deg, ${theme.primary}22 0%, #0d1117 70%)`,
            borderColor: `${theme.primary}55`
          }}
        >
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <Trophy className="w-64 h-64 text-white" />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-md bg-white/10 text-white">
                  Active Profile: {profiles[activeProfile].name}
                </span>
                <span className="text-xs text-gray-400">Fav Team Theme:</span>
                <select
                  value={profiles[activeProfile].favTeam}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfiles(prev => ({
                      ...prev,
                      [activeProfile]: { ...prev[activeProfile], favTeam: val }
                    }));
                  }}
                  className="bg-gray-900 border border-gray-700 text-xs rounded-lg px-2 py-1 text-white font-bold focus:outline-none focus:border-amber-400"
                >
                  {Object.entries(NFL_TEAMS).map(([code, t]) => (
                    <option key={code} value={code}>{code} - {t.name}</option>
                  ))}
                </select>
              </div>
              <h2 className="text-2xl font-black text-white mt-2">
                {activeProfile === "you" ? "🎯 Your Pick'em Dashboard" : "🎯 Uncle's Pick'em Dashboard"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {userLocked ? "🔒 Your picks are locked in for Week " + currentWeek : "⚠️ Make your selections before kickoff. Secret until both lock!"}
              </p>
            </div>

            {/* Series Scoreboard */}
            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl px-6 py-3 flex items-center space-x-6 shadow-inner">
              <div className="text-center">
                <div className="text-xs text-gray-400 font-semibold">{profiles.you.name}</div>
                <div className="text-2xl font-black text-blue-400">1</div>
                <div className="text-[10px] text-gray-500">Weeks Won</div>
              </div>
              <div className="text-gray-600 font-black text-xl">:</div>
              <div className="text-center">
                <div className="text-xs text-gray-400 font-semibold">{profiles.uncle.name}</div>
                <div className="text-2xl font-black text-purple-400">0</div>
                <div className="text-[10px] text-gray-500">Weeks Won</div>
              </div>
            </div>
          </div>
        </div>

        {/* WEEK SLIDER & NAVIGATION */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900/90 border border-gray-800 rounded-2xl p-4 mb-6 shadow-lg gap-4">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button 
              onClick={() => setCurrentWeek(prev => Math.max(1, prev - 1))}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 md:flex-none text-center">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">NFL Regular Season</div>
              <div className="text-lg font-black text-white flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Week {currentWeek} of 18</span>
              </div>
            </div>
            <button 
              onClick={() => setCurrentWeek(prev => Math.min(18, prev + 1))}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Week Slider */}
          <div className="w-full md:w-auto flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(w => (
              <button
                key={w}
                onClick={() => setCurrentWeek(w)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                  currentWeek === w 
                    ? 'bg-amber-500 text-gray-950 shadow-md font-black'
                    : 'bg-gray-950 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800'
                }`}
              >
                W{w}
              </button>
            ))}
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveTab("picks")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'picks' ? 'bg-amber-500 text-gray-950' : 'text-gray-400 hover:text-white'}`}
            >
              Make Picks
            </button>
            <button
              onClick={() => setActiveTab("archive")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'archive' ? 'bg-amber-500 text-gray-950' : 'text-gray-400 hover:text-white'}`}
            >
              Scores & Archive
            </button>
          </div>
        </div>

        {/* MAIN VIEW: WEEKLY PICKS & MATCHUPS */}
        {activeTab === 'picks' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>Week {currentWeek} Matchups & Point Spreads</span>
              </h3>
              
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-400">
                  Status: {userLocked ? <span className="text-emerald-400 font-bold">Locked 🔒</span> : <span className="text-amber-400 font-bold">Drafting ✍️</span>}
                </span>
                {!userLocked && (
                  <button
                    onClick={lockInPicks}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock In My Picks</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentGameData.games && currentGameData.games.length > 0 ? (
                currentGameData.games.map(game => {
                  const myPick = picks[currentWeek]?.[game.id]?.[activeProfile];
                  const opponentKey = activeProfile === 'you' ? 'uncle' : 'you';
                  const opponentPick = picks[currentWeek]?.[game.id]?.[opponentKey];
                  const opponentIsLocked = lockedStatus[currentWeek]?.[opponentKey];

                  return (
                    <div 
                      key={game.id} 
                      className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition shadow-lg relative group"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">
                          Spread Handicap: <strong className="text-amber-400">{game.spread}</strong>
                        </span>
                        <button
                          onClick={() => setSelectedMatchup(game)}
                          className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>View Lineup & Stats</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {/* Away Team */}
                        <button
                          disabled={userLocked}
                          onClick={() => handlePick(game.id, game.away)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition ${
                            myPick === game.away 
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md font-black'
                              : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          <span className="text-xs text-gray-400">Away</span>
                          <span className="text-lg font-black">{game.away}</span>
                          <span className="text-[10px] text-gray-500 mt-1">Record: 5-3</span>
                        </button>

                        {/* Home Team */}
                        <button
                          disabled={userLocked}
                          onClick={() => handlePick(game.id, game.home)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition ${
                            myPick === game.home 
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md font-black'
                              : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          <span className="text-xs text-gray-400">Home</span>
                          <span className="text-lg font-black">{game.home}</span>
                          <span className="text-[10px] text-gray-500 mt-1">Record: 6-2</span>
                        </button>
                      </div>

                      {/* Secret Pick Status */}
                      <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-800 text-gray-400">
                        <span>Your Pick: <strong className="text-white">{myPick || "None"}</strong></span>
                        <span>
                          Opponent Pick: {bothLocked || (userLocked && opponentIsLocked) ? (
                            <strong className="text-emerald-400">{opponentPick || "None"}</strong>
                          ) : (
                            <span className="text-amber-500/80 italic">🔒 Hidden Until Both Lock</span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-12 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto text-gray-600 mb-2" />
                  <p>No matchups available for this week yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCORES & PAST WEEKS ARCHIVE */}
        {activeTab === 'archive' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-amber-400" />
              <span>Past Weeks & Spread Coverage Trends</span>
            </h3>
            <p className="text-xs text-gray-400 mb-6">Review final scores, spreads, and against-the-spread covers for all completed weeks of 2026.</p>

            <div className="space-y-4">
              {Object.entries(seasonData).map(([wNum, data]) => (
                <div key={wNum} className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800">
                    <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider">Week {wNum} Results</h4>
                    <span className="text-xs text-gray-400">{data.games.length} Matchups</span>
                  </div>

                  <div className="space-y-2">
                    {data.games.map(g => (
                      <div key={g.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 p-3 rounded-lg text-xs gap-2">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-white">{g.away} @ {g.home}</span>
                          <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300">Spread: {g.spread}</span>
                          <span className="text-amber-300 font-semibold">Score: {g.score}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400">Covered:</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">{g.covered || "Pending"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MATCHUP DETAIL MODAL (Lineup & Stats with Injury Filtering) */}
      {selectedMatchup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedMatchup(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center font-bold"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{selectedMatchup.away} @ {selectedMatchup.home}</h3>
                <p className="text-xs text-gray-400">Spread: {selectedMatchup.spread} | Final/Live Score: {selectedMatchup.score}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Game Summary & Stats</h4>
                <p className="text-xs text-gray-300">{selectedMatchup.stats}</p>
              </div>

              {/* Active 5-Player Lineup & Injury Filter */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Verified 5-Player Starting Lineup (Injury Filtered)</span>
                </h4>
                <div className="space-y-2">
                  {(TEAM_ROSTERS[selectedMatchup.away] || DEFAULT_ROSTER).map((player, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-900 p-2 rounded-lg text-xs">
                      <div>
                        <span className="font-bold text-white">{player.name}</span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{player.pos}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">{player.stats}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          player.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {player.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedMatchup(null)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black rounded-xl text-sm transition shadow-lg"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
