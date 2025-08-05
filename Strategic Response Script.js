/**
 * Automatically fills a Google Form with a specified number of biased submissions.
 * This version supports Multiple Choice, List, and Linear Scale questions.
 */
function foo() {
  // Replace "1bH_h-7B43MyUuZDrc1b0H0bZIu-kQGEQ0rhb20lxHn4" with your form ID.
  // You can find this in the URL of your Google Form in the 'edit' view.
  const form = FormApp.openById("1bH_h-7B43MyUuZDrc1b0H0bZIu-kQGEQ0rhb20lxHn4");
  
  // Set the number of submissions you want to create.
  const nSubs = 50; 
  
  const randomSubs = [];
  while (randomSubs.length < nSubs) {
    try {
      // Create and submit a single biased response.
      randomSubs.push(createRandomSubmission_(form).submit());
    } catch (e) {
      Logger.log("Error submitting form: " + e);
    }
  }
}

/**
 * Creates a single form response with a biased answer for each supported question.
 * @param {GoogleAppsScript.Forms.Form} form The form to submit to.
 * @return {GoogleAppsScript.Forms.FormResponse} The completed form response.
 */
function createRandomSubmission_(form) {
  const resp = form.createResponse();
  
  // Get all questions from the form and filter for the types we can answer.
  const questions = form.getItems().filter(isAnswerable_);
  
  questions.forEach(function (question) {
    try {
      // Get a biased answer for the specific question.
      const answer = getBiasedAnswer_(question);
      if (answer) {
        resp.withItemResponse(answer);
      }
    } catch (e) {
      Logger.log("Error answering question: " + e);
    }
  });
  
  return resp;
}

// Global constant for form item types
const iTypes = FormApp.ItemType;

/**
 * Checks if a form item is a supported, answerable type.
 * This now includes Linear Scale questions.
 * @param {GoogleAppsScript.Forms.Item} item The form item to check.
 * @return {boolean} True if the item is answerable, false otherwise.
 */
function isAnswerable_(item) {
  const iType = item.getType();
  return (
    iType === iTypes.MULTIPLE_CHOICE ||
    iType === iTypes.LIST ||
    iType === iTypes.SCALE // Added support for Linear Scale
  );
}

/**
 * Dispatches the question to the correct function for generating a biased answer.
 * @param {GoogleAppsScript.Forms.Item} q The question item.
 * @return {GoogleAppsScript.Forms.ItemResponse} The response for the question.
 */
function getBiasedAnswer_(q) {
  const qType = q.getType();
  switch (qType) {
    case iTypes.MULTIPLE_CHOICE:
      return getBiasedChoice(q.asMultipleChoiceItem());
    case iTypes.LIST:
      return getBiasedChoice(q.asListItem());
    case iTypes.SCALE:
      return getBiasedScale(q.asScaleItem()); // New function for linear scale
    default:
      throw new TypeError("Unsupported question type: " + qType);
  }
}

/**
 * Biased choice selection for Multiple Choice and List items.
 * The logic favors "positive" responses.
 * @param {GoogleAppsScript.Forms.MultipleChoiceItem | GoogleAppsScript.Forms.ListItem} item The item to answer.
 * @return {GoogleAppsScript.Forms.ItemResponse} The response for the item.
 */
function getBiasedChoice(item) {
  const choices = item.getChoices().map(c => c.getValue());
  
  // Define positive and neutral keywords for identification
  const positiveWords = ["very easy", "easy", "strongly agree", "agree", "yes", "false", "definitely", "probably", "smooth", "very smooth"];
  const neutralWords = ["neutral", "not sure"];
  
  const positive = choices.filter(c => matchesKeyword(c, positiveWords));
  const neutral = choices.filter(c => matchesKeyword(c, neutralWords));
  const negative = choices.filter(c => !positive.includes(c) && !neutral.includes(c));
  
  // Set weighted chances for each category
  const pool = [];
  positive.forEach(c => pool.push(...Array(7).fill(c))); // 70% chance
  neutral.forEach(c => pool.push(...Array(2).fill(c))); 	// 20% chance
  negative.forEach(c => pool.push(c)); 					// 10% chance
  
  if (pool.length === 0) {
    throw new Error("No answer options available for choice question.");
  }
  
  // Randomly select a biased choice from the weighted pool.
  const selected = pool[Math.floor(Math.random() * pool.length)];
  return item.createResponse(selected);
}

/**
 * Biased number selection for Linear Scale items.
 * The logic favors numbers towards the upper bound of the scale.
 * @param {GoogleAppsScript.Forms.ScaleItem} item The linear scale item to answer.
 * @return {GoogleAppsScript.Forms.ItemResponse} The response for the item.
 */
function getBiasedScale(item) {
  const lowerBound = item.getLowerBound();
  const upperBound = item.getUpperBound();

  // Create a weighted pool of numbers to select from
  const pool = [];
  const totalRange = upperBound - lowerBound + 1;
  const positiveThreshold = Math.ceil(upperBound - totalRange * 0.3); // Top ~30% of the scale
  const neutralThreshold = Math.ceil(upperBound - totalRange * 0.7); // Middle ~40% of the scale

  for (let i = lowerBound; i <= upperBound; i++) {
    if (i >= positiveThreshold) {
      pool.push(...Array(7).fill(i)); // 70% chance for top values
    } else if (i >= neutralThreshold) {
      pool.push(...Array(2).fill(i)); // 20% chance for middle values
    } else {
      pool.push(i); // 10% chance for low values
    }
  }

  if (pool.length === 0) {
    throw new Error("No scale options available for scale question.");
  }

  // Randomly select a biased number from the weighted pool.
  const selected = pool[Math.floor(Math.random() * pool.length)];
  return item.createResponse(selected);
}

/**
 * Helper function to check if a string contains any of the keywords.
 * @param {string} choice The string to search within.
 * @param {string[]} keywordList The list of keywords to search for.
 * @return {boolean} True if a keyword is found, false otherwise.
 */
function matchesKeyword(choice, keywordList) {
  const lc = choice.toLowerCase();
  return keywordList.some(k => lc.includes(k));
}
