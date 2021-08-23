const Alexa = require('ask-sdk-core');
const axios = require('axios');

// Overwatch Stats API by FatChan (Thomas Lynch) - NPM Package URL: https://www.npmjs.com/package/overwatch-stats-api **
const ow = require('overwatch-stats-api');

// Default parameters
const appName = 'My Overwatch';
let nickName = "my friend";
let drinkCount = 0;
let platforms = [
    "pc",
    "xbl",
    "psn"
];

/** OVERWATCH GENERAL RESPONSES **/
const responses = {
    GREETING: "Welcome to My Overwatch! We can tell you your stats of your Overwatch progress. Say get my stats to hear your stats of your Overwatch profile.",
    GREETING_PERSONALIZED: `Welcome ${nickName} to Blizz Tavern! Please, have a seat and take a load off! Here's a round on the house!`,
    GREETING_PERSONALIZED_II: `<prosody volume="x-loud">Hey you miscreants! You throw another chair and I'll toss you out myself!</prosody> Oh hey there my friend! Welcome to Blizz Tavern! You must be exhausted, drinks are <emphasis level="reduced">on</emphasis> me!`,
    GREETING_PERSONALIZED_III: `<prosody volume="x-loud">Hey Jack! don't make me come back there!</prosody> Oh hey, sorry about that. Some people get a little <emphasis level="moderate">rowdy</emphasis>, a round here. Welcome to Blizz Tavern! You must be exhausted. Here, drinks are on me!`,
    OPTIONS: `Now, what can I do for you? Would you like another drink, do you want to see how your Overwatch progress is going, or would you like to leave the tavern?`,
    TOO_MANY_DRINKS_OPTIONS: `Now. What can I do for you? Would you like to see how your Overwatch progress is going, or are you looking to leave the tavern?`,
    ALTERNATE_OPTIONS: `Amazing thus far. Now, what can I do for you? Would you like another drink, do you want to check up on your Overwatch progress again, or do you want to leave the tavern?`,
    YOU_ARE_WELCOME: "Not a problem at all my friend! How have you been faring?",
    RANK_PERSONALIZED_BEGIN: "Sure, let me check my data analysis unit. Let's see here.",
    GREETING_RESPONSE: "I'm doing just well. I'm glad that you are here!",
    NEED_TO_LINK_MESSAGE: 'Before we can continue, you will need to link your account to the My Overwatch skill using the card that I have sent to the Alexa app.',
    TOP_MENU: "Great! We can tell you your stats of your Overwatch progress. Say get my stats to hear your stats of your Overwatch profile.",
    OVERWATCH_SERVICE_UNAVAILABLE: "Oh no! The My Overwatch service is not available at the moment. Please try again later.",
    PLEASE_WAIT: "Please wait while we try to retrieve that profile information",
    PLACEMENTS_NOT_COMPLETE: "You have not placed yet in this Competitive season. Make sure you do so in order to hear about your ranking info.",
    GOODBYE: `You are always welcome here my friend! If you have some time, please leave us a rating on the My Overwatch skill in the skill store. We would appreciate it greatly.
             Stop by Blizz tavern next time and we can catch up again. Good luck in your battles!`,
    DEFAULT_ERROR_BATTLETAG: "Strange, My data analysis unit is not finding your information. No worries, we can try again later.",
    DEFAULT_ERROR_PLATFORM: "Sorry, we did not recognize that platform. Please say either Xbox, PC, or Playstation.",
    PLATFORM_INQUIRY: "Great! Which platform do you want to get your stats for? Xbox, PC or Playstation?",
    PLEASE_REPEAT: "Sorry, we did not hear from you.",
    ANYTHING_ELSE: "Is there anything else that you would like to know?",
    POUR_DRINK_AUDIO: "<audio src='soundbank://soundlibrary/household/water/pour_water_01'/>",
    DOOR_OPEN_AUDIO: "<audio src='soundbank://soundlibrary/home/amzn_sfx_door_open_01'/>",
    GLASS_CLINK_AUDIO: "<audio src='soundbank://soundlibrary/glass/clink/glasses_clink_04'/>",
    ROWDY_BAR_AMBIANCE_AUDIO: "<audio src='soundbank://soundlibrary/ambience/amzn_sfx_crowd_bar_rowdy_01'/>"
}

/** CUSTOM FUNCTIONS **/
function isObjectEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

/** COOL OVERWATCH SOUND EFFECTS **/
const hero_sound = {
    SOLDIER76: "",
    HANZO: "https://my-overwatch.s3.amazonaws.com/Hanzo.mp3"
}


//let card = 'Something went wrong. Please try again.';
let outputSpeech = 'Something went wrong. Please try again.';

// OVERWATCH API STATS REQUIRED PARAMETERS
let battletag = '';

function isAccountLinked(handlerInput) {
    // if there is an access token, then assumed linked
    return (handlerInput.requestEnvelope.session.user.accessToken === undefined);
}
    
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
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {

        // welcome message
        let welcomeText = `${responses.DOOR_OPEN_AUDIO} ${responses.ROWDY_BAR_AMBIANCE_AUDIO} ${responses.GREETING_PERSONALIZED} ${responses.POUR_DRINK_AUDIO} Cheers, my friend! ${responses.GLASS_CLINK_AUDIO} ${responses.OPTIONS}`;

        // Get a random number between 1 and 3
        let randomChoice = getRndInteger(1,4);

        // return a random welcome message to ensure human like interaction.
        try {
            if (randomChoice == 1){
                welcomeText = responses.DOOR_OPEN_AUDIO + responses.ROWDY_BAR_AMBIANCE_AUDIO + responses.GREETING_PERSONALIZED + responses.POUR_DRINK_AUDIO + "Cheers, my friend!" + responses.GLASS_CLINK_AUDIO + responses.OPTIONS;
            } else if (randomChoice == 2) {
                welcomeText = responses.DOOR_OPEN_AUDIO + responses.ROWDY_BAR_AMBIANCE_AUDIO + responses.GREETING_PERSONALIZED_II + responses.POUR_DRINK_AUDIO + "Cheers, my friend!" + responses.GLASS_CLINK_AUDIO + responses.OPTIONS;
            } else if (randomChoice == 3) {
                welcomeText = responses.DOOR_OPEN_AUDIO + responses.ROWDY_BAR_AMBIANCE_AUDIO + responses.GREETING_PERSONALIZED_III + responses.POUR_DRINK_AUDIO + "Cheers, my friend!" + responses.GLASS_CLINK_AUDIO + responses.OPTIONS;
            }
        } catch (error) {
            console.log("Something went wrong with randomization welcome message. Error: ", error.message);
        }
        

        let rePromptText = `Are you going to stare at me or do you want to choose? ${responses.OPTIONS}`;

        // welcome screen message
        let displayText = responses.GREETING_PERSONALIZED;

        return handlerInput.responseBuilder
            .speak("<voice name='Emma'>" + welcomeText + "</voice>")
            .reprompt("<voice name='Emma'>" + rePromptText + "</voice>")
            .withSimpleCard(appName, displayText)
            .getResponse();
    }
}; // end of launch request handler

const GetMyStatsIntentHandler = {
    canHandle(handlerInput) {
        return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetMyStatsIntent');
    },
    async handle(handlerInput) {
        outputSpeech = responses.DEFAULT_ERROR_BATTLETAG;
        //let intent = handlerInput.requestEnvelope.request.intent;

        //let platformVal = intent.slots.platform.value;
        //let battletag_username = intent.slots.battletag_username.value;
        //let battletag_number = intent.slots.battletag_number.value;

        var accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
        var userInfo = null;

        if (accessToken == undefined){
            // The request did not include a token, so tell the user to link
            // accounts and return a LinkAccount card
            var speechText = responses.NEED_TO_LINK_MESSAGE;

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

        try {
            userInfo = await axios.get(`https://us.battle.net/oauth/userinfo?:region=us&access_token=${accessToken}`);
                console.log("Blizzard user info: ",userInfo.data);
                console.log("Blizzard user battle tag: ",userInfo.data.battletag);

        } catch(error) {
            console.log("Error occurred getting user info: ", error);
        }

        let battletag_username = "";
        let battletag_number = "";

        if (userInfo) {
            battletag_username = userInfo.data.battletag.split("#")[0];
            battletag_number = userInfo.data.battletag.split("#")[1];
        }

        let rePromptText = `Well, I guess you don't find that to be very exciting but in any case I will leave you to it. Let me know if you need anything else. ${drinkCount > 3 ? responses.TOO_MANY_DRINKS_OPTIONS : responses.OPTIONS}`;

        console.log("Captured Battletag username: " + battletag_username);
        console.log("Captured Battletag number: " + battletag_number);
        // console.log("Captured Platform: " + platform);

        try {
            // send the progressive response while looking up blizzard user data.
            await callDirectiveService(handlerInput);
        } catch (err) {

            // if it failed we can continue, just the user will wait longer for first response
            console.log("There was an issue attempting to send the progressive response while searching for overwatch profile of the given battletag " + err);
        }

        // CALL THE OVERWATCH STATS API TO GET THE PROFILE INFORMATION FOR THE PASSED BATTLETAG WITH PLATFORM
        if (battletag_username && battletag_number) {

            // CONCAT USERNAME DASH AND NUMBER TO GET THE STATS
            battletag = battletag_username + "-" + battletag_number;

            console.log("Full translated battletag: " + battletag);
            // console.log("Platform recognized: " + platform);

            nickName = battletag_username;

            var stats = null;
            var mostPlayed = null;

            // loop through rest of platforms.
            for (const platform in platforms){
                try {
                    // get all stats for the given user
                    stats = await ow.getAllStats(battletag, platforms[platform]);

                    // get most played heroes per given user
                    mostPlayed = await ow.getMostPlayed(battletag, platforms[platform]);

                    break;
                } catch (error) {
                    if (error.message.indexOf("PROFILE_PRIVATE") >= 0){
                        outputSpeech = `${nickName}. I would love to tell you how your Overwatch progress is going but it seems your profile is private. You should set your profile public so my analysis is able to retrieve the data we need.`;
                    } else {
                        outputSpeech = `${nickName}. I would love to tell you how your Overwatch progress is going but it seems my analyzer is not functioning at the moment. The error I see here is ${error.message}. Try again later.`;
                    }
                    
                }
            }

            try {

                // Check if stats are retrieved for the player
                if (isObjectEmpty(stats)) {
                    outputSpeech = " " + responses.OVERWATCH_SERVICE_UNAVAILABLE;
                } else {

                    outputSpeech = `${nickName},`;

                    // Get the players current level and prestige.
                    outputSpeech += ` you are currently level ${stats.level} at prestige ${stats.prestige}.`;

                    if (stats.prestige != "") {
                        if (stats.prestige > 3) {
                            outputSpeech += ` Whoa, a veteran of Overwatch? Very cool!`;
                        }
                    }
                    
                    // Check if player has ranked otherwise let them know they need to place to know their rank.
                    if (!isObjectEmpty(stats.rank)){
                        
                        outputSpeech += ` Lets see here about your rank. Ahh, interesting,`;

                        // Get the tank ranking if placed otherwise don't append response.
                        if (!!stats.rank.tank) {
                            outputSpeech += ` For the tank role ${getPlayerRank(stats.rank.tank)},`;
                        }

                        // Get the damage ranking if placed otherwise don't append response.
                        if (!!stats.rank.damage) {
                            outputSpeech += ` For the damage role ${getPlayerRank(stats.rank.damage)},`;
                        }

                        // Get the healer ranking if placed otherwise don't append response.
                        if (!!stats.rank.healer) {
                            outputSpeech += ` For the healer role ${getPlayerRank(stats.rank.healer)},`;
                        }
                        
                    } else {
                        outputSpeech = " " + responses.PLACEMENTS_NOT_COMPLETE;
                    }

                    // Check if we retrieved data for the most played heroes
                    if (isObjectEmpty(mostPlayed)) {
                        outputSpeech = responses.OVERWATCH_SERVICE_UNAVAILABLE;
                    } else {
                        console.log("All stats data payload: ", JSON.stringify(stats));
                        console.log("Most played data payload: ", JSON.stringify(mostPlayed));

                        let quickPlayHero = Object.keys(mostPlayed.quickplay)[0];

                        // Tell the player about their most played hero in Quick Play.
                        outputSpeech += ` It seems you really enjoy playing ${toTitleCase(quickPlayHero)} in Quickplay. `;

                        // Tell the player about the most played hero's win percentage.
                        outputSpeech += `Your current win percentage with this hero in Quickplay is ${stats.heroStats.quickplay[quickPlayHero].game.win_percentage}.`;

                        // Check if there are stats for competitive, if there aren't the player doesn't compete
                        if (!!stats.heroStats.competitive) {
                            let mostPlayedCompetitiveHero = Object.keys(mostPlayed.competitive)[0];
                            let statsCompHeroWinPercentage = stats.heroStats.competitive[mostPlayedCompetitiveHero].game.win_percentage;

                            outputSpeech += ` Also, it seems you really enjoy playing ${toTitleCase(mostPlayedCompetitiveHero)} in Competitive. `;
                            outputSpeech += `Your current win percentage with this hero in Competitive is ${statsCompHeroWinPercentage}.`;

                            // Check to see if the hero in competitive the user plays the most has the best win percentage, if not suggest the hero with better win percentage.
                            var suggestedCompHero = getBestHeroForComp(mostPlayedCompetitiveHero, statsCompHeroWinPercentage, stats.heroStats.competitive);

                            if (suggestedCompHero !== null){
                                outputSpeech += ` Fascinating, there is a tip here in my data analysis. It says that based on your win percentage with this hero in competitive, 
                                                you will have more success with ${toTitleCase(suggestedCompHero.hero)} 
                                                since your win percentage with that hero in competitive is ${suggestedCompHero.win_percentage}.`;
                            }
                        }
                    }
                    
                    // Once all stats are retrieved and appended lets append the options again for the user to choose what they want to do thereafter.
                    outputSpeech += drinkCount > 2 ? " " + responses.TOO_MANY_DRINKS_OPTIONS : " " + responses.ALTERNATE_OPTIONS;
                }

            } catch (error) {
                outputSpeech = `${nickName}. I would love to tell you how your Overwatch progress is going but it seems my analyzer is not functioning at the moment. The error I see here is ${error.message}. Try again later.`;
            }

        }


        return handlerInput.responseBuilder
            .speak(`<voice name='Emma'>${outputSpeech}</voice>`)
            .reprompt(`<voice name='Emma'>${rePromptText}</voice>`)
            //.withStandardCard(appName, card)
            .getResponse();

    },
};

const AnotherDrinkIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AnotherDrinkIntent';
    },
    handle(handlerInput) {
        drinkCount++;

        let speechText = `You got it my friend! Coming right up! ${responses.POUR_DRINK_AUDIO} Cheers! ${responses.GLASS_CLINK_AUDIO} ${responses.OPTIONS}`;

        if (drinkCount == 1) {
            speechText = `You got it my friend! Coming right up! ${responses.POUR_DRINK_AUDIO} Cheers! ${responses.GLASS_CLINK_AUDIO} ${responses.OPTIONS}`;
        } else if (drinkCount == 2) {
            speechText = `Here's another round my friend. ${responses.POUR_DRINK_AUDIO} Cheers, to great friends! ${responses.GLASS_CLINK_AUDIO} ${responses.OPTIONS}`;
        } else if (drinkCount == 3) {
            speechText = `Whoa, another one? Thirsty, aren't we? You got it my friend! Coming right up! Although, I want you conscious for our conversation you know. ${responses.POUR_DRINK_AUDIO} Cheers, to friends and great battles! ${responses.GLASS_CLINK_AUDIO} ${responses.TOO_MANY_DRINKS_OPTIONS}`;
        } else if (drinkCount > 3) {
            speechText = `I'm sorry my friend. I cannot in all good conscience allow you to drink that much. ${responses.TOO_MANY_DRINKS_OPTIONS}`;
        }
        

        return handlerInput.responseBuilder
            .speak(`<voice name='Emma'>${speechText}</voice>`)
            .reprompt(`<voice name='Emma'>${speechText}</voice>`)
            .getResponse();
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = '';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    },
};

const YesIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent';
    },
    handle(handlerInput) {

        return handlerInput.responseBuilder
            .speak(`<voice name='Emma'>${responses.TOP_MENU}</voice>`)
            .reprompt(`<voice name='Emma'>${responses.PLEASE_REPEAT} ${responses.ANYTHING_ELSE}</voice>`)
            .getResponse();
    },
};

const NoIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent';
    },
    handle(handlerInput) {

        return handlerInput.responseBuilder
            .speak(`<voice name='Emma'>${responses.GOODBYE}</voice>`)
            .reprompt(`<voice name='Emma'>${responses.PLEASE_REPEAT} ${responses.ANYTHING_ELSE}</voice>`)
            .getResponse();
    },
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = responses.GOODBYE;

        return handlerInput.responseBuilder
            .speak(`<voice name='Emma'>${speechText}</voice>`)
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak(`<voice name='Emma'>Sorry, my systems have malfunctioned there. Can you repeat that?</voice>`)
            .reprompt(`<voice name='Emma'>Sorry, my systems have malfunctioned there. Can you repeat that?</voice>`)
            .getResponse();
    },
};

/** BUILT-IN FUNCTIONS **/
function callDirectiveService(handlerInput) {
    // Call Alexa Directive Service.
    const requestEnvelope = handlerInput.requestEnvelope;
    const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();

    const requestId = requestEnvelope.request.requestId;
    const endpoint = requestEnvelope.context.System.apiEndpoint;
    const token = requestEnvelope.context.System.apiAccessToken;

    // build the progressive response directive
    const directive = {
        header: {
            requestId,
        },
        directive: {
            type: 'VoicePlayer.Speak',
            speech: `<voice name='Emma'>${responses.RANK_PERSONALIZED_BEGIN}</voice>`,
        },
    };

    // send directive
    return directiveServiceClient.enqueue(directive, endpoint, token);
}

/** BEGIN CUSTOM FUNCTIONS **/

function toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }

function getRndInteger(minimum, maximum) {
	return Math.floor(Math.random() * (maximum - minimum)) + minimum;
}

function getBestHeroForComp(mostPlayedHero, mostPlayedWinPercentage, compHeroes){
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
      	if (compHeroes[hero].game.games_won > 0){
            
            // if current hero in context is most played we can skip this since we are need alt hero with better win percentage if found.
            if (hero == mostPlayedHero){
                continue;
            }

            // Check if last win percentage captured is better than current win percentage in context and if so capture hero and win percentage.
            if (parseInt(bestWinPercentage) < parseInt(compHeroes[hero].game.win_percentage)){
                bestWinPercentage = compHeroes[hero].game.win_percentage;
                bestHero = hero;
            }

            // console.log(JSON.stringify(compHeroes[hero].game.win_percentage));
            // console.log(JSON.stringify(hero));

            // console.log("Best win percentage: ", bestWinPercentage);
            // console.log("Best hero with that win percentage: ", bestHero);
            // console.log("Current iter win count: ", compHeroes[hero].game.games_won);
            // console.log("Current iter loss count: ", compHeroes[hero].game.games_lost);
        }
      }
    	
    }

    // If the win percentage found is better than the most played heros win percentage, suggest the new found hero.
    if (parseInt(bestWinPercentage) > parseInt(mostPlayedWinPercentage)) {
        bestHeroToPlay = {
            hero: bestHero,
            win_percentage: bestWinPercentage
        };

        // console.log("Suggested hero: ", bestHeroToPlay.hero);
        // console.log("Suggested hero's win percentage: ", bestHeroToPlay.win_percentage);
    }

    
    return bestHeroToPlay;
}

function getPlayerRank(heroType) {
    let outputSpeech = "";
    
    // Check if rank is empty which means they haven't placed and return a message to place for the current season.
    if (!isObjectEmpty(heroType)) {
        if (heroType.sr > 4000) {
            outputSpeech = `you are currently ranked Grandmaster at ${heroType.sr}!`;
        } else if (heroType.sr < 3999 && heroType.sr > 3500) {
            outputSpeech = `you are currently ranked Master at ${heroType.sr}, ${heroType.sr > 3950 ? 'you are very close to Grandmaster rank. Keep going' : 'you got a ways to go to get to Grandmaster rank. Keep pushing'}!`;
        } else if (heroType.sr < 3499 && heroType.sr > 3000) {
            outputSpeech = `you are currently ranked Diamond at ${heroType.sr}, ${heroType.sr > 3450 ? 'you are very close to Master rank. Keep going' : 'you got a ways to go to get to Master rank. Keep pushing'}!`;
        } else if (heroType.sr < 2999 && heroType.sr > 2500) {
            outputSpeech = `you are currently ranked Platinum at ${heroType.sr}, ${heroType.sr > 2950 ? 'you are very close to Diamond rank. Keep going' : 'you got a ways to go to get to Diamond rank. Keep pushing'}!`;
        } else if (heroType.sr < 2499 && heroType.sr > 2000) {
            outputSpeech = `you are currently ranked Gold at ${heroType.sr}, ${heroType.sr > 2450 ? 'you are very close to Platinum rank. Keep going' : 'you got a ways to go to get to Platinum rank. Keep pushing'}!`;
        } else if (heroType.sr < 1999 && heroType.sr > 1500) {
            outputSpeech = `you are currently ranked Silver at ${heroType.sr}, ${heroType.sr > 1950 ? 'you are very close to Gold rank. Keep going' : 'you got a ways to go to get to Gold rank. Keep pushing'}!`;
        } else {
            outputSpeech = `you are currently ranked Bronze at ${heroType.sr}, ${heroType.sr > 1450 ? 'you are very close to Silver rank. Keep going' : 'you got a ways to go to get to Silver rank. Keep pushing'}!`;
        }
    }

    return outputSpeech;
}

/** END OF CUSTOM FUNCTIONS **/

const getRemoteData = function (url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? require('https') : require('http');
        const request = client.get(url, (response) => {
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new Error('Failed with status code: ' + response.statusCode));
            }
            const body = [];
            response.on('data', (chunk) => body.push(chunk));
            response.on('end', () => resolve(body.join('')));
        });
        request.on('error', (err) => reject(err))
    })
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
    .addRequestHandlers(
        CheckAccountLinkedHandler,
        LaunchRequestHandler,
        AnotherDrinkIntentHandler,
        GetMyStatsIntentHandler,
        HelpIntentHandler,
        YesIntentHandler,
        NoIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();
