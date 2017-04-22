'use strict';

/**
 * This skill queries Wolfam|Alpha for nutritional data including calories for the requested food.
 * 
 * 
 */


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `${title}`,
            content: `${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Welcome to Nutrition Label. ' +
        'You can ask for nutrition facts by saying, how many calories are in bacon.';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Please request a nutrition fact by saying, ' +
        'how many calories are in bacon';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for using Nutrition Label.';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

/*
 * Gets the food from the intent, makes a call to the appropriate food processing
 * function, prepares a response.
 */
function getFood(intent, session, callback) {
   const cardTitle = 'Nutrition Request';
    const foodSlot = intent.slots.Food;
    const nutrientSlot = intent.slots.Nutrient;
    let repromptText = '';
    let sessionAttributes = {};
    const shouldEndSession = true;
    let speechOutput = '';

    if (foodSlot && nutrientSlot) {
        const food = foodSlot.value;
        const nutrient = nutrientSlot.value
        var units = "";
        getCalsFromWolfram(nutrient, food, (speechOut) => {
            speechOutput = speechOut;
            repromptText = "";
            callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        });
    } else {
        speechOutput = "I couldn't get info for that food. Please try again.";
        repromptText = "You can request nutritional info " +
            'for a food by saying, get calories for pizza. Or simply say, end';
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }

    
}

/*
 * Takes the given food and queries Wolfram for nutrional data. JSON is processed here.
 * It
 */
function getCalsFromWolfram(nutrient, food, callback) {
	var result = '';
	var json = '';

	const https = require('https');

	var request = https.get('https://api.wolframalpha.com/v2/query?input=get+'+nutrient+'+for+'+food+'&format=plaintext&podindex=2&output=JSON&appid=U22V69-P3P5HREH67', (res) => {
	  res.on('data', (d) => {
	    json += d;
	  });
	}).on('close', () => {
	    if (JSON.parse(json).queryresult.success === true) {
    	    if (nutrient === 'calories') {
        		console.log(JSON.parse(json).queryresult.pods[0].subpods[0].plaintext);
        		callback(food + ' has ' + JSON.parse(json).queryresult.pods[0].subpods[0].plaintext.replace("(dietary Calories)", ""));
    	    } else if (nutrient === 'carbs' || nutrient === 'carbohydrates') {
    	        console.log(JSON.parse(json).queryresult.pods[0].subpods[0].plaintext);
        		callback(food + ' has ' + JSON.parse(json).queryresult.pods[0].subpods[0].plaintext + ' of carbohydrates.');
    	    } else if (nutrient === 'protein') {
    	        console.log(JSON.parse(json).queryresult.pods[0].subpods[0].plaintext);
        		callback(food + ' has ' + JSON.parse(json).queryresult.pods[0].subpods[0].plaintext + ' of protein.');
    	    } else if (nutrient === 'fat') {
    	        console.log(JSON.parse(json).queryresult.pods[0].subpods[0].plaintext);
        		callback(food + ' has ' + JSON.parse(json).queryresult.pods[0].subpods[0].plaintext + ' of fat.');
    	    } 
    	    else {
    	        callback('Sorry, I couldn\'t find ' + nutrient + ' for ' + food);
    	    }
	    }
	    else {
	        callback('Sorry, I couldn\'t complete that request.');
	    }
	}).on('error', (e) => {
	  callback('Sorry, I could not complete that request. Please try again.');
	  console.error(e);
	  // return "unknown";
	});

	request.setTimeout( 10000, function() {
        console.log( 'Your request has timed out. Please try again.');
    });
}



// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'GetNutritionIntent') {
    	getFood(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent: ' + intentName);
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        
        if (event.session.application.applicationId !== 'amzn1.ask.skill.0fd9cb9c-462a-45f0-a4d4-c3c36fac6577') {
             callback('Invalid Application ID');
        }
        

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};





