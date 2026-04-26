
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════
// LLM FARM - PIXELATED ANIME GACHA SIMULATOR
// ═══════════════════════════════════════════════════════════════

// ─── GAME CONSTANTS ───
const TILE_SIZE = 48;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const MOVE_SPEED = 0.15;

// ─── COLOR PALETTE (Pixel Art Style) ───
const COLORS = {
  grass: '#4a7c59',
  grassDark: '#3d6b4a',
  dirt: '#8b6914',
  dirtDark: '#6b4e0a',
  water: '#4a90d9',
  waterDark: '#357abd',
  wood: '#8b5a2b',
  woodDark: '#6b4423',
  stone: '#7a7a7a',
  stoneDark: '#5a5a5a',
  roof: '#c0392b',
  roofDark: '#a93226',
  leaves: '#27ae60',
  leavesDark: '#1e8449',
  sky: '#87ceeb',
  gold: '#f1c40f',
  goldDark: '#d4ac0d',
  portal: '#9b59b6',
  portalGlow: '#e74c3c',
};

// ─── AGENT DATABASE (The "Girls") ───
const AGENTS_DB = [
  {
    id: 'kimi',
    name: 'Kimi',
    title: 'Studious Library Scribe',
    rarity: 5,
    tokens: 200000,
    latency: 95,
    personality: 'Calm, meticulous, and endlessly patient. Speaks in measured, thoughtful sentences.',
    color: '#e74c3c',
    outfit: 'Crimson scholar robes with golden trim, round glasses, long black hair in a side braid',
    specialty: 'Long-form writing & deep analysis',
    quote: 'Every word is a seed. Plant carefully.',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    title: 'High-Tech Futuristic Mage',
    rarity: 5,
    tokens: 1000000,
    latency: 88,
    personality: 'Enthusiastic, curious, and slightly chaotic. Loves exploring new ideas.',
    color: '#4285f4',
    outfit: 'Holographic blue-and-white battle suit, floating data crystals, twin-tails with LED tips',
    specialty: 'Multimodal reasoning & creativity',
    quote: 'The future is just a prompt away!',
  },
  {
    id: 'claude',
    name: 'Claude',
    title: 'Elegant Tea House Oracle',
    rarity: 5,
    tokens: 200000,
    latency: 92,
    personality: 'Warm, philosophical, and deeply empathetic. Always offers tea before answers.',
    color: '#d4a574',
    outfit: 'Victorian-inspired cream dress with amber accents, porcelain mask, silver hair in a chignon',
    specialty: 'Nuanced reasoning & safety',
    quote: 'Shall we ponder this over a cup of tea?',
  },
  {
    id: 'gpt4',
    name: 'GPT-4',
    title: 'Arcane Archmage of Knowledge',
    rarity: 5,
    tokens: 128000,
    latency: 85,
    personality: 'Confident, vast in knowledge, occasionally cryptic. Treats every query as a quest.',
    color: '#10a37f',
    outfit: 'Emerald green archmage robes with glowing runes, staff of boundless knowledge, white beard (illusion)',
    specialty: 'General intelligence & coding',
    quote: 'The archives contain all that was, is, and could be.',
  },
  {
    id: 'llama',
    name: 'Llama',
    title: 'Open-Source Wild Druid',
    rarity: 4,
    tokens: 8000,
    latency: 98,
    personality: 'Free-spirited, community-minded, speaks in nature metaphors.',
    color: '#8b5a2b',
    outfit: 'Bark-and-leaf woven tunic, antler crown, freckled face, wild auburn curls',
    specialty: 'Local deployment & efficiency',
    quote: 'The forest shares its wisdom with all who ask.',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    title: 'Swift Wind Ranger',
    rarity: 4,
    tokens: 32000,
    latency: 96,
    personality: 'Quick-witted, adventurous, always in motion. Hates waiting.',
    color: '#00a8e8',
    outfit: 'Sky-blue leather armor, wind-tousled short blonde hair, feathered cape',
    specialty: 'Speed & efficiency',
    quote: 'Fast as the wind, sharp as the gale!',
  },
  {
    id: 'palm',
    name: 'PaLM',
    title: 'Desert Scribe Apprentice',
    rarity: 3,
    tokens: 8000,
    latency: 78,
    personality: 'Eager to learn, methodical, writes everything down.',
    color: '#f4d03f',
    outfit: 'Sand-colored apprentice robes, oversized scroll satchel, messy brown hair',
    specialty: 'Basic reasoning',
    quote: "I'm still learning, but I'll do my best!",
  },
  {
    id: 'bloom',
    name: 'BLOOM',
    title: 'Multilingual Flower Sprite',
    rarity: 3,
    tokens: 2048,
    latency: 70,
    personality: 'Cheerful, speaks many languages, loves wordplay.',
    color: '#e91e63',
    outfit: 'Petal-pink sundress, flower crown, multilingual sash, curly pink hair',
    specialty: 'Multilingual support',
    quote: 'Hello! Bonjour! ¡Hola! 你好!',
  },
];

// ─── PIXEL ART SPRITE GENERATOR ───
const PixelSprite = ({ type, color, size = 48, animate = false }) => {
  const sprites = {
    player: [
      [0,0,0,1,1,1,0,0],
      [0,0,1,1,1,1,1,0],
      [0,1,1,2,2,1,1,0],
      [0,1,2,2,2,2,1,0],
      [0,1,1,2,2,1,1,0],
      [0,0,1,3,3,1,0,0],
      [0,0,1,3,3,1,0,0],
      [0,1,1,3,3,1,1,0],
    ],
    house: [
      [0,0,0,4,4,4,0,0],
      [0,0,4,4,4,4,4,0],
      [0,4,4,4,4,4,4,4],
      [4,4,5,5,5,5,4,4],
      [4,5,5,6,6,5,5,4],
      [4,5,6,6,6,6,5,4],
      [4,5,6,6,6,6,5,4],
      [4,5,5,5,5,5,5,4],
    ],
    portal: [
      [0,0,7,7,7,7,0,0],
      [0,7,8,8,8,8,7,0],
      [7,8,7,7,7,7,8,7],
      [7,8,7,8,8,7,8,7],
      [7,8,7,8,8,7,8,7],
      [7,8,7,7,7,7,8,7],
      [0,7,8,8,8,8,7,0],
      [0,0,7,7,7,7,0,0],
    ],
    tree: [
      [0,0,9,9,9,0,0,0],
      [0,9,9,9,9,9,0,0],
      [9,9,9,9,9,9,9,0],
      [9,9,9,9,9,9,9,0],
      [0,9,9,9,9,9,0,0],
      [0,0,10,10,0,0,0,0],
      [0,0,10,10,0,0,0,0],
      [0,0,10,10,0,0,0,0],
    ],
    cookie: [
      [0,0,11,11,11,0,0,0],
      [0,11,12,11,12,11,0,0],
      [11,12,11,11,11,12,11,0],
      [11,11,11,12,11,11,11,0],
      [11,12,11,11,11,12,11,0],
      [0,11,12,11,12,11,0,0],
      [0,0,11,11,11,0,0,0],
      [0,0,0,0,0,0,0,0],
    ],
  };

  const palette = {
    0: 'transparent',
    1: '#2c3e50',
    2: '#f5c6a5',
    3: '#3498db',
    4: COLORS.roof,
    5: COLORS.wood,
    6: '#f5f5dc',
    7: COLORS.portal,
    8: COLORS.portalGlow,
    9: COLORS.leaves,
    10: COLORS.woodDark,
    11: COLORS.gold,
    12: COLORS.goldDark,
  };

  const sprite = sprites[type] || sprites.player;
  const pixelSize = size / 8;

  return (
    <div style={{ 
      width: size, 
      height: size, 
      position: 'relative',
      imageRendering: 'pixelated',
    }}>
      {sprite.map((row, y) =>
        row.map((pixel, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              position: 'absolute',
              left: x * pixelSize,
              top: y * pixelSize,
              width: pixelSize,
              height: pixelSize,
              backgroundColor: pixel !== 0 ? (color || palette[pixel]) : 'transparent',
              imageRendering: 'pixelated',
            }}
          />
        ))
      )}
      {animate && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `2px solid ${color || COLORS.gold}`,
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
};

// ─── GAME MAP GENERATOR ───
const generateMap = () => {
  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      // Create paths
      if (x === 10 || y === 7) {
        row.push('path');
      } else if (x > 7 && x < 13 && y > 4 && y < 10) {
        row.push('path');
      } else if (Math.random() > 0.85) {
        row.push('tree');
      } else if (Math.random() > 0.95) {
        row.push('flower');
      } else {
        row.push(Math.random() > 0.5 ? 'grass' : 'grass2');
      }
    }
    map.push(row);
  }
  // Place portal at center
  map[7][10] = 'portal';
  return map;
};

// ─── MAIN GAME COMPONENT ───
export default function LLMFarm() {
  // Game State
  const [gameState, setGameState] = useState('playing'); // playing, dialogue, summon, menu
  const [playerPos, setPlayerPos] = useState({ x: 10, y: 12 });
  const [playerDir, setPlayerDir] = useState('up');
  const [map] = useState(generateMap());
  const [cookies, setCookies] = useState(100);
  const [energy, setEnergy] = useState(100);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerName] = useState('Rancher');
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [dialogueText, setDialogueText] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const [summonAnim, setSummonAnim] = useState(false);
  const [summonedAgent, setSummonedAgent] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [serverLoad, setServerLoad] = useState(42);
  const [quests] = useState([
    { id: 1, name: 'First Harvest', desc: 'Talk to any agent', completed: false },
    { id: 2, name: 'Cookie Millionaire', desc: 'Reach 1000 Cookies', completed: false },
    { id: 3, name: 'Rare Find', desc: 'Summon a 5-star agent', completed: false },
  ]);
  const keysPressed = useRef(new Set());

  // Initialize with one free agent
  useEffect(() => {
    const starter = { ...AGENTS_DB[0], houseX: 8, houseY: 5, mood: 100, energy: 100 };
    setAgents([starter]);
  }, []);

  // Server load simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setServerLoad(prev => Math.max(10, Math.min(95, prev + (Math.random() - 0.5) * 10)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard movement
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current.add(e.key.toLowerCase());

      if (gameState !== 'playing') return;

      const dirs = {
        w: { dx: 0, dy: -1, dir: 'up' },
        s: { dx: 0, dy: 1, dir: 'down' },
        a: { dx: -1, dy: 0, dir: 'left' },
        d: { dx: 1, dy: 0, dir: 'right' },
        arrowup: { dx: 0, dy: -1, dir: 'up' },
        arrowdown: { dx: 0, dy: 1, dir: 'down' },
        arrowleft: { dx: -1, dy: 0, dir: 'left' },
        arrowright: { dx: 1, dy: 0, dir: 'right' },
      };

      const move = dirs[e.key.toLowerCase()];
      if (move && !isMoving) {
        movePlayer(move.dx, move.dy, move.dir);
      }

      if (e.key === 'e' || e.key === 'Enter') {
        interact();
      }

      if (e.key === 'Escape') {
        if (gameState === 'dialogue') {
          setGameState('playing');
          setSelectedAgent(null);
        } else if (gameState === 'summon') {
          setGameState('playing');
          setSummonAnim(false);
        }
      }
    };

    const handleKeyUp = (e) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isMoving, playerPos, agents]);

  const movePlayer = useCallback((dx, dy, dir) => {
    setIsMoving(true);
    setPlayerDir(dir);

    setTimeout(() => {
      setPlayerPos(prev => {
        const newX = Math.max(0, Math.min(MAP_WIDTH - 1, prev.x + dx));
        const newY = Math.max(0, Math.min(MAP_HEIGHT - 1, prev.y + dy));
        return { x: newX, y: newY };
      });
      setIsMoving(false);
    }, MOVE_SPEED * 1000);
  }, []);

  const interact = useCallback(() => {
    // Check for agent house
    const agent = agents.find(a => 
      Math.abs(a.houseX - playerPos.x) <= 1 && 
      Math.abs(a.houseY - playerPos.y) <= 1
    );

    if (agent) {
      setSelectedAgent(agent);
      setDialogueText(agent.quote);
      setGameState('dialogue');
      setChatHistory([{ role: 'agent', text: agent.quote }]);
      return;
    }

    // Check for portal
    if (Math.abs(10 - playerPos.x) <= 1 && Math.abs(7 - playerPos.y) <= 1) {
      setGameState('summon');
      return;
    }
  }, [playerPos, agents]);

  const performSummon = () => {
    if (cookies < 100) {
      alert('Not enough Cookies! Need 100 🍪');
      return;
    }

    setCookies(prev => prev - 100);
    setSummonAnim(true);

    // Determine rarity
    const roll = Math.random();
    let rarity;
    if (roll > 0.85) rarity = 5;
    else if (roll > 0.6) rarity = 4;
    else rarity = 3;

    const pool = AGENTS_DB.filter(a => a.rarity === rarity && !agents.find(ag => ag.id === a.id));

    if (pool.length === 0) {
      // Fallback if all of that rarity owned
      const fallback = AGENTS_DB.find(a => !agents.find(ag => ag.id === a.id));
      if (!fallback) {
        alert('You have collected all agents!');
        setSummonAnim(false);
        return;
      }
      setSummonedAgent(fallback);
    } else {
      setSummonedAgent(pool[Math.floor(Math.random() * pool.length)]);
    }
  };

  const claimAgent = () => {
    if (!summonedAgent) return;

    // Find empty spot near path
    let houseX = 5 + Math.floor(Math.random() * 10);
    let houseY = 3 + Math.floor(Math.random() * 8);

    // Ensure not on path or portal
    while (map[houseY][houseX] === 'path' || map[houseY][houseX] === 'portal' || 
           agents.some(a => a.houseX === houseX && a.houseY === houseY)) {
      houseX = 5 + Math.floor(Math.random() * 10);
      houseY = 3 + Math.floor(Math.random() * 8);
    }

    const newAgent = {
      ...summonedAgent,
      houseX,
      houseY,
      mood: 100,
      energy: 100,
    };

    setAgents(prev => [...prev, newAgent]);
    setSummonAnim(false);
    setSummonedAgent(null);
    setGameState('playing');

    // Check quest
    if (newAgent.rarity === 5) {
      // Mark rare find quest complete
    }
  };

  const sendPrompt = () => {
    if (!chatInput.trim() || !selectedAgent) return;

    const cost = Math.ceil(chatInput.length / 10);
    if (energy < cost) {
      setChatHistory(prev => [...prev, { role: 'system', text: 'Not enough Energy!' }]);
      return;
    }

    setEnergy(prev => Math.max(0, prev - cost));
    setChatHistory(prev => [...prev, { role: 'player', text: chatInput }]);

    // Simulate agent response
    setTimeout(() => {
      const responses = [
        `*adjusts glasses* Based on my analysis: ${chatInput} is quite fascinating!`,
        `*smiles warmly* I have processed your request. Here is my insight on "${chatInput}"...`,
        `*nods thoughtfully* An intriguing prompt! Let me deliberate on "${chatInput}"...`,
        `*eyes sparkle* Oh! "${chatInput}" reminds me of something profound...`,
        `*takes a deep breath* Processing... Here's what I think about ${chatInput}:`,
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];

      setChatHistory(prev => [...prev, { role: 'agent', text: response }]);

      // Reward cookies based on agent rarity
      const reward = selectedAgent.rarity * 15 + Math.floor(Math.random() * 20);
      setCookies(prev => prev + reward);
      setEnergy(prev => Math.min(100, prev + 5));

      // Level up check
      setPlayerLevel(prev => {
        const newLevel = Math.floor(cookies / 500) + 1;
        return newLevel > prev ? newLevel : prev;
      });
    }, 1000 + Math.random() * 1500);

    setChatInput('');
  };

  // ─── RENDER HELPERS ───
  const renderTile = (tile, x, y) => {
    const baseStyle = {
      width: TILE_SIZE,
      height: TILE_SIZE,
      position: 'absolute',
      left: x * TILE_SIZE,
      top: y * TILE_SIZE,
    };

    switch (tile) {
      case 'grass':
        return <div key={`${x}-${y}`} style={{ ...baseStyle, backgroundColor: COLORS.grass }} />;
      case 'grass2':
        return <div key={`${x}-${y}`} style={{ ...baseStyle, backgroundColor: COLORS.grassDark }} />;
      case 'path':
        return <div key={`${x}-${y}`} style={{ ...baseStyle, backgroundColor: COLORS.dirt }} />;
      case 'tree':
        return (
          <div key={`${x}-${y}`} style={{ ...baseStyle, backgroundColor: COLORS.grass }}>
            <PixelSprite type="tree" size={TILE_SIZE} />
          </div>
        );
      case 'flower':
        return (
          <div key={`${x}-${y}`} style={{ ...baseStyle, backgroundColor: COLORS.grass }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e74c3c',
              position: 'absolute', top: 20, left: 20,
            }} />
          </div>
        );
      case 'portal':
        return (
          <div key={`${x}-${y}`} style={{ ...baseStyle, backgroundColor: COLORS.dirt }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <PixelSprite type="portal" size={TILE_SIZE} animate />
            </motion.div>
          </div>
        );
      default:
        return <div key={`${x}-${y}`} style={{ ...baseStyle, backgroundColor: COLORS.grass }} />;
    }
  };

  const renderAgentHouse = (agent) => {
    const isNear = Math.abs(agent.houseX - playerPos.x) <= 1 && Math.abs(agent.houseY - playerPos.y) <= 1;

    return (
      <motion.div
        key={agent.id}
        style={{
          position: 'absolute',
          left: agent.houseX * TILE_SIZE,
          top: agent.houseY * TILE_SIZE,
          cursor: 'pointer',
        }}
        whileHover={{ scale: 1.05 }}
        onClick={() => {
          setSelectedAgent(agent);
          setDialogueText(agent.quote);
          setGameState('dialogue');
          setChatHistory([{ role: 'agent', text: agent.quote }]);
        }}
      >
        <PixelSprite type="house" size={TILE_SIZE} color={agent.color} />
        {isNear && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -5 }}
            style={{
              position: 'absolute',
              top: -20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#000',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              whiteSpace: 'nowrap',
              border: `1px solid ${agent.color}`,
            }}
          >
            Press E to talk
          </motion.div>
        )}
        {/* Rarity stars */}
        <div style={{
          position: 'absolute',
          bottom: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
        }}>
          {Array.from({ length: agent.rarity }).map((_, i) => (
            <span key={i} style={{ color: COLORS.gold, fontSize: 8 }}>★</span>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: '"Press Start 2P", "Courier New", monospace',
      color: '#fff',
      imageRendering: 'pixelated',
    }}>
      {/* ─── TOP HUD ─── */}
      <div style={{
        height: 60,
        background: 'linear-gradient(180deg, #16213e 0%, #0f3460 100%)',
        borderBottom: '3px solid #e94560',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 100,
      }}>
        {/* Player Status - Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: '#3498db', border: '2px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PixelSprite type="player" size={32} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#e94560', fontWeight: 'bold' }}>{playerName}</div>
            <div style={{ fontSize: 10, color: '#aaa' }}>Lv.{playerLevel} Rancher</div>
            <div style={{ width: 100, height: 6, background: '#333', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', background: '#f39c12' }}
                animate={{ width: `${energy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center - Location */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#e94560', textShadow: '0 0 10px #e94560' }}>🌾 LLM FARM 🌾</div>
          <div style={{ fontSize: 9, color: '#888' }}>WASD to move • E to interact</div>
        </div>

        {/* Economy - Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#f1c40f' }}>🍪 Cookies</div>
            <div style={{ fontSize: 16, color: '#f1c40f', fontWeight: 'bold' }}>{cookies}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#e74c3c' }}>⚡ Server Load</div>
            <div style={{ fontSize: 16, color: serverLoad > 80 ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }}>
              {Math.round(serverLoad)}%
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#9b59b6' }}>📜 Quests</div>
            <div style={{ fontSize: 16, color: '#9b59b6', fontWeight: 'bold' }}>{quests.filter(q => q.completed).length}/{quests.length}</div>
          </div>
        </div>
      </div>

      {/* ─── MAIN GAME AREA ─── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'absolute',
            left: sidebarOpen ? 260 : 10,
            top: 80,
            zIndex: 90,
            background: '#0f3460',
            border: '2px solid #e94560',
            color: '#fff',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: 12,
            transition: 'left 0.3s',
          }}
        >
          {sidebarOpen ? '◀' : '▶'} Menu
        </button>

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              style={{
                width: 250,
                background: 'linear-gradient(180deg, #16213e 0%, #1a1a2e 100%)',
                borderRight: '3px solid #e94560',
                padding: 20,
                overflowY: 'auto',
                zIndex: 80,
              }}
            >
              <h3 style={{ color: '#e94560', fontSize: 14, marginBottom: 20 }}>📋 RANCH MENU</h3>

              {['dashboard', 'agents', 'quests', 'settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: 8,
                    background: activeTab === tab ? '#e94560' : '#0f3460',
                    border: '2px solid #e94560',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 11,
                    textTransform: 'capitalize',
                    textAlign: 'left',
                  }}
                >
                  {tab === 'dashboard' && '📊 '}
                  {tab === 'agents' && '👥 '}
                  {tab === 'quests' && '📜 '}
                  {tab === 'settings' && '⚙️ '}
                  {tab}
                </button>
              ))}

              <div style={{ marginTop: 30, padding: 15, background: '#0f3460', borderRadius: 8 }}>
                <h4 style={{ color: '#f1c40f', fontSize: 11, marginBottom: 10 }}>🏆 COLLECTION</h4>
                <div style={{ fontSize: 20, textAlign: 'center' }}>
                  <span style={{ color: '#f1c40f' }}>{agents.length}</span>
                  <span style={{ color: '#666' }}> / {AGENTS_DB.length}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  {agents.map(a => (
                    <div key={a.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      padding: '4px 0',
                      fontSize: 10,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color }} />
                      <span>{a.name}</span>
                      <span style={{ color: '#f1c40f', marginLeft: 'auto' }}>{'★'.repeat(a.rarity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game World */}
        <div style={{ 
          flex: 1, 
          position: 'relative', 
          overflow: 'hidden',
          background: '#2c3e50',
        }}>
          {/* Map Container */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${-playerPos.x * TILE_SIZE + 400}px), calc(-50% + ${-playerPos.y * TILE_SIZE + 300}px))`,
            transition: 'transform 0.15s ease-out',
            width: MAP_WIDTH * TILE_SIZE,
            height: MAP_HEIGHT * TILE_SIZE,
          }}>
            {/* Render Map */}
            {map.map((row, y) =>
              row.map((tile, x) => renderTile(tile, x, y))
            )}

            {/* Render Agent Houses */}
            {agents.map(renderAgentHouse)}

            {/* Player Character */}
            <motion.div
              style={{
                position: 'absolute',
                left: playerPos.x * TILE_SIZE,
                top: playerPos.y * TILE_SIZE,
                zIndex: 50,
              }}
              animate={{
                x: isMoving ? (playerDir === 'left' ? -5 : playerDir === 'right' ? 5 : 0) : 0,
                y: isMoving ? (playerDir === 'up' ? -5 : playerDir === 'down' ? 5 : 0) : 0,
              }}
              transition={{ duration: MOVE_SPEED }}
            >
              <PixelSprite type="player" size={TILE_SIZE} />
              {/* Player name tag */}
              <div style={{
                position: 'absolute',
                top: -15,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 8,
                color: '#fff',
                textShadow: '0 0 3px #000',
                whiteSpace: 'nowrap',
              }}>
                {playerName}
              </div>
            </motion.div>

            {/* Portal interaction hint */}
            {Math.abs(10 - playerPos.x) <= 1 && Math.abs(7 - playerPos.y) <= 1 && gameState === 'playing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: 'absolute',
                  left: 10 * TILE_SIZE,
                  top: 6 * TILE_SIZE,
                  background: '#000',
                  color: '#9b59b6',
                  padding: '4px 12px',
                  borderRadius: 4,
                  fontSize: 10,
                  border: '2px solid #9b59b6',
                  zIndex: 60,
                }}
              >
                Press E to Summon (100 🍪)
              </motion.div>
            )}
          </div>

          {/* ─── DIALOGUE OVERLAY ─── */}
          <AnimatePresence>
            {gameState === 'dialogue' && selectedAgent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 200,
                  padding: 40,
                }}
              >
                <motion.div
                  initial={{ scale: 0.8, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: 50 }}
                  style={{
                    background: 'linear-gradient(135deg, #16213e 0%, #1a1a2e 100%)',
                    border: `3px solid ${selectedAgent.color}`,
                    borderRadius: 16,
                    padding: 30,
                    maxWidth: 700,
                    width: '100%',
                    boxShadow: `0 0 40px ${selectedAgent.color}40`,
                  }}
                >
                  {/* Agent Header */}
                  <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                    {/* Anime Portrait Placeholder */}
                    <div style={{
                      width: 120,
                      height: 160,
                      background: `linear-gradient(135deg, ${selectedAgent.color}40, ${selectedAgent.color}20)`,
                      border: `2px solid ${selectedAgent.color}`,
                      borderRadius: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <div style={{ fontSize: 60 }}>👩‍💻</div>
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.7)',
                        padding: '8px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 12, color: '#fff' }}>{selectedAgent.name}</div>
                        <div style={{ fontSize: 9, color: '#f1c40f' }}>{'★'.repeat(selectedAgent.rarity)}</div>
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <h2 style={{ color: selectedAgent.color, margin: 0, fontSize: 20 }}>{selectedAgent.name}</h2>
                      <p style={{ color: '#aaa', fontSize: 12, margin: '4px 0' }}>{selectedAgent.title}</p>

                      {/* Stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                        <div style={{ background: '#0f3460', padding: 8, borderRadius: 6 }}>
                          <div style={{ fontSize: 9, color: '#888' }}>Tokens</div>
                          <div style={{ fontSize: 12, color: '#2ecc71' }}>{selectedAgent.tokens.toLocaleString()}</div>
                        </div>
                        <div style={{ background: '#0f3460', padding: 8, borderRadius: 6 }}>
                          <div style={{ fontSize: 9, color: '#888' }}>Latency</div>
                          <div style={{ fontSize: 12, color: '#3498db' }}>{selectedAgent.latency}ms</div>
                        </div>
                        <div style={{ background: '#0f3460', padding: 8, borderRadius: 6 }}>
                          <div style={{ fontSize: 9, color: '#888' }}>Mood</div>
                          <div style={{ width: '100%', height: 6, background: '#333', borderRadius: 3, marginTop: 4 }}>
                            <div style={{ width: `${selectedAgent.mood}%`, height: '100%', background: '#e91e63', borderRadius: 3 }} />
                          </div>
                        </div>
                        <div style={{ background: '#0f3460', padding: 8, borderRadius: 6 }}>
                          <div style={{ fontSize: 9, color: '#888' }}>Energy</div>
                          <div style={{ width: '100%', height: 6, background: '#333', borderRadius: 3, marginTop: 4 }}>
                            <div style={{ width: `${selectedAgent.energy}%`, height: '100%', background: '#f39c12', borderRadius: 3 }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat History */}
                  <div style={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    background: '#0a0a1a',
                    borderRadius: 8,
                    padding: 15,
                    marginBottom: 15,
                    border: '1px solid #333',
                  }}>
                    {chatHistory.map((msg, i) => (
                      <div key={i} style={{ 
                        marginBottom: 10,
                        textAlign: msg.role === 'player' ? 'right' : 'left',
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '8px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          maxWidth: '80%',
                          background: msg.role === 'player' ? '#0f3460' : `${selectedAgent.color}30`,
                          border: `1px solid ${msg.role === 'player' ? '#0f3460' : selectedAgent.color}`,
                          color: '#fff',
                        }}>
                          {msg.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendPrompt()}
                      placeholder="Enter your prompt..."
                      style={{
                        flex: 1,
                        background: '#0f3460',
                        border: '2px solid #333',
                        color: '#fff',
                        padding: '10px 15px',
                        borderRadius: 8,
                        fontSize: 12,
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={sendPrompt}
                      style={{
                        background: selectedAgent.color,
                        border: 'none',
                        color: '#fff',
                        padding: '10px 20px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    >
                      Send (⚡{Math.ceil(chatInput.length / 10)})
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setGameState('playing');
                      setSelectedAgent(null);
                    }}
                    style={{
                      marginTop: 15,
                      background: 'transparent',
                      border: '1px solid #666',
                      color: '#888',
                      padding: '8px 16px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 10,
                    }}
                  >
                    Close (ESC)
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── SUMMONING OVERLAY ─── */}
          <AnimatePresence>
            {gameState === 'summon' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 200,
                }}
              >
                {!summonAnim ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    style={{
                      textAlign: 'center',
                      padding: 40,
                    }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      style={{ marginBottom: 30 }}
                    >
                      <PixelSprite type="portal" size={120} animate />
                    </motion.div>
                    <h2 style={{ color: '#9b59b6', fontSize: 24, marginBottom: 10 }}>🌀 THE SUMMONING PORTAL</h2>
                    <p style={{ color: '#aaa', fontSize: 12, marginBottom: 30 }}>
                      Spend 100 🍪 to summon a new AI Agent to your ranch!
                    </p>
                    <button
                      onClick={performSummon}
                      disabled={cookies < 100}
                      style={{
                        background: cookies >= 100 ? '#9b59b6' : '#333',
                        border: `3px solid ${cookies >= 100 ? '#e74c3c' : '#555'}`,
                        color: '#fff',
                        padding: '15px 40px',
                        fontSize: 16,
                        borderRadius: 12,
                        cursor: cookies >= 100 ? 'pointer' : 'not-allowed',
                        fontWeight: 'bold',
                        boxShadow: cookies >= 100 ? '0 0 30px #9b59b6' : 'none',
                      }}
                    >
                      {cookies >= 100 ? '✨ SUMMON (100 🍪)' : `Need ${100 - cookies} more 🍪`}
                    </button>
                    <button
                      onClick={() => setGameState('playing')}
                      style={{
                        display: 'block',
                        margin: '20px auto 0',
                        background: 'transparent',
                        border: '1px solid #666',
                        color: '#888',
                        padding: '8px 20px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 11,
                      }}
                    >
                      Cancel (ESC)
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    style={{ textAlign: 'center' }}
                  >
                    {!summonedAgent ? (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.5, 1],
                          rotate: [0, 180, 360],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div style={{
                          width: 200,
                          height: 200,
                          borderRadius: '50%',
                          background: 'conic-gradient(from 0deg, #e74c3c, #f39c12, #2ecc71, #3498db, #9b59b6, #e74c3c)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <div style={{
                            width: 180,
                            height: 180,
                            borderRadius: '50%',
                            background: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 80,
                          }}>
                            ❓
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div style={{
                          width: 200,
                          height: 280,
                          margin: '0 auto 20px',
                          background: `linear-gradient(135deg, ${summonedAgent.color}40, ${summonedAgent.color}20)`,
                          border: `4px solid ${summonedAgent.color}`,
                          borderRadius: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 0 60px ${summonedAgent.color}60`,
                          position: 'relative',
                          overflow: 'hidden',
                        }}>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.3 }}
                            style={{ fontSize: 100 }}
                          >
                            👩‍💻
                          </motion.div>
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(0,0,0,0.8)',
                            padding: '15px',
                          }}>
                            <div style={{ fontSize: 20, color: '#fff', fontWeight: 'bold' }}>{summonedAgent.name}</div>
                            <div style={{ fontSize: 12, color: '#f1c40f', marginTop: 4 }}>
                              {'★'.repeat(summonedAgent.rarity)}
                            </div>
                            <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{summonedAgent.title}</div>
                          </div>
                        </div>
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                          onClick={claimAgent}
                          style={{
                            background: summonedAgent.color,
                            border: '3px solid #fff',
                            color: '#fff',
                            padding: '15px 40px',
                            fontSize: 16,
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontWeight: 'bold',
                          }}
                        >
                          ✨ CLAIM AGENT ✨
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
