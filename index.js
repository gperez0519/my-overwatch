const Alexa = require('ask-sdk-core');
const axios = require('axios');
const VocalResponses = require('./vocalResponses');

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
        const speakOutput = VocalResponses.responses.NEED_TO_LINK_MESSAGE;
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
        let welcomeText = `${VocalResponses.responses.DOOR_OPEN_AUDIO} ${VocalResponses.responses.ROWDY_BAR_AMBIANCE_AUDIO} ${VocalResponses.responses.GREETING_PERSONALIZED} ${VocalResponses.responses.POUR_DRINK_AUDIO} Cheers, my friend! ${VocalResponses.responses.GLASS_CLINK_AUDIO} ${VocalResponses.responses.OPTIONS}`;

        // Get a random number between 1 and 3
        let randomChoice = getRndInteger(1,4);

        // return a random welcome message to ensure human like interaction.
        try {
            if (randomChoice == 1){
                welcomeText = VocalResponses.responses.DOOR_OPEN_AUDIO + VocalResponses.responses.ROWDY_BAR_AMBIANCE_AUDIO + VocalResponses.responses.GREETING_PERSONALIZED + VocalResponses.responses.POUR_DRINK_AUDIO + "Cheers, my friend!" + VocalResponses.responses.GLASS_CLINK_AUDIO + VocalResponses.responses.OPTIONS;
            } else if (randomChoice == 2) {
                welcomeText = VocalResponses.responses.DOOR_OPEN_AUDIO + VocalResponses.responses.ROWDY_BAR_AMBIANCE_AUDIO + VocalResponses.responses.GREETING_PERSONALIZED_II + VocalResponses.responses.POUR_DRINK_AUDIO + "Cheers, my friend!" + VocalResponses.responses.GLASS_CLINK_AUDIO + VocalResponses.responses.OPTIONS;
            } else if (randomChoice == 3) {
                welcomeText = VocalResponses.responses.DOOR_OPEN_AUDIO + VocalResponses.responses.ROWDY_BAR_AMBIANCE_AUDIO + VocalResponses.responses.GREETING_PERSONALIZED_III + VocalResponses.responses.POUR_DRINK_AUDIO + "Cheers, my friend!" + VocalResponses.responses.GLASS_CLINK_AUDIO + VocalResponses.responses.OPTIONS;
            }
        } catch (error) {
            console.log("Something went wrong with randomization welcome message. Error: ", error.message);
        }
        

        let rePromptText = `Are you going to stare at me or do you want to choose? ${VocalResponses.responses.OPTIONS}`;

        // welcome screen message
        let displayText = VocalResponses.responses.GREETING_PERSONALIZED;

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
        outputSpeech = VocalResponses.responses.DEFAULT_ERROR_BATTLETAG;
        //let intent = handlerInput.requestEnvelope.request.intent;

        //let platformVal = intent.slots.platform.value;
        //let battletag_username = intent.slots.battletag_username.value;
        //let battletag_number = intent.slots.battletag_number.value;

        var accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
        var userInfo = null;

        if (accessToken == undefined){
            // The request did not include a token, so tell the user to link
            // accounts and return a LinkAccount card
            var speechText = VocalResponses.responses.NEED_TO_LINK_MESSAGE;

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

        let rePromptText = `Well, I guess you don't find that to be very exciting but in any case I will leave you to it. Let me know if you need anything else. ${drinkCount > 3 ? VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : VocalResponses.responses.OPTIONS}`;

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
                    outputSpeech = " " + VocalResponses.responses.OVERWATCH_SERVICE_UNAVAILABLE;
                } else {

                    outputSpeech = `${nickName},`;

                    // Get the players current level and prestige.
                    outputSpeech += ` you are currently level ${stats.level} ${stats.prestige ? `at prestige ${stats.prestige}` : ``} .`;

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
                        outputSpeech = " " + VocalResponses.responses.PLACEMENTS_NOT_COMPLETE;
                        console.log("Player has not placed in rank yet.");
                    }

                    // Check if we retrieved data for the most played heroes
                    if (isObjectEmpty(mostPlayed)) {
                        outputSpeech = VocalResponses.responses.OVERWATCH_SERVICE_UNAVAILABLE;
                    } else {
                        console.log("All stats data payload: ", JSON.stringify(stats));
                        console.log("Most played data payload: ", JSON.stringify(mostPlayed));

                        let quickPlayHero = Object.keys(mostPlayed.quickplay)[0];

                        // Tell the player about their most played hero in Quick Play.
                        outputSpeech += ` It seems you really enjoy playing ${toTitleCase(quickPlayHero)} in Quickplay. `;

                        // Tell the player about the most played hero's win percentage.
                        outputSpeech += `Your current win percentage with this hero in Quickplay is ${stats.heroStats.quickplay[quickPlayHero].game.win_percentage}.`;

                        // Tell the player about their combat weapon accuracy for competitive if it exists
                        if (stats.heroStats.quickplay[quickPlayHero].combat.weapon_accuracy) {
                            let quickPlayHeroWeaponAccuracy = stats.heroStats.quickplay[quickPlayHero].combat.weapon_accuracy

                            outputSpeech += ` Analysis shows your weapon accuracy in Quickplay with ${toTitleCase(quickPlayHero)} is ${quickPlayHeroWeaponAccuracy}! ${parseInt(quickPlayHeroWeaponAccuracy) > "50%" ? `That is actually really impressive!` : `I think you might want to practice your aim more in training to increase your chances of success.`}`;
                        }

                        // Check if there are stats for competitive, if there aren't the player doesn't compete
                        if (!isObjectEmpty(stats.heroStats.competitive)) {
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

                            // Tell the player about their combat weapon accuracy for competitive if it exists.
                            if (stats.heroStats.competitive[mostPlayedCompetitiveHero].combat.weapon_accuracy) {
                                let statsCompHeroWeaponAccuracy = stats.heroStats.competitive[mostPlayedCompetitiveHero].combat.weapon_accuracy;

                                outputSpeech += ` Analysis shows your weapon accuracy in competitive with ${toTitleCase(suggestedCompHero.hero)} is ${statsCompHeroWeaponAccuracy}! ${parseInt(statsCompHeroWeaponAccuracy) > "50%" ? `That is actually really impressive!` : `I think you might want to practice your aim more in training to increase your chances of success.`}`;
                            }
                            
                        }
                    }
                    
                    // Once all stats are retrieved and appended lets append the options again for the user to choose what they want to do thereafter.
                    outputSpeech += drinkCount > 2 ? " " + VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " " + VocalResponses.responses.ALTERNATE_OPTIONS;
                }

            } catch (error) {
                outputSpeech = `${nickName}. I would love to tell you how your Overwatch progress is going but it seems my analyzer is not functioning at the moment. The error I see here is ${error.message}. Try again later.`;
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
                outputSpeech,
                stats.iconURL ? stats.iconURL : '',
                stats.iconURL ? stats.iconURL : '')
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

        let speechText = `You got it my friend! Coming right up! ${VocalResponses.responses.POUR_DRINK_AUDIO} Cheers! ${VocalResponses.responses.GLASS_CLINK_AUDIO} ${VocalResponses.responses.OPTIONS}`;

        if (drinkCount == 1) {
            speechText = `You got it my friend! Coming right up! ${VocalResponses.responses.POUR_DRINK_AUDIO} Cheers! ${VocalResponses.responses.GLASS_CLINK_AUDIO} ${VocalResponses.responses.OPTIONS}`;
        } else if (drinkCount == 2) {
            speechText = `Here's another round my friend. ${VocalResponses.responses.POUR_DRINK_AUDIO} Cheers, to great friends! ${VocalResponses.responses.GLASS_CLINK_AUDIO} ${VocalResponses.responses.OPTIONS}`;
        } else if (drinkCount == 3) {
            speechText = `Whoa, another one? Thirsty, aren't we? You got it my friend! Coming right up! Although, I want you conscious for our conversation you know. ${VocalResponses.responses.POUR_DRINK_AUDIO} Cheers, to friends and great battles! ${VocalResponses.responses.GLASS_CLINK_AUDIO} ${VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS}`;
        } else if (drinkCount > 3) {
            speechText = `I'm sorry my friend. I cannot in all good conscience allow you to drink that much. ${VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS}`;
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

        console.log("User asked for help.");

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
            .speak(`<voice name='Emma'>${VocalResponses.responses.TOP_MENU}</voice>`)
            .reprompt(`<voice name='Emma'>${VocalResponses.responses.PLEASE_REPEAT} ${VocalResponses.responses.ANYTHING_ELSE}</voice>`)
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
            .speak(`<voice name='Emma'>${VocalResponses.responses.GOODBYE}</voice>`)
            .reprompt(`<voice name='Emma'>${VocalResponses.responses.PLEASE_REPEAT} ${VocalResponses.responses.ANYTHING_ELSE}</voice>`)
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
        const speechText = VocalResponses.responses.GOODBYE;

        console.log("User left tavern");

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
            speech: `<voice name='Emma'>${VocalResponses.responses.PROGRESSIVE_RESPONSE}</voice>`,
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
            outputSpeech = `you are currently ranked Master at ${heroType.sr}, ${heroType.sr > 3950 ? 'you are very close to Grandmaster rank. Amazing! Keep pushing' : 'you got a ways to go to get to Grandmaster rank. Amazing! Keep pushing'}!`;
        } else if (heroType.sr < 3499 && heroType.sr > 3000) {
            outputSpeech = `you are currently ranked Diamond at ${heroType.sr}, ${heroType.sr > 3450 ? 'you are very close to Master rank. Almost there my friend, keep going' : 'you got a ways to go to get to Master rank. Almost there my friend, keep going'}!`;
        } else if (heroType.sr < 2999 && heroType.sr > 2500) {
            outputSpeech = `you are currently ranked Platinum at ${heroType.sr}, ${heroType.sr > 2950 ? 'you are very close to Diamond rank. Amazing! Keep pushing' : 'you got a ways to go to get to Diamond rank. Amazing! Keep pushing'}!`;
        } else if (heroType.sr < 2499 && heroType.sr > 2000) {
            outputSpeech = `you are currently ranked Gold at ${heroType.sr}, ${heroType.sr > 2450 ? 'you are very close to Platinum rank. Almost there my friend, keep going' : 'you got a ways to go to get to Platinum rank. Almost there my friend, keep going'}!`;
        } else if (heroType.sr < 1999 && heroType.sr > 1500) {
            outputSpeech = `you are currently ranked Silver at ${heroType.sr}, ${heroType.sr > 1950 ? 'you are very close to Gold rank. Amazing! Keep pushing' : 'you got a ways to go to get to Gold rank. Amazing! Keep pushing'}!`;
        } else {
            outputSpeech = `you are currently ranked Bronze at ${heroType.sr}, ${heroType.sr > 1450 ? 'you are very close to Silver rank. Almost there my friend, keep going' : 'you got a ways to go to get to Silver rank. Almost there my friend, keep going'}!`;
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
