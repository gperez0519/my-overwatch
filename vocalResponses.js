/** OVERWATCH GENERAL RESPONSES **/

let nickName = "my friend";

const responses = {
  GREETING_PERSONALIZED: `Junkrat, come on, you can't bury your treasure behind the bar. What is wrong with you? <audio src='https://my-overwatch.s3.amazonaws.com/Junkrat+-+Treasure.mp3'/> Uh, okay. Whatever, Oh hey there ${nickName}! Don't mind him, he can be a little weird sometimes. Welcome to Blizzard Tavern! You must be exhausted, drinks are <emphasis level="reduced">on</emphasis> me!`,
  GREETING_PERSONALIZED_II: `Bastion, can you do me a favor and bring me those boxes? <audio src='https://my-overwatch.s3.amazonaws.com/Bastion+-+Nanana.mp3'/> Wait, what? Bastion, I don't speak that language. Is anyone a translator in here? Actually, nevermind that. ${nickName}, I'm so glad you are here. Welcome to Blizzard Tavern! I could imagine that you can use a drink right about now, I could as well.`,
  GREETING_PERSONALIZED_III: `<audio src='https://my-overwatch.s3.amazonaws.com/Genji+-+Ramen.mp3'/> Genji, we don't serve Ramen here, where did you get Ramen from? Actually, you know what, I don't want to know. Hey ${nickName}, Welcome to Blizzard Tavern! You must be exhausted, drinks are <emphasis level="reduced">on</emphasis> me!`,
  GREETING_PERSONALIZED_DISPLAY: `Junkrat, come on, you can't bury your treasure behind the bar. What is wrong with you? Uh, okay. Whatever, Oh hey there ${nickName}! Don't mind him, he can be a little weird sometimes. Welcome to Blizzard Tavern! You must be exhausted, drinks are on me!`,
  GREETING_PERSONALIZED_II_DISPLAY: `Bastion, can you do me a favor and bring me those boxes? Wait, what? Bastion, I don't speak that language. Is anyone a translator in here? You know what, nevermind. ${nickName}, I'm so glad you are here. Welcome to Blizzard Tavern! I bet you could use a drink. I could as well.`,
  GREETING_PERSONALIZED_III_DISPLAY: `Genji, we don't serve Ramen here, where did you get Ramen from? Actually, you know what, I don't want to know. Hey ${nickName}, Welcome to Blizzard Tavern! You must be exhausted, drinks are on me!`,
  ERROR_PROMPT: `My apologies, my data analysis unit has malfunctioned <emphasis level='strong'>there</emphasis> for a second. If this continues to occur, send us an email at ultrium dev at gmail.com, that is <say-as interpret-as='spell-out'>ultriumdev@gmail.com</say-as>`,
  ERROR_PROMPT_DISPLAY: `My apologies, my data analysis unit has malfunctioned there for a second. If this continues to occur, send us an email at ultriumdev@gmail.com.`,
  HELP_PROMPT: `Sure, we have a couple of features in this skill to assist you. However, if you are experiencing any issues with the skill, please let us know by sending us an email at ultriumdev@gmail.com, that is <say-as interpret-as='spell-out'>ultriumdev@gmail.com</say-as>. In any case, here are the options,`,
  HELP_PROMPT_DISPLAY: `Sure, we have a couple of features in this skill to assist you. However, if you are experiencing any issues with the skill, please let us know by sending us an email at ultriumdev@gmail.com. In any case, here are the options,`,
  HELP_REPEAT_PROMPT: `My apologies, something went wrong there. For assistance, we have a couple of features in this skill to assist you. However, if you are experiencing any issues with the skill, please let us know by sending us an email at ultriumdev@gmail.com, that is <say-as interpret-as='spell-out'>ultriumdev@gmail.com</say-as>. In any case, here are the options,`,
  HERO_MORE_INFO_PROMPT: `Would you like to hear more about this hero?`,
  ANYTHING_ELSE: `Now, what else can I do for you?`,
  OPTION_SET_ONE_NO_DRINK: `would you like to check on your Overwatch progress, choose a random hero to play, or would you like something else?`,
  OPTION_SET_TWO_NO_DRINK: `would you like to hear about Overwatch league matches, hear about your favorite Overwatch league team's record or would you like something else?`,
  OPTION_SET_THREE_NO_DRINK: `would you like to leave the tavern, or would you like something else?`,
  OPTION_SET_ONE_WITH_DRINK: `would you like another drink, would you like to check on your Overwatch progress, or would you like something else?`,
  OPTION_SET_TWO_WITH_DRINK: `would you like to choose a random hero to play, would you like to hear about Overwatch league matches, or would you like something else?`,
  OPTION_SET_THREE_WITH_DRINK: `would you like to hear about your favorite Overwatch league team's record, would you like to leave the tavern, or would you like something else?`,
  YOU_ARE_WELCOME: `Not a problem at all ${nickName}! How have you been faring?`,
  PROGRESSIVE_RESPONSE:
    "Sure, let me check my data analysis unit. Let's see here.",
  GREETING_RESPONSE: "I'm doing just well. I'm glad that you are here!",
  NEED_TO_LINK_MESSAGE:
    "Before I can continue, you will need to link your battle.net account to the Blizzard Tavern - Overwatch skill using the card that I have sent to the Alexa app.",
  TOP_MENU:
    "Great! I can tell you your stats of your Overwatch progress. Say get my stats to hear your stats of your Overwatch profile.",
  OVERWATCH_SERVICE_UNAVAILABLE:
    "Oh no! The Blizzard Tavern - Overwatch service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultrium dev at gmail.com, that is <say-as interpret-as='spell-out'>ultriumdev@gmail.com</say-as>.",
  OVERWATCH_LEAGUE_SERVICE_UNAVAILABLE:
    "Oh no! The Overwatch League service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultrium dev at gmail.com, that is <say-as interpret-as='spell-out'>ultriumdev@gmail.com</say-as>.",
  OVERWATCH_LEAGUE_TEAM_SERVICE_UNAVAILABLE:
    "Oh no! The Overwatch Team service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultrium dev at gmail.com, that is <say-as interpret-as='spell-out'>ultriumdev@gmail.com</say-as>.",
  OVERWATCH_HERO_SERVICE_UNAVAILABLE:
    "Oh no! The Overwatch Hero service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultrium dev at gmail.com, that is <say-as interpret-as='spell-out'>ultriumdev@gmail.com</say-as>.",
  OVERWATCH_SERVICE_UNAVAILABLE_DISPLAY:
    "Oh no! The Blizzard Tavern - Overwatch service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultriumdev@gmail.com.",
  OVERWATCH_LEAGUE_SERVICE_UNAVAILABLE_DISPLAY:
    "Oh no! The Overwatch League service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultriumdev@gmail.com.",
  OVERWATCH_LEAGUE_TEAM_SERVICE_UNAVAILABLE_DISPLAY:
    "Oh no! The Overwatch Team service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultriumdev@gmail.com.",
  OVERWATCH_HERO_SERVICE_UNAVAILABLE_DISPLAY:
    "Oh no! The Overwatch Hero service is not available at the moment. Please try again later. If this continues to occur, send us an email at ultriumdev@gmail.com.",
  OVERWATCH_STATS_NOT_AVAILABLE: `Interesting, I don't believe you have played any games just yet. Make sure you login to Overwatch and start playing silly.`,
  PRIVATE_PROFILE_ISSUE: `I would love to tell you how your Overwatch progress is going but it seems your profile is private. You should set your profile public so my analysis is able to retrieve your statistics. In order to set your profile to public, open the Overwatch game, click on Options, click Social and toggle the arrow for Career Profile Visibility to Public. When you exit the game, I should be able to retrieve your statistics thereafter.`,
  FALLBACK_PROMPT: `Sorry, I could not recognize the option that you are referring to.`,
  PLEASE_WAIT: "Please wait while I try to retrieve that profile information",
  PLACEMENTS_NOT_COMPLETE:
    "You have not placed yet in this Competitive season. Make sure you do so in order to hear about your ranking info.",
  GOODBYE: `${nickName}, thanks for joining us and we look forward to seeing you again. If you haven't already done so, please leave us a rating on the Blizzard Tavern skill in the skill store, I would appreciate it greatly. Stop by Blizzard Tavern next time and we can catch up again. Good luck in your battles!`,
  DEFAULT_ERROR_BATTLETAG:
    "Strange, My data analysis unit is not finding your information. No worries, I can try again later.",
  DEFAULT_ERROR_PLATFORM:
    "Sorry, I did not recognize that platform. Please say either Xbox, PC, or Playstation.",
  PLATFORM_INQUIRY:
    "Great! Which platform do you want to get your stats for? Xbox, PC or Playstation?",
  PLEASE_REPEAT: "Sorry, I did not hear from you.",
  POUR_DRINK_AUDIO:
    "<audio src='soundbank://soundlibrary/household/water/pour_water_01'/>",
  DOOR_OPEN_AUDIO:
    "<audio src='soundbank://soundlibrary/home/amzn_sfx_door_open_01'/>",
  GLASS_CLINK_AUDIO:
    "<audio src='soundbank://soundlibrary/glass/clink/glasses_clink_04'/>",
  ROWDY_BAR_AMBIANCE_AUDIO:
    "<audio src='soundbank://soundlibrary/ambience/amzn_sfx_crowd_bar_rowdy_01'/>",
  HANZO_GIFT_FOR_YOU_AUDIO:
    "<audio src='https://my-overwatch.s3.amazonaws.com/Hanzo+-+A+Gift+for+You.mp3'/>",
  JUNKRAT_TREASURE_AUDIO:
    "<audio src='https://my-overwatch.s3.amazonaws.com/Junkrat+-+Treasure.mp3'/>",
};

module.exports = {
  responses,
};
