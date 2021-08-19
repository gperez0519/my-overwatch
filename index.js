const Alexa = require('ask-sdk-core');
const axios = require('axios');

// Overwatch Stats API - NPM Package URL: https://www.npmjs.com/package/overwatch-stats-api **
const ow = require('overwatch-stats-api');

const appName = 'My Overwatch';
let nickName = "my friend";

/** OVERWATCH GENERAL RESPONSES **/
const responses = {
    GREETING: "Welcome to My Overwatch! We can tell you your stats of your Overwatch progress. Say get my stats to hear your stats of your Overwatch profile.",
    GREETING_PERSONALIZED: `Welcome ${nickName} to Blizz Tavern! Please. have a seat and take a load off! Here's a round on the house!`,
    GREETING_PERSONALIZED_II: `<amazon:emotion name="excited" intensity="high">Hey guys, keep it down over there.</amazon:emotion> Oh hey there my friend! Welcome to Blizz Tavern! You must be exhausted, drinks on me!`,
    GREETING_PERSONALIZED_III: `<amazon:emotion name="excited" intensity="high">Hey Jack don't make me come back there.</amazon:emotion> Oh hey. Sorry about that. Some people get a little rowdy around here. Welcome to Blizz Tavern! You must be exhausted, drinks on me!`,
    YOU_ARE_WELCOME: "Not a problem at all my friend! How have you been faring?",
    RANK_PERSONALIZED_BEGIN: "Whoa! I see that you are working hard on your rank. Let's see here.",
    GREETING_RESPONSE: "I'm doing just well. I'm glad that you are here!",
    NEED_TO_LINK_MESSAGE: 'Before we can continue, you will need to link your account to the My Overwatch skill using the card that I have sent to the Alexa app.',
    TOP_MENU: "Great! We can tell you your stats of your Overwatch progress. Say get my stats to hear your stats of your Overwatch profile.",
    OVERWATCH_SERVICE_UNAVAILABLE: "Oh no! The My Overwatch service is not available at the moment. Please try again later.",
    PLEASE_WAIT: "Please wait while we try to retrieve that profile information",
    PLACEMENTS_NOT_COMPLETE: "You have not placed yet in the Competitive season. Make sure you do so in order to hear about your ranking info.",
    BATTLETAG_NUMBER_INQUIRY: "Perfect! Now, please read off the number portion of your battle tag after the hashtag symbol.",
    GOODBYE: "You are always welcome here my friend! Stop by next time and we can catch up again. Good luck in your battles!",
    DEFAULT_ERROR_BATTLETAG: "Strange. My data analysis unit is not finding your information. No worries, we can try again later.",
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
let platform = '';

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
        let welcomeText = responses.DOOR_OPEN_AUDIO + responses.ROWDY_BAR_AMBIANCE_AUDIO + responses.GREETING_PERSONALIZED + responses.POUR_DRINK_AUDIO + responses.GLASS_CLINK_AUDIO;

        // return a random welcome message to ensure human like interaction.
        if (Math.floor(Math.random() * 3) == 0){
            welcomeText = responses.DOOR_OPEN_AUDIO + responses.ROWDY_BAR_AMBIANCE_AUDIO + responses.GREETING_PERSONALIZED + responses.POUR_DRINK_AUDIO + responses.GLASS_CLINK_AUDIO;
        } else if (Math.floor(Math.random() * 3) == 1) {
            welcomeText = responses.DOOR_OPEN_AUDIO + responses.ROWDY_BAR_AMBIANCE_AUDIO + responses.GREETING_PERSONALIZED_II + responses.POUR_DRINK_AUDIO + responses.GLASS_CLINK_AUDIO;
        } else if (Math.floor(Math.random() * 3) == 2) {
            welcomeText = responses.DOOR_OPEN_AUDIO + responses.ROWDY_BAR_AMBIANCE_AUDIO + responses.GREETING_PERSONALIZED_III + responses.POUR_DRINK_AUDIO + responses.GLASS_CLINK_AUDIO;
        }

        let rePromptText = "You know it is quite rude to not thank someone for giving you a round on the house you know.";

        // welcome screen message
        let displayText = responses.GREETING_PERSONALIZED;

        return handlerInput.responseBuilder
            .speak("<voice name='Emma'>" + welcomeText + "</voice>")
            .reprompt("<voice name='Emma'>" + rePromptText + "</voice>")
            .withSimpleCard(appName, displayText)
            .getResponse();
    }
}; // end of launch request handler

const ThanksIntentHandler = {
    canHandle(handlerInput) {
        return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'ThanksIntent');
    },
    handle(handlerInput) {

        // welcome message
        let youAreWelcomeResponse = responses.YOU_ARE_WELCOME;

        let rePromptText = "Are you okay my friend?";

        // welcome screen message
        let displayText = responses.WELCOME_PERSONALIZED;

        return handlerInput.responseBuilder
            .speak("<voice name='Emma'>" + youAreWelcomeResponse + "</voice>")
            .reprompt("<voice name='Emma'>" + rePromptText + "</voice>")
            .withSimpleCard(appName, displayText)
            .getResponse();
    }
}; // end of thanks intent handler

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

        let platformVal = "PC";
        let battletag_username = "";
        let battletag_number = "";

        if (userInfo) {
            battletag_username = userInfo.data.battletag.split("#")[0];
            battletag_number = userInfo.data.battletag.split("#")[1];
        }

        let rePromptText = "Well, I guess you don't find that to be very exciting but in any case I will leave you to it. Let me know if you need anything else.";

        console.log("Captured Battletag username: " + battletag_username);
        console.log("Captured Battletag number: " + battletag_number);
        console.log("Captured Platform: " + platformVal);

        try {

            await callDirectiveService(handlerInput);
        } catch (err) {

            // if it failed we can continue, just the user will wait longer for first response
            console.log("There was an issue attempting to send the progressive response while searching for overwatch profile of the given battletag " + err);
        }

        // SET THE PLATFORM TO THE OVERWATCH STATS API PARAMETER TYPE EITHER pc, xbl or psn
        if (platformVal.toLowerCase() == "xbox") {
            platform = "xbl";
        } else if (platformVal.toLowerCase() == "pc" || platformVal.toLowerCase() == "peesee" || platformVal.toLowerCase() == "pz" || platformVal.toLowerCase() == "peezee" || platformVal.toLowerCase() == "p.c") {
            platform = "pc";
        } else if (platformVal.toLowerCase() == "playstation") {
            platform = "psn";
        }

        // CALL THE OVERWATCH STATS API TO GET THE PROFILE INFORMATION FOR THE PASSED BATTLETAG WITH PLATFORM
        if (battletag_username && battletag_number && platform) {

            // CONCAT USERNAME DASH AND NUMBER TO GET THE STATS
            battletag = battletag_username + "-" + battletag_number;

            console.log("Full translated battletag: " + battletag);
            console.log("Platform recognized: " + platform);

            nickName = battletag_username;

            try {

                // get all stats for the given user
                const stats = await ow.getAllStats(battletag, platform);

                // get most played heroes per given user
                const mostPlayed = await ow.getMostPlayed(battletag, platform);

                // Check if stats are retrieved for the player
                if (isObjectEmpty(stats)) {
                    outputSpeech = responses.OVERWATCH_SERVICE_UNAVAILABLE;
                } else {

                    outputSpeech = "";

                    // Check if player has ranked otherwise let them know they need to place to know their rank.
                    if (!isObjectEmpty(stats.rank)){
                        
                        // Get the tank ranking if placed otherwise don't append response.
                        if (!!stats.rank.tank) {
                            outputSpeech = "For the tank role " + getPlayerRank(stats.rank.tank);
                        }

                        // Get the damage ranking if placed otherwise don't append response.
                        if (!!stats.rank.damage) {
                            if (outputSpeech != "") {
                                outputSpeech += " For the damage role " + getPlayerRank(stats.rank.damage);
                            } else {
                                outputSpeech = "For the damage role " + getPlayerRank(stats.rank.damage);
                            }
                        }

                        // Get the healer ranking if placed otherwise don't append response.
                        if (!!stats.rank.healer) {
                            if (outputSpeech != "") {
                                outputSpeech += " For the healer role " + getPlayerRank(stats.rank.healer);
                            } else {
                                outputSpeech = "For the healer role " + getPlayerRank(stats.rank.healer);
                            }
                        }
                        
                    } else {
                        outputSpeech = responses.PLACEMENTS_NOT_COMPLETE;
                    }

                    // Check if we retrieved data for the most played heroes
                    if (isObjectEmpty(mostPlayed)) {
                        outputSpeech = responses.OVERWATCH_SERVICE_UNAVAILABLE;
                    } else {
                        console.log("All stats data payload: ", JSON.stringify(stats));
                        console.log("Most played data payload: ", JSON.stringify(mostPlayed));

                        let quickPlayHero = Object.keys(mostPlayed.quickplay)[0];
                        let competitiveHero = Object.keys(mostPlayed.competitive)[0];

                        outputSpeech += ` It seems you really enjoy playing ${quickPlayHero} in Quickplay. `;
                        outputSpeech += `Your current win percentage with this hero in Quickplay is ${stats.heroStats.quickplay[quickPlayHero].game.win_percentage}`;
                        outputSpeech += ` It seems you really enjoy playing ${competitiveHero} in Competitive. `;
                        outputSpeech += `Your current win percentage with this hero in Competitive is ${stats.heroStats.competitive[competitiveHero].game.win_percentage}`;
                    }
                    
                    
                }

                

            } catch (error) {
                if (error.message.indexOf("PROFILE_PRIVATE") >= 0){
                    outputSpeech = `${nickName}. I would love to tell you how your Overwatch progress is going but it seems your profile is private. You should set your profile public so my analysis is able to retrieve the data we need.`;
                } else {
                    outputSpeech = `${nickName}. I would love to tell you how your Overwatch progress is going but it seems my analyzer is not functioning at the moment. The error I see here is ${error.message}. Try again later.`;
                }
                
            }

        }


        return handlerInput.responseBuilder
            .speak(`<voice name='Emma'>${outputSpeech}</voice>`)
            .reprompt(`<voice name='Emma'>${rePromptText}</voice>`)
            //.withStandardCard(appName, card)
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
            .speak(responses.TOP_MENU)
            .reprompt(`${responses.PLEASE_REPEAT} ${responses.ANYTHING_ELSE}`)
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
            .speak(`<voice name='Emma'>${response.GOODBYE}</voice>`)
            .reprompt(`${responses.PLEASE_REPEAT} ${responses.ANYTHING_ELSE}`)
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
            speech: `<voice name='Emma'>${responses.GREETING_RESPONSE}${responses.RANK_PERSONALIZED_BEGIN}</voice>`,
        },
    };

    // send directive
    return directiveServiceClient.enqueue(directive, endpoint, token);
}

/** BEGIN CUSTOM FUNCTIONS **/

function getPlayerRank(heroType) {
    let outputSpeech = "";
    
    // Check if rank is empty which means they haven't placed and return a message to place for the current season.
    if (!isObjectEmpty(heroType)) {
        if (heroType.sr > 4000) {
            outputSpeech = 'You are currently ranked Grandmaster!';
        } else if (heroType.sr < 3999 && heroType.sr > 3500) {
            outputSpeech = 'You are currently ranked Master!';
        } else if (heroType.sr < 3499 && heroType.sr > 3000) {
            outputSpeech = 'You are currently ranked Diamond!';
        } else if (heroType.sr < 2999 && heroType.sr > 2500) {
            outputSpeech = 'You are currently ranked Platinum!';
        } else if (heroType.sr < 2499 && heroType.sr > 2000) {
            outputSpeech = 'You are currently ranked Gold!';
        } else if (heroType.sr < 1999 && heroType.sr > 1500) {
            outputSpeech = 'You are currently ranked Silver but you got a ways to go!';
        } else {
            outputSpeech = 'You are currently ranked Bronze but you got a ways to go!';
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
        ThanksIntentHandler,
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
