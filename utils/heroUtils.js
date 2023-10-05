const { isObjectEmpty } = require("./genericUtils");

function getHeroInfo(heroName, heroRole, heroes) {
  try {
    var filteredArray = null;
    var outputSpeech = "";
    let abilitiesLength = "";
    let heroDescription = "";
    let heroAbilities = null;

    // Filter the hero from the roles array in json file based on given hero name and hero role.
    filteredArray = heroes.role[0][heroRole].filter(function (itm) {
      return itm.name == heroName;
    });

    // if the filtered array has data respond back with the hero description and abilities.
    if (filteredArray) {
      heroDescription = filteredArray[0].heroDescription;
      heroAbilities = filteredArray[0].abilities;
      abilitiesLength = filteredArray[0].abilities.length;

      outputSpeech = heroDescription;
      outputSpeech += ` ${heroName} has over ${abilitiesLength} abilities. `;
      heroAbilities.map((ability, index) => {
        if (index == abilitiesLength - 1) {
          outputSpeech += `And finally the ultimate ability, `;
        }
        outputSpeech += `${ability.name}. ${ability.description} `;
      });
    }
  } catch (error) {
    console.log(error.message);
    return outputSpeech;
  }

  return outputSpeech;
}

function getBestHeroForComp(
  mostPlayedHero,
  mostPlayedWinPercentage,
  compHeroes
) {
  var bestHeroToPlay = null;
  var iter = 0;
  var bestWinPercentage = "0";
  var bestHero = "";

  for (var hero in compHeroes) {
    // Bypass first key as it is not hero specific.
    if (iter == 0) {
      iter++;
      continue;
    }

    // Check if current hero has games won and use them to check win percentage.
    if (!!compHeroes[hero].game.games_won) {
      if (compHeroes[hero].game.games_won > 0) {
        // if current hero in context is most played we can skip this since we are need alt hero with better win percentage if found.
        if (hero == mostPlayedHero) {
          continue;
        }

        // Check if last win percentage captured is better than current win percentage in context and if so capture hero and win percentage.
        if (
          parseInt(bestWinPercentage) <
          parseInt(compHeroes[hero].game.win_percentage)
        ) {
          bestWinPercentage = compHeroes[hero].game.win_percentage;
          bestHero = hero;
        }
      }
    }
  }

  // If the win percentage found is better than the most played heros win percentage, suggest the new found hero.
  if (parseInt(bestWinPercentage) > parseInt(mostPlayedWinPercentage)) {
    bestHeroToPlay = {
      hero: bestHero,
      win_percentage: bestWinPercentage,
    };
  }

  return bestHeroToPlay;
}

function getPlayerRank(heroType) {
  let outputSpeech = "";

  // Check if rank is empty which means they haven't placed and return a message to place for the current season.
  if (!isObjectEmpty(heroType)) {
    if (heroType.sr >= 4000) {
      outputSpeech = `you are currently ranked Grandmaster at ${heroType.sr}!`;
    } else if (heroType.sr >= 3500 && heroType.sr < 3999) {
      outputSpeech = `you are currently ranked Master at ${heroType.sr}, ${
        heroType.sr > 3950
          ? "you are very close to Grandmaster rank. Amazing! Keep pushing"
          : "you got a ways to go to get to Grandmaster rank. Amazing! Keep pushing"
      }!`;
    } else if (heroType.sr >= 3000 && heroType.sr < 3499) {
      outputSpeech = `you are currently ranked Diamond at ${heroType.sr}, ${
        heroType.sr > 3450
          ? "you are very close to Master rank. Almost there my friend, keep going"
          : "you got a ways to go to get to Master rank. Almost there my friend, keep going"
      }!`;
    } else if (heroType.sr >= 2500 && heroType.sr < 2999) {
      outputSpeech = `you are currently ranked Platinum at ${heroType.sr}, ${
        heroType.sr > 2950
          ? "you are very close to Diamond rank. Amazing! Keep pushing"
          : "you got a ways to go to get to Diamond rank. Amazing! Keep pushing"
      }!`;
    } else if (heroType.sr >= 2000 && heroType.sr < 2499) {
      outputSpeech = `you are currently ranked Gold at ${heroType.sr}, ${
        heroType.sr > 2450
          ? "you are very close to Platinum rank. Almost there my friend, keep going"
          : "you got a ways to go to get to Platinum rank. Almost there my friend, keep going"
      }!`;
    } else if (heroType.sr >= 1500 && heroType.sr < 1999) {
      outputSpeech = `you are currently ranked Silver at ${heroType.sr}, ${
        heroType.sr > 1950
          ? "you are very close to Gold rank. Amazing! Keep pushing"
          : "you got a ways to go to get to Gold rank. Amazing! Keep pushing"
      }!`;
    } else {
      outputSpeech = `you are currently ranked Bronze at ${heroType.sr}, ${
        heroType.sr > 1450
          ? "you are very close to Silver rank. Almost there my friend, keep going"
          : "you got a ways to go to get to Silver rank. Almost there my friend, keep going"
      }!`;
    }
  }

  return outputSpeech;
}

module.exports = {
  getHeroInfo,
  getBestHeroForComp,
  getPlayerRank,
};
