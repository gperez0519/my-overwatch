const Alexa = require('ask-sdk-core');
const ow = require('overwatch-stats-api');

const appName = 'My Overwatch';

/** OVERWATCH GENERAL RESPONSES **/
const responses = {
    WELCOME: "Welcome to My Overwatch! Please tell us your battletag and we will give you an update on your stats. Make sure you say the full battle tag with username, hashtag and number",
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

const GetBattleTagIntentHandler = {
    canHandle(handlerInput) {
        return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetBattleTagIntent');
    },
    handle(handlerInput) {
        outputSpeech = responses.DEFAULT_ERROR_BATTLETAG;

        let intent = handlerInput.requestEnvelope.request.intent;
        let battletagVal = intent.slots.battletag.value;

        if (battletagVal) {
            battletag = battletagVal;
            outputSpeech = responses.PLATFORM_INQUIRY;
        } else {
            outputSpeech = responses.DEFAULT_ERROR_BATTLETAG;
        }

        return handlerInput.responseBuilder
            .speak(outputSpeech)
            .reprompt(outputSpeech)
            .getResponse();

    },
};

const GetPlatformIntentHandler = {
    canHandle(handlerInput) {
        return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetPlatformIntent');
    },
    handle(handlerInput) {
        outputSpeech = responses.DEFAULT_ERROR_PLATFORM;

        let intent = handlerInput.requestEnvelope.request.intent;
        let platformVal = intent.slots.platform.value;

        // SET THE PLATFORM TO THE OVERWATCH STATS API PARAMETER TYPE EITHER pc, xbl or psn
        if (platformVal.toLowerCase() == "xbox") {
            platform = "xbl";
        } else if (platformVal.toLowerCase() == "pc") {
            platform = "pc";
        } else if (platformVal.toLowerCase() == "playstation") {
            platform = "psn";
        }

        return handlerInput.responseBuilder
            .speak(outputSpeech)
            .reprompt(outputSpeech)
            //.withStandardCard(appName, card)
            .getResponse();

    },
};

const GetStatsIntentHandler = {
    canHandle(handlerInput) {
        return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetStatsIntent');
    },
    handle(handlerInput) {
        outputSpeech = responses.DEFAULT_ERROR_BATTLETAG;

        // CALL THE OVERWATCH STATS API TO GET THE PROFILE INFORMATION FOR THE PASSED BATTLETAG WITH PLATFORM
        if (battletag && platform) {

            console.log("Captured Battletag: " . battletag);

            // REPLACE THE HASHTAG WITH DASH REQUIRED FOR API
            battletag = battletag.replace("#", "-");

            // CAPITALIZE FIRST LETTER OF BATTLETAG AS REQUIRED FOR BATTLETAG   
            battletag = battletag.charAt(0).toUpperCase() + battletag.slice(1);

            console.log("Battletag translated: " . battletag);

           /*  (async () => {
                    const stats = await ow.getAllStats(battletag, platform);
                    console.log(JSON.stringify(stats));
                })(); */
            
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
        GetBattleTagIntentHandler,
        GetPlatformIntentHandler,
        GetStatsIntentHandler,
        HelpIntentHandler,
        YesIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
