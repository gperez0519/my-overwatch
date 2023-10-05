const { responses } = require("../vocalResponses");
function configureAndReturnNextOptionSet(
  patronAllowedDrinks,
  currentOptionSet
) {
  let optionResponse = "";

  if (patronAllowedDrinks) {
    if (currentOptionSet == "OPTION_ONE_WITH_DRINKS") {
      currentOptionSet = "OPTION_TWO_WITH_DRINKS";
      optionResponse = `${responses.OPTION_SET_TWO_WITH_DRINK}`;
    } else if (currentOptionSet == "OPTION_TWO_WITH_DRINKS") {
      currentOptionSet = "OPTION_THREE_WITH_DRINKS";
      optionResponse = `${responses.OPTION_SET_THREE_WITH_DRINK}`;
    } else if (currentOptionSet == "OPTION_THREE_WITH_DRINKS") {
      currentOptionSet = "OPTION_ONE_WITH_DRINKS";
      optionResponse = `${responses.OPTION_SET_ONE_WITH_DRINK}`;
    }
  } else {
    if (
      currentOptionSet == "OPTION_ONE_WITH_DRINKS" ||
      currentOptionSet == "OPTION_ONE_NO_DRINKS"
    ) {
      currentOptionSet = "OPTION_TWO_NO_DRINKS";
      optionResponse = `${responses.OPTION_SET_TWO_NO_DRINK}`;
    } else if (
      currentOptionSet == "OPTION_TWO_WITH_DRINKS" ||
      currentOptionSet == "OPTION_TWO_NO_DRINKS"
    ) {
      currentOptionSet = "OPTION_THREE_NO_DRINKS";
      optionResponse = `${responses.OPTION_SET_THREE_NO_DRINK}`;
    } else if (
      currentOptionSet == "OPTION_THREE_WITH_DRINKS" ||
      currentOptionSet == "OPTION_THREE_NO_DRINKS"
    ) {
      currentOptionSet = "OPTION_ONE_NO_DRINKS";
      optionResponse = `${responses.OPTION_SET_ONE_NO_DRINK}`;
    }
  }

  return { optionResponse, currentOptionSet };
}

module.exports = {
  configureAndReturnNextOptionSet,
};
