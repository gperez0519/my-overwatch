const Alexa = require('ask-sdk-core');
const axios = require('axios');
const VocalResponses = require('./vocalResponses');
const momentTZ = require('moment-timezone');
const teamInfo = require('./TeamListData.json');
const heroes = require('./OverwatchHeroes.json');

// Get an instance of the persistence adapter
var persistenceAdapter = getPersistenceAdapter();

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

//let card = 'Something went wrong. Please try again.';
let outputSpeech = 'Something went wrong. Please try again.';

// OVERWATCH API STATS REQUIRED PARAMETERS
let battletag = '';

function isAccountLinked(handlerInput) {
    // if there is an access token, then assumed linked
    return (handlerInput.requestEnvelope.session.user.accessToken === undefined);
}

function getPersistenceAdapter(tableName) {
    // This function is an indirect way to detect if this is part of an Alexa-Hosted skill
    function isAlexaHosted() {
        return process.env.S3_PERSISTENCE_BUCKET;
    }
    if (isAlexaHosted()) {
        const {S3PersistenceAdapter} = require('ask-sdk-s3-persistence-adapter');
        return new S3PersistenceAdapter({
            bucketName: process.env.S3_PERSISTENCE_BUCKET
        });
    } else {
        // IMPORTANT: don't forget to give DynamoDB access to the role you're using to run this lambda (via IAM policy)
        const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
        return new DynamoDbPersistenceAdapter({
            tableName: tableName || 'my_overwatch',
            createTable: true
        });
    }
}

const LoadAttributesRequestInterceptor = {
    async process(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        if (Alexa.isNewSession(requestEnvelope)){ //is this a new session? this check is not enough if using auto-delegate (more on next module)
            const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
            console.log('Loading from persistent storage: ' + JSON.stringify(persistentAttributes));
            //copy persistent attribute to session attributes
            attributesManager.setSessionAttributes(persistentAttributes); // ALL persistent attributtes are now session attributes
        }
    }
};

// If you disable the skill and reenable it the userId might change and you loose the persistent attributes saved below as userId is the primary key
const SaveAttributesResponseInterceptor = {
    async process(handlerInput, response) {
        if (!response) return; // avoid intercepting calls that have no outgoing response due to errors
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession); //is this a session end?
        if (shouldEndSession || Alexa.getRequestType(requestEnvelope) === 'SessionEndedRequest') { // skill was stopped or timed out
            // we increment a persistent session counter here
            sessionAttributes['sessionCounter'] = sessionAttributes['sessionCounter'] ? sessionAttributes['sessionCounter'] + 1 : 1;
            // we make ALL session attributes persistent
            console.log('Saving to persistent storage:' + JSON.stringify(sessionAttributes));
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
        }
    }
};

// This request interceptor will log all incoming requests to this lambda
const LoggingRequestInterceptor = {
    process(handlerInput) {
        console.log(`Incoming request: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    }
};

// This response interceptor will log all outgoing responses of this lambda
const LoggingResponseInterceptor = {
    process(handlerInput, response) {
        console.log(`Outgoing response: ${JSON.stringify(response)}`);
    }
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
    async handle(handlerInput) {
        const { attributesManager } = handlerInput;

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

        if (userInfo) {
            battletag_username = userInfo.data.battletag.split("#")[0];
        }

        // the attributes manager allows us to access session attributes
        const sessionAttributes = attributesManager.getSessionAttributes();

        // Reset particular session attributes
        sessionAttributes['hero-info'] = false;
        sessionAttributes['hero-role'] = "";
        sessionAttributes['hero-name'] = "";

        if (!sessionAttributes['nickName']) {
            sessionAttributes['nickName'] = battletag_username;
        }

        let GREETING_PERSONALIZED = VocalResponses.responses.GREETING_PERSONALIZED;
        let GREETING_PERSONALIZED_II = VocalResponses.responses.GREETING_PERSONALIZED_II;
        let GREETING_PERSONALIZED_III = VocalResponses.responses.GREETING_PERSONALIZED_III;

        let GREETING_PERSONALIZED_DISPLAY = VocalResponses.responses.GREETING_PERSONALIZED_DISPLAY;
        let GREETING_PERSONALIZED_II_DISPLAY = VocalResponses.responses.GREETING_PERSONALIZED_II_DISPLAY;
        let GREETING_PERSONALIZED_III_DISPLAY = VocalResponses.responses.GREETING_PERSONALIZED_III_DISPLAY;

        // if this isn't the first time the user is using the skill add their saved nick name to personalization.
        if (sessionAttributes['nickName']) {
            if (sessionAttributes['sessionCounter'] >= 1) {
                nickName = sessionAttributes['nickName'];

                // replace the words my friend with the person's name for more personalization if this isn't the first time they are using the skill.
                GREETING_PERSONALIZED = GREETING_PERSONALIZED.replace("my friend", nickName);
                GREETING_PERSONALIZED_II = GREETING_PERSONALIZED_II.replace("my friend", nickName);
                GREETING_PERSONALIZED_III = GREETING_PERSONALIZED_III.replace("my friend", nickName);
    
                // replace the words welcome with welcome back for more personalization if this isn't the first time they are using the skill.
                GREETING_PERSONALIZED = GREETING_PERSONALIZED.replace("Welcome", "Welcome back");
                GREETING_PERSONALIZED_II = GREETING_PERSONALIZED_II.replace("Welcome", "Welcome back");
                GREETING_PERSONALIZED_III = GREETING_PERSONALIZED_III.replace("Welcome", "Welcome back");

                // replace the words my friend with the person's name for more personalization if this isn't the first time they are using the skill.
                GREETING_PERSONALIZED_DISPLAY = GREETING_PERSONALIZED_DISPLAY.replace("my friend", nickName);
                GREETING_PERSONALIZED_II_DISPLAY = GREETING_PERSONALIZED_II_DISPLAY.replace("my friend", nickName);
                GREETING_PERSONALIZED_III_DISPLAY = GREETING_PERSONALIZED_III_DISPLAY.replace("my friend", nickName);
    
                // replace the words welcome with welcome back for more personalization if this isn't the first time they are using the skill.
                GREETING_PERSONALIZED_DISPLAY = GREETING_PERSONALIZED_DISPLAY.replace("Welcome", "Welcome back");
                GREETING_PERSONALIZED_II_DISPLAY  = GREETING_PERSONALIZED_II_DISPLAY.replace("Welcome", "Welcome back");
                GREETING_PERSONALIZED_III_DISPLAY  = GREETING_PERSONALIZED_III_DISPLAY.replace("Welcome", "Welcome back");
            }
            
        }

        // welcome message
        let welcomeText = `${VocalResponses.responses.DOOR_OPEN_AUDIO} ${VocalResponses.responses.ROWDY_BAR_AMBIANCE_AUDIO} ${GREETING_PERSONALIZED} ${VocalResponses.responses.POUR_DRINK_AUDIO} Cheers, my friend! ${VocalResponses.responses.GLASS_CLINK_AUDIO} ${VocalResponses.responses.OPTIONS}`;

        // Get a random number between 1 and 3
        let randomChoice = getRndInteger(1,4);

        // return a random welcome message to ensure human like interaction.
        try {
            if (randomChoice == 1){
                welcomeText = VocalResponses.responses.DOOR_OPEN_AUDIO + VocalResponses.responses.ROWDY_BAR_AMBIANCE_AUDIO + GREETING_PERSONALIZED + VocalResponses.responses.POUR_DRINK_AUDIO + "Cheers, my friend!" + VocalResponses.responses.GLASS_CLINK_AUDIO + VocalResponses.responses.OPTIONS;
                displayText = GREETING_PERSONALIZED_DISPLAY + VocalResponses.responses.OPTIONS;
            } else if (randomChoice == 2) {
                welcomeText = VocalResponses.responses.DOOR_OPEN_AUDIO + VocalResponses.responses.ROWDY_BAR_AMBIANCE_AUDIO + GREETING_PERSONALIZED_II + VocalResponses.responses.POUR_DRINK_AUDIO + "Cheers, my friend!" + VocalResponses.responses.GLASS_CLINK_AUDIO + VocalResponses.responses.OPTIONS;
                displayText = GREETING_PERSONALIZED_II_DISPLAY + VocalResponses.responses.OPTIONS;
            } else if (randomChoice == 3) {
                welcomeText = VocalResponses.responses.DOOR_OPEN_AUDIO + VocalResponses.responses.ROWDY_BAR_AMBIANCE_AUDIO + GREETING_PERSONALIZED_III + VocalResponses.responses.POUR_DRINK_AUDIO + "Cheers, my friend!" + VocalResponses.responses.GLASS_CLINK_AUDIO + VocalResponses.responses.OPTIONS;
                displayText = GREETING_PERSONALIZED_III_DISPLAY + VocalResponses.responses.OPTIONS;
            }
        } catch (error) {
            console.log("Something went wrong with randomization welcome message. Error: ", error.message);
        }
        

        let rePromptText = `Are you going to stare at me or do you want to choose? ${VocalResponses.responses.OPTIONS}`;

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
        const { attributesManager } = handlerInput;

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

            // the attributes manager allows us to access session attributes
            const sessionAttributes = attributesManager.getSessionAttributes();

            if (!sessionAttributes['nickName']) {
                sessionAttributes['nickName'] = battletag_username;
                nickName = sessionAttributes['nickName'];
            }

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

const OverwatchLeagueTeamInfoIntentIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'OverwatchLeagueTeamInfoIntent';
    },
    async handle(handlerInput) {
        
        let teamName = handlerInput.requestEnvelope.request.intent.slots.teamName.value;
        let teamLogoURL = "";

        // X-ray Web Scraper by Matt Mueller - NPM Package URL: https://www.npmjs.com/package/x-ray **
        const xray = require("x-ray");
        const x = xray();

        try {
            if (teamName){
                let teamNameLowerCase = teamName.toLowerCase();
                var standingsURL = 'https://www.overwatchleague.com/en-us/standings/';

                if (standingsURL) {
                    if (standingsURL.includes("overwatchleague")){
                        // Retrieve the JSON Overwatch League Data by method of web scraping using x-ray npm package (https://www.npmjs.com/package/x-ray)
                        await x(standingsURL, '#__NEXT_DATA__')
                        .then(overwatchLeagueTeamData => JSON.parse(overwatchLeagueTeamData)) // parse the overwatch data as JSON
                        .then(overwatchLeagueTeamData => {
        
                            if (overwatchLeagueTeamData.props.pageProps.blocks[1]) {
        
                                var divisions = overwatchLeagueTeamData.props.pageProps.blocks[1].standings.tabs[0].tables;
                                var standingsForTeamFound = false;
                                
                                for (const division in divisions) {
                                    if (Object.hasOwnProperty.call(divisions, division)) {
                                        const team = divisions[division];

                                        for (const currentTeam in team.teams) {
                                            if (Object.hasOwnProperty.call(team.teams, currentTeam)) {
                                                const curTeam = team.teams[currentTeam];
                                                if (curTeam.hasOwnProperty('teamName')){
                                                    var curteamNameLowerCase = curTeam.teamName.toLowerCase();

                                                    if (curteamNameLowerCase.includes(teamNameLowerCase)){
                                                        standingsForTeamFound = true;
                                                        teamName = curTeam.teamName;
                                                        
                                                        for (const teamList in teamInfo.teamList) {
                                                            if (Object.hasOwnProperty.call(teamInfo.teamList, teamList)) {
                                                                const team = teamInfo.teamList[teamList];
                                                                if (team.name.toLowerCase().includes(teamNameLowerCase)){
                                                                    teamLogoURL = team.logoUrl;
                                                                }
                                                            }
                                                        }

                                                        let howTeamIsFaringThisSeason = '';
                                                        if (parseInt(curTeam.w) > parseInt(curTeam.l)) {
                                                            howTeamIsFaringThisSeason = 'They are doing pretty good so far.';
                                                        } else {
                                                            howTeamIsFaringThisSeason = "Oh no! They are not doing so great this season.";
                                                        }
                                                        outputSpeech = `The ${curTeam.teamName} currently has a record of ${curTeam.w} wins and ${curTeam.l} losses. ${howTeamIsFaringThisSeason}`;
                                                        break;
                                                    }
                                                    
                                                }
                                                
                                            }
                                        }

                                        if (standingsForTeamFound){
                                            break;
                                        }
                                    }
                                }

                                if (standingsForTeamFound == false){
                                    outputSpeech = `I could not find that team. Please repeat the name or try the team name without the city.`;
                                }
                            } else {
                                outputSpeech = "I'm not seeing any information yet for this season. Please try again later.";
                            }
    
                        })
                        .catch(err => {
                            outputSpeech = `${VocalResponses.responses.OVERWATCH_LEAGUE_TEAM_SERVICE_UNAVAILABLE}`;
        
                            console.log(err.message);
                        });
                    }
                }


            }
        } catch (error) {
            console.log(`Error occurred: ${error.message}`);

            return handlerInput.responseBuilder
                .speak(`<voice name='Emma'>${VocalResponses.responses.OVERWATCH_LEAGUE_TEAM_SERVICE_UNAVAILABLE}</voice>`)
                .reprompt(`<voice name='Emma'>${VocalResponses.responses.OVERWATCH_LEAGUE_TEAM_SERVICE_UNAVAILABLE}</voice>`)
                .getResponse();
        }

        return handlerInput.responseBuilder
                .speak(`<voice name='Emma'>${outputSpeech} ${drinkCount > 2 ? " " + VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " " + VocalResponses.responses.ALTERNATE_OPTIONS}</voice>`)
                .reprompt(`<voice name='Emma'>${VocalResponses.responses.PLEASE_REPEAT} ${drinkCount > 2 ? " " + VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " " + VocalResponses.responses.ALTERNATE_OPTIONS}</voice>`)
                .withStandardCard(
                    teamName ? `${teamName} OWL Record This Season` : `OWL Record This Season`,
                    outputSpeech,
                    teamLogoURL ? teamLogoURL : '',
                    teamLogoURL ? teamLogoURL : '')
                .getResponse();
    },
};

const OverwatchLeagueUpcomingMatchesIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'OverwatchLeagueUpcomingMatchesIntent';
    },
    async handle(handlerInput) {

        const serviceClientFactory = handlerInput.serviceClientFactory;
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;
        
        // Get the user's time zone to ensure the right time of the overwatch matches
        let userTimeZone;
        try {
            const upsServiceClient = serviceClientFactory.getUpsServiceClient();
            userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);   
        } catch (error) {
            if (error.name !== 'ServiceError') {
                return handlerInput.responseBuilder.speak("There was a problem connecting to the service.").getResponse();
            }
            console.log('error', error.message);
        }
        
        outputSpeech = VocalResponses.responses.OVERWATCH_LEAGUE_SERVICE_UNAVAILABLE;
        
        // X-ray Web Scraper by Matt Mueller - NPM Package URL: https://www.npmjs.com/package/x-ray **
        const xray = require("x-ray");
        const x = xray();

        // Retrieve the JSON Overwatch League Data by method of web scraping using x-ray npm package (https://www.npmjs.com/package/x-ray)
        await x('https://www.overwatchleague.com/', '#__NEXT_DATA__')
        .then(overwatchLeagueData => JSON.parse(overwatchLeagueData)) // parse the overwatch data as JSON
        .then(overwatchLeagueData => {

            if (overwatchLeagueData.props.pageProps.blocks[0].owlHeader.scoreStripList.scoreStrip.matches) {

                // save the upcoming matches object array
                var matches = overwatchLeagueData.props.pageProps.blocks[0].owlHeader.scoreStripList.scoreStrip.matches;

                // configure the date parameters
                const options = {
                    month: "long", 
                    day: "numeric"
                };

                var matchIterationCount = 1;
                
                // Loop through each match and indicate the upcoming matches to the user.
                for (const match in matches) {
                    if (Object.hasOwnProperty.call(matches, match)) {
                        const element = matches[match];

                        // Ensure the upcoming date and time is available
                        if (element.date.startDate) {
                            var eventStartDate = momentTZ.utc(element.date.startDate).tz(userTimeZone);
                            const eventStartDateFormatted = eventStartDate.format("LL [at] LT");

                            // Ensure the competitors object array is available.
                            if (element.competitors) {
                                var oneTeamTBD = false;
                                var leftTeamTBD = false;
                                var rightTeamTBD = false;

                                // Check to see if one of the teams is TBD if so change response.
                                if (element.competitors[0].longName == "TBD") {
                                    oneTeamTBD = true;
                                    leftTeamTBD = true;
                                } else if (element.competitors[1].longName == "TBD") {
                                    oneTeamTBD = true;
                                    rightTeamTBD = true;
                                }

                                // Ensure the status of the match is available.
                                if (element.status){

                                    if (element.statusText == "Online Play"){
                                        if (element.status == "PENDING") {

                                            if (matchIterationCount == 1) {
                                                outputSpeech = `I have the breakdown of the upcoming Overwatch League matches.`;
                                            }

                                            outputSpeech += ` On ${eventStartDateFormatted}, `;
                                            if (oneTeamTBD) {
                                                if (leftTeamTBD) {
                                                    outputSpeech += `the ${element.competitors[1].longName} will face the team that is yet to be determined.`;
                                                } else if (rightTeamTBD) {
                                                    outputSpeech += `the ${element.competitors[0].longName} will face the team that is yet to be determined.`;
                                                }
                                                
                                            } else {
                                                outputSpeech += `the ${element.competitors[0].longName} will face the ${element.competitors[1].longName}.`;
                                            }
                                        } else {
                                            outputSpeech += `There is a match in progress that started on ${eventStartDateFormatted}, `;
                                            outputSpeech += `the teams that are playing are the ${element.competitors[0].longName} facing against the ${element.competitors[1].longName}.`;
                                        }
                                        
                                        
                                    }
                                    
                                }
                                
                            }
                            
                        }
                        
                    }
                    ++matchIterationCount;
                }
            } else {
                outputSpeech = "I'm not seeing any upcoming matches yet for the current season.";
            }



        })
        .catch(err => {
            outputSpeech = VocalResponses.responses.OVERWATCH_LEAGUE_SERVICE_UNAVAILABLE + drinkCount > 2 ? " " + VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " " + VocalResponses.responses.ALTERNATE_OPTIONS;

            console.log(err.message);
        });

        return handlerInput.responseBuilder
                .speak(`<voice name='Emma'>${outputSpeech} ${drinkCount > 2 ? " " + VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " " + VocalResponses.responses.ALTERNATE_OPTIONS}</voice>`)
                .reprompt(`<voice name='Emma'>${VocalResponses.responses.PLEASE_REPEAT} ${drinkCount > 2 ? " " + VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " " + VocalResponses.responses.ALTERNATE_OPTIONS}</voice>`)
                .getResponse();
    },
};

const RandomRoleHeroGeneratorIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'RandomRoleHeroGeneratorIntent';
    },
    handle(handlerInput) {
        
        let role = handlerInput.requestEnvelope.request.intent.slots.role.value;

        const {attributesManager} = handlerInput;

        // the attributes manager allows us to access session attributes
        const sessionAttributes = attributesManager.getSessionAttributes();

        try {
            for (const roleHeroes in heroes) {
                if (Object.hasOwnProperty.call(heroes, roleHeroes)) {
                    const heroesInRole = heroes[roleHeroes];
                    var randomChoice = -1;
            
                    if (role.toLowerCase().includes("tank")){
                        randomChoice = getRndInteger(0, (heroesInRole[0].tank.length));
                        let heroName = heroesInRole[0].tank[randomChoice].name;
            
                        // Suggested random hero.
                        outputSpeech = `The tank hero you should play is ${heroName}.`;

                        sessionAttributes['hero-info'] = true;
                        sessionAttributes['hero-role'] = "tank";
                        sessionAttributes['hero-name'] = heroName;

                        // // Tell user about the hero.
                        // outputSpeech += ` ${heroDescription}`;

                        // // Tell user about the heroes abilities
                        // outputSpeech += ` ${heroName} has over ${abilitiesLength} abilities. `;
                        // heroAbilities.map((ability, index) => {
                        //     if (index == (abilitiesLength - 1)) {
                        //         outputSpeech += `And finally the ultimate ability, `;
                        //     }
                        //     outputSpeech += `${ability.name}. ${ability.description} `;
                        // });

                        break;
                    } else if (role.toLowerCase().includes("damage") || role.toLowerCase().includes("dps")) {
                        randomChoice = getRndInteger(0, (heroesInRole[0].damage.length));
                        let heroName = heroesInRole[0].damage[randomChoice].name;

                        // Suggested random hero.
                        outputSpeech = `The damage hero you should play is ${heroName}.`;

                        sessionAttributes['hero-info'] = true;
                        sessionAttributes['hero-role'] = "damage";
                        sessionAttributes['hero-name'] = heroName;

                        break;
                    } else if (role.toLowerCase().includes("healer")) {
                        randomChoice = getRndInteger(0, (heroesInRole[0].healer.length));
                        let heroName = heroesInRole[0].healer[randomChoice].name;
            
                        // Suggested random hero.
                        outputSpeech = `The healer hero you should play is ${heroName}.`;

                        sessionAttributes['hero-info'] = true;
                        sessionAttributes['hero-role'] = "healer";
                        sessionAttributes['hero-name'] = heroName;

                        break;
                    }
                    
                }
            }
        } catch (error) {
            outputSpeech = VocalResponses.responses.OVERWATCH_SERVICE_UNAVAILABLE + drinkCount > 2 ? " " + VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " " + VocalResponses.responses.ALTERNATE_OPTIONS;
            console.log(err.message);
            return handlerInput.responseBuilder
                .speak(`<voice name='Emma'>${outputSpeech}</voice>`)
                .reprompt(`<voice name='Emma'>${outputSpeech}</voice>`)
                .getResponse();
            
        }
        
        return handlerInput.responseBuilder
            .speak(`<voice name='Emma'>${outputSpeech} ${VocalResponses.responses.HERO_MORE_INFO_PROMPT}</voice>`)
            .reprompt(`<voice name='Emma'>${VocalResponses.responses.PLEASE_REPEAT} ${VocalResponses.responses.HERO_MORE_INFO_PROMPT}</voice>`)
            .getResponse();
    },
};

const SpecialTestIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'SpecialTestIntent';
    },
    async handle(handlerInput) {
        var speechText = "Something went wrong.";
        
        const serviceClientFactory = handlerInput.serviceClientFactory;
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;

        let userTimeZone;
        try {
            const upsServiceClient = serviceClientFactory.getUpsServiceClient();
            userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);   
            speechText = `The timezone we detected is: ${userTimeZone}`;
        } catch (error) {
            if (error.name !== 'ServiceError') {
                return handlerInput.responseBuilder.speak("There was a problem connecting to the service.").getResponse();
            }
            console.log('error', error.message);
        }

        return handlerInput.responseBuilder
            .speak(`<voice name='Emma'>${speechText}</voice>`)
            .reprompt(`<voice name='Emma'>${speechText}</voice>`)
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
            speechText = `Whoa, another one? Thirsty aren't we. You got it my friend! Coming right up! Although, I want you conscious for our conversation you know. ${VocalResponses.responses.POUR_DRINK_AUDIO} Cheers, to friends and great battles! ${VocalResponses.responses.GLASS_CLINK_AUDIO} ${VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS}`;
        } else if (drinkCount > 3) {
            speechText = `I'm sorry my friend. I cannot in all good conscience allow you to drink that much. ${VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS}`;
        }
        

        return handlerInput.responseBuilder
            .speak(`<voice name='Emma'>${speechText}</voice>`)
            .reprompt(`<voice name='Emma'>${VocalResponses.responses.PLEASE_REPEAT} ${speechText}</voice>`)
            .getResponse();
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {

        console.log("User asked for help.");

        return handlerInput.responseBuilder
            .speak('Sure. ' + drinkCount > 2 ? " " + VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " " + VocalResponses.responses.ALTERNATE_OPTIONS)
            .reprompt(VocalResponses.responses.PLEASE_REPEAT + drinkCount > 2 ? " " + VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " " + VocalResponses.responses.ALTERNATE_OPTIONS)
            .getResponse();
    },
};

const YesIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;

        // the attributes manager allows us to access session attributes
        const sessionAttributes = attributesManager.getSessionAttributes();

        outputSpeech = `I'm not sure what you are saying yes to but let's start with an option. ${drinkCount > 2 ? VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " "} ${VocalResponses.responses.ALTERNATE_OPTIONS}`;

        if (sessionAttributes) {
            if (sessionAttributes['hero-info'] && sessionAttributes['hero-role'] && sessionAttributes['hero-name']) {
                outputSpeech = `${getHeroInfo(sessionAttributes['hero-name'], sessionAttributes['hero-role'])} ${drinkCount > 2 ? VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " "} ${VocalResponses.responses.ALTERNATE_OPTIONS}`;
            }
        }

        return handlerInput.responseBuilder
            .speak(`<voice name='Emma'>${outputSpeech}</voice>`)
            .reprompt(`<voice name='Emma'>${VocalResponses.responses.PLEASE_REPEAT} ${drinkCount > 2 ? VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " "} ${VocalResponses.responses.ALTERNATE_OPTIONS}</voice>`)
            .getResponse();
    },
};

const NoIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent';
    },
    handle(handlerInput) {

        // // the attributes manager allows us to access session attributes
        // const sessionAttributes = attributesManager.getSessionAttributes();

        return handlerInput.responseBuilder
            .speak(`<voice name='Emma'>${drinkCount > 2 ? VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " "} ${VocalResponses.responses.ALTERNATE_OPTIONS}</voice>`)
            .reprompt(`<voice name='Emma'>${VocalResponses.responses.PLEASE_REPEAT} ${drinkCount > 2 ? VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " "} ${VocalResponses.responses.ALTERNATE_OPTIONS}</voice>`)
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
        let speechText = VocalResponses.responses.GOODBYE;

        const {attributesManager} = handlerInput;

        // the attributes manager allows us to access session attributes
        const sessionAttributes = attributesManager.getSessionAttributes();

        // if this isn't the first time the user is using the skill add their saved nick name to personalization.
        if (sessionAttributes['nickName']) {
            nickName = sessionAttributes['nickName'];

            // replace the words my friend with the person's name for more personalization if this isn't the first time they are using the skill.
            speechText = speechText.replace("my friend", nickName);
        }

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

function getHeroInfo(heroName, heroRole) {
    try {
        
        var filteredArray = null;
        var outputSpeech = "";
        let abilitiesLength = "";
        let heroDescription = "";
        let heroAbilities = null;

        if (heroRole.toLowerCase().includes("tank")) {
            filteredArray = heroes.role[0].tank.filter(function(itm){
                return itm.name == heroName;
            });

            if (filteredArray) {
                heroDescription = filteredArray[0].heroDescription;
                heroAbilities = filteredArray[0].abilities;
                abilitiesLength = filteredArray[0].abilities.length;

                outputSpeech = heroDescription;
                outputSpeech += ` ${heroName} has over ${abilitiesLength} abilities. `;
                heroAbilities.map((ability, index) => {
                    if (index == (abilitiesLength - 1)) {
                        outputSpeech += `And finally the ultimate ability, `;
                    }
                    outputSpeech += `${ability.name}. ${ability.description} `;
                });
            }

        } else if ((heroRole.toLowerCase().includes("damage") || heroRole.toLowerCase().includes("dps"))) {

            filteredArray = heroes.role[0].damage.filter(function(itm){
                return itm.name == heroName;
            });

            if (filteredArray) {
                heroDescription = filteredArray[0].heroDescription;
                heroAbilities = filteredArray[0].abilities;
                abilitiesLength = filteredArray[0].abilities.length;

                outputSpeech = heroDescription;
                outputSpeech += ` ${heroName} has over ${abilitiesLength} abilities. `;
                heroAbilities.map((ability, index) => {
                    if (index == (abilitiesLength - 1)) {
                        outputSpeech += `And finally the ultimate ability, `;
                    }
                    outputSpeech += `${ability.name}. ${ability.description} `;
                });
            }
        } else if (heroRole.toLowerCase().includes("healer")) {

            filteredArray = heroes.role[0].healer.filter(function(itm){
                return itm.name == heroName;
            });

            if (filteredArray) {
                heroDescription = filteredArray[0].heroDescription;
                heroAbilities = filteredArray[0].abilities;
                abilitiesLength = filteredArray[0].abilities.length;

                outputSpeech = heroDescription;
                outputSpeech += ` ${heroName} has over ${abilitiesLength} abilities. `;
                heroAbilities.map((ability, index) => {
                    if (index == (abilitiesLength - 1)) {
                        outputSpeech += `And finally the ultimate ability, `;
                    }
                    outputSpeech += `${ability.name}. ${ability.description} `;
                });
            }
        }
    } catch (error) {
        outputSpeech = VocalResponses.responses.OVERWATCH_SERVICE_UNAVAILABLE + drinkCount > 2 ? " " + VocalResponses.responses.TOO_MANY_DRINKS_OPTIONS : " " + VocalResponses.responses.ALTERNATE_OPTIONS;
        console.log(err.message);
        return outputSpeech;
        
    }

    return outputSpeech;
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
    .withSkillId("amzn1.ask.skill.9956ae31-282b-4ab3-b675-080acd9b0bed")
    .addRequestHandlers(
        CheckAccountLinkedHandler,
        LaunchRequestHandler,
        GetMyStatsIntentHandler,
        OverwatchLeagueUpcomingMatchesIntentHandler,
        OverwatchLeagueTeamInfoIntentIntentHandler,
        RandomRoleHeroGeneratorIntentHandler,
        SpecialTestIntentHandler,
        AnotherDrinkIntentHandler,
        HelpIntentHandler,
        YesIntentHandler,
        NoIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(
        LoggingRequestInterceptor,
        LoadAttributesRequestInterceptor)
    .addResponseInterceptors(
        LoggingResponseInterceptor,
        SaveAttributesResponseInterceptor)
    .withPersistenceAdapter(persistenceAdapter)
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();
