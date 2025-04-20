# Intro

If you have to create some meaningless questionnaire for your school project and need answers for it, I present to you my **Auto-Response Generator for Google Forms**!

Don’t worry—even if you don’t know much about programming, I’ll make it easy to understand and use. It’s effectively plug and play.

>**Note:** This tool is designed for **multiple choice** and **true or false** question types.

# What the Tool Does

* Connects to a Google Form using its ID.
* Can **strategically** or **randomly** fill out and submit forms as many times as you want.
* Automatically detects **positive** and **negative** answers.
* By default, answers your questionnaire in a **positive** manner.

# How to Use (for Random Responses)

1. Open [Google Apps Script](https://script.google.com/home) on the same Google account that you made the form with.
2. Create a new project and delete the default code.
3. Paste the script below and replace the form ID with your actual form ID (found in the URL).**Example form URL (to find your Form ID):** `https://docs.google.com/forms/d/[FORM ID HERE]/edit`
4. Click the **“Run”** button in the top bar.

# Random Response Script

    function foo() {
      const form = FormApp.openById("1uQSf8PwHJaUMsO6GIkkXCW09sEZZfcDdiatpNypA1yY");
      const randomSubs = [], nSubs = 50;
      while (randomSubs.length < nSubs) {
        try {
          randomSubs.push(createRandomSubmission_(form).submit());
        } catch (e) {
          Logger.log("Error submitting form: " + e);
        }
      }
    }
    
    function createRandomSubmission_(form) {
      const resp = form.createResponse();
      const questions = form.getItems().filter(isAnswerable_);
    
      questions.forEach(function (question) {
        try {
          const answer = getRandomAnswer_(question);
          if (answer) resp.withItemResponse(answer);
        } catch (e) {
          Logger.log("Error answering question: " + e);
        }
      });
    
      return resp;
    }
    
    const iTypes = FormApp.ItemType;
    
    function isAnswerable_(item) {
      const iType = item.getType();
      return (
        iType === iTypes.MULTIPLE_CHOICE ||
        iType === iTypes.LIST
      );
    }
    
    function getRandomAnswer_(q) {
      const qType = q.getType();
      switch (qType) {
        case iTypes.MULTIPLE_CHOICE:
          return getRandomMultipleChoiceAnswer_(q.asMultipleChoiceItem());
        case iTypes.LIST:
          return getRandomListAnswer_(q.asListItem());
        default:
          throw new TypeError("Answering questions of type '" + qType + "' is not yet implemented");
      }
    }
    
    function getRandomMultipleChoiceAnswer_(mcItem) {
      const choices = mcItem.getChoices();
      if (choices.length === 0) throw new Error("No choices available");
      const i = Math.floor(Math.random() * choices.length);
      return mcItem.createResponse(choices[i].getValue()); // ← safe version
    }
    
    function getRandomListAnswer_(listItem) {
      const choices = listItem.getChoices();
      if (choices.length === 0) throw new Error("No choices available");
      const i = Math.floor(Math.random() * choices.length);
      return listItem.createResponse(choices[i].getValue()); // ← safe version
    }

# How to Use (for Strategic Responses)

1. Open [Google Apps Script](https://script.google.com/home) on the same Google account that you made the form with.
2. Create a new project and delete the default code.
3. Paste the script below and replace the form ID with your actual form ID (same as before).**Example form URL:** `https://docs.google.com/forms/d/[FORM ID HERE]/edit`
4. Run the script as-is for default **positive-biased** responses, or proceed to step 5 for customisation.

**How It Picks Responses (Default Behavior)**

* **Positive phrases** (e.g. *very easy, agree, yes*): \~70% chance
* **Neutral phrases** (e.g. *not sure, neutral*): \~20% chance
* **Negative phrases** (anything else): \~10% chance *(only if positive or neutral phrases are found)*
* If no recognisable keywords are found, answers are picked **completely randomly**.

# Customising the Strategy

5. To customize bias:

* Edit the **positiveWords** and **neutralWords** arrays to match your desired keywords.
* If you want more **negative** responses, simply move negative keywords into the `positiveWords` array (to give them the 70% weight).

# Strategic Response Script

    function foo() {
      const form = FormApp.openById("1uQSf8PwHJaUMsO6GIkkXCW09sEZZfcDdiatpNypA1yY");
      const randomSubs = [], nSubs = 50;
      while (randomSubs.length < nSubs) {
        try {
          randomSubs.push(createRandomSubmission_(form).submit());
        } catch (e) {
          Logger.log("Error submitting form: " + e);
        }
      }
    }
    
    function createRandomSubmission_(form) {
      const resp = form.createResponse();
      const questions = form.getItems().filter(isAnswerable_);
    
      questions.forEach(function (question) {
        try {
          const answer = getBiasedAnswer_(question);
          if (answer) resp.withItemResponse(answer);
        } catch (e) {
          Logger.log("Error answering question: " + e);
        }
      });
    
      return resp;
    }
    
    const iTypes = FormApp.ItemType;
    
    function isAnswerable_(item) {
      const iType = item.getType();
      return (
        iType === iTypes.MULTIPLE_CHOICE ||
        iType === iTypes.LIST
      );
    }
    
    function getBiasedAnswer_(q) {
      const qType = q.getType();
      switch (qType) {
        case iTypes.MULTIPLE_CHOICE:
          return getBiasedChoice(q.asMultipleChoiceItem());
        case iTypes.LIST:
          return getBiasedChoice(q.asListItem());
        default:
          throw new TypeError("Unsupported question type: " + qType);
      }
    }
    
    // Biased choice selection based on answer sentiment
    function getBiasedChoice(item) {
      const choices = item.getChoices().map(c => c.getValue());
    
      // Define positive and neutral keywords for identification
      const positiveWords = ["very easy", "easy", "strongly agree", "agree", "yes", "false", "definitely", "probably", "smooth", "very smooth"];
      const neutralWords = ["neutral", "not sure"];
      
      const positive = choices.filter(c => matchesKeyword(c, positiveWords));
      const neutral = choices.filter(c => matchesKeyword(c, neutralWords));
      const negative = choices.filter(c => !positive.includes(c) && !neutral.includes(c));
    
      // Set weighted chances
      const pool = [];
    
      positive.forEach(c => pool.push(...Array(7).fill(c))); // 70%
      neutral.forEach(c => pool.push(...Array(2).fill(c)));  // 20%
      negative.forEach(c => pool.push(c));                   // 10%
    
      if (pool.length === 0) throw new Error("No answer options available");
    
      const selected = pool[Math.floor(Math.random() * pool.length)];
      return item.createResponse(selected);
    }
    
    function matchesKeyword(choice, keywordList) {
      const lc = choice.toLowerCase();
      return keywordList.some(k => lc.includes(k));
    }

If you have any questions about the script, feel free to drop a comment—I should be able to help you out with any issues.
