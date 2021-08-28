/** OVERWATCH GENERAL RESPONSES **/

let nickName = "my friend";

const responses = {
    GREETING: "Welcome to My Overwatch! We can tell you your stats of your Overwatch progress. Say get my stats to hear your stats of your Overwatch profile.",
    GREETING_PERSONALIZED: `Welcome ${nickName} to Blizz Tavern! Please, have a seat and take a load off! Here's a round on the house!`,
    GREETING_PERSONALIZED_II: `<prosody volume="x-loud">Hey you miscreants! You throw another chair and I'll toss you out myself!</prosody> Oh hey there ${nickName}! Welcome to Blizz Tavern! You must be exhausted, drinks are <emphasis level="reduced">on</emphasis> me!`,
    GREETING_PERSONALIZED_III: `<prosody volume="x-loud">Hey Jack! don't make me come back there!</prosody> Oh hey ${nickName}, sorry about that. Some people get a little <emphasis level="moderate">rowdy</emphasis> a round here. Welcome to Blizz Tavern! You must be exhausted. Here, drinks are on me!`,
    GREETING_PERSONALIZED_DISPLAY: `Welcome ${nickName} to Blizz Tavern! Please, have a seat and take a load off! Here's a round on the house!`,
    GREETING_PERSONALIZED_II_DISPLAY: `Hey you miscreants! You throw another chair and I'll toss you out myself! Oh hey there ${nickName}! Welcome to Blizz Tavern! You must be exhausted, drinks are on me!`,
    GREETING_PERSONALIZED_III_DISPLAY: `Hey Jack! don't make me come back there! Oh hey ${nickName}, sorry about that. Some people get a little rowdy a round here. Welcome to Blizz Tavern! You must be exhausted. Here, drinks are on me!`,
    OPTIONS: `Now, what can I do for you? Would you like another drink, do you want to check on your Overwatch progress, do you want us to pick a random hero for you to play, do you want to hear about upcoming Overwatch League matches, do you want to find out how your favorite Overwatch League team is doing this season, or would you like to leave the tavern?`,
    TOO_MANY_DRINKS_OPTIONS: `Now. What can I do for you? Would you like to check on your Overwatch progress, do you want us to pick a random hero for you to play, do you want to want to hear about upcoming Overwatch League matches, do you want to want to find out how your favorite Overwatch League team is doing this season, or are you looking to leave the tavern?`,
    ALTERNATE_OPTIONS: `Okay. Now, what can I do for you? Would you like another drink, do you want to check on your Overwatch progress, do you want us to pick a random hero for you to play, do you want to want to hear about upcoming Overwatch League matches, do you want to want to find out how your favorite Overwatch League team is doing this season, or do you want to leave the tavern?`,
    YOU_ARE_WELCOME: `Not a problem at all ${nickName}! How have you been faring?`,
    PROGRESSIVE_RESPONSE: "Sure, let me check my data analysis unit. Let's see here.",
    GREETING_RESPONSE: "I'm doing just well. I'm glad that you are here!",
    NEED_TO_LINK_MESSAGE: 'Before we can continue, you will need to link your battle.net account to the My Overwatch skill using the card that I have sent to the Alexa app.',
    TOP_MENU: "Great! We can tell you your stats of your Overwatch progress. Say get my stats to hear your stats of your Overwatch profile.",
    OVERWATCH_SERVICE_UNAVAILABLE: "Oh no! The My Overwatch service is not available at the moment. Please try again later.",
    OVERWATCH_LEAGUE_SERVICE_UNAVAILABLE: "Oh no! The Overwatch League service is not available at the moment. Please try again later.",
    OVERWATCH_LEAGUE_TEAM_SERVICE_UNAVAILABLE: "Oh no! The Overwatch Team service is not available at the moment. Please try again later.",
    PLEASE_WAIT: "Please wait while we try to retrieve that profile information",
    PLACEMENTS_NOT_COMPLETE: "You have not placed yet in this Competitive season. Make sure you do so in order to hear about your ranking info.",
    GOODBYE: `You are always welcome here ${nickName}! If you have some time, please leave us a rating on the My Overwatch skill in the skill store. We would appreciate it greatly.
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

module.exports = {
    responses
};