/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');

const appName = 'Scary Stories';
const LIGHTNING_SOUND_ONE = "<audio src='soundbank://soundlibrary/nature/amzn_sfx_lightning_strike_01'/>";
const LIGHTNING_SOUND_TWO = "<audio src='soundbank://soundlibrary/nature/amzn_sfx_lightning_strike_02'/>";
const RAIN_THUNDER = "<audio src='soundbank://soundlibrary/nature/amzn_sfx_rain_thunder_01'/>";
const GHOST_SOUND_ONE = "<audio src='soundbank://soundlibrary/magic/amzn_sfx_ghost_spooky_01'/>";
const TWIG_BREAK_SOUND = "";

/**  THE STORIES   **/

const GHOST_STORY = "<voice name='Joey'>" + LIGHTNING_SOUND_ONE + "It all started on a cold rainy night in 1978."
    + RAIN_THUNDER + " A couple of friends of mine decided to finally suck it up and spend the night at the old miller's house,"
    + " the abandoned mansion at the top of the hill. " + GHOST_SOUND_ONE + "We have been talking about breaking into that place for the longest time ever since we were children...but we were all too scared. "
    + LIGHTNING_SOUND_TWO + "After some drinking"
    + " and seeing as the girls were around us, we decided that it would be a good opportunity to scare the girls so that they might be too scared and ask to protect them, then"
    + " they would be eating out the palm of our hands...or at least that is how it played out in our heads...to be continued...</voice>";


let card = 'Something went wrong. Please try again.';
let outputSpeech = 'Something went wrong. Please try again.';
let retrievedToken = '';
let apiEndPoint = '';
let apiPhoneNumEndPoint = '/v2/accounts/~current/settings/Profile.mobileNumber';

//code for the handlers
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        // REQUEST THE API ACCESS TOKEN FOR CUSTOMER PROFILE API
        retrievedToken = handlerInput.requestEnvelope.context.System.apiAccessToken;

        // GET THE MAIN ALEXA API ENDPOINT PREFIX EX: https://api.amazonalexa.com
        apiEndPoint = handlerInput.requestEnvelope.context.System.apiEndpoint;

        //welcome message
        let speechText = 'Hello there fellow spooksters and welcome to your source of scary stories! Ask me for a scary story by saying something like, tell me a story about ghosts or tell me a scary story';
        //speechText = `API EndPoint is ${apiEndPoint}`;

        //welcome screen message
        let displayText = "Welcome to Scary Stories!";
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard(appName, displayText)
            .getResponse();
    }
}; // end of launch request handler



const GetScaryStoryIntentHandler = {
    canHandle(handlerInput) {
        return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetScaryStoryIntent');
    },
    async handle(handlerInput) {
        outputSpeech = 'Sorry, we did not understand your last command. You can say things like, tell me a story about ghosts or tell me a scary story';
        let promptUser = 'Would you like to hear another story?';
        let intent = handlerInput.requestEnvelope.request.intent;
        let category = intent.slots.category.value;

        // REQUEST THE API ACCESS TOKEN FOR CUSTOMER PROFILE API
        retrievedToken = handlerInput.requestEnvelope.context.System.apiAccessToken;

        // GET THE MAIN ALEXA API ENDPOINT PREFIX EX: https://api.amazonalexa.com
        apiEndPoint = handlerInput.requestEnvelope.context.System.apiEndpoint;

        process.env.TZ = 'America/New_York';

        // DELIVER THE RIGHT STORY BASED ON THE CATEGORY
        if (category.toLowerCase() == "ghosts" || category.toLowerCase() == "ghost" || category.toLowerCase() == "ghost story" || category.toLowerCase() == "ghost stories") {
            outputSpeech = GHOST_STORY;
        }
        else {
            outputSpeech = "You got a generic scary story. Ask us about the ghost stories."
        }

        return handlerInput.responseBuilder
            .speak(outputSpeech)
            .reprompt(promptUser)
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
        const speechText = 'Ask me for a scary story by saying something like, tell me a story about ghosts or tell me a scary story';

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
        const speechText = 'Great! What kind of story would you like?';

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
        //const speechText = 'Thank you for using the My Westmed Alexa Skill. We look forward to improving your experience in ensuring your wellness presently and into the future. Goodbye!';
        const speechText = 'Ha Ha Ha! Was it too scary for you? Awww, well, visit us next time for more scary stories and remember...always check under your bed and in your closet! Ha Ha Ha Ha Ha!';

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
        GetScaryStoryIntentHandler,
        HelpIntentHandler,
        YesIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
