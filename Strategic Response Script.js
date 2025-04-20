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
