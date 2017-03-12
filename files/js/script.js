

var previousFrame = null;
var paused = false;

var controllerOptions = {enableGestures: true};

Leap.loop(controllerOptions, function(frame) 
{
    if (paused) 
    {
        return; 
    }

    var frameOutput = document.getElementById("frameData");

    var frameString = "Frame ID: " + frame.id + "<br />" +
        "Timestamp: " + frame.timestamp + " &micro;s<br />" +
        "Hands: " + frame.hands.length + "<br />" +
        "Fingers: " + frame.fingers.length + "<br />";

    var handOutput = document.getElementById("handData");
    var handString = "";
    if (frame.hands.length > 0) 
    {
        for (var i = 0; i < frame.hands.length; i++) 
        {
            var hand = frame.hands[i];

            handString += "<div style='width:300px; float:left; padding:5px'>";
            handString += "Hand ID: " + hand.id + "<br />";
            handString += "Type: " + hand.type + " hand" + "<br />";
            handString += "Direction: " + vectorToString(hand.direction, 2) + "<br />";
            handString += "Palm position: " + vectorToString(hand.palmPosition) + " mm<br />";
            handString += "Grab strength: " + hand.grabStrength + "<br />";
            handString += "Pinch strength: " + hand.pinchStrength + "<br />";
            handString += "Confidence: " + hand.confidence + "<br />";
            handString += "Arm direction: " + vectorToString(hand.arm.direction()) + "<br />";
            handString += "Arm center: " + vectorToString(hand.arm.center()) + "<br />";
            handString += "Arm up vector: " + vectorToString(hand.arm.basis[1]) + "<br />";

            if (hand.pointables.length > 0) 
            {
                var fingerIds = [];
                for (var j = 0; j < hand.pointables.length; j++) 
                {
                    var pointable = hand.pointables[j];
                    fingerIds.push(pointable.id);
                }
                if (fingerIds.length > 0) 
                {
                    handString += "Fingers IDs: " + fingerIds.join(", ") + "<br />";
                }
            }

            handString += "</div>";
        }
    } else 
    {
        handString += "No hands";
    }

    var pointableOutput = document.getElementById("pointableData");
    var pointableString = "";
    if (frame.pointables.length > 0) 
    {
        var fingerTypeMap = ["Thumb", "Index finger", "Middle finger", "Ring finger", "Pinky finger"];
        var boneTypeMap = ["Metacarpal", "Proximal phalanx", "Intermediate phalanx", "Distal phalanx"];
        for (var i = 0; i < frame.pointables.length; i++) 
        {
            var pointable = frame.pointables[i];

            var thumb = frame.pointables[0];
            var index = frame.pointables[1];
            var middle = frame.pointables[2];
            var ring = frame.pointables[3];
            var pinky = frame.pointables[4];
            var palm = frame.hands[0];

            var thumbPosition = (thumb.tipPosition);
            var indexPosition = (index.tipPosition);
            var middlePosition = (middle.tipPosition);
            var ringPosition = (ring.tipPosition);
            var pinkyPosition = (pinky.tipPosition);
            var palmPosition = (palm.palmPosition);

            var thumbToIndex = findDistance(thumbPosition, indexPosition);
            var middleToPalm = findDistance(middlePosition, palmPosition);
            var ringToPalm = findDistance(ringPosition, palmPosition);
            var pinkyToThumb = findDistance(pinkyPosition, thumbPosition);
            var ringToThumb = findDistance(palmPosition, thumbPosition);
            var middleToThumb = findDistance(middlePosition, thumbPosition);
            var indexToThumb = findDistance(indexPosition, thumbPosition);
            var pinkyToRing = findDistance(palmPosition, ringPosition);

            //Wow sign
            if (thumbToIndex <= 100 && thumb.extended == false && index.extended == false && frame.pointables[2].extended == true && frame.pointables[3].extended == true && frame.pointables[4].extended == true) 
            {
                console.log("Wow");
                post("Wow");
            }

            //love sign
            if (middleToPalm <= 80 && ringToPalm <= 80 && frame.pointables[0].extended == true && frame.pointables[1].extended == true && frame.pointables[4].extended == true) 
            {
                console.log("Love");
                post("Love");
            }

            //Peace sign
            if (pinkyToRing <= 80 && ringToThumb <= 80 && pinkyToThumb <= 80 && frame.pointables[1].extended == true && frame.pointables[2].extended == true) 
            {
                console.log("Peace");
                post("Peace");
            }

            //Please
            if(pinkyToThumb <= 60 && ringToThumb <= 60 && middleToThumb <= 60 && indexToThumb <= 60)
            {
            	console.log("Please");

            	post("Please");
            }

            //gestures
            if (frame.valid && frame.gestures.length > 0) 
            {
                frame.gestures.forEach(function(gesture) 
                {
                    if(gesture.type == "swipe")
                    {
                    	if(frame.pointables[0].extended == false && frame.pointables[4].extended == false)
                    	{
                    		console.log("Swiped and cleared");
	                    	document.getElementById("output-array").innerHTML = null;
	                    	post("-1");
                    	}
                    }
                });
            }

            pointableString += "<div style='width:250px; float:left; padding:5px'>";
            
            {
                pointableString += "Pointable ID: " + pointable.id + "<br />";
                pointableString += "Type: " + fingerTypeMap[pointable.type] + "<br />";
                pointableString += "Belongs to hand with ID: " + pointable.handId + "<br />";
                pointableString += "Classified as a finger<br />";
                pointableString += "Length: " + pointable.length.toFixed(1) + " mm<br />";
                pointableString += "Width: " + pointable.width.toFixed(1) + " mm<br />";
                pointableString += "Direction: " + vectorToString(pointable.direction, 2) + "<br />";
                pointableString += "Extended?: " + pointable.extended + "<br />";
                pointable.bones.forEach(function(bone) 
                {
                    pointableString += boneTypeMap[bone.type] + " bone <br />";
                    pointableString += "Center: " + vectorToString(bone.center()) + "<br />";
                    pointableString += "Direction: " + vectorToString(bone.direction()) + "<br />";
                    pointableString += "Up vector: " + vectorToString(bone.basis[1]) + "<br />";
                });
                pointableString += "Tip position: " + vectorToString(pointable.tipPosition) + " mm<br />";
                pointableString += "</div>";
            }
        }
    } else 
    {
        pointableString += "<div>No pointables</div>";
    }
    previousFrame = frame;
})

function vectorToString(vector, digits) 
{
    if (typeof digits === "undefined") 
    {
        digits = 1;
    }
    return "(" + vector[0].toFixed(digits) + ", " +
        vector[1].toFixed(digits) + ", " +
        vector[2].toFixed(digits) + ")";
}

function togglePause() 
{
    paused = !paused;

    if (paused) 
    {
        document.getElementById("pause").innerText = "Resume";
    } else 
    {
        document.getElementById("pause").innerText = "Pause";
    }
}

function findDistance(v1, v2) 
{
    var dx = v1[0] - v2[0];
    var dy = v1[1] - v2[1];
    var dz = v1[2] - v2[2];
    var distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    return distance;
}

var wordArray = [];
var previousWord;
function post(message) 
{
	if(message == previousWord)
		return;

	wordArray.push(message);
	
	
	$("#output-array").html(null);

	for(var x = 0; x <= wordArray.length; x++)
	{
		$("#output-array").append(wordArray[x]);
		$("#output-array").append(' ');
	}
	if(message == "-1")
	{
		wordArray = [];
		message = null;
		previousWord = null;
		$("#output-array").html(null);
		$("#output-text").html(null);
		return;
	}
	outputSpeach(message);
	document.getElementById("output-text").innerHTML = message;
	previousWord = message;
}
/*




*/






$(function() 
{
    if ('speechSynthesis' in window) 
    {
        speechSynthesis.onvoiceschanged = function() 
        {
            var $voicelist = $('#voices');

            if ($voicelist.find('option').length == 0) 
            {
                speechSynthesis.getVoices().forEach(function(voice, index) 
                {
                    console.log(voice);
                    var $option = $('<option>')
                        .val(index)
                        .html(voice.name + (voice.default ? ' (default)' : ''));

                    $voicelist.append($option);
                });

                $voicelist.material_select();
            }
        }

        $('#speak').click(function() 
        {
            outputSpeach();
        })
    } else 
    {
        $('#modal1').openModal();
    }
});


function outputSpeach(message)
{
	var text = message;
            var msg = new SpeechSynthesisUtterance();
            var voices = window.speechSynthesis.getVoices();
            msg.voice = voices[$('#voices').val()];
            msg.rate = $('#rate').val() / 10;
            msg.pitch = $('#pitch').val();
            msg.text = text;

            msg.onend = function(e) 
            {
                console.log('Finished in ' + event.elapsedTime + ' seconds.');
            };

            console.log(speechSynthesis);

            speechSynthesis.speak(msg);
}
