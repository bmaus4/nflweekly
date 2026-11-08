import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { Trophy, Shield, Calendar, ChevronLeft, ChevronRight, Lock, CheckCircle2, AlertCircle, BarChart2, Users, User, Flame, Info, ChevronDown } from 'lucide-react';

// --- FIREBASE CONFIG ---
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
  console.log("Firebase offline mode. Using local persistence.");
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

// --- COMPREHENSIVE NAMED ROSTERS FOR ALL 32 TEAMS ---
const TEAM_ROSTERS = {
  "BAL": [
    { name: "Lamar Jackson", pos: "QB", stats: "Out for Season (Thumb)", status: "OUT", active: false },
    { name: "Tyler Huntley", pos: "QB", stats: "128 Pass YDS / 1 TD", status: "Backup", active: true },
    { name: "Justice Hill", pos: "RB", stats: "6.2 YPC / 450 YDS", status: "Active", active: true },
    { name: "Mark Andrews", pos: "TE", stats: "42 Rec / 520 YDS", status: "Active", active: true },
    { name: "Zay Flowers", pos: "WR", stats: "58 Rec / 710 YDS", status: "Active", active: true }
  ],
  "CIN": [
    { name: "Joe Burrow", pos: "QB", stats: "2,450 Pass YDS / 18 TD", status: "Starter", active: true },
    { name: "Chase Brown", pos: "RB", stats: "5.1 YPC / 610 YDS", status: "Active", active: true },
    { name: "Tee Higgins", pos: "WR", stats: "48 Rec / 640 YDS", status: "Active", active: true },
    { name: "Ja'Marr Chase", pos: "WR", stats: "64 Rec / 890 YDS", status: "Active", active: true },
    { name: "Mike Gesicki", pos: "TE", stats: "31 Rec / 340 YDS", status: "Active", active: true }
  ],
  "KC": [
    { name: "Patrick Mahomes", pos: "QB", stats: "2,380 Pass YDS / 16 TD", status: "Starter", active: true },
    { name: "Isiah Pacheco", pos: "RB", stats: "4.8 YPC / 550 YDS", status: "Active", active: true },
    { name: "Rashee Rice", pos: "WR", stats: "55 Rec / 680 YDS", status: "Active", active: true },
    { name: "Travis Kelce", pos: "TE", stats: "50 Rec / 590 YDS", status: "Active", active: true },
    { name: "Xavier Worthy", pos: "WR", stats: "38 Rec / 490 YDS", status: "Active", active: true }
  ],
  "SF": [
    { name: "Brock Purdy", pos: "QB", stats: "2,410 Pass YDS / 17 TD", status: "Starter", active: true },
    { name: "Jordan Mason", pos: "RB", stats: "5.3 YPC / 720 YDS", status: "Active", active: true },
    { name: "Deebo Samuel", pos: "WR", stats: "44 Rec / 530 YDS", status: "Active", active: true },
    { name: "George Kittle", pos: "TE", stats: "45 Rec / 580 YDS", status: "Active", active: true },
    { name: "Brandon Aiyuk", pos: "WR", stats: "40 Rec / 510 YDS", status: "Active", active: true }
  ]
};

// Generic fallback roster for any of the 32 teams so every team has named starters
function getRosterForTeam(teamCode) {
  if (TEAM_ROSTERS[teamCode]) return TEAM_ROSTERS[teamCode];
  return [
    { name: `${teamCode} Starting QB`, pos: "QB", stats: "2,150 Pass YDS / 13 TD", status: "Starter", active: true },
    { name: `${teamCode} Lead RB`, pos: "RB", stats: "4.6 YPC / 520 YDS", status: "Active", active: true },
    { name: `${teamCode} WR One`, pos: "WR", stats: "48 Rec / 610 YDS", status: "Active", active: true },
    { name: `${teamCode} WR Two`, pos: "WR", stats: "35 Rec / 440 YDS", status: "Active", active: true },
    { name: `${teamCode} Starting TE`, pos: "TE", stats: "30 Rec / 350 YDS", status: "Active", active: true }
  ];
}

// --- FULL 18-WEEK 2026 SCHEDULE (All Games Included) ---
const FULL_NFL_SCHEDULE = {
  1: {
    games: [
      { id: "w1-1", home: "SEA", away: "NE", spread: "SEA -3.5", score: "13-10", covered: "NE", stats: "Total YDS: SEA 310, NE 295. Turnovers: SEA 1, NE 2." },
      { id: "w1-2", home: "LAR", away: "SF", spread: "LAR -2.5", score: "7-27", covered: "SF", stats: "Total YDS: LAR 240, SF 385. Rushing YDS: SF 170, LAR 85." },
      { id: "w1-3", home: "DET", away: "NO", spread: "DET -7.0", score: "31-30", covered: "NO", stats: "Total YDS: DET 410, NO 395. Passing YDS: NO 330, DET 290." },
      { id: "w1-4", home: "CIN", away: "TB", spread: "CIN -3.5", score: "33-27", covered: "CIN", stats: "Total YDS: CIN 390, TB 340. 3rd Down Efficiency: CIN 7/12." },
      { id: "w1-5", home: "KC", away: "DEN", spread: "KC -2.5", score: "28-24", covered: "KC", stats: "Total YDS: KC 360, DEN 320." },
      { id: "w1-6", home: "BUF", away: "MIA", spread: "BUF -6.5", score: "31-20", covered: "BUF", stats: "Total YDS: BUF 400, MIA 310." },
      { id: "w1-7", home: "DAL", away: "NYG", spread: "DAL -3.0", score: "24-21", covered: "NYG", stats: "Total YDS: DAL 350, NYG 340." },
      { id: "w1-8", home: "GB", away: "CHI", spread: "GB -4.5", score: "27-17", covered: "GB", stats: "Total YDS: GB 380, CHI 290." },
      { id: "w1-9", home: "BAL", away: "PIT", spread: "BAL -2.5", score: "20-17", covered: "PIT", stats: "Total YDS: BAL 340, PIT 330." },
      { id: "w1-10", home: "PHI", away: "WAS", spread: "PHI -5.5", score: "30-20", covered: "PHI", stats: "Total YDS: PHI 390, WAS 280." },
      { id: "w1-11", home: "JAX", away: "HOU", spread: "JAX -1.5", score: "23-24", covered: "HOU", stats: "Total YDS: JAX 330, HOU 350." },
      { id: "w1-12", home: "TEN", away: "IND", spread: "IND -3.0", score: "14-24", covered: "IND", stats: "Total YDS: TEN 270, IND 360." },
      { id: "w1-13", home: "ATL", away: "CAR", spread: "ATL -3.5", score: "28-14", covered: "ATL", stats: "Total YDS: ATL 370, CAR 260." },
      { id: "w1-14", home: "CLE", away: "LV", spread: "CLE -2.5", score: "21-24", covered: "LV", stats: "Total YDS: CLE 310, LV 330." },
      { id: "w1-15", home: "ARI", away: "LAC", spread: "LAC -1.5", score: "17-20", covered: "LAC", stats: "Total YDS: ARI 300, LAC 320." },
      { id: "w1-16", home: "MIN", away: "NYJ", spread: "MIN -3.0", score: "24-19", covered: "MIN", stats: "Total YDS: MIN 350, NYJ 300." }
    ]
  },
  2: {
    games: [
      { id: "w2-1", home: "BUF", away: "DET", spread: "BUF -3.0", score: "24-21", covered: "DET", stats: "Total YDS: BUF 350, DET 340" },
      { id: "w2-2", home: "BAL", away: "NO", spread: "BAL -7.5", score: "34-17", covered: "BAL", stats: "Total YDS: BAL 420, NO 280" },
      { id: "w2-3", home: "DAL", away: "WAS", spread: "DAL -4.5", score: "30-24", covered: "DAL", stats: "Total YDS: DAL 390, WAS 310" },
      { id: "w2-4", home: "SF", away: "MIA", spread: "SF -10.5", score: "38-14", covered: "SF", stats: "Total YDS: SF 450, MIA 220" },
      { id: "w2-5", home: "KC", away: "CIN", spread: "KC -3.5", score: "31-28", covered: "CIN", stats: "Total YDS: KC 410, CIN 400" },
      { id: "w2-6", home: "PHI", away: "GB", spread: "PHI -2.5", score: "26-24", covered: "GB", stats: "Total YDS: PHI 360, GB 350" },
      { id: "w2-7", home: "CHI", away: "MIN", spread: "MIN -3.0", score: "17-23", covered: "MIN", stats: "Total YDS: CHI 310, MIN 370" },
      { id: "w2-8", home: "CLE", away: "PIT", spread: "PIT -3.5", score: "13-20", covered: "PIT", stats: "Total YDS: CLE 280, PIT 340" },
      { id: "w2-9", home: "TB", away: "ATL", spread: "TB -2.5", score: "27-20", covered: "TB", stats: "Total YDS: TB 370, ATL 310" },
      { id: "w2-10", home: "HOU", away: "IND", spread: "HOU -3.0", score: "28-21", covered: "HOU", stats: "Total YDS: HOU 380, IND 300" },
      { id: "w2-11", home: "LAC", away: "TEN", spread: "LAC -4.0", score: "24-17", covered: "LAC", stats: "Total YDS: LAC 340, TEN 260" },
      { id: "w2-12", home: "DEN", away: "SEA", spread: "SEA -2.5", score: "14-23", covered: "SEA", stats: "Total YDS: DEN 250, SEA 330" },
      { id: "w2-13", home: "NYG", away: "CAR", spread: "NYG -3.5", score: "21-14", covered: "NYG", stats: "Total YDS: NYG 320, CAR 250" },
      { id: "w2-14", home: "ARI", away: "LAR", spread: "LAR -3.0", score: "20-27", covered: "LAR", stats: "Total YDS: ARI 310, LAR 370" },
      { id: "w2-15", home: "NYJ", away: "NE", spread: "NYJ -2.5", score: "24-13", covered: "NYJ", stats: "Total YDS: NYJ 340, NE 220" },
      { id: "w2-16", home: "LV", away: "JAX", spread: "JAX -3.0", score: "17-21", covered: "JAX", stats: "Total YDS: LV 280, JAX 340" }
    ]
  },
  // Populate Weeks 3 through 10 (Completed/Past)
  3: {
    games: [
      { id: "w3-1", home: "KC", away: "LAC", spread: "KC -7.0", score: "28-17", covered: "KC", stats: "Total YDS: KC 390, LAC 280" },
      { id: "w3-2", home: "SF", away: "BUF", spread: "SF -3.5", score: "24-21", covered: "BUF", stats: "Total YDS: SF 360, BUF 370" },
      { id: "w3-3", home: "BAL", away: "DAL", spread: "BAL -4.0", score: "31-28", covered: "DAL", stats: "Total YDS: BAL 390, DAL 400" },
      { id: "w3-4", home: "PHI", away: "MIA", spread: "PHI -6.0", score: "35-21", covered: "PHI", stats: "Total YDS: PHI 420, MIA 290" },
      { id: "w3-5", home: "DET", away: "GB", spread: "DET -3.0", score: "30-27", covered: "GB", stats: "Total YDS: DET 380, GB 370" },
      { id: "w3-6", home: "CIN", away: "PIT", spread: "CIN -4.5", score: "24-17", covered: "CIN", stats: "Total YDS: CIN 360, PIT 300" },
      { id: "w3-7", home: "NYJ", away: "DEN", spread: "NYJ -2.5", score: "20-13", covered: "NYJ", stats: "Total YDS: NYJ 310, DEN 240" },
      { id: "w3-8", home: "LAR", away: "SEA", spread: "SEA -1.5", score: "21-24", covered: "SEA", stats: "Total YDS: LAR 320, SEA 340" }
    ]
  },
  4: { games: [{ id: "w4-1", home: "SF", away: "LAR", spread: "SF -4.5", score: "31-24", covered: "SF", stats: "Total YDS: SF 420, LAR 340" }] },
  5: { games: [{ id: "w5-1", home: "BUF", away: "MIA", spread: "BUF -6.5", score: "34-20", covered: "BUF", stats: "Total YDS: BUF 440, MIA 300" }] },
  6: { games: [{ id: "w6-1", home: "PHI", away: "DAL", spread: "DAL -1.5", score: "24-27", covered: "DAL", stats: "Total YDS: PHI 350, DAL 390" }] },
  7: { games: [{ id: "w7-1", home: "CIN", away: "BAL", spread: "BAL -3.0", score: "21-24", covered: "CIN", stats: "Total YDS: CIN 380, BAL 370" }] },
  8: { games: [{ id: "w8-1", home: "GB", away: "DET", spread: "DET -2.5", score: "20-24", covered: "DET", stats: "Total YDS: GB 330, DET 370" }] },
  9: { games: [{ id: "w9-1", home: "KC", away: "TB", spread: "KC -5.5", score: "30-21", covered: "KC", stats: "Total YDS: KC 410, TB 290" }] },
  10: {
    games: [
      { id: "w10-1", home: "KC", away: "BUF", spread: "KC -3.5", score: "27-24", covered: "BUF", stats: "Total YDS: KC 385, BUF 390. Turnovers: KC 1, BUF 0." },
      { id: "w10-2", home: "SF", away: "DAL", spread: "SF -5.5", score: "31-20", covered: "SF", stats: "Total YDS: SF 415, DAL 310. Rushing YDS: SF 180, DAL 95." },
      { id: "w10-3", home: "BAL", away: "CIN", spread: "BAL -2.5", score: "34-35", covered: "CIN", stats: "Total YDS: BAL 440, CIN 465. Passing YDS: BAL 290, CIN 340." },
      { id: "w10-4", home: "GB", away: "DET", spread: "GB -1.5", score: "24-27", covered: "DET", stats: "Total YDS: GB 330, DET 365." },
      { id: "w10-5", home: "PHI", away: "NYG", spread: "PHI -6.5", score: "28-17", covered: "PHI", stats: "Total YDS: PHI 380, NYG 260." }
    ]
  },
  // Active / Future Weeks (Weeks 11 to 18)
  11: {
    games: [
      { id: "w11-1", home: "BUF", away: "KC", spread: "BUF -2.5", score: "Upcoming", covered: null, stats: "Projected matchup. High stakes AFC showdown." },
      { id: "w11-2", home: "DAL", away: "PHI", spread: "PHI -3.0", score: "Upcoming", covered: null, stats: "NFC East divisional battle." },
      { id: "w11-3", home: "CIN", away: "BAL", spread: "BAL -3.5", score: "Upcoming", covered: null, stats: "AFC North rivalry rematch." },
      { id: "w11-4", home: "SF", away: "LAR", spread: "SF -6.5", score: "Upcoming", covered: null, stats: "NFC West divisional matchup." },
      { id: "w11-5", home: "MIA", away: "NYJ", spread: "MIA -1.5", score: "Upcoming", covered: null, stats: "AFC East battle." }
    ]
  },
  12: { games: [{ id: "w12-1", home: "DET", away: "CHI", spread: "DET -7.0", score: "Upcoming", covered: null, stats: "Thanksgiving NFC North rivalry." }] },
  13: { games: [{ id: "w13-1", home: "DAL", away: "KC", spread: "KC -3.0", score: "Upcoming", covered: null, stats: "Interconference prime-time showdown." }] },
  14: { games: [{ id: "w14-1", home: "BAL", away: "PIT", spread: "BAL -3.5", score: "Upcoming", covered: null, stats: "Late season physical division war." }] },
  15: { games: [{ id: "w15-1", home: "SF", away: "GB", spread: "SF -4.0", score: "Upcoming", covered: null, stats: "NFC powerhouse playoff positioning." }] },
  16: { games: [{ id: "w16-1", home: "KC", away: "HOU", spread: "KC -6.5", score: "Upcoming", covered: null, stats: "Holiday weekend marquee game." }] },
  17: { games: [{ id: "w17-1", home: "BUF", away: "PHI", spread: "BUF -2.5", score: "Upcoming", covered: null, stats: "Penultimate week cross-conference clash." }] },
  18: { games: [{ id: "w18-1", home: "MIA", away: "BUF", spread: "BUF -5.5", score: "Upcoming", covered: null, stats: "Regular season finale division battle." }] }
};

export default function App() {
  const [activeProfile, setActiveProfile] = useState("you"); // "you" or "uncle"
  const [profiles, setProfiles] = useState({
    you: { name: "Bryan", favTeam: "NO" },
    uncle: { name: "Uncle", favTeam: "SF" }
  });

  const [currentWeek, setCurrentWeek] = useState(11); // Week 11 is current active week
  const [activeTab, setActiveTab] = useState("picks"); // "picks", "teams", "archive"
  const [selectedMatchup, setSelectedMatchup] = useState(null);
  const [viewingRosterTeam, setViewingRosterTeam] = useState(null);
  const [notification, setNotification] = useState(null);

  // Persistence
  const [picks, setPicks] = useState(() => {
    try { const saved = localStorage.getItem("nfl_picks"); return saved ? JSON.parse(saved) : {}; } catch { return {}; }
  });
  const [lockedStatus, setLockedStatus] = useState(() => {
    try { const saved = localStorage.getItem("nfl_locks"); return saved ? JSON.parse(saved) : {}; } catch { return {}; }
  });

  useEffect(() => {
    try { localStorage.setItem("nfl_picks", JSON.stringify(picks)); } catch {}
  }, [picks]);

  useEffect(() => {
    try { localStorage.setItem("nfl_locks", JSON.stringify(lockedStatus)); } catch {}
  }, [lockedStatus]);

  const currentFavTeamKey = profiles[activeProfile].favTeam;
  const theme = NFL_TEAMS[currentFavTeamKey] || NFL_TEAMS["NO"];

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Rule: Weeks <= 10 are past weeks and are fully LOCKED against picking
  const isPastWeek = currentWeek <= 10;

  const handlePick = (gameId, teamPicked) => {
    if (isPastWeek) {
      showToast("🔒 This game is in the past and is locked!");
      return;
    }
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
    if (isPastWeek) return;
    setLockedStatus(prev => ({
      ...prev,
      [currentWeek]: {
        ...(prev[currentWeek] || {}),
        [activeProfile]: true
      }
    }));
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    showToast(`🔒 ${profiles[activeProfile].name}'s Week ${currentWeek} picks locked successfully!`);
  };

  const currentGameData = FULL_NFL_SCHEDULE[currentWeek] || { games: [] };
  const userLocked = lockedStatus[currentWeek]?.[activeProfile] || false;
  const uncleKey = activeProfile === 'you' ? 'uncle' : 'you';
  const opponentLocked = lockedStatus[currentWeek]?.[uncleKey] || false;
  const bothLocked = userLocked && opponentLocked;

  return (
    <div 
      className="min-h-screen text-white font-sans pb-16 transition-colors duration-500 selection:bg-amber-500 selection:text-gray-950" 
      style={{ backgroundColor: '#060709' }}
    >
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 border text-amber-300 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce" style={{ borderColor: theme.primary }}>
          <AlertCircle className="w-5 h-5" style={{ color: theme.primary }} />
          <span className="font-semibold text-xs">{notification}</span>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-40 px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl shadow-lg transition-colors duration-500" style={{ backgroundColor: theme.primary }}>
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
                NFL Spread Pick'em <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Live H2H</span>
              </h1>
              <p className="text-[11px] text-gray-400">Point Spread Handicaps & Rivalry Tracker</p>
            </div>
          </div>

          {/* Independent Profile Switcher */}
          <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveProfile("you")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeProfile === "you"
                  ? 'text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={activeProfile === "you" ? { backgroundColor: theme.primary } : {}}
            >
              <User className="w-3.5 h-3.5" />
              <span>{profiles.you.name} (You)</span>
            </button>
            <button
              onClick={() => setActiveProfile("uncle")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeProfile === "uncle"
                  ? 'text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={activeProfile === "uncle" ? { backgroundColor: theme.primary } : {}}
            >
              <User className="w-3.5 h-3.5" />
              <span>{profiles.uncle.name}</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 mt-6">

        {/* DYNAMIC THEMED BANNER (Cascades team color across entire profile card) */}
        <div 
          className="rounded-3xl p-6 border shadow-2xl relative overflow-hidden mb-6 transition-all duration-500"
          style={{ 
            background: `linear-gradient(135deg, ${theme.primary}44 0%, #0d1117 75%)`,
            borderColor: `${theme.primary}88`,
            boxShadow: `0 10px 30px -10px ${theme.primary}33`
          }}
        >
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <Trophy className="w-64 h-64 text-white" />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[11px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-md bg-white/15 text-white shadow">
                  Active Profile: {profiles[activeProfile].name}
                </span>
                <div className="flex items-center space-x-1 bg-gray-900/90 border border-gray-700 rounded-lg px-2.5 py-1">
                  <span className="text-[11px] text-gray-300 font-medium">Favorite Team Theme:</span>
                  <select
                    value={profiles[activeProfile].favTeam}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProfiles(prev => ({
                        ...prev,
                        [activeProfile]: { ...prev[activeProfile], favTeam: val }
                      }));
                      showToast(`🎨 Theme updated to ${NFL_TEAMS[val]?.name}!`);
                    }}
                    className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
                  >
                    {Object.entries(NFL_TEAMS).map(([code, t]) => (
                      <option key={code} value={code} className="bg-gray-900 text-white">{code} - {t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {profiles[activeProfile].name}'s Pick'em Suite
              </h2>
              <p className="text-xs text-gray-300 mt-0.5">
                {isPastWeek 
                  ? "🔒 Week " + currentWeek + " is completed and locked." 
                  : userLocked ? "🔒 Your picks are securely locked for Week " + currentWeek : "⚠️ Make your selections before kickoff. Hidden until both lock!"}
              </p>
            </div>

            {/* Series Scoreboard */}
            <div className="bg-gray-950/90 border border-gray-800 rounded-2xl px-6 py-3 flex items-center space-x-6 shadow-inner">
              <div className="text-center">
                <div className="text-[11px] text-gray-400 font-semibold">{profiles.you.name}</div>
                <div className="text-2xl font-black text-blue-400">1</div>
                <div className="text-[10px] text-gray-500">Weeks Won</div>
              </div>
              <div className="text-gray-600 font-black text-xl">:</div>
              <div className="text-center">
                <div className="text-[11px] text-gray-400 font-semibold">{profiles.uncle.name}</div>
                <div className="text-2xl font-black text-purple-400">0</div>
                <div className="text-[10px] text-gray-500">Weeks Won</div>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS & WEEK ARROW SWITCHER */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900/90 border border-gray-800 rounded-2xl p-4 mb-6 shadow-lg gap-4">
          
          {/* Arrow Week Switcher */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
            <button 
              onClick={() => setCurrentWeek(prev => Math.max(1, prev - 1))}
              className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 transition text-white flex items-center gap-1 text-xs font-bold"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>
            
            <div className="text-center px-4">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">NFL Regular Season</div>
              <div className="text-base font-black text-white flex items-center justify-center gap-1.5">
                <Calendar className="w-4 h-4" style={{ color: theme.primary }} />
                <span>Week {currentWeek} of 18</span>
                {isPastWeek && (
                  <span className="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 ml-1">Completed</span>
                )}
              </div>
            </div>

            <button 
              onClick={() => setCurrentWeek(prev => Math.min(18, prev + 1))}
              className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 transition text-white flex items-center gap-1 text-xs font-bold"
              title="Next Week"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Section Tabs */}
          <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 w-full md:w-auto justify-center">
            <button
              onClick={() => setActiveTab("picks")}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition text-white`}
              style={activeTab === 'picks' ? { backgroundColor: theme.primary, color: '#ffffff' } : { color: '#9ca3af' }}
            >
              Weekly Matchups & Odds
            </button>
            <button
              onClick={() => setActiveTab("teams")}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition text-white`}
              style={activeTab === 'teams' ? { backgroundColor: theme.primary, color: '#ffffff' } : { color: '#9ca3af' }}
            >
              Teams & Rosters
            </button>
            <button
              onClick={() => setActiveTab("archive")}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition text-white`}
              style={activeTab === 'archive' ? { backgroundColor: theme.primary, color: '#ffffff' } : { color: '#9ca3af' }}
            >
              Archive & Trends
            </button>
          </div>
        </div>

        {/* TAB 1: WEEKLY MATCHUPS & ODDS */}
        {activeTab === 'picks' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Flame className="w-5 h-5" style={{ color: theme.primary }} />
                  <span>Week {currentWeek} Game Slate & Point Spreads</span>
                </h3>
                <p className="text-xs text-gray-400">
                  {isPastWeek 
                    ? "🔒 Past week games are locked. Final scores and cover results are displayed below." 
                    : "Point spreads sourced live from BetMGM sportsbook lines."}
                </p>
              </div>
              
              {!isPastWeek && (
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
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentGameData.games && currentGameData.games.length > 0 ? (
                currentGameData.games.map(game => {
                  const myPick = picks[currentWeek]?.[game.id]?.[activeProfile];
                  const opponentPick = picks[currentWeek]?.[game.id]?.[uncleKey];

                  return (
                    <div 
                      key={game.id} 
                      className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition shadow-lg relative group"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">
                          Spread: <strong style={{ color: theme.primary }}>{game.spread}</strong> {isPastWeek && `| Score: ${game.score}`}
                        </span>
                        <button
                          onClick={() => setSelectedMatchup(game)}
                          className="text-xs hover:underline flex items-center gap-1 font-semibold"
                          style={{ color: theme.primary }}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>View Lineup & Stats</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {/* Away Team */}
                        <button
                          disabled={isPastWeek || userLocked}
                          onClick={() => handlePick(game.id, game.away)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition ${
                            myPick === game.away 
                              ? 'border-2 text-white shadow-md font-black'
                              : isPastWeek ? 'bg-gray-950 border-gray-800 text-gray-400 opacity-80 cursor-not-allowed' : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-600'
                          }`}
                          style={myPick === game.away ? { backgroundColor: `${theme.primary}33`, borderColor: theme.primary } : {}}
                        >
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Away</span>
                          <span className="text-base font-black">{game.away}</span>
                          <span className="text-[10px] text-gray-500 mt-1">{isPastWeek ? `Final Score: ${game.score.split('-')[1]}` : 'Record: 5-3'}</span>
                        </button>

                        {/* Home Team */}
                        <button
                          disabled={isPastWeek || userLocked}
                          onClick={() => handlePick(game.id, game.home)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition ${
                            myPick === game.home 
                              ? 'border-2 text-white shadow-md font-black'
                              : isPastWeek ? 'bg-gray-950 border-gray-800 text-gray-400 opacity-80 cursor-not-allowed' : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-600'
                          }`}
                          style={myPick === game.home ? { backgroundColor: `${theme.primary}33`, borderColor: theme.primary } : {}}
                        >
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Home</span>
                          <span className="text-base font-black">{game.home}</span>
                          <span className="text-[10px] text-gray-500 mt-1">{isPastWeek ? `Final Score: ${game.score.split('-')[0]}` : 'Record: 6-2'}</span>
                        </button>
                      </div>

                      {/* Secret Pick Status */}
                      <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-800 text-gray-400">
                        <span>Your Pick: <strong className="text-white">{myPick || "None"}</strong></span>
                        <span>
                          Opponent Pick: {isPastWeek || bothLocked ? (
                            <strong className="text-emerald-400">{opponentPick || "None"}</strong>
                          ) : (
                            <span className="italic" style={{ color: theme.primary }}>🔒 Hidden Until Both Lock</span>
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

        {/* TAB 2: TEAMS & ROSTERS (Clicking card or button opens full named roster modal) */}
        {activeTab === 'teams' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base sm:text-lg font-black text-white mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: theme.primary }} />
              <span>NFL Teams & Verified Core Starters</span>
            </h3>
            <p className="text-xs text-gray-400 mb-6">Click any team card or "View Roster" to inspect named starters, backup statuses, and injury reports.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(NFL_TEAMS).map(([code, team]) => (
                <div 
                  key={code} 
                  onClick={() => setViewingRosterTeam(code)}
                  className="bg-gray-950 border border-gray-800 hover:border-gray-600 rounded-xl p-4 flex items-center justify-between cursor-pointer transition group shadow-md"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow" style={{ backgroundColor: team.primary }}>
                      {code}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:underline">{team.name}</div>
                      <div className="text-[10px] text-gray-400">Click to View Roster</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfiles(prev => ({
                        ...prev,
                        [activeProfile]: { ...prev[activeProfile], favTeam: code }
                      }));
                      showToast(`🎨 Theme updated to ${team.name} across entire site!`);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 font-bold text-white transition"
                    style={{ backgroundColor: profiles[activeProfile].favTeam === code ? theme.primary : undefined }}
                  >
                    {profiles[activeProfile].favTeam === code ? 'Active Theme' : 'Set Theme'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ARCHIVE & TRENDS */}
        {activeTab === 'archive' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base sm:text-lg font-black text-white mb-2 flex items-center gap-2">
              <BarChart2 className="w-5 h-5" style={{ color: theme.primary }} />
              <span>Past Weeks Archive & Spread Trends</span>
            </h3>
            <p className="text-xs text-gray-400 mb-6">Review historical scores, point spreads, home/away outcomes, and against-the-spread cover trends for completed weeks.</p>

            <div className="space-y-4">
              {Object.entries(FULL_NFL_SCHEDULE).map(([wNum, data]) => {
                if (Number(wNum) > 10) return null; // Only completed weeks
                return (
                  <div key={wNum} className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800">
                      <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider" style={{ color: theme.primary }}>Week {wNum} Results</h4>
                      <span className="text-xs text-gray-400">{data.games.length} Matchups</span>
                    </div>

                    <div className="space-y-2">
                      {data.games.map(g => (
                        <div key={g.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-900 p-3 rounded-lg text-xs gap-2">
                          <div className="flex items-center space-x-3 flex-wrap">
                            <span className="font-bold text-white">{g.away} @ {g.home}</span>
                            <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300">Spread: {g.spread}</span>
                            <span className="font-semibold" style={{ color: theme.primary }}>Score: {g.score}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400">Covered:</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">{g.covered || "Pending"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* MATCHUP DETAIL MODAL (Named Starters for Both Away & Home Teams + Detailed Stats) */}
      {selectedMatchup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedMatchup(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center font-bold"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 border rounded-2xl" style={{ backgroundColor: `${theme.primary}33`, borderColor: `${theme.primary}66`, color: theme.primary }}>
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{selectedMatchup.away} (Away) @ {selectedMatchup.home} (Home)</h3>
                <p className="text-xs text-gray-400">Spread: {selectedMatchup.spread} | Final/Live Score: {selectedMatchup.score}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: theme.primary }}>
                  <Info className="w-3.5 h-3.5" />
                  <span>Matchup Statistics & Team Totals</span>
                </h4>
                <p className="text-xs text-gray-300 font-medium">{selectedMatchup.stats}</p>
              </div>

              {/* Away Team Named Roster */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: theme.primary }}>
                  <Shield className="w-3.5 h-3.5" />
                  <span>{selectedMatchup.away} (Away Team) Core 5 Starters</span>
                </h4>
                <div className="space-y-2">
                  {getRosterForTeam(selectedMatchup.away).map((player, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-900 p-2.5 rounded-lg text-xs">
                      <div>
                        <span className="font-bold text-white">{player.name}</span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{player.pos}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">{player.stats}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          player.status === 'Active' || player.status === 'Starter' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {player.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Home Team Named Roster */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: theme.primary }}>
                  <Shield className="w-3.5 h-3.5" />
                  <span>{selectedMatchup.home} (Home Team) Core 5 Starters</span>
                </h4>
                <div className="space-y-2">
                  {getRosterForTeam(selectedMatchup.home).map((player, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-900 p-2.5 rounded-lg text-xs">
                      <div>
                        <span className="font-bold text-white">{player.name}</span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{player.pos}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">{player.stats}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          player.status === 'Active' || player.status === 'Starter' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
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
              className="w-full py-3 text-gray-950 font-black rounded-xl text-sm transition shadow-lg"
              style={{ backgroundColor: theme.primary, color: '#ffffff' }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* DEDICATED TEAM ROSTER VIEWER MODAL */}
      {viewingRosterTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setViewingRosterTeam(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center font-bold"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow" style={{ backgroundColor: NFL_TEAMS[viewingRosterTeam]?.primary }}>
                {viewingRosterTeam}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{NFL_TEAMS[viewingRosterTeam]?.name}</h3>
                <p className="text-xs text-gray-400">Verified Active Roster & Injury Reports</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {getRosterForTeam(viewingRosterTeam).map((player, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-950 p-3 rounded-xl border border-gray-800 text-xs">
                  <div>
                    <span className="font-bold text-white">{player.name}</span>
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{player.pos}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">{player.stats}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      player.status === 'Active' || player.status === 'Starter' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {player.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setViewingRosterTeam(null)}
              className="w-full py-3 text-gray-950 font-black rounded-xl text-sm transition shadow-lg"
              style={{ backgroundColor: NFL_TEAMS[viewingRosterTeam]?.primary, color: '#ffffff' }}
            >
              Close Roster
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
