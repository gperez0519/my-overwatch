const Alexa = require("ask-sdk-core");
const axios = require("axios");
const { responses } = require("./vocalResponses");
const momentTZ = require("moment-timezone");
const teamInfo = require("./TeamListData.json");
const heroes = require("./OverwatchHeroes.json");
const {
  getRandInteger,
  toTitleCase,
  isObjectEmpty,
} = require("./utils/genericUtils");
const {
  getHeroInfo,
  getBestHeroForComp,
  getStats,
} = require("./utils/heroUtils");
const { getPersistenceAdapter } = require("./utils/persistanceUtils");
const { configureAndReturnNextOptionSet } = require("./utils/patronUtils");

// Get an instance of the persistence adapter
let persistenceAdapter = getPersistenceAdapter();

// Overwatch Stats API by FatChan (Thomas Lynch) - NPM Package URL: https://www.npmjs.com/package/overwatch-stats-api **
const ow = require("overwatch-stats-api");

// Default parameters
const appName = "Blizzard Tavern - Overwatch";
let nickName = "my friend";
let drinkCount = 0;
let platforms = ["pc", "xbl", "psn"];
let patronAllowedDrinks = true;
let currentOptionSet = "OPTION_ONE_WITH_DRINKS";

let outputSpeech = "Something went wrong. Please try again.";

// OVERWATCH API STATS REQUIRED PARAMETERS
let battletag = "";

function isAccountLinked(handlerInput) {
  // if there is an access token, then assumed linked
  return handlerInput.requestEnvelope.session.user.accessToken === undefined;
}

const LoadAttributesRequestInterceptor = {
  async process(handlerInput) {
    const { attributesManager, requestEnvelope } = handlerInput;
    if (Alexa.isNewSession(requestEnvelope)) {
      //is this a new session? this check is not enough if using auto-delegate (more on next module)
      const persistentAttributes =
        (await attributesManager.getPersistentAttributes()) || {};
      console.log(
        "Loading from persistent storage: " +
          JSON.stringify(persistentAttributes)
      );
      //copy persistent attribute to session attributes
      attributesManager.setSessionAttributes(persistentAttributes); // ALL persistent attributtes are now session attributes
    }
  },
};

// If you disable the skill and reenable it the userId might change and you loose the persistent attributes saved below as userId is the primary key
const SaveAttributesResponseInterceptor = {
  async process(handlerInput, response) {
    if (!response) return; // avoid intercepting calls that have no outgoing response due to errors
    const { attributesManager, requestEnvelope } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const shouldEndSession =
      typeof response.shouldEndSession === "undefined"
        ? true
        : response.shouldEndSession; //is this a session end?
    if (
      shouldEndSession ||
      Alexa.getRequestType(requestEnvelope) === "SessionEndedRequest"
    ) {
      // skill was stopped or timed out
      // we increment a persistent session counter here
      sessionAttributes["sessionCounter"] = sessionAttributes["sessionCounter"]
        ? sessionAttributes["sessionCounter"] + 1
        : 1;
      // we make ALL session attributes persistent
      console.log(
        "Saving to persistent storage:" + JSON.stringify(sessionAttributes)
      );
      attributesManager.setPersistentAttributes(sessionAttributes);
      await attributesManager.savePersistentAttributes();
    }
  },
};

// This request interceptor will log all incoming requests to this lambda
const LoggingRequestInterceptor = {
  process(handlerInput) {
    console.log(
      `Incoming request: ${JSON.stringify(handlerInput.requestEnvelope)}`
    );
  },
};

// This response interceptor will log all outgoing responses of this lambda
const LoggingResponseInterceptor = {
  process(handlerInput, response) {
    console.log(`Outgoing response: ${JSON.stringify(response)}`);
  },
};

// CheckAccountLinkedHandler: This handler is always run first,
// based on the order defined in the skillBuilder.
// If no access token is present, then send the Link Account Card.
//
const CheckAccountLinkedHandler = {
  canHandle(handlerInput) {
    // If accessToken does not exist (ie, account is not linked),
    // then return true, which triggers the "need to link" card.
    // This should not be used unless the skill cannot function without
    // a linked account.  If there's some functionality which is available without
    // linking an account, do this check "just-in-time"
    return isAccountLinked(handlerInput);
  },
  handle(handlerInput) {
    const speakOutput = responses.NEED_TO_LINK_MESSAGE;
    return handlerInput.responseBuilder
      .speak("<voice name='Emma'>" + speakOutput + "</voice>")
      .withLinkAccountCard()
      .getResponse();
  },
};

//code for the handlers
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "LaunchRequest";
  },
  async handle(handlerInput) {
    // Reset certain parameters
    drinkCount = 0;
    patronAllowedDrinks = true;
    currentOptionSet = "OPTION_ONE_WITH_DRINKS";

    const { attributesManager } = handlerInput;

    // the attributes manager allows us to access session attributes
    const sessionAttributes = attributesManager.getSessionAttributes();

    // retrieve the battle net access token to check if it is still valid and to retrieve user info.
    let accessToken =
      handlerInput.requestEnvelope.context.System.user.accessToken;
    let userInfo = null;
    let options = configureAndReturnNextOptionSet(
      patronAllowedDrinks,
      currentOptionSet
    );

    // Get the updated option and set.
    currentOptionSet = options.currentOptionSet;

    let GREETING_PERSONALIZED = responses.GREETING_PERSONALIZED;
    let GREETING_PERSONALIZED_II = responses.GREETING_PERSONALIZED_II;
    let GREETING_PERSONALIZED_III = responses.GREETING_PERSONALIZED_III;

    let GREETING_PERSONALIZED_DISPLAY = responses.GREETING_PERSONALIZED_DISPLAY;
    let GREETING_PERSONALIZED_II_DISPLAY =
      responses.GREETING_PERSONALIZED_II_DISPLAY;
    let GREETING_PERSONALIZED_III_DISPLAY =
      responses.GREETING_PERSONALIZED_III_DISPLAY;

    if (accessToken == undefined) {
      // The request did not include a token, so tell the user to link
      // accounts and return a LinkAccount card
      let speechText = responses.NEED_TO_LINK_MESSAGE;

      return handlerInput.responseBuilder
        .speak(`<voice name='Emma'>${speechText}</voice>`)
        .withLinkAccountCard()
        .getResponse();
    }

    /* use the access token to query the user info
     *  Endpoint: https://us.battle.net/oauth/userinfo
     *  Params:
     *  :region us
     *  access_token {token}
     *
     */

    // if this isn't the first time the user is using the skill add their saved nick name to personalization.
    // retrieve the user's battletag
    try {
      userInfo = await axios.get(
        `https://us.battle.net/oauth/userinfo?:region=us&access_token=${accessToken}`
      );
      console.log("Blizzard user info: ", userInfo.data);
      console.log("Blizzard user battle tag: ", userInfo.data.battletag);

      if (userInfo) {
        // capture the username portion of the battletag if the session attribute for nickname does not exist.
        nickName = userInfo.data.battletag.split("#")[0];
        sessionAttributes["nickName"] = nickName;
      }
    } catch (error) {
      console.log("Error occurred getting user info: ", error);
    }

    // Reset particular session attributes
    sessionAttributes["hero-info"] = false;
    sessionAttributes["hero-role"] = "";
    sessionAttributes["hero-name"] = "";

    if (nickName != "my friend") {
      // replace the words my friend with the person's name for more personalization every time they are using the skill.
      GREETING_PERSONALIZED = GREETING_PERSONALIZED.replace(
        "my friend",
        nickName
      );
      GREETING_PERSONALIZED_II = GREETING_PERSONALIZED_II.replace(
        "my friend",
        nickName
      );
      GREETING_PERSONALIZED_III = GREETING_PERSONALIZED_III.replace(
        "my friend",
        nickName
      );

      // replace the words my friend with the person's name for more personalization every time they are using the skill.
      GREETING_PERSONALIZED_DISPLAY = GREETING_PERSONALIZED_DISPLAY.replace(
        "my friend",
        nickName
      );
      GREETING_PERSONALIZED_II_DISPLAY =
        GREETING_PERSONALIZED_II_DISPLAY.replace("my friend", nickName);
      GREETING_PERSONALIZED_III_DISPLAY =
        GREETING_PERSONALIZED_III_DISPLAY.replace("my friend", nickName);
    }

    if (sessionAttributes["sessionCounter"] > 1) {
      // replace the words welcome with welcome back for more personalization if this isn't the first time they are using the skill.
      GREETING_PERSONALIZED = GREETING_PERSONALIZED.replace(
        "Welcome",
        "Welcome back"
      );
      GREETING_PERSONALIZED_II = GREETING_PERSONALIZED_II.replace(
        "Welcome",
        "Welcome back"
      );
      GREETING_PERSONALIZED_III = GREETING_PERSONALIZED_III.replace(
        "Welcome",
        "Welcome back"
      );

      // replace the words welcome with welcome back for more personalization if this isn't the first time they are using the skill.
      GREETING_PERSONALIZED_DISPLAY = GREETING_PERSONALIZED_DISPLAY.replace(
        "Welcome",
        "Welcome back"
      );
      GREETING_PERSONALIZED_II_DISPLAY =
        GREETING_PERSONALIZED_II_DISPLAY.replace("Welcome", "Welcome back");
      GREETING_PERSONALIZED_III_DISPLAY =
        GREETING_PERSONALIZED_III_DISPLAY.replace("Welcome", "Welcome back");
    }

    // Default welcome message
    let welcomeText = `${responses.DOOR_OPEN_AUDIO} ${responses.ROWDY_BAR_AMBIANCE_AUDIO} ${GREETING_PERSONALIZED} ${responses.POUR_DRINK_AUDIO} Cheers, my friend! ${responses.GLASS_CLINK_AUDIO} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;

    // Get a random number between 1 and 3
    let randomChoice = getRandInteger(1, 4);

    // Return a random welcome message to ensure human like interaction.
    try {
      if (randomChoice == 1) {
        welcomeText = `${responses.DOOR_OPEN_AUDIO} ${responses.ROWDY_BAR_AMBIANCE_AUDIO} ${GREETING_PERSONALIZED} ${responses.POUR_DRINK_AUDIO} Cheers, my friend! ${responses.GLASS_CLINK_AUDIO} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
        displayText = `${GREETING_PERSONALIZED_DISPLAY} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
      } else if (randomChoice == 2) {
        welcomeText = `${responses.DOOR_OPEN_AUDIO} ${responses.ROWDY_BAR_AMBIANCE_AUDIO} ${GREETING_PERSONALIZED_II} ${responses.POUR_DRINK_AUDIO} Cheers, my friend! ${responses.GLASS_CLINK_AUDIO} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
        displayText = `${GREETING_PERSONALIZED_II_DISPLAY} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
      } else if (randomChoice == 3) {
        welcomeText = `${responses.DOOR_OPEN_AUDIO} ${responses.ROWDY_BAR_AMBIANCE_AUDIO} ${GREETING_PERSONALIZED_III} ${responses.POUR_DRINK_AUDIO} Cheers, my friend! ${responses.GLASS_CLINK_AUDIO} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
        displayText = `${GREETING_PERSONALIZED_III_DISPLAY} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
      }
    } catch (error) {
      console.log(
        "Something went wrong with randomization welcome message. Error: ",
        error.message
      );
    }

    // If the user doesn't say anything the system will reprompt and this is the custom message that reprompts user
    let rePromptText = `Are you going to stare at me or do you want to choose? ${responses.ANYTHING_ELSE} ${options.optionResponse}`;

    return handlerInput.responseBuilder
      .speak("<voice name='Emma'>" + welcomeText + "</voice>")
      .reprompt("<voice name='Emma'>" + rePromptText + "</voice>")
      .withSimpleCard(appName, displayText)
      .getResponse();
  },
}; // end of launch request handler

const GetMyStatsIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "GetMyStatsIntent"
    );
  },
  async handle(handlerInput) {
    outputSpeech = responses.DEFAULT_ERROR_BATTLETAG;
    const { attributesManager } = handlerInput;

    let accessToken =
      handlerInput.requestEnvelope.context.System.user.accessToken;
    let userInfo = null;
    let displayText = "";
    let options = configureAndReturnNextOptionSet(
      patronAllowedDrinks,
      currentOptionSet
    );

    // Get the updated option and set.
    currentOptionSet = options.currentOptionSet;

    if (accessToken == undefined) {
      // The request did not include a token, so tell the user to link
      // accounts and return a LinkAccount card
      let speechText = responses.NEED_TO_LINK_MESSAGE;

      return handlerInput.responseBuilder
        .speak(`<voice name='Emma'>${speechText}</voice>`)
        .withLinkAccountCard()
        .getResponse();
    }

    /* use the access token to query the user info
     *  Endpoint: https://us.battle.net/oauth/userinfo
     *  Params:
     *  :region us
     *  access_token {token}
     *
     */

    // retrieve the user's battletag
    try {
      userInfo = await axios.get(
        `https://us.battle.net/oauth/userinfo?:region=us&access_token=${accessToken}`
      );
      console.log("Blizzard user info: ", userInfo.data);
      console.log("Blizzard user battle tag: ", userInfo.data.battletag);
    } catch (error) {
      console.log("Error occurred getting user info: ", error);
    }

    let battletag_username = "";
    let battletag_number = "";

    if (userInfo) {
      battletag_username = userInfo.data.battletag.split("#")[0];
      battletag_number = userInfo.data.battletag.split("#")[1];
    }

    let rePromptText = `Well, I guess you don't find that to be very exciting but in any case I will leave you to it. Let me know if you need anything else. ${
      drinkCount > 2 ? responses.TOO_MANY_DRINKS_OPTIONS : responses.OPTIONS
    }`;

    console.log("Captured Battletag username: " + battletag_username);
    console.log("Captured Battletag number: " + battletag_number);
    // console.log("Captured Platform: " + platform);

    try {
      // send the progressive response while looking up blizzard user data.
      await callDirectiveService(handlerInput);
    } catch (err) {
      // if it failed we can continue, just the user will wait longer for first response
      console.log(
        "There was an issue attempting to send the progressive response while searching for overwatch profile of the given battletag " +
          err
      );
    }

    // CALL THE OVERWATCH STATS API TO GET THE PROFILE INFORMATION FOR THE PASSED BATTLETAG WITH PLATFORM
    if (battletag_username && battletag_number) {
      // CONCAT USERNAME DASH AND NUMBER TO GET THE STATS
      battletag = battletag_username + "-" + battletag_number;

      console.log("Full translated battletag: " + battletag);
      // console.log("Platform recognized: " + platform);

      // the attributes manager allows us to access session attributes
      const sessionAttributes = attributesManager.getSessionAttributes();

      if (!sessionAttributes["nickName"]) {
        sessionAttributes["nickName"] = battletag_username;
        nickName = sessionAttributes["nickName"];
      }

      try {
        // Retrieve player stats from my new xray scrubber of Overwatch 2 site.
        await getStats(battletag)
          .then((playerStats) => {
            if (playerStats.error) {
              outputSpeech = responses.PRIVATE_PROFILE_ISSUE;
              displayText = responses.PRIVATE_PROFILE_ISSUE;
            } else {
              outputSpeech = `Data analysis complete, ${nickName}, here is what I see.`;

              // Check if we retrieved data for the most played heroes
              if (!isObjectEmpty(playerStats.stats.mostPlayedQP)) {
                console.log(
                  "All stats data payload: ",
                  JSON.stringify(playerStats)
                );
                console.log(
                  "Most played data payload: ",
                  JSON.stringify(playerStats.stats.mostPlayedQP)
                );

                // Tell the player about their most played hero in Quick Play.
                outputSpeech += ` It seems you really enjoy playing ${playerStats.stats.mostPlayedQP} in Quickplay. `;

                // TODO: ADD WIN PERCENTAGE STAT TO GET STATS XRAY SCRUBBER UTIL FUNCTION.
                // if (
                //   stats.heroStats.quickplay[quickPlayHero].game.win_percentage
                // ) {
                //   // Tell the player about the most played hero's win percentage.
                //   outputSpeech += `Your current win percentage with this hero in Quickplay is ${stats.heroStats.quickplay[quickPlayHero].game.win_percentage}.`;
                // }

                // TODO: ADD WEAPON ACCURACY STAT TO GET STATS XRAY SCRUBBER UTIL FUNCTION.
                // Tell the player about their combat weapon accuracy for competitive if it exists
                // if (
                //   stats.heroStats.quickplay[quickPlayHero].combat
                //     .weapon_accuracy
                // ) {
                //   let quickPlayHeroWeaponAccuracy =
                //     stats.heroStats.quickplay[quickPlayHero].combat
                //       .weapon_accuracy;

                //   outputSpeech += ` Analysis shows your weapon accuracy in Quickplay with ${toTitleCase(
                //     quickPlayHero
                //   )} is ${quickPlayHeroWeaponAccuracy}! ${
                //     parseInt(quickPlayHeroWeaponAccuracy) > "50%"
                //       ? `That is actually really impressive!`
                //       : `I think you might want to practice your aim more in training to increase your chances of success.`
                //   }`;
                // }
              }

              // APPEND MOST PLAYED COMP
              if (!isObjectEmpty(playerStats.stats.mostPlayedComp)) {
                outputSpeech += `You also seem to be fond of ${playerStats.stats.mostPlayedQP} in Competitive. That hero is quite fun to play as, I can attest to that. `;
              }
              // APPEND GAMES WON

              if (!isObjectEmpty(playerStats.stats.gamesWon)) {
                outputSpeech += `Over the course of your battle <emphasis level='strong'>career</emphasis>, you have won ${
                  playerStats.stats.gamesWon
                } games. ${
                  playerStats.stats.gamesWon > 200
                    ? "Fascinating, you seem to be quite the veteran. "
                    : "It seems you are quite new to battlefield still. Keep kicking butt out there. "
                }`;
              }

              // APPEND GAMES LOST
              if (!isObjectEmpty(playerStats.stats.gamesLost)) {
                outputSpeech += `Lastly, you have suffered over ${
                  playerStats.stats.gamesLost
                } losses. ${
                  playerStats.stats.gamesWon > playerStats.stats.gamesLost
                    ? "Although, it seems your win percentage is higher. Very nice, you are quite a strong warrior I see."
                    : "Your losses seem to be greater than your wins, you should learn where your weaknesses lie and try to improve those areas."
                }`;
              }

              // Once all stats are retrieved and appended lets append the options again for the user to choose what they want to do thereafter.
              outputSpeech += ` ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
              displayText = outputSpeech;
            }
          })
          .catch((err) => {
            outputSpeech = " " + responses.OVERWATCH_STATS_NOT_AVAILABLE;
            displayText = responses.OVERWATCH_STATS_NOT_AVAILABLE;
          });
      } catch (error) {
        console.log(
          `User experienced the following error when attempt to retrieve stats: ${error.message}`
        );

        displayText = outputSpeech;
      }
    } else {
      // Battle tag and username is null
      console.log("Battle tag and username was not found for some reason");
    }

    return handlerInput.responseBuilder
      .speak(`<voice name='Emma'>${outputSpeech}</voice>`)
      .reprompt(`<voice name='Emma'>${rePromptText}</voice>`)
      .withStandardCard(
        nickName ? ` Profile Analysis` : `Your Profile Analysis`,
        displayText,
        "",
        ""
      )
      .getResponse();
  },
};

const OverwatchLeagueTeamInfoIntentIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "OverwatchLeagueTeamInfoIntent"
    );
  },
  async handle(handlerInput) {
    let teamName =
      handlerInput.requestEnvelope.request.intent.slots.teamName.value;
    let teamLogoURL = "";
    let displayText = "";
    let options = configureAndReturnNextOptionSet(
      patronAllowedDrinks,
      currentOptionSet
    );

    // Get the updated option and set.
    currentOptionSet = options.currentOptionSet;

    // X-ray Web Scraper by Matt Mueller - NPM Package URL: https://www.npmjs.com/package/x-ray **
    const xray = require("x-ray");
    const x = xray();

    try {
      if (teamName) {
        let teamNameLowerCase = teamName.toLowerCase();
        let standingsURL = "https://www.overwatchleague.com/en-us/standings/";

        if (standingsURL) {
          if (standingsURL.includes("overwatchleague")) {
            // Retrieve the JSON Overwatch League Data by method of web scraping using x-ray npm package (https://www.npmjs.com/package/x-ray)
            await x(standingsURL, "#__NEXT_DATA__")
              .then((overwatchLeagueTeamData) =>
                JSON.parse(overwatchLeagueTeamData)
              ) // parse the overwatch data as JSON
              .then((overwatchLeagueTeamData) => {
                if (overwatchLeagueTeamData.props.pageProps.blocks[1]) {
                  // get the divisions west and east objects
                  let divisions =
                    overwatchLeagueTeamData.props.pageProps.blocks[1].standings
                      .tabs[0].tables;
                  let standingsForTeamFound = false;

                  // for each division, check and filter the team in context and get the wins and losses
                  for (const division in divisions) {
                    if (Object.hasOwnProperty.call(divisions, division)) {
                      const team = divisions[division];

                      for (const currentTeam in team.teams) {
                        if (
                          Object.hasOwnProperty.call(team.teams, currentTeam)
                        ) {
                          const curTeam = team.teams[currentTeam];
                          if (curTeam.hasOwnProperty("teamName")) {
                            let curteamNameLowerCase =
                              curTeam.teamName.toLowerCase();

                            if (
                              curteamNameLowerCase.includes(teamNameLowerCase)
                            ) {
                              standingsForTeamFound = true;
                              teamName = curTeam.teamName;

                              for (const teamList in teamInfo.teamList) {
                                if (
                                  Object.hasOwnProperty.call(
                                    teamInfo.teamList,
                                    teamList
                                  )
                                ) {
                                  const team = teamInfo.teamList[teamList];
                                  if (
                                    team.name
                                      .toLowerCase()
                                      .includes(teamNameLowerCase)
                                  ) {
                                    teamLogoURL = team.logoUrl;
                                  }
                                }
                              }

                              let howTeamIsFaringThisSeason = "";
                              let currentTeamWins = parseInt(curTeam.w);
                              let currentTeamLosses = parseInt(curTeam.l);

                              if (
                                currentTeamWins == 0 &&
                                currentTeamLosses == 0
                              ) {
                                outputSpeech = `Sure, it looks like the ${curTeam.teamName} have not yet had a match this season.`;
                              } else {
                                if (currentTeamWins > currentTeamLosses) {
                                  howTeamIsFaringThisSeason =
                                    "they are doing pretty good this season.";
                                } else {
                                  howTeamIsFaringThisSeason =
                                    "oh no, they are not doing so great this season.";
                                }

                                outputSpeech = `Sure, it looks like the ${curTeam.teamName} currently has a record of ${curTeam.w} wins and ${curTeam.l} losses, ${howTeamIsFaringThisSeason}`;
                              }

                              displayText = outputSpeech;
                              break;
                            }
                          }
                        }
                      }

                      if (standingsForTeamFound) {
                        break;
                      }
                    }
                  }

                  if (standingsForTeamFound == false) {
                    outputSpeech = `I could not find that team. Please repeat the name or try the team name without the city.`;
                    displayText = outputSpeech;
                  }
                } else {
                  outputSpeech =
                    "I'm not seeing any information yet for this season. Please try again later.";
                  displayText = outputSpeech;
                }
              })
              .catch((err) => {
                outputSpeech = `${responses.OVERWATCH_LEAGUE_TEAM_SERVICE_UNAVAILABLE}`;
                displayText = `${responses.OVERWATCH_LEAGUE_TEAM_SERVICE_UNAVAILABLE_DISPLAY}`;

                console.log(err.message);
              });
          }
        }
      }
    } catch (error) {
      console.log(`Error occurred: ${error.message}`);

      return handlerInput.responseBuilder
        .speak(
          `<voice name='Emma'>${responses.OVERWATCH_LEAGUE_TEAM_SERVICE_UNAVAILABLE}</voice>`
        )
        .reprompt(
          `<voice name='Emma'>${responses.OVERWATCH_LEAGUE_TEAM_SERVICE_UNAVAILABLE}</voice>`
        )
        .getResponse();
    }

    return handlerInput.responseBuilder
      .speak(
        `<voice name='Emma'>${outputSpeech} ${responses.ANYTHING_ELSE} ${options.optionResponse}</voice>`
      )
      .reprompt(
        `<voice name='Emma'>${responses.PLEASE_REPEAT} ${responses.ANYTHING_ELSE} ${options.optionResponse}</voice>`
      )
      .withStandardCard(
        `This team's current OWL Record`,
        `${displayText} ${responses.ANYTHING_ELSE} ${options.optionResponse}`,
        teamLogoURL ? teamLogoURL : "",
        teamLogoURL ? teamLogoURL : ""
      )
      .getResponse();
  },
};

const OverwatchLeagueUpcomingMatchesIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "OverwatchLeagueUpcomingMatchesIntent"
    );
  },
  async handle(handlerInput) {
    let options = configureAndReturnNextOptionSet(
      patronAllowedDrinks,
      currentOptionSet
    );

    // Get the updated option and set.
    currentOptionSet = options.currentOptionSet;

    function retrieveOWLMatches(owlMatches, userTimeZone) {
      let matchResultInfo = "";
      let futureMatches = false;
      let recentMatches = false;

      try {
        if (owlMatches) {
          // save the upcoming matches object array
          let matches = owlMatches;

          let matchIterationCount = 1;
          let liveMatchIterationCount = 1;
          let completeMatchesCount = 0;
          let preIntroMessage = false;
          let completedPreIntroMessage = false;

          // Loop through each match and indicate the upcoming matches to the user.
          for (const match in matches) {
            if (Object.hasOwnProperty.call(matches, match)) {
              const element = matches[match];

              // Ensure the upcoming date and time is available
              if (element.startDate) {
                let eventStartDate = momentTZ
                  .utc(element.startDate)
                  .tz(userTimeZone);
                let curDateTime = momentTZ.utc().tz(userTimeZone);
                let eventStartDateOnly = momentTZ
                  .utc(element.startDate)
                  .tz("America/New_York")
                  .format("MM-DD-YYYY");
                let yesterdayDateOnly = momentTZ
                  .utc()
                  .tz("America/New_York")
                  .subtract(1, "days")
                  .format("MM-DD-YYYY");
                let curDateOnly = momentTZ
                  .utc()
                  .tz("America/New_York")
                  .format("MM-DD-YYYY");

                let eventStartDateFormatted = "";

                if (eventStartDateOnly == curDateOnly) {
                  eventStartDateFormatted =
                    eventStartDate.format("[Today] [at] LT");
                } else {
                  eventStartDateFormatted =
                    eventStartDate.format("[On] LL [at] LT");
                }

                let minutesPastEvent = curDateTime.diff(
                  eventStartDate,
                  "minutes"
                );

                // Ensure the competitors object array is available.
                if (element.competitors) {
                  let oneTeamTBD = false;
                  let leftTeamTBD = false;
                  let rightTeamTBD = false;

                  // Check to see if one or more of the teams is TBD if so change response.
                  if (
                    element.competitors[0].name == "TBD" &&
                    element.competitors[1].name == "TBD"
                  ) {
                    leftTeamTBD = true;
                    rightTeamTBD = true;
                  } else {
                    if (element.competitors[0].name == "TBD") {
                      oneTeamTBD = true;
                      leftTeamTBD = true;
                    } else if (element.competitors[1].name == "TBD") {
                      oneTeamTBD = true;
                      rightTeamTBD = true;
                    }
                  }

                  // Ensure the status of the match is available. Status can be LIVE and COMPLETED
                  if (element.status) {
                    if (
                      element.status == "PENDING" &&
                      element.isEncore == false
                    ) {
                      if (
                        element.tickets.statusText[0].value == "Online Play" ||
                        element.tickets.statusText[0].value == "Watch Now" ||
                        element.tickets.statusText[0].value == "Tickets"
                      ) {
                        // Status Text can be Online Play, Watch Now or Encore

                        if (
                          matchIterationCount == 1 &&
                          preIntroMessage == false
                        ) {
                          matchResultInfo = `I have the breakdown of the upcoming Overwatch League matches.`;
                          futureMatches = true;
                          preIntroMessage = true;
                        }

                        if (minutesPastEvent > 0 && minutesPastEvent <= 120) {
                          if (matchIterationCount == 1) {
                            matchResultInfo += ` Great News!`;
                          }
                          matchResultInfo += ` Currently, there is a match in progress. The event started ${eventStartDateFormatted}. `;
                          matchResultInfo += `The ${
                            element.competitors[0].name
                          } is currently facing the ${
                            element.competitors[1].name
                          }${
                            element.link.includes("Playoffs")
                              ? " in the playoffs!"
                              : "."
                          } Check it out now and don't miss the event.`;
                        } else {
                          matchResultInfo += ` ${eventStartDateFormatted}, `;
                          if (leftTeamTBD && rightTeamTBD) {
                            matchResultInfo += `there will be a match between two Overwatch League teams who is yet to be determined.`;
                          } else {
                            if (oneTeamTBD) {
                              if (leftTeamTBD) {
                                matchResultInfo += `the ${element.competitors[1].name} will face the team that is yet to be determined.`;
                              } else if (rightTeamTBD) {
                                matchResultInfo += `the ${element.competitors[0].name} will face the team that is yet to be determined.`;
                              }
                            } else {
                              matchResultInfo += `the ${
                                element.competitors[0].name
                              } will face the ${element.competitors[1].name}${
                                element.link.includes("Playoffs")
                                  ? " in the playoffs!"
                                  : "."
                              }`;
                            }
                          }
                        }
                        matchIterationCount++;
                      }
                    } else if (
                      element.status == "LIVE" &&
                      element.isEncore == false
                    ) {
                      if (
                        element.tickets.statusText[0].value == "Online Play" ||
                        element.tickets.statusText[0].value == "Watch Now" ||
                        element.tickets.statusText[0].value == "Tickets"
                      ) {
                        // Watch Now status text only with LIVE
                        if (
                          matchIterationCount == 1 &&
                          preIntroMessage == false
                        ) {
                          matchResultInfo = `I have the breakdown of the upcoming Overwatch League matches.`;
                          futureMatches = true;
                          preIntroMessage = true;
                        }

                        if (liveMatchIterationCount == 1) {
                          matchResultInfo += ` Great News!`;
                          matchResultInfo += ` Currently, there is a match in progress. The event started ${eventStartDateFormatted}. `;
                          matchResultInfo += `The ${
                            element.competitors[0].name
                          } is currently facing the ${
                            element.competitors[1].name
                          }${
                            element.link.includes("Playoffs")
                              ? " in the playoffs!"
                              : "."
                          } Check it out now on youtube.com/overwatchleague and don't miss the event.`;
                        } else {
                          matchResultInfo += ` There is another match in progress. The event started ${eventStartDateFormatted}. `;
                          matchResultInfo += `The ${
                            element.competitors[0].name
                          } is currently facing the ${
                            element.competitors[1].name
                          }${
                            element.link.includes("Playoffs")
                              ? " in the playoffs!"
                              : "."
                          } Check it out now on youtube.com/overwatchleague and don't miss the event.`;
                        }

                        liveMatchIterationCount++;
                        matchIterationCount++;
                      }
                    } else if (
                      ((element.status == "COMPLETED" &&
                        element.isEncore == false) ||
                        (element.status == "CONCLUDED" &&
                          element.isEncore == false)) &&
                      completeMatchesCount < 3 &&
                      (eventStartDateOnly == yesterdayDateOnly ||
                        eventStartDateOnly == curDateOnly)
                    ) {
                      if (completedPreIntroMessage == false) {
                        if (futureMatches) {
                          matchResultInfo += `It looks like there were some recent matches.`;
                        } else {
                          matchResultInfo = `It looks like there were some recent matches.`;
                        }

                        completedPreIntroMessage = true;
                        recentMatches = true;
                      }

                      if (
                        parseInt(element.scores[0]) >
                        parseInt(element.scores[1])
                      ) {
                        matchResultInfo += ` The ${
                          element.competitors[0].name
                        } defeated the ${
                          element.competitors[1].name
                        } with a score of ${element.scores[0]} to ${
                          element.scores[1]
                        }${
                          element.link.includes("Playoffs")
                            ? " in the playoffs!"
                            : "."
                        }`;
                      } else if (
                        parseInt(element.scores[0]) <
                        parseInt(element.scores[1])
                      ) {
                        matchResultInfo += ` The ${
                          element.competitors[1].name
                        } defeated the ${
                          element.competitors[0].name
                        } with a score of ${element.scores[1]} to ${
                          element.scores[0]
                        }${
                          element.link.includes("Playoffs")
                            ? " in the playoffs!"
                            : "."
                        }`;
                      } else if (
                        parseInt(element.scores[0]) ==
                        parseInt(element.scores[1])
                      ) {
                        matchResultInfo += ` The match between the ${
                          element.competitors[0].name
                        } and the ${
                          element.competitors[1].name
                        } ended in a tie with a score of ${
                          element.scores[0]
                        } to ${element.scores[1]}${
                          element.link.includes("Playoffs")
                            ? " in the playoffs!"
                            : "."
                        }`;
                      }
                      matchIterationCount++;
                      completeMatchesCount++;
                    }
                  }
                }
              }
            }
            if (matchIterationCount == 6) {
              if (matches.length > 6) {
                matchResultInfo +=
                  " There are more matches scheduled with other teams. For more information, please visit overwatchleague.com.";
              }
              break;
            }
          }
        } else {
          matchResultInfo =
            "It doesn't look like there are any upcoming Overwatch League matches yet. Please try again later.";
        }

        if (futureMatches == false && recentMatches == false) {
          matchResultInfo =
            "It doesn't look like there are any upcoming Overwatch League matches yet. Please try again later.";
        }
      } catch (error) {
        console.log(
          `Overwatch league match info retrieval error occurred: ${error.message}`
        );
        matchResultInfo = `${responses.OVERWATCH_LEAGUE_SERVICE_UNAVAILABLE}`;
      }

      return matchResultInfo;
    }

    const serviceClientFactory = handlerInput.serviceClientFactory;
    const deviceId =
      handlerInput.requestEnvelope.context.System.device.deviceId;
    let displayText = "";

    // Get the user's time zone to ensure the right time of the overwatch matches
    let userTimeZone;
    try {
      const upsServiceClient = serviceClientFactory.getUpsServiceClient();
      userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
    } catch (error) {
      if (error.name !== "ServiceError") {
        userTimeZone = "America/New_York";
      }
      console.log("Error in time zone retrieval: ", error.message);
    }

    outputSpeech = responses.OVERWATCH_LEAGUE_SERVICE_UNAVAILABLE;

    // X-ray Web Scraper by Matt Mueller - NPM Package URL: https://www.npmjs.com/package/x-ray **
    const xray = require("x-ray");
    const x = xray();

    // Retrieve the JSON Overwatch League Data by method of web scraping using x-ray npm package (https://www.npmjs.com/package/x-ray)
    await x("https://overwatchleague.com/en-us/schedule/", "#__NEXT_DATA__")
      .then((overwatchLeagueData) => JSON.parse(overwatchLeagueData)) // parse the overwatch data as JSON
      .then((overwatchLeagueData) => {
        let overwatchLeagueScheduleBlock =
          overwatchLeagueData.props.pageProps.blocks[2].schedule;
        let overwatchLeagueScheduleMatches =
          overwatchLeagueData.props.pageProps.blocks[2].schedule.tableData
            .events[0].matches;

        if (overwatchLeagueScheduleBlock) {
          if (overwatchLeagueScheduleMatches.length > 0) {
            outputSpeech = retrieveOWLMatches(
              overwatchLeagueScheduleMatches,
              userTimeZone
            );
          } else {
            outputSpeech =
              "It doesn't look like there are any upcoming Overwatch League matches yet. Please try again later.";
          }
        } else {
          outputSpeech =
            "It doesn't look like there are any upcoming Overwatch League matches yet. Please try again later.";
        }
      })
      .catch((err) => {
        outputSpeech = `${responses.OVERWATCH_LEAGUE_SERVICE_UNAVAILABLE}`;
        displayText = `${responses.OVERWATCH_LEAGUE_SERVICE_UNAVAILABLE_DISPLAY}`;
        console.log(err.message);
      });

    // Set the display text based on the output.
    // displayText = outputSpeech;

    return handlerInput.responseBuilder
      .speak(
        `<voice name='Emma'>${outputSpeech} ${responses.ANYTHING_ELSE} ${options.optionResponse}</voice>`
      )
      .reprompt(
        `<voice name='Emma'>${responses.PLEASE_REPEAT} ${responses.ANYTHING_ELSE} ${options.optionResponse}</voice>`
      )
      .withStandardCard(
        `Upcoming OWL Matches`,
        `${displayText} ${responses.ANYTHING_ELSE} ${options.optionResponse}`,
        "https://my-overwatch.s3.amazonaws.com/owl/OWL_Logo.png",
        "https://my-overwatch.s3.amazonaws.com/owl/OWL_Logo_Large.png"
      )
      .getResponse();
  },
};

const RandomRoleHeroGeneratorIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "RandomRoleHeroGeneratorIntent"
    );
  },
  handle(handlerInput) {
    let role = handlerInput.requestEnvelope.request.intent.slots.role.value;

    // force lowercase of role spoken.
    role = role.toLowerCase();

    let displayText = "";
    let options = configureAndReturnNextOptionSet(
      patronAllowedDrinks,
      currentOptionSet
    );

    // Get the updated option and set.
    currentOptionSet = options.currentOptionSet;

    console.log(`Role spoken was: ${role}`);

    if (role == "dps") {
      role = "damage";
    } else if (role == "healer") {
      role = "support";
    }

    let heroPicURL = "";
    outputSpeech = `${responses.OVERWATCH_HERO_SERVICE_UNAVAILABLE} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
    displayText = `${responses.OVERWATCH_HERO_SERVICE_UNAVAILABLE_DISPLAY} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;

    const { attributesManager } = handlerInput;

    // the attributes manager allows us to access session attributes
    const sessionAttributes = attributesManager.getSessionAttributes();

    try {
      if (heroes.role[0][role]) {
        // Generate random choice
        randomChoice = getRandInteger(0, heroes.role[0][role].length);

        // Get the hero name from random choice
        let heroName = heroes.role[0][role][randomChoice].name;

        // Get the hero portrait url from random choice
        heroPicURL = heroes.role[0][role][randomChoice].portraitURL;

        // Suggested random hero.
        outputSpeech = `The ${role} hero you should play is ${heroName}.`;
        displayText = outputSpeech;

        sessionAttributes["hero-info"] = true;
        sessionAttributes["hero-role"] = role;
        sessionAttributes["hero-name"] = heroName;
      }
    } catch (error) {
      outputSpeech = `${responses.OVERWATCH_HERO_SERVICE_UNAVAILABLE} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
      displayText = `${responses.OVERWATCH_HERO_SERVICE_UNAVAILABLE_DISPLAY} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
      console.log(error.message);
      return handlerInput.responseBuilder
        .speak(`<voice name='Emma'>${outputSpeech}</voice>`)
        .reprompt(`<voice name='Emma'>${outputSpeech}</voice>`)
        .getResponse();
    }

    return handlerInput.responseBuilder
      .speak(
        `<voice name='Emma'>${outputSpeech} ${responses.HERO_MORE_INFO_PROMPT}</voice>`
      )
      .reprompt(
        `<voice name='Emma'>${responses.PLEASE_REPEAT} ${responses.HERO_MORE_INFO_PROMPT}</voice>`
      )
      .withStandardCard(
        sessionAttributes["hero-name"]
          ? `Random Hero: ${sessionAttributes["hero-name"]}`
          : `Random Hero`,
        `${displayText} ${responses.HERO_MORE_INFO_PROMPT}`,
        heroPicURL ? heroPicURL : "",
        heroPicURL ? heroPicURL : ""
      )
      .getResponse();
  },
};

const SomethingElseOptionsIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "SomethingElseOptionsIntent"
    );
  },
  handle(handlerInput) {
    let options = configureAndReturnNextOptionSet(
      patronAllowedDrinks,
      currentOptionSet
    );

    // Get the updated option and set.
    currentOptionSet = options.currentOptionSet;

    outputSpeech = `Sure, ${options.optionResponse}`;

    return handlerInput.responseBuilder
      .speak(`<voice name='Emma'>${outputSpeech}</voice>`)
      .reprompt(
        `<voice name='Emma'>${responses.PLEASE_REPEAT} ${options.optionResponse}</voice>`
      )
      .withStandardCard(`Other Options`, outputSpeech, "", "")
      .getResponse();
  },
};

const AnotherDrinkIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AnotherDrinkIntent"
    );
  },
  handle(handlerInput) {
    drinkCount++;
    console.log(`Current drink count: ${drinkCount}`);
    let displayText = "";
    let options = configureAndReturnNextOptionSet(
      patronAllowedDrinks,
      currentOptionSet
    );

    // Get the updated option and set.
    currentOptionSet = options.currentOptionSet;

    let speechText = `Sure, you've got it my friend! Coming right up! ${responses.POUR_DRINK_AUDIO} Cheers! ${responses.GLASS_CLINK_AUDIO} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
    displayText = `Sure, you've got it my friend! Coming right up! Cheers! ${responses.ANYTHING_ELSE} ${options.optionResponse}`;

    // Check to see which current set we are on and set that option.

    // Serve up the drinks but limit them based on the amount of drinks they've had already.
    if (drinkCount == 1) {
      speechText = `Sure, you've got it my friend! Coming right up! ${responses.POUR_DRINK_AUDIO} Cheers! ${responses.GLASS_CLINK_AUDIO} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
      displayText = `Sure, you've got it my friend! Coming right up! Cheers! ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
    } else if (drinkCount == 2) {
      speechText = `Here's another round my friend. ${responses.POUR_DRINK_AUDIO} Cheers, to great friends! ${responses.GLASS_CLINK_AUDIO} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
      displayText = `Here's another round my friend. Cheers, to great friends! ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
    } else if (drinkCount == 3) {
      patronAllowedDrinks = false;

      // update option set for no drinks
      options = configureAndReturnNextOptionSet(
        patronAllowedDrinks,
        currentOptionSet
      );

      // Get the updated option and set.
      currentOptionSet = options.currentOptionSet;

      speechText = `Whoa, another one? Thirsty aren't we. Sure, you've got it my friend! Coming right up! Although, I want you conscious for our conversation you know. ${responses.POUR_DRINK_AUDIO} Cheers, to friends and great battles! ${responses.GLASS_CLINK_AUDIO} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
      displayText = `Whoa, another one? Thirsty aren't we. Sure, you've got it my friend! Coming right up! Although, I want you conscious for our conversation you know. Cheers, to friends and great battles! ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
    } else if (drinkCount > 3) {
      speechText = `I apologize my friend, I cannot in all good conscience allow you to drink that much. ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
      displayText = speechText;
    }

    return handlerInput.responseBuilder
      .speak(`<voice name='Emma'>${speechText}</voice>`)
      .reprompt(
        `<voice name='Emma'>${responses.PLEASE_REPEAT} ${speechText}</voice>`
      )
      .withStandardCard(`Cheers!`, displayText, "", "")
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    let displayText = "";
    let options = configureAndReturnNextOptionSet(
      patronAllowedDrinks,
      currentOptionSet
    );

    // Get the updated option and set.
    currentOptionSet = options.currentOptionSet;

    // Default Help Message.
    outputSpeech = `${responses.HELP_PROMPT} ${options.optionResponse}`;
    displayText = `${responses.HELP_PROMPT_DISPLAY} ${options.optionResponse}`;

    console.log("User asked for help.");

    return handlerInput.responseBuilder
      .speak(`<voice name='Emma'>${outputSpeech}</voice>`)
      .reprompt(
        `<voice name='Emma'>${responses.HELP_REPEAT_PROMPT} ${options.optionResponse}</voice>`
      )
      .withStandardCard(`Need Help?`, displayText, "", "")
      .getResponse();
  },
};

const YesIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.YesIntent"
    );
  },
  handle(handlerInput) {
    const { attributesManager } = handlerInput;

    // the attributes manager allows us to access session attributes
    const sessionAttributes = attributesManager.getSessionAttributes();
    let displayText = "";
    let options = configureAndReturnNextOptionSet(
      patronAllowedDrinks,
      currentOptionSet
    );

    // Get the updated option and set.
    currentOptionSet = options.currentOptionSet;

    // default response
    outputSpeech = `I'm not sure what you are saying yes to but let's start with an option. ${options.optionResponse}`;
    displayText = outputSpeech;

    // check to see if session attributes object exists.
    if (sessionAttributes) {
      // if they are responding yes to retrieving more information about the hero in context then retrieve that info and respond back.
      if (
        sessionAttributes["hero-info"] &&
        sessionAttributes["hero-role"] &&
        sessionAttributes["hero-name"]
      ) {
        outputSpeech = `${getHeroInfo(
          sessionAttributes["hero-name"],
          sessionAttributes["hero-role"],
          heroes
        )} ${responses.ANYTHING_ELSE} ${options.optionResponse}`;
        displayText = outputSpeech;
      }
    }

    return handlerInput.responseBuilder
      .speak(`<voice name='Emma'>${outputSpeech}</voice>`)
      .reprompt(
        `<voice name='Emma'>${responses.PLEASE_REPEAT} ${options.optionResponse}</voice>`
      )
      .withStandardCard(`Requested Info`, displayText, "", "")
      .getResponse();
  },
};

const NoIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.NoIntent"
    );
  },
  handle(handlerInput) {
    // // the attributes manager allows us to access session attributes
    // const sessionAttributes = attributesManager.getSessionAttributes();
    let options = configureAndReturnNextOptionSet(
      patronAllowedDrinks,
      currentOptionSet
    );

    // Get the updated option and set.
    currentOptionSet = options.currentOptionSet;

    return handlerInput.responseBuilder
      .speak(
        `<voice name='Emma'>Very well, ${responses.ANYTHING_ELSE} ${options.optionResponse}</voice>`
      )
      .reprompt(
        `<voice name='Emma'>${responses.PLEASE_REPEAT} ${options.optionResponse}</voice>`
      )
      .withStandardCard(
        `Options`,
        `${responses.ANYTHING_ELSE} ${options.optionResponse}`,
        "",
        ""
      )
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name ===
        "AMAZON.CancelIntent" ||
        handlerInput.requestEnvelope.request.intent.name ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    let speechText = `<voice name="Emma">${responses.GOODBYE}</voice>`;
    let displayText = `${responses.GOODBYE}`;

    try {
      const { attributesManager } = handlerInput;

      // the attributes manager allows us to access session attributes
      const sessionAttributes = attributesManager.getSessionAttributes();

      // if this isn't the first time the user is using the skill add their saved nick name to personalization.
      if (sessionAttributes["nickName"]) {
        nickName = sessionAttributes["nickName"];

        // replace the words my friend with the person's name for more personalization if this isn't the first time they are using the skill.
        speechText = speechText.replace("my friend", nickName);
      }

      console.log("User left tavern");
    } catch (error) {
      console.log(
        `Error occurred in the stop and cancel intent: ${error.message}`
      );
    }

    return handlerInput.responseBuilder
      .speak(speechText)
      .withStandardCard(
        `Thanks for coming! Until Next Time!`,
        `${displayText}`,
        "",
        ""
      )
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    console.log(
      `Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`
    );

    if (handlerInput.requestEnvelope.request.error) {
      console.log(
        `Session ended with error: ${handlerInput.requestEnvelope.request.error.message}`
      );
    }

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    let options = configureAndReturnNextOptionSet(
      patronAllowedDrinks,
      currentOptionSet
    );

    // Get the updated option and set.
    currentOptionSet = options.currentOptionSet;

    return handlerInput.responseBuilder
      .speak(
        `<voice name='Emma'>${responses.ERROR_PROMPT}, ${responses.ANYTHING_ELSE} ${options.optionResponse}</voice>`
      )
      .reprompt(
        `<voice name='Emma'>${responses.ERROR_PROMPT}, ${responses.ANYTHING_ELSE} ${options.optionResponse}</voice>`
      )
      .withStandardCard(
        `My apologies, something went wrong!`,
        `${responses.ERROR_PROMPT_DISPLAY}, ${responses.ANYTHING_ELSE} ${options.optionResponse}`,
        "",
        ""
      )
      .getResponse();
  },
};

const FallbackIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "AMAZON.FallbackIntent"
    );
  },

  handle(handlerInput) {
    let options = configureAndReturnNextOptionSet(
      patronAllowedDrinks,
      currentOptionSet
    );

    // Get the updated option and set.
    currentOptionSet = options.currentOptionSet;

    return handlerInput.responseBuilder
      .speak(
        `<voice name='Emma'>${responses.FALLBACK_PROMPT} ${responses.ANYTHING_ELSE} ${options.optionResponse}</voice>`
      )
      .reprompt(
        `<voice name='Emma'>${responses.FALLBACK_PROMPT} ${responses.ANYTHING_ELSE} ${options.optionResponse}</voice>`
      )
      .withStandardCard(
        `My apologies, something went wrong!`,
        `${responses.FALLBACK_PROMPT} ${responses.ANYTHING_ELSE} ${options.optionResponse}`,
        "",
        ""
      )
      .getResponse();
  },
};

/** BUILT-IN FUNCTIONS **/
function callDirectiveService(handlerInput) {
  // Call Alexa Directive Service.
  const requestEnvelope = handlerInput.requestEnvelope;
  const directiveServiceClient =
    handlerInput.serviceClientFactory.getDirectiveServiceClient();

  const requestId = requestEnvelope.request.requestId;
  const endpoint = requestEnvelope.context.System.apiEndpoint;
  const token = requestEnvelope.context.System.apiAccessToken;

  // build the progressive response directive
  const directive = {
    header: {
      requestId,
    },
    directive: {
      type: "VoicePlayer.Speak",
      speech: `<voice name='Emma'>${responses.PROGRESSIVE_RESPONSE}</voice>`,
    },
  };

  // send directive
  return directiveServiceClient.enqueue(directive, endpoint, token);
}

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .withSkillId("amzn1.ask.skill.9956ae31-282b-4ab3-b675-080acd9b0bed")
  .addRequestHandlers(
    CheckAccountLinkedHandler,
    LaunchRequestHandler,
    SomethingElseOptionsIntentHandler,
    GetMyStatsIntentHandler,
    OverwatchLeagueUpcomingMatchesIntentHandler,
    OverwatchLeagueTeamInfoIntentIntentHandler,
    RandomRoleHeroGeneratorIntentHandler,
    AnotherDrinkIntentHandler,
    HelpIntentHandler,
    YesIntentHandler,
    NoIntentHandler,
    FallbackIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(
    LoggingRequestInterceptor,
    LoadAttributesRequestInterceptor
  )
  .addResponseInterceptors(
    LoggingResponseInterceptor,
    SaveAttributesResponseInterceptor
  )
  .withPersistenceAdapter(persistenceAdapter)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();
