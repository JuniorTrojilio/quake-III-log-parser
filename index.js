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
    kills_by_means: {},
  };
  return game;
}

// [x] - Group the game data of each match
rl.on('line', (line) => {
  if (line.includes('InitGame')) {
    if (generalInfo.gamesAmount > 0) {
      generalInfo.allGames.push(generalInfo.currentGame);
    }

    generalInfo.gamesAmount++;
    generalInfo.currentGame = createGame(generalInfo.gamesAmount);
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
    const method = action.split('by')[1].trim();

    generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].total_kills++;

    if (killer === '<world>') {
      generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killed] = generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killed] ? generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killed] - 1 : -1;
      return;
    }

    generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killer] = generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killer] ? generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killer] + 1 : 1;

    if (!generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killed]) {
      generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills[killed] = 0;
    }

    // [x] - Plus: Generate a report of deaths grouped by death cause for each match
    generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills_by_means[method] = generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills_by_means[method] ? generalInfo.currentGame[`game_${generalInfo.gamesAmount}`].kills_by_means[method] + 1 : 1;
  }
});

rl.on('close', () => {
  console.log(util.inspect(generalInfo.allGames, false, null, true))
  console.log('file was ended!');
});

