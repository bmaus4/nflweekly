import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { Trophy, Shield, Calendar, ChevronLeft, ChevronRight, Lock, AlertCircle, BarChart2, Users, User, Flame, Info } from 'lucide-react';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyD-MockKeyForDemo12345",
  authDomain: "nfl-pickem-demo.firebaseapp.com",
  projectId: "nfl-pickem-demo",
  storageBucket: "nfl-pickem-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456:web:abcdef"
};

try {
  initializeApp(firebaseConfig);
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
  "WAS": { name: "Washington Commanders", primary: "#5A1414", secondary: "#FFB612" },
  "WSH": { name: "Washington Commanders", primary: "#5A1414", secondary: "#FFB612" },
  "LV":  { name: "Las Vegas Raiders", primary: "#000000", secondary: "#A5ACAF" }
};

export default function App() {
  const [activeProfile, setActiveProfile] = useState("you"); // "you" or "uncle"
  const [profiles, setProfiles] = useState({
    you: { name: "Bryan", favTeam: "NO" },
    uncle: { name: "Uncle", favTeam: "SF" }
  });

  const [currentWeek, setCurrentWeek] = useState(11);
  const [activeTab, setActiveTab] = useState("picks"); // "picks", "teams", "archive"
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatchup, setSelectedMatchup] = useState(null);
  const [viewingRosterTeam, setViewingRosterTeam] = useState(null);
  const [teamRosterData, setTeamRosterData] = useState([]);
  const [notification, setNotification] = useState(null);

  // Persistence for user picks and locks
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

  // Dynamically fetch live weekly schedule, odds, scores, and start times from ESPN API
  useEffect(() => {
    async function fetchSchedule() {
      setLoading(true);
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${currentWeek}`);
        const data = await res.json();
        
        const parsedGames = (data.events || []).map(event => {
          const competition = event.competitions[0];
          const homeComp = competition.competitors.find(c => c.homeAway === 'home');
          const awayComp = competition.competitors.find(c => c.homeAway === 'away');
          const odds = competition.odds?.[0]?.details || "Spread N/A";
          const statusType = event.status?.type?.name;
          const isCompleted = statusType === 'STATUS_FINAL';
          const startTime = new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', weekday: 'short' });

          return {
            id: event.id,
            home: homeComp?.team?.abbreviation || "HOME",
            homeName: homeComp?.team?.displayName || "Home Team",
            homeScore: homeComp?.score || "0",
            homeRecord: homeComp?.records?.[0]?.summary || "0-0",
            away: awayComp?.team?.abbreviation || "AWAY",
            awayName: awayComp?.team?.displayName || "Away Team",
            awayScore: awayComp?.score || "0",
            awayRecord: awayComp?.records?.[0]?.summary || "0-0",
            spread: odds,
            startTime,
            completed: isCompleted,
            score: isCompleted ? `${awayComp?.score}-${homeComp?.score}` : (statusType === 'STATUS_IN_PROGRESS' ? `${awayComp?.score}-${homeComp?.score} (Live)` : startTime),
            stats: competition.notes?.[0]?.headline || `${awayComp?.team?.displayName} at ${homeComp?.team?.displayName}`
          };
        });

        setGames(parsedGames);
      } catch (err) {
        console.error("Error fetching live ESPN data:", err);
        setGames([]);
      }
      setLoading(false);
    }
    fetchSchedule();
  }, [currentWeek]);

  // Fetch dynamic player rosters & stats from ESPN API when inspecting a team
  useEffect(() => {
    async function fetchRoster() {
      if (!viewingRosterTeam) return;
      try {
        const teamRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`);
        const teamData = await teamRes.json();
        const foundTeam = teamData.sports?.[0]?.leagues?.[0]?.teams?.find(t => t.team.abbreviation === viewingRosterTeam || t.team.slug === viewingRosterTeam.toLowerCase());
        
        if (foundTeam) {
          const teamId = foundTeam.team.id;
          const rosterRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}?enable=roster`);
          const rosterData = await rosterRes.json();
          const athletes = rosterData.team?.athletes || [];
          
          const formatted = athletes.slice(0, 10).map(athl => ({
            name: athl.fullName || athl.displayName,
            pos: athl.position?.abbreviation || "ATH",
            stats: athl.injuries?.length > 0 ? athl.injuries[0].status : "Active Roster",
            status: athl.injuries?.length > 0 ? "Injured" : "Active"
          }));
          setTeamRosterData(formatted.length > 0 ? formatted : getDefaultRoster(viewingRosterTeam));
        } else {
          setTeamRosterData(getDefaultRoster(viewingRosterTeam));
        }
      } catch {
        setTeamRosterData(getDefaultRoster(viewingRosterTeam));
      }
    }
    fetchRoster();
  }, [viewingRosterTeam]);

  function getDefaultRoster(code) {
    return [
      { name: `${code} Starting QB`, pos: "QB", stats: "Active Starter", status: "Active" },
      { name: `${code} Lead RB`, pos: "RB", stats: "Active Starter", status: "Active" },
      { name: `${code} Top WR`, pos: "WR", stats: "Active Starter", status: "Active" },
      { name: `${code} Tight End`, pos: "TE", stats: "Active Starter", status: "Active" },
      { name: `${code} Star Defender`, pos: "DL", stats: "Active Starter", status: "Active" }
    ];
  }

  // Weeks 1 to 10 considered past/completed games
  const isPastWeek = currentWeek <= 10;

  const handlePick = (gameId, teamPicked) => {
    if (isPastWeek) {
      showToast("🔒 Past week games are locked.");
      return;
    }
    if (lockedStatus[currentWeek]?.[activeProfile]) {
      showToast("🔒 Your picks for this week are locked!");
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

  const userLocked = lockedStatus[currentWeek]?.[activeProfile] || false;
  const uncleKey = activeProfile === 'you' ? 'uncle' : 'you';
  const opponentLocked = lockedStatus[currentWeek]?.[uncleKey] || false;
  const bothLocked = userLocked && opponentLocked;

  return (
    <div className="min-h-screen text-white font-sans pb-16 transition-colors duration-500 selection:bg-amber-500 selection:text-gray-950" style={{ backgroundColor: '#060709' }}>
      
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
                NFL Spread Pick'em <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Live API Sync</span>
              </h1>
              <p className="text-[11px] text-gray-400">Point Spread Handicaps & Rivalry Tracker</p>
            </div>
          </div>

          {/* Profile Switcher */}
          <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveProfile("you")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeProfile === "you" ? 'text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
              style={activeProfile === "you" ? { backgroundColor: theme.primary } : {}}
            >
              <User className="w-3.5 h-3.5" />
              <span>{profiles.you.name} (You)</span>
            </button>
            <button
              onClick={() => setActiveProfile("uncle")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeProfile === "uncle" ? 'text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
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

        {/* DYNAMIC THEMED BANNER */}
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
            </div>

            {/* Scoreboard */}
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

        {/* NAVIGATION & WEEK ARROW SWITCHER */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900/90 border border-gray-800 rounded-2xl p-4 mb-6 shadow-lg gap-4">
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
            <button 
              onClick={() => setCurrentWeek(prev => Math.max(1, prev - 1))}
              className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 transition text-white flex items-center gap-1 text-xs font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>
            
            <div className="text-center px-4">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">NFL Regular Season</div>
              <div className="text-base font-black text-white flex items-center justify-center gap-1.5">
                <Calendar className="w-4 h-4" style={{ color: theme.primary }} />
                <span>Week {currentWeek} of 18</span>
              </div>
            </div>

            <button 
              onClick={() => setCurrentWeek(prev => Math.min(18, prev + 1))}
              className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 transition text-white flex items-center gap-1 text-xs font-bold"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 w-full md:w-auto justify-center">
            <button
              onClick={() => setActiveTab("picks")}
              className="flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition text-white"
              style={activeTab === 'picks' ? { backgroundColor: theme.primary, color: '#ffffff' } : { color: '#9ca3af' }}
            >
              Weekly Matchups & Odds
            </button>
            <button
              onClick={() => setActiveTab("teams")}
              className="flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition text-white"
              style={activeTab === 'teams' ? { backgroundColor: theme.primary, color: '#ffffff' } : { color: '#9ca3af' }}
            >
              Teams & Rosters
            </button>
            <button
              onClick={() => setActiveTab("archive")}
              className="flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition text-white"
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
                  <span>Week {currentWeek} Live Game Slate & Point Spreads</span>
                </h3>
                <p className="text-xs text-gray-400">Fetched dynamically from ESPN live scoreboard feeds.</p>
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

            {loading ? (
              <div className="text-center py-20 text-gray-400">Loading live ESPN schedule and odds...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.length > 0 ? (
                  games.map(game => {
                    const myPick = picks[currentWeek]?.[game.id]?.[activeProfile];
                    const opponentPick = picks[currentWeek]?.[game.id]?.[uncleKey];

                    return (
                      <div key={game.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition shadow-lg relative">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">
                            Spread: <strong style={{ color: theme.primary }}>{game.spread}</strong> | {game.score}
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
                              myPick === game.away ? 'border-2 text-white shadow-md font-black' : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-600'
                            }`}
                            style={myPick === game.away ? { backgroundColor: `${theme.primary}33`, borderColor: theme.primary } : {}}
                          >
                            <span className="text-[10px] text-gray-400 uppercase font-bold">Away</span>
                            <span className="text-base font-black">{game.away}</span>
                            <span className="text-[10px] text-gray-500 mt-1">Record: {game.awayRecord}</span>
                          </button>

                          {/* Home Team */}
                          <button
                            disabled={isPastWeek || userLocked}
                            onClick={() => handlePick(game.id, game.home)}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition ${
                              myPick === game.home ? 'border-2 text-white shadow-md font-black' : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-600'
                            }`}
                            style={myPick === game.home ? { backgroundColor: `${theme.primary}33`, borderColor: theme.primary } : {}}
                          >
                            <span className="text-[10px] text-gray-400 uppercase font-bold">Home</span>
                            <span className="text-base font-black">{game.home}</span>
                            <span className="text-[10px] text-gray-500 mt-1">Record: {game.homeRecord}</span>
                          </button>
                        </div>

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
                    <p>No games found for Week {currentWeek}.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TEAMS & ROSTERS */}
        {activeTab === 'teams' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base sm:text-lg font-black text-white mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: theme.primary }} />
              <span>NFL Teams & Dynamic Roster Viewer</span>
            </h3>
            <p className="text-xs text-gray-400 mb-6">Click any team to query ESPN API for live roster players and injury statuses.</p>

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
                      <div className="text-[10px] text-gray-400">View Roster</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfiles(prev => ({
                        ...prev,
                        [activeProfile]: { ...prev[activeProfile], favTeam: code }
                      }));
                      showToast(`🎨 Theme updated to ${team.name}!`);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 font-bold text-white transition"
                    style={{ backgroundColor: profiles[activeProfile].favTeam === code ? theme.primary : undefined }}
                  >
                    {profiles[activeProfile].favTeam === code ? 'Active' : 'Set'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ARCHIVE */}
        {activeTab === 'archive' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base sm:text-lg font-black text-white mb-2 flex items-center gap-2">
              <BarChart2 className="w-5 h-5" style={{ color: theme.primary }} />
              <span>Past Weeks Archive</span>
            </h3>
            <p className="text-xs text-gray-400 mb-6">Use the week arrows above to navigate back to Weeks 1–10 to review scores and game results.</p>
          </div>
        )}

      </main>

      {/* MATCHUP DETAIL MODAL */}
      {selectedMatchup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
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
                <h3 className="text-lg font-black text-white">{selectedMatchup.awayName} @ {selectedMatchup.homeName}</h3>
                <p className="text-xs text-gray-400">Spread: {selectedMatchup.spread} | Time: {selectedMatchup.startTime}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: theme.primary }}>
                  <Info className="w-3.5 h-3.5" />
                  <span>Matchup & Broadcast Info</span>
                </h4>
                <p className="text-xs text-gray-300">{selectedMatchup.stats}</p>
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

      {/* TEAM ROSTER MODAL */}
      {viewingRosterTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
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
                <p className="text-xs text-gray-400">Live ESPN API Roster Feed</p>
              </div>
            </div>

            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {teamRosterData.map((player, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-950 p-3 rounded-xl border border-gray-800 text-xs">
                  <div>
                    <span className="font-bold text-white">{player.name}</span>
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{player.pos}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${player.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {player.status}
                  </span>
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
