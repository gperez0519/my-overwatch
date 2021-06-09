const Alexa = require('ask-sdk-core');

// Overwatch Stats API - NPM Package URL: https://www.npmjs.com/package/overwatch-stats-api
const ow = require('overwatch-stats-api');

const appName = 'My Overwatch';

/** OVERWATCH GENERAL RESPONSES **/
const responses = {
    WELCOME: "Welcome to My Overwatch! We can tell you your stats of your Overwatch progress. Say get my stats to hear your stats of your Overwatch profile.",
    TOP_MENU: "Great! We can tell you your stats of your Overwatch progress. Say get my stats to hear your stats of your Overwatch profile.",
    OVERWATCH_SERVICE_UNAVAILABLE: "Oh no! The My Overwatch service is not available at the moment. Please try again later.",
    PLEASE_WAIT: "Please wait while we try to retrieve that profile information",
    PLACEMENTS_NOT_COMPLETE: "You have not placed yet in the Competitive season. Make sure you do so in order to hear about your ranking info.",
    BATTLETAG_NUMBER_INQUIRY: "Perfect! Now, please read off the number portion of your battle tag after the hashtag symbol.",
    GOODBYE: "Thank you for choosing My Overwatch! Always thrive to attain Grand Master if you haven't already. Good luck in your battles! Come back again for an updated look at your Overwatch profile and some tips to help in your gameplay to get you to the top!",
    DEFAULT_ERROR_BATTLETAG: "Sorry, we could not find that battletag. Please repeat the battle tag username before the hashtag. For example, say illusion or elite",
    DEFAULT_ERROR_PLATFORM: "Sorry, we did not recognize that platform. Please say either Xbox, PC, or Playstation.",
    PLATFORM_INQUIRY: "Great! Which platform do you want to get your stats for? Xbox, PC or Playstation?",
    PLEASE_REPEAT: "Sorry, we did not hear from you.",
    ANYTHING_ELSE: "Is there anything else that you would like to know?"
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

//code for the handlers
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {

        // welcome message
        let welcomeText = responses.WELCOME;

        // welcome screen message
        let displayText = responses.WELCOME;

        return handlerInput.responseBuilder
            .speak(welcomeText)
            .reprompt(welcomeText)
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
        let intent = handlerInput.requestEnvelope.request.intent;

        let platformVal = intent.slots.platform.value;
        let battletag_username = intent.slots.battletag_username.value;
        let battletag_number = intent.slots.battletag_number.value;

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
                    outputSpeech = `Profile info retrieved successfully! 
Hello ${battletag_username}! ${!isObjectEmpty(stats.rank) ?
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
                                                    ? 'You are currently ranked Silver!'
                                                    : 'You are currently ranked Bronze!') : responses.PLACEMENTS_NOT_COMPLETE
                        }
You are level ${stats.level} 
and prestige level ${stats.prestige}.
Your most played hero is ${!isObjectEmpty(mostPlayed) ? Object.keys(mostPlayed.quickplay)[0] : ""}`;
                    console.log(JSON.stringify(stats));
                }

            } catch (error) {
                outputSpeech = `Error occurred: ${error}. Profile info retrieval failed! We heard you say ${platformVal} as the platform. ${battletag_username} as the username of the battletag and ${battletag_number} as the number in the battletag.`;
            }

        }


        return handlerInput.responseBuilder
            .speak(`${outputSpeech} ${responses.ANYTHING_ELSE}`)
            .reprompt(`${responses.PLEASE_REPEAT} ${responses.ANYTHING_ELSE}`)
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

    // build the progressive response directive
    const directive = {
        header: {
            requestId,
        },
        directive: {
            type: 'VoicePlayer.Speak',
            speech: `${responses.PLEASE_WAIT}`,
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
        LaunchRequestHandler,
        GetMyStatsIntentHandler,
        HelpIntentHandler,
        YesIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();
