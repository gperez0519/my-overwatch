const Alexa = require('ask-sdk-core');

// Overwatch Stats API - NPM Package URL: https://www.npmjs.com/package/overwatch-stats-api **
const ow = require('overwatch-stats-api');

const appName = 'My Overwatch';

/** OVERWATCH GENERAL RESPONSES **/
const responses = {
    GREETING: "Welcome to My Overwatch! We can tell you your stats of your Overwatch progress. Say get my stats to hear your stats of your Overwatch profile.",
    GREETING_PERSONALIZED: "Welcome Illusion! Please. have a seat and take a load off! Here's a round on the house!",
    YOU_ARE_WELCOME: "Not a problem at all buddy!",
    RANK_PERSONALIZED_BEGIN: "Hmm. I see that you are working hard on your rank",
    GREETING_RESPONSE: "I'm doing just well. now that you are here!",
    NEED_TO_LINK_MESSAGE: 'Before we can continue, you will need to link your account to the My Overwatch skill using the card that I have sent to the Alexa app.',
    TOP_MENU: "Great! We can tell you your stats of your Overwatch progress. Say get my stats to hear your stats of your Overwatch profile.",
    OVERWATCH_SERVICE_UNAVAILABLE: "Oh no! The My Overwatch service is not available at the moment. Please try again later.",
    PLEASE_WAIT: "Please wait while we try to retrieve that profile information",
    PLACEMENTS_NOT_COMPLETE: "You have not placed yet in the Competitive season. Make sure you do so in order to hear about your ranking info.",
    BATTLETAG_NUMBER_INQUIRY: "Perfect! Now, please read off the number portion of your battle tag after the hashtag symbol.",
    GOODBYE: "You are always welcome here my friend! Stop by next time and we can catch up again. Good luck in your battles!",
    DEFAULT_ERROR_BATTLETAG: "Sorry, we could not find that battletag. Please repeat the battle tag username before the hashtag. For example, say illusion or elite",
    DEFAULT_ERROR_PLATFORM: "Sorry, we did not recognize that platform. Please say either Xbox, PC, or Playstation.",
    PLATFORM_INQUIRY: "Great! Which platform do you want to get your stats for? Xbox, PC or Playstation?",
    PLEASE_REPEAT: "Sorry, we did not hear from you.",
    ANYTHING_ELSE: "Is there anything else that you would like to know?",
    POUR_DRINK_AUDIO: "<audio src='soundbank://soundlibrary/household/water/pour_water_01'/>",
    DOOR_OPEN_AUDIO: "<audio src='soundbank://soundlibrary/home/amzn_sfx_door_open_01'/>",
    GLASS_CLINK_AUDIO: "<audio src='soundbank://soundlibrary/glass/clink/glasses_clink_04'/>"
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
        .speak("<voice name='Brian'>" + speakOutput + "</voice>")
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
        let welcomeText = responses.DOOR_OPEN_AUDIO + responses.GREETING_PERSONALIZED + responses.POUR_DRINK_AUDIO + responses.GLASS_CLINK_AUDIO;

        let rePromptText = "You know it is quite rude to not thank someone for giving you a round on the house you know.";

        // welcome screen message
        let displayText = responses.GREETING_PERSONALIZED;

        return handlerInput.responseBuilder
            .speak("<voice name='Brian'>" + welcomeText + "</voice>")
            .reprompt("<voice name='Brian'>" + rePromptText + "</voice>")
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
            .speak("<voice name='Brian'>" + youAreWelcomeResponse + "</voice>")
            .reprompt("<voice name='Brian'>" + rePromptText + "</voice>")
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

        let platformVal = "PC";
        let battletag_username = "illusion";
        let battletag_number = "1474";

        let rePromptText = "Well, I guess you don't find that to be very exciting but in any case I will leave you to it. Let me know if you need anything else.";

        console.log("Captured Battletag username: " + battletag_username);
        console.log("Captured Battletag number: " + battletag_number);
        console.log("Captured Platform: " + platformVal);

        try {

            //await callDirectiveService(handlerInput);
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

            // CAPITALIZE FIRST LETTER OF BATTLETAG USERNAME AS REQUIRED FOR BATTLETAG   
            battletag_username = battletag_username.charAt(0).toUpperCase() + battletag_username.slice(1);

            // CONCAT USERNAME DASH AND NUMBER TO GET THE STATS
            battletag = battletag_username + "-" + battletag_number;

            console.log("Full translated battletag: " + battletag);
            console.log("Platform recognized: " + platform);

            try {

                // get all stats for the given user
                const stats = await ow.getAllStats(battletag, platform);

                // get most played heroes per given user
                const mostPlayed = await ow.getMostPlayed(battletag, platform);

                if (isObjectEmpty(mostPlayed)) {
                    outputSpeech = responses.OVERWATCH_SERVICE_UNAVAILABLE;
                } else {
                    // get the rank if user has completed their placements
                    outputSpeech = `${responses.RANK_PERSONALIZED_BEGIN}! ${!isObjectEmpty(stats.rank) ?
                            (stats.rank.damage.sr > 4000
                                ? 'You are currently ranked Grandmaster!'
                                : stats.rank.damage.sr < 3999 && stats.rank.damage.sr > 3500
                                    ? 'You are currently ranked Master!'
                                    : stats.rank.damage.sr < 3499 && stats.rank.damage.sr > 3000
                                        ? 'You are currently ranked Diamond!'
                                        : stats.rank.damage.sr < 2999 && stats.rank.damage.sr > 2500
                                            ? 'You are currently ranked Platinum!'
                                            : stats.rank.damage.sr < 2499 && stats.rank.damage.sr > 2000
                                                ? 'You are currently ranked Gold!'
                                                : stats.rank.damage.sr < 1999 && stats.rank.damage.sr > 1500
                                                    ? 'You are currently ranked Silver but you got a ways to go!'
                                                    : 'You are currently ranked Bronze but you got a ways to go!') : responses.PLACEMENTS_NOT_COMPLETE
                        }
Wow. you really love to play ${!isObjectEmpty(mostPlayed) ? Object.keys(mostPlayed.quickplay)[0] : ""} alot in Quick Play.
and you seem to enjoy playing alot with ${!isObjectEmpty(mostPlayed) ? Object.keys(mostPlayed.competitive)[0] : ""} in Competitive.
You must really dominate the field with them. Keep going and you will be the best in no time.`;
                    console.log(JSON.stringify(stats));
                }

            } catch (error) {
                outputSpeech = `Error occurred: ${error}. Profile info retrieval failed! We heard you say ${platformVal} as the platform. ${battletag_username} as the username of the battletag and ${battletag_number} as the number in the battletag.`;
            }

        }


        return handlerInput.responseBuilder
            .speak(`<voice name='Brian'>${responses.GREETING_RESPONSE} ${outputSpeech}</voice>`)
            .reprompt(`<voice name='Brian'>${rePromptText}</voice>`)
            //.withStandardCard(appName, card)
            .getResponse();

    },
};

function callDirectiveService(handlerInput) {
    // Call Alexa Directive Service.
    const requestEnvelope = handlerInput.requestEnvelope;
    const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();

    const requestId = requestEnvelope.request.requestId;
    const endpoint = requestEnvelope.context.System.apiEndpoint;
    const token = requestEnvelope.context.System.apiAccessToken;

    console.log("Token:",token);
    console.log("EndPoint:", endpoint);
    console.log("Request ID:", requestId);

    // build the progressive response directive
    const directive = {
        header: {
            requestId,
        },
        directive: {
            type: 'VoicePlayer.Speak',
            speech: `<voice name='Brian'>${responses.RANK_PERSONALIZED_BEGIN}</voice>`,
        },
    };

    // send directive
    return directiveServiceClient.enqueue(directive, endpoint, token);
}


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
            .speak(responses.GOODBYE)
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
            .speak(speechText)
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
            .speak('Sorry, I can\'t understand the command. Please say again.')
            .reprompt('Sorry, I can\'t understand the command. Please say again.')
            .getResponse();
    },
};

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
