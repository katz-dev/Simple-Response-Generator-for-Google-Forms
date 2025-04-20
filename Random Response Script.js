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
