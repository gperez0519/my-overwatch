/** OVERWATCH GENERAL RESPONSES **/

let nickName = "my friend";

const responses = {
    GREETING: "Welcome to My Overwatch! I can tell you your stats of your Overwatch progress. Say get my stats to hear your stats of your Overwatch profile.",
    GREETING_PERSONALIZED: `Welcome ${nickName} to Blizz Tavern! Please, have a seat and take a load off! Here's a round on the house!`,
    GREETING_PERSONALIZED_II: `<prosody volume="x-loud">Hey you miscreants! You throw another chair and I'll toss you out myself!</prosody> Oh hey there ${nickName}! Welcome to Blizz Tavern! You must be exhausted, drinks are <emphasis level="reduced">on</emphasis> me!`,
    GREETING_PERSONALIZED_III: `<prosody volume="x-loud">Hey Jack! don't make me come back there!</prosody> Oh hey ${nickName}, sorry about that. Some people get a little <emphasis level="moderate">rowdy</emphasis> a round here. Welcome to Blizz Tavern! You must be exhausted. Here, drinks are on me!`,
    GREETING_PERSONALIZED_DISPLAY: `Welcome ${nickName} to Blizz Tavern! Please, have a seat and take a load off! Here's a round on the house!`,
    GREETING_PERSONALIZED_II_DISPLAY: `Hey you miscreants! You throw another chair and I'll toss you out myself! Oh hey there ${nickName}! Welcome to Blizz Tavern! You must be exhausted, drinks are on me!`,
    GREETING_PERSONALIZED_III_DISPLAY: `Hey Jack! don't make me come back there! Oh hey ${nickName}, sorry about that. Some people get a little rowdy a round here. Welcome to Blizz Tavern! You must be exhausted. Here, drinks are on me!`,
    ERROR_PROMPT: `My apologies, my data analysis unit has malfunctioned there for a second. If this continues to occur, send us an email at ultriumdev@gmail.com, that is <say-as interpret-as='spell-out'>ultriumdev@gmail.com</say-as>`,
    ERROR_PROMPT_DISPLAY: `My apologies, my data analysis unit has malfunctioned there for a second. If this continues to occur, send us an email at ultriumdev@gmail.com.`,
    HELP_PROMPT: `Sure, we have a couple of features in this skill to assist you. However, if you are experiencing any issues with the skill, please let us know by sending us an email at ultriumdev@gmail.com, that is <say-as interpret-as='spell-out'>ultriumdev@gmail.com</say-as>. In any case, here are the options, would you like another drink, do you want to check on your Overwatch progress, do you want us to pick a random hero for you to play, do you want to hear about upcoming Overwatch League matches, do you want to find out how your favorite Overwatch League team is doing this season, or would you like to leave the tavern?`,
    HELP_PROMPT_DISPLAY: `Sure, we have a couple of features in this skill to assist you. However, if you are experiencing any issues with the skill, please let us know by sending us an email at ultriumdev@gmail.com. In any case, here are the options, would you like another drink, do you want to check on your Overwatch progress, do you want us to pick a random hero for you to play, do you want to hear about upcoming Overwatch League matches, do you want to find out how your favorite Overwatch League team is doing this season, or would you like to leave the tavern?`,
    HELP_REPEAT_PROMPT: `My apologies, something went wrong there. For assistance, we have a couple of features in this skill to assist you. However, if you are experiencing any issues with the skill, please let us know by sending us an email at ultriumdev@gmail.com, that is <say-as interpret-as='spell-out'>ultriumdev@gmail.com</say-as>. In any case, here are the options, would you like another drink, do you want to check on your Overwatch progress, do you want us to pick a random hero for you to play, do you want to hear about upcoming Overwatch League matches, do you want to find out how your favorite Overwatch League team is doing this season, or would you like to leave the tavern?`,
    HERO_MORE_INFO_PROMPT: `Would you like to hear more about this hero?`,
    OPTIONS: `Now, what can I do for you? Would you like another drink, do you want to check on your Overwatch progress, do you want us to pick a random hero for you to play, do you want to hear about upcoming Overwatch League matches, do you want to find out how your favorite Overwatch League team is doing this season, or would you like to leave the tavern?`,
    TOO_MANY_DRINKS_OPTIONS: `Now. What can I do for you? Would you like to check on your Overwatch progress, do you want us to pick a random hero for you to play, do you want to hear about upcoming Overwatch League matches, do you want to find out how your favorite Overwatch League team is doing this season, or are you looking to leave the tavern?`,
    ALTERNATE_OPTIONS: `Okay. Now, what can I do for you? Would you like another drink, do you want to check on your Overwatch progress, do you want us to pick a random hero for you to play, do you want to hear about upcoming Overwatch League matches, do you want to find out how your favorite Overwatch League team is doing this season, or do you want to leave the tavern?`,
    YOU_ARE_WELCOME: `Not a problem at all ${nickName}! How have you been faring?`,
    PROGRESSIVE_RESPONSE: "Sure, let me check my data analysis unit. Let's see here.",
    GREETING_RESPONSE: "I'm doing just well. I'm glad that you are here!",
    NEED_TO_LINK_MESSAGE: 'Before I can continue, you will need to link your battle.net account to the My Overwatch skill using the card that I have sent to the Alexa app.',
    TOP_MENU: "Great! I can tell you your stats of your Overwatch progress. Say get my stats to hear your stats of your Overwatch profile.",
    OVERWATCH_SERVICE_UNAVAILABLE: "Oh no! The My Overwatch service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultriumdev@gmail.com, that is <say-as interpret-as='spell-out'>ultriumdev@gmail.com</say-as>",
    OVERWATCH_LEAGUE_SERVICE_UNAVAILABLE: "Oh no! The Overwatch League service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultriumdev@gmail.com, that is <say-as interpret-as='spell-out'>ultriumdev@gmail.com</say-as>",
    OVERWATCH_LEAGUE_TEAM_SERVICE_UNAVAILABLE: "Oh no! The Overwatch Team service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultriumdev@gmail.com, that is <say-as interpret-as='spell-out'>ultriumdev@gmail.com</say-as>",
    OVERWATCH_HERO_SERVICE_UNAVAILABLE: "Oh no! The Overwatch Hero service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultriumdev@gmail.com, that is <say-as interpret-as='spell-out'>ultriumdev@gmail.com</say-as>",
    OVERWATCH_SERVICE_UNAVAILABLE_DISPLAY: "Oh no! The My Overwatch service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultriumdev@gmail.com.",
    OVERWATCH_LEAGUE_SERVICE_UNAVAILABLE_DISPLAY: "Oh no! The Overwatch League service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultriumdev@gmail.com.",
    OVERWATCH_LEAGUE_TEAM_SERVICE_UNAVAILABLE_DISPLAY: "Oh no! The Overwatch Team service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultriumdev@gmail.com.",
    OVERWATCH_HERO_SERVICE_UNAVAILABLE_DISPLAY: "Oh no! The Overwatch Hero service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultriumdev@gmail.com.",
    FALLBACK_PROMPT: `Sorry, I could not recognize the option that you are referring to.`,
    PLEASE_WAIT: "Please wait while I try to retrieve that profile information",
    PLACEMENTS_NOT_COMPLETE: "You have not placed yet in this Competitive season. Make sure you do so in order to hear about your ranking info.",
    GOODBYE: `You are always welcome here ${nickName}! If you haven't already done so, please leave us a rating on the Blizz Tavern - Overwatch skill in the skill store. I would appreciate it greatly. Stop by Blizz Tavern next time and we can catch up again. Good luck in your battles!`,
    DEFAULT_ERROR_BATTLETAG: "Strange, My data analysis unit is not finding your information. No worries, I can try again later.",
    DEFAULT_ERROR_PLATFORM: "Sorry, I did not recognize that platform. Please say either Xbox, PC, or Playstation.",
    PLATFORM_INQUIRY: "Great! Which platform do you want to get your stats for? Xbox, PC or Playstation?",
    PLEASE_REPEAT: "Sorry, I did not hear from you.",
    ANYTHING_ELSE: "Is there anything else that you would like to know?",
    POUR_DRINK_AUDIO: "<audio src='soundbank://soundlibrary/household/water/pour_water_01'/>",
    DOOR_OPEN_AUDIO: "<audio src='soundbank://soundlibrary/home/amzn_sfx_door_open_01'/>",
    GLASS_CLINK_AUDIO: "<audio src='soundbank://soundlibrary/glass/clink/glasses_clink_04'/>",
    ROWDY_BAR_AMBIANCE_AUDIO: "<audio src='soundbank://soundlibrary/ambience/amzn_sfx_crowd_bar_rowdy_01'/>"
}

module.exports = {
    responses
};