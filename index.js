const Alexa = require('ask-sdk-core');
const ow = require('overwatch-stats-api');

const appName = 'My Overwatch';

/** OVERWATCH GENERAL RESPONSES **/
const responses = {
    WELCOME: "Welcome to My Overwatch! We can tell you your stats of your Overwatch progress. Say get my stats to hear your stats of your Overwatch profile.",
    BATTLETAG_NUMBER_INQUIRY: "Perfect! Now, please read off the number portion of your battle tag after the hashtag symbol.",
    GOODBYE: "Thank you for choosing My Overwatch! Always thrive to attain Grand Master if you haven't already. Good luck in your battles! Come back again for an updated look at your Overwatch profile and some tips to help in your gameplay to get you to the top!",
    DEFAULT_ERROR_BATTLETAG: "Sorry, we could not find that battletag. Please repeat the full battle tag. For example, say soldier#1337",
    DEFAULT_ERROR_PLATFORM: "Sorry, we did not recognize that platform. Please say either Xbox, PC, or Playstation.",
    PLATFORM_INQUIRY: "Great! Which platform do you want to get your stats for? Xbox, PC or Playstation?"
}

/** COOL OVERWATCH SOUND EFFECTS **/
const heroes = {
    SOLDIER76: "test value",

}


let card = 'Something went wrong. Please try again.';
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
    handle(handlerInput) {
        outputSpeech = responses.DEFAULT_ERROR_BATTLETAG;
        let intent = handlerInput.requestEnvelope.request.intent;

        let platformVal = intent.slots.platform.value;
        let battletag_username = intent.slots.battletag_username.value;
        let battletag_number = intent.slots.battletag_number.value;

        let profileInfoRetrieved = false;

        console.log("Captured Battletag username: " + battletag_username);
        console.log("Captured Battletag number: " + battletag_number);
        console.log("Captured Platform " + platform);

        // SET THE PLATFORM TO THE OVERWATCH STATS API PARAMETER TYPE EITHER pc, xbl or psn
        if (platformVal.toLowerCase() == "xbox") {
            platform = "xbl";
        } else if (platformVal.toLowerCase() == "pc") {
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

           (async () => {
                    const stats = await ow.getAllStats(battletag, platform);
                    console.log(JSON.stringify(stats));
                    profileInfoRetrieved = true;
                })();
            
        } 
        if (profileInfoRetrieved) {
            outputSpeech = `Profile info retrieved successfully! We heard you say ${platformVal} as the platform. ${battletag_username} as the username of the battletag and ${battletag_number} as the number in the battletag.`;
        } else {
            outputSpeech = `Profile info retrieval failed! We heard you say ${platformVal} as the platform. ${battletag_username} as the username of the battletag and ${battletag_number} as the number in the battletag.`;
        }
        
        return handlerInput.responseBuilder
            .speak(outputSpeech)
            .reprompt(outputSpeech)
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
        const speechText = '';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
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
    .lambda();
