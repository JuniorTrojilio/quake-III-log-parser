import fs from 'fs';
import readline from 'readline';
import util from 'util';

// [x] - read log file
const rl = readline.createInterface({
  input: fs.createReadStream('./log.txt'),
  output: process.stdout,
  terminal: false,
});

const generalInfo = {
  gamesAmount: 0,
  currentGame: {},
  allGames: [],
}

function createGame(index) {
  const game = {};
  game[`game_${index}`] = {
    total_kills: 0,
    players: [],
    kills: {},
    events: [],
  };
  return game;
}

// [x] - Group the game data of each match
rl.on('line', (line) => {
  if (line.includes('InitGame')) {
    if (generalInfo.gamesAmount > 0) {

      if (!generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].events.includes('successfully_finished')) {
        generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].events.push('unexpected_close');
      }

      generalInfo.allGames.push(generalInfo.currentGame);
    }

    generalInfo.gamesAmount++;
    generalInfo.currentGame = createGame(generalInfo.gamesAmount);
    generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].events.push('successfully_started');
  }

  if (line.includes('ClientUserinfoChanged')) {
    const player = line.split('\\')[1];
    if (!generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].players.includes(player)) {
      generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].players.push(player);
    }
  }

  // [x] - Collect kill data
  if (line.includes('Kill')) {
    const [event, action] = line.split('killed');
    const killer = event.split(':')[3].trim();
    const killed = action.split('by')[0].trim();

    generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].total_kills++;

    if (killer === '<world>') {
      generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killed] = generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killed] ? generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killed] - 1 : -1;
      return;
    }

    generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killer] = generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killer] ? generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killer] + 1 : 1;

    if (!generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killed]) {
      generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killed] = 0;
    }
  }

  if (line.includes('ShutdownGame')) {
    generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].events.push('successfully_finished');
  }
});

rl.on('close', () => {
  console.log(util.inspect(generalInfo.allGames, false, null, true))
  console.log('file was ended!');
});

