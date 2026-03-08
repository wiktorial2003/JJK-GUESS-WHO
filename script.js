
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  push,
  remove
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

import {
  getAuth,
  signInAnonymously
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyBkgtA_dhslvLf4q9h52zC2PeCaaadQpf0",
  authDomain: "jjk-guess-who.firebaseapp.com",
  databaseURL: "https://jjk-guess-who-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jjk-guess-who",
  storageBucket: "jjk-guess-who.firebasestorage.app",
  messagingSenderId: "161558821877",
  appId: "1:161558821877:web:18b614318f51f7e843bebc"
};

const ROOM_LIFETIME_MS = 60 * 60 * 1000; 
const firebaseConfigured = !Object.values(firebaseConfig).some(value => String(value).startsWith('PASTE_YOUR'));

let app = null;
let db = null;
let auth = null;
let firebaseReady = false;

if (firebaseConfigured) {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  auth = getAuth(app);
}

async function initializeFirebaseAuth() {
  if (!firebaseConfigured || !auth) return;

  try {
    await signInAnonymously(auth);
    firebaseReady = true;
    console.log("Signed in anonymously");

    await cleanupExpiredRooms();
  } catch (error) {
    console.error("Anonymous login failed:", error);
  }
}

const CHARACTERS = [
  { name: 'Yuji Itadori', image:'images/yuji.jpg', gender: 'male', hair: 'pink', student: true, teacher: false, cursed_user: true, glasses: false, weapon: false, clan: false, special_grade: false, alive: true },
  { name: 'Megumi Fushiguro', image:'images/megumi.jpg', gender: 'male', hair: 'black', student: true, teacher: false, cursed_user: true, glasses: false, weapon: false, clan: true, special_grade: false, alive: true },
  { name: 'Nobara Kugisaki', image:'images/nobara.jpg', gender: 'female', hair: 'brown', student: true, teacher: false, cursed_user: true, glasses: false, weapon: true, clan: false, special_grade: false, alive: false },
  { name: 'Satoru Gojo', image:'images/gojo.jpg', gender: 'male', hair: 'white', student: false, teacher: true, cursed_user: true, glasses: true, weapon: false, clan: true, special_grade: true, alive: false },
  { name: 'Maki Zenin', image:'images/maki.jpg', gender: 'female', hair: 'black', student: true, teacher: false, cursed_user: false, glasses: true, weapon: true, clan: true, special_grade: false, alive: true },
  { name: 'Toge Inumaki', image:'images/toge.jpg', gender: 'male', hair: 'white', student: true, teacher: false, cursed_user: true, glasses: false, weapon: false, clan: true, special_grade: false, alive: true },
  { name: 'Yuta Okkotsu', image:'images/yuta.jpg', gender: 'male', hair: 'black', student: true, teacher: false, cursed_user: true, glasses: false, weapon: true, clan: false, special_grade: true, alive: true },
  { name: 'Panda', image:'images/panda.jpg', gender: 'male', hair: 'other', student: true, teacher: false, cursed_user: false, glasses: false, weapon: false, clan: false, special_grade: false, alive: true },
  { name: 'Kento Nanami', image:'images/nanami.jpg', gender: 'male', hair: 'blond', student: false, teacher: false, cursed_user: true, glasses: true, weapon: true, clan: false, special_grade: false, alive: false },
  { name: 'Suguru Geto', image:'images/geto.jpg', gender: 'male', hair: 'black', student: false, teacher: false, cursed_user: true, glasses: false, weapon: false, clan: false, special_grade: true, alive: false },
  { name: 'Toji Fushiguro', image:'images/toji.jpg', gender: 'male', hair: 'black', student: false, teacher: false, cursed_user: false, glasses: false, weapon: true, clan: true, special_grade: false, alive: false },
  { name: 'Mahito', image:'images/mahito.jpg', gender: 'male', hair: 'blue', student: false, teacher: false, cursed_user: true, glasses: false, weapon: false, clan: false, special_grade: true, alive: false },
  { name: 'Ryomen Sukuna', image:'images/sukuna.jpg', gender: 'male', hair: 'pink', student: false, teacher: false, cursed_user: true, glasses: false, weapon: false, clan: false, special_grade: true, alive: true },
  { name: 'Hiromi Higuruma', image:'images/higuruma.jpg', gender: 'male', hair: 'brown', student: false, teacher: false, cursed_user: true, glasses: false, weapon: false, clan: false, special_grade: false, alive: false },
  { name: 'Choso', image:'images/choso.jpg', gender: 'male', hair: 'black', student: false, teacher: false, cursed_user: true, glasses: false, weapon: false, clan: false, special_grade: false, alive: true },
  { name: 'Jogo', image:'images/jogo.jpg', gender: 'male', hair: 'other', student: false, teacher: false, cursed_user: true, glasses: false, weapon: false, clan: false, special_grade: true, alive: false },
  { name: 'Aoi Todo', image:'images/todo.jpg', gender: 'male', hair: 'black', student: true, teacher: false, cursed_user: true, glasses: false, weapon: false, clan: false, special_grade: false, alive: true },
  { name: 'Kenjaku', image: 'images/kenjaku.jpg', gender: 'male', hair: 'black', student: false, teacher: false, cursed_user: true, glasses: false, weapon: false, clan: false, special_grade: true, alive: true }
];

const QUESTIONS = [
  
];

const playerNameInput = document.getElementById('playerName');
const roomCodeInput = document.getElementById('roomCode');
const randomCodeBtn = document.getElementById('randomCodeBtn');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const copyInviteBtn = document.getElementById('copyInviteBtn');
const gameArea = document.getElementById('gameArea');
const statusText = document.getElementById('statusText');
const characterGrid = document.getElementById('characterGrid');
const questionList = document.getElementById('questionList');
const log = document.getElementById('log');
const secretChoiceBox = document.getElementById('secretChoiceBox');
const guessSelect = document.getElementById('guessSelect');
const guessBtn = document.getElementById('guessBtn');
const youLabel = document.getElementById('youLabel');
const opponentLabel = document.getElementById('opponentLabel');
const rematchBtn = document.getElementById('rematchBtn');
const customQuestionInput = document.getElementById('customQuestionInput');
const askCustomBtn = document.getElementById('askCustomBtn');
const pendingQuestionText = document.getElementById('pendingQuestionText');
const answerYesBtn = document.getElementById('answerYesBtn');
const answerNoBtn = document.getElementById('answerNoBtn');
const howToPlayCard = document.getElementById('howToPlayCard');
const topLogCard = document.getElementById('topLogCard');
const topLog = document.getElementById('topLog');

let currentRoomCode = '';
let currentPlayerId = '';
let roomState = null;
let localEliminated = new Set();

function makeId(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function getInviteLink(code) {
  const url = new URL(window.location.href);
  url.searchParams.set('room', code);
  return url.toString();
}

function setStatus(text) {
  statusText.textContent = text;
}

function getCharacterByName(name) {
  return CHARACTERS.find(character => character.name === name) || null;
}

function getMyPlayer() {
  if (!roomState || !currentPlayerId) return null;
  return roomState.players?.[currentPlayerId] || null;
}

function getOpponentEntry() {
  if (!roomState?.players) return null;
  const entries = Object.entries(roomState.players).filter(([id]) => id !== currentPlayerId);
  return entries[0] || null;
}

function isMyTurn() {
  return roomState?.turn === currentPlayerId;
}

function bothPlayersJoined() {
  return roomState?.players && Object.keys(roomState.players).length === 2;
}

function bothSelectedCharacters() {
  if (!bothPlayersJoined()) return false;
  return Object.values(roomState.players).every(player => !!player.secretCharacter);
}

function gameWinnerName() {
  if (!roomState?.winner) return null;
  return roomState.players?.[roomState.winner]?.name || 'Unknown';
}

function renderGuessOptions() {
  guessSelect.innerHTML = '';
  CHARACTERS.forEach(character => {
    const option = document.createElement('option');
    option.value = character.name;
    option.textContent = character.name;
    guessSelect.appendChild(option);
  });
}

function renderCharacters() {
  const myPlayer = getMyPlayer();
  characterGrid.innerHTML = '';

  CHARACTERS.forEach(character => {
    const card = document.createElement('div');
    card.className = 'char-card';

    if (myPlayer?.secretCharacter === character.name) {
      card.classList.add('selected');
    }

    if (localEliminated.has(character.name)) {
      card.classList.add('eliminated');
    }

    card.innerHTML = `
    <img src="${character.image}" class="char-image" alt="${character.name}">
    <div class="char-name">${character.name}</div>
    <div class="small">Hair: ${capitalize(character.hair)}</div>
    <div class="badge-row">
    <span class="badge">${character.student ? 'Student' : 'Non-student'}</span>
    <span class="badge">${capitalize(character.gender)}</span>
    ${character.teacher ? '<span class="badge">Teacher</span>' : ''}
  </div>
`;

    card.addEventListener('click', async () => {
      const me = getMyPlayer();
      if (!me?.secretCharacter) {
        await chooseSecretCharacter(character.name);
        return;
      }

      if (me.secretCharacter === character.name) {
        return;
      }

      if (localEliminated.has(character.name)) {
        localEliminated.delete(character.name);
      } else {
        localEliminated.add(character.name);
      }

      renderCharacters();
    });

    characterGrid.appendChild(card);
  });

  secretChoiceBox.textContent = `Your secret character: ${myPlayer?.secretCharacter || 'not selected'}`;
}

function renderQuestions() {
  questionList.innerHTML = '';
  const disabled = !bothSelectedCharacters() || !isMyTurn() || !!roomState?.winner || hasPendingCustomQuestion();
  const askedIds = new Set(roomState?.askedQuestions || []);

  QUESTIONS.forEach((question, index) => {
    const item = document.createElement('div');
    item.className = 'question-item';

    const button = document.createElement('button');
    button.textContent = 'Ask';
    button.disabled = disabled || askedIds.has(index);
    button.addEventListener('click', () => askQuestion(index));

    const text = document.createElement('div');
    text.innerHTML = askedIds.has(index)
      ? `${question.text} <span class="pill">used</span>`
      : question.text;

    item.appendChild(button);
    item.appendChild(text);
    questionList.appendChild(item);
  });
}

function renderCustomQuestionArea() {
  const pending = roomState?.pendingCustomQuestion;

  if (!pending) {
    pendingQuestionText.textContent = 'No custom question waiting.';
    answerYesBtn.disabled = true;
    answerNoBtn.disabled = true;
    askCustomBtn.disabled = !bothSelectedCharacters() || !isMyTurn() || !!roomState?.winner;
    return;
  }

  const isForMe = pending.from !== currentPlayerId;

  if (isForMe) {
    pendingQuestionText.textContent = `Opponent asks: ${pending.text}`;
    answerYesBtn.disabled = false;
    answerNoBtn.disabled = false;
    askCustomBtn.disabled = true;
  } else {
    pendingQuestionText.textContent = `Waiting for opponent to answer: ${pending.text}`;
    answerYesBtn.disabled = true;
    answerNoBtn.disabled = true;
    askCustomBtn.disabled = true;
  }
}

function renderLabels() {
  const myPlayer = getMyPlayer();
  const opponent = getOpponentEntry();
  youLabel.textContent = `You: ${myPlayer?.name || '-'}`;
  opponentLabel.textContent = `Opponent: ${opponent?.[1]?.name || '-'}`;
}

function renderStatusFromState() {
  if (!roomState) {
    setStatus('Not connected.');
    return;
  }

  if (roomState.winner) {
    setStatus(`Game over. Winner: ${gameWinnerName()}`);
    return;
  }

  if (roomState?.pendingCustomQuestion) {
    const pending = roomState.pendingCustomQuestion;

    if (pending.from === currentPlayerId) {
      setStatus('Waiting for your opponent to answer your custom question.');
    } else {
      setStatus('Answer your opponent’s custom question.');
    }
    return;
  }

  if (!bothPlayersJoined()) {
    setStatus('Waiting for a second player to join...');
    return;
  }

  if (!bothSelectedCharacters()) {
    const myPlayer = getMyPlayer();
    if (!myPlayer?.secretCharacter) {
      setStatus('Pick your secret character to start the match.');
    } else {
      setStatus('Waiting for your opponent to pick their secret character...');
    }
    return;
  }

  if (isMyTurn()) {
    setStatus('Your turn. Ask a question or make a guess.');
  } else {
    setStatus("Opponent's turn. Wait for their move.");
  }
}

function hasPendingCustomQuestion() {
  return !!roomState?.pendingCustomQuestion;
}

function renderEverything() {
  renderLabels();
  renderCharacters();
  renderQuestions();
  renderGuessOptions();
  renderStatusFromState();
  renderCustomQuestionArea();
  guessBtn.disabled = !bothSelectedCharacters() || !isMyTurn() || !!roomState?.winner || hasPendingCustomQuestion();
}

async function chooseSecretCharacter(characterName) {
  if (!firebaseConfigured) {
    alert('Add your Firebase config first.');
    return;
  }

  const playerRef = ref(db, `rooms/${currentRoomCode}/players/${currentPlayerId}`);
  await update(playerRef, { secretCharacter: characterName });
}

async function askQuestion(questionIndex) {
  if (!firebaseConfigured) {
    alert('Add your Firebase config first.');
    return;
  }

  if (!roomState || roomState.winner) return;
  if (!isMyTurn()) {
    alert('Not your turn.');
    return;
  }

  const question = QUESTIONS[questionIndex];
  const opponent = getOpponentEntry();
  if (!opponent) return;

  const opponentSecretName = opponent[1].secretCharacter;
  const opponentCharacter = getCharacterByName(opponentSecretName);
  if (!opponentCharacter) {
    alert('Opponent has not picked a character yet.');
    return;
  }

  const answer = opponentCharacter[question.key] === question.value;
  const nextTurn = currentPlayerId === roomState.playerOrder?.[0]
    ? roomState.playerOrder?.[1]
    : roomState.playerOrder?.[0];

  await update(ref(db, `rooms/${currentRoomCode}`), {
    askedQuestions: [...(roomState.askedQuestions || []), questionIndex],
    turn: nextTurn
  });

  await push(ref(db, `rooms/${currentRoomCode}/log`), {
    text: `${getMyPlayer()?.name || 'Player'} asked: ${question.text} -> ${answer ? 'Yes' : 'No'}`,
    createdAt: Date.now()
  });
}

async function askCustomQuestion() {
  if (!firebaseConfigured) return;
  if (!roomState || roomState.winner) return;

  if (!isMyTurn()) {
    alert('Not your turn.');
    return;
  }

  const questionText = customQuestionInput.value.trim();
  if (!questionText) {
    alert('Type a question first.');
    return;
  }

  const opponent = getOpponentEntry();
  if (!opponent) return;

  await update(ref(db, `rooms/${currentRoomCode}`), {
    pendingCustomQuestion: {
      from: currentPlayerId,
      text: questionText
    }
  });

  await push(ref(db, `rooms/${currentRoomCode}/log`), {
    text: `${getMyPlayer()?.name || 'Player'} asked a custom question: ${questionText}`,
    createdAt: Date.now()
  });

  customQuestionInput.value = '';
}

async function answerCustomQuestion(answer) {
  if (!firebaseConfigured) return;
  if (!roomState?.pendingCustomQuestion) return;

  const pending = roomState.pendingCustomQuestion;

  if (pending.from === currentPlayerId) {
    alert('You cannot answer your own question.');
    return;
  }

  const nextTurn = currentPlayerId;

  await push(ref(db, `rooms/${currentRoomCode}/log`), {
    text: `${getMyPlayer()?.name || 'Player'} answered custom question "${pending.text}" -> ${answer ? 'Yes' : 'No'}`,
    createdAt: Date.now()
  });

  await update(ref(db, `rooms/${currentRoomCode}`), {
    pendingCustomQuestion: null,
    turn: nextTurn,
    lastActivity: Date.now()
  });
}

async function makeGuess() {
  if (!firebaseConfigured) {
    alert('Add your Firebase config first.');
    return;
  }

  if (!roomState || roomState.winner) return;
  if (!isMyTurn()) {
    alert('Not your turn.');
    return;
  }

  const guessName = guessSelect.value;
  const opponent = getOpponentEntry();
  if (!opponent) return;

  const opponentSecret = opponent[1].secretCharacter;
  if (!opponentSecret) {
    alert('Opponent has not picked a character yet.');
    return;
  }

  if (guessName === opponentSecret) {
    await update(ref(db, `rooms/${currentRoomCode}`), {
      winner: currentPlayerId
    });

    await push(ref(db, `rooms/${currentRoomCode}/log`), {
      text: `${getMyPlayer()?.name || 'Player'} guessed ${guessName}. Correct guess.`,
      createdAt: Date.now()
    });
  } else {
    const nextTurn = currentPlayerId === roomState.playerOrder?.[0]
      ? roomState.playerOrder?.[1]
      : roomState.playerOrder?.[0];

    await update(ref(db, `rooms/${currentRoomCode}`), {
      turn: nextTurn
    });

    await push(ref(db, `rooms/${currentRoomCode}/log`), {
      text: `${getMyPlayer()?.name || 'Player'} guessed ${guessName}. Wrong guess.`,
      createdAt: Date.now()
    });
  }
}

async function cleanupExpiredRooms() {
  if (!firebaseConfigured) return;

  const roomsRef = ref(db, 'rooms');
  const snapshot = await get(roomsRef);

  if (!snapshot.exists()) return;

  const rooms = snapshot.val();
  const now = Date.now();

  for (const [roomCode, roomData] of Object.entries(rooms)) {
    const lastActivity = roomData.lastActivity || roomData.createdAt || 0;
    const isExpired = now - lastActivity > ROOM_LIFETIME_MS;

    if (isExpired) {
      await remove(ref(db, `rooms/${roomCode}`));
    }
  }
}

async function createRoom() {

if (!firebaseReady) {
  alert('Still connecting to Firebase. Try again in a second.');
  return;
}

  if (!firebaseConfigured) {
    alert('You need to paste your Firebase config into script.js first.');
    return;
  }

  const name = playerNameInput.value.trim();
  let code = roomCodeInput.value.trim().toUpperCase();

  if (!name) {
    alert('Enter your display name.');
    return;
  }

  if (!code) {
    code = makeId(6);
    roomCodeInput.value = code;
  }

  currentPlayerId = makeId(10);
  currentRoomCode = code;

  const roomRef = ref(db, `rooms/${code}`);
  const existing = await get(roomRef);
  if (existing.exists()) {
    alert('That room already exists. Use Join Room instead.');
    return;
  }

  await set(roomRef, {
    createdAt: Date.now(),
    hostId: currentPlayerId,
    turn: currentPlayerId,
    winner: null,
    askedQuestions: [],
    playerOrder: [currentPlayerId],
    rematchVotes: {},
    players: {
      [currentPlayerId]: {
        id: currentPlayerId,
        name,
        secretCharacter: null
      }
    }
  });

  await push(ref(db, `rooms/${code}/log`), {
    text: `${name} created the room.`,
    createdAt: Date.now()
  });

  connectToRoom(code);
  copyInviteBtn.classList.remove('hidden');
  
}

async function joinRoom() {

  if (!firebaseReady) {
  alert('Still connecting to Firebase. Try again in a second.');
  return;
}  

  if (!firebaseConfigured) {
    alert('You need to paste your Firebase config into script.js first.');
    return;
  }

  const name = playerNameInput.value.trim();
  const code = roomCodeInput.value.trim().toUpperCase();

  if (!name) {
    alert('Enter your display name.');
    return;
  }

  if (!code) {
    alert('Enter a room code.');
    return;
  }

  const roomRef = ref(db, `rooms/${code}`);
  const snapshot = await get(roomRef);
  if (!snapshot.exists()) {
    alert('Room not found.');
    return;
  }

  const room = snapshot.val();
  if (Object.keys(room.players || {}).length >= 2) {
    alert('This room is already full.');
    return;
  }

  currentPlayerId = makeId(10);
  currentRoomCode = code;

  await update(ref(db, `rooms/${code}`), {
    [`players/${currentPlayerId}`]: {
      id: currentPlayerId,
      name,
      secretCharacter: null
    },
    playerOrder: [...(room.playerOrder || []), currentPlayerId]
  });

  await push(ref(db, `rooms/${code}/log`), {
    text: `${name} joined the room.`,
    createdAt: Date.now()
  });

  connectToRoom(code);
  copyInviteBtn.classList.remove('hidden');
}

function connectToRoom(code) {
  gameArea.classList.remove('hidden');

  howToPlayCard.classList.add('hidden');
  topLogCard.classList.remove('hidden');

  localEliminated = new Set();

  onValue(ref(db, `rooms/${code}`), snapshot => {
    roomState = snapshot.val();
    if (!roomState) {
      setStatus('Room no longer exists.');
      return;
    }

    if (shouldResetForRematch()) {
      resetLocalBoardForRematch();
    }

    renderEverything();
  });

  onValue(ref(db, `rooms/${code}/log`), snapshot => {
    const entries = snapshot.val() || {};
    const sorted = Object.values(entries).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const logText = sorted.map(entry => entry.text).join('\n');

    log.textContent = logText;
    topLog.textContent = logText;
    log.scrollTop = log.scrollHeight;
  });
}

function shouldResetForRematch() {
  if (!roomState) return false;
  return roomState.winner === null && Array.isArray(roomState.askedQuestions) && roomState.askedQuestions.length === 0;
}

function resetLocalBoardForRematch() {
  localEliminated = new Set();
}

async function requestRematch() {
  if (!firebaseConfigured) return;
  if (!currentRoomCode || !currentPlayerId) return;
  if (!roomState?.players) return;

  const updatedVotes = {
    ...(roomState.rematchVotes || {}),
    [currentPlayerId]: true
  };

  await update(ref(db, `rooms/${currentRoomCode}`), {
    rematchVotes: updatedVotes
  });

  await push(ref(db, `rooms/${currentRoomCode}/log`), {
    text: `${getMyPlayer()?.name || 'Player'} wants a rematch.`,
    createdAt: Date.now()
  });

  const playerIds = Object.keys(roomState.players);
  const bothWantRematch = playerIds.length === 2 && playerIds.every(id => updatedVotes[id]);

  if (bothWantRematch) {
    const resetPlayers = {};
    for (const [id, player] of Object.entries(roomState.players)) {
      resetPlayers[id] = {
        ...player,
        secretCharacter: null
      };
    }

    await update(ref(db, `rooms/${currentRoomCode}`), {
      winner: null,
      askedQuestions: [],
      rematchVotes: {},
      players: resetPlayers,
      turn: roomState.playerOrder?.[0] || playerIds[0]
    });

    await push(ref(db, `rooms/${currentRoomCode}/log`), {
      text: `Rematch started. Pick new secret characters.`,
      createdAt: Date.now()
    });
  }
}

randomCodeBtn.addEventListener('click', () => {
  roomCodeInput.value = makeId(6);
});

createRoomBtn.addEventListener('click', createRoom);
joinRoomBtn.addEventListener('click', joinRoom);
guessBtn.addEventListener('click', makeGuess);
rematchBtn.addEventListener('click', requestRematch);
askCustomBtn.addEventListener('click', askCustomQuestion);
answerYesBtn.addEventListener('click', () => answerCustomQuestion(true));
answerNoBtn.addEventListener('click', () => answerCustomQuestion(false));

copyInviteBtn.addEventListener('click', async () => {
  if (!currentRoomCode) return;
  const link = getInviteLink(currentRoomCode);
  try {
    await navigator.clipboard.writeText(link);
    alert('Invite link copied.');
  } catch {
    alert('Copy failed. Invite link: ' + link);
  }
});

function applyRoomFromUrl() {
  const url = new URL(window.location.href);
  const room = url.searchParams.get('room');
  if (room) {
    roomCodeInput.value = room.toUpperCase();
  }
}

applyRoomFromUrl();
renderGuessOptions();
renderCharacters();
renderQuestions();
initializeFirebaseAuth();

if (!firebaseConfigured) {
  setStatus('Paste your Firebase config into script.js first, then deploy to GitHub Pages.');
}
