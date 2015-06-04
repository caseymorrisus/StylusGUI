// The MIT License (MIT)

// Copyright (c) 2015 Casey Morris

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.




(function ( $ ) {

	console.log('test');

	$.fn.flipFlap = function( sequence ) {

		return this.each(function() {

			// ================== //
			// Set Data Variables //
			// ================== //
						
			$(this).data('animationRunning', false);
			$(this).data('controlElement', sequence.controlElement);
			$(this).data('currentLoop', 0 );
			$(this).data('loopAmount', sequence.loopAmount);
			$(this).data('reverse', false);

			// ==================== //
			// Set Option Variables //
			// ==================== //
			
			var animationRunning = $(this).data('animationRunning'),
				container = $(this),
				controlElement = $($(this).data('controlElement')),
				currentLoop = $(this).data( 'currentLoop'),
				digits = sequence.digits,
				dir = sequence.dir,
				end = sequence.end,
				extension = sequence.extension,
				fps = (1000 / sequence.fps) || 24,
				intervalName = $(this),
				loopAmount = $(this).data('loopAmount') || 1,
				loopType = sequence.loopType || 'none',
				name = sequence.name,	
				reverse = $(this).data('reverse'),		
				start = sequence.start || 0,
				trailing = sequence.trailing || true,
				zeroes = '';

			// ==================== //
			// Set Option Functions //
			// ==================== //

            function onComplete() {
            	sequence.onComplete();
            };

            function onStart() {
            	sequence.onStart();
            };

            function onChange() {
            	sequence.onChange();
            };

            // ================ //
            // Helper Functions //
            // ================ //

            function restartAnimationBtn() {
            	if( !animationRunning ) {
            		currentFrame = start;
	            	currentLoop = 0;
					animateSequence();
            	}
            }

            
            // Restart Stopped Animation When Clicked

            controlElement.click(function() {
				restartAnimationBtn();
            });


            // Prepare Manifest for preloading

            var queue = new createjs.LoadQueue(true);
            var manifest = [];
            console.log(start);
            console.log(end);

            // Fill the manifest and calculate trailing zeroes

			for (b = start; b <= end; b++) {
			  if (b < 10) {
			  	calcTrailing(digits - 1);
			    manifest.push(dir + name + zeroes + b + extension);
			  } else if (b < 100) {
			  	calcTrailing(digits - 2);
			    manifest.push(dir + name + zeroes + b + extension);
			  } else if (b < 1000) {
			  	calcTrailing(digits - 3);
			    manifest.push(dir + name + zeroes + b + extension);
			  } else if (b < 10000) {
			  	calcTrailing(digits - 4);
			    manifest.push(dir + name + zeroes + b + extension);
			  }
			}

			queue.on("complete", startAnimation, this);
			queue.on("fileload", fileLoaded, this);

			queue.loadManifest(manifest);

			var fileNumber = 1;

			function fileLoaded(event) {
			  var percent = Math.floor(((Math.ceil(fileNumber)) / (manifest.length)) * 100);
			  var text = 'Downloaded ' + (Math.ceil(fileNumber)) + ' of ' + (manifest.length);
			  var item = event.item; // A reference to the item that was passed in to the LoadQueue
			  var type = item.type;
			  container.children('.loading').children('p').text(percent + "%");
			  container.children('.loading').children('.progress').width(percent + "%");
			  ++fileNumber;
			  

			   // Add any images to the page body.
			   if (type == createjs.LoadQueue.IMAGE) {
			       container.prepend(event.result);
			   }
			}


			// Prepare current frame using starting frame
			$(this).data( 'currentFrame', start );
			var currentFrame = $(this).data('currentFrame');

			// Function for adding trailing zeroes
			function calcTrailing(amount){
				zeroes = '';
				for ( i = 0; i < amount; i++ ) {
					zeroes = zeroes + '0';
				}
			}

			// Prepare zeroes variable based on number of digits
			if (trailing) {
				calcTrailing(digits);
			}

			// Build full source
			var fullSource = dir + name + zeroes + extension;

			// Append first frame to container
			container.append('<img src="' + fullSource + '" />');

			// Put added img element into variable for use
			var imgElement = container.children('img');

			// Change img src
			function changeSrc(frameNumber) {
				fullSource = dir + name + zeroes + frameNumber + extension;
				imgElement.attr('src', fullSource);
			}

			// Go to next frame
			function nextFrame() {

				if (reverse == true) {
					if ( currentFrame == 0 ) {
						++currentLoop;
						reverse = false;

					} else {
						--currentFrame;
					}
				} else {
					++currentFrame;
				}
				if ( currentLoop == loopAmount ) {
					animationRunning = false;
					onComplete();
					return;
				}
				if ( currentFrame == end ) {
					if ( loopType == 'none' ) {
						animationRunning = false;
						return;
					} else if ( loopType == 'restart' ) {
						++currentLoop;
						currentFrame = 0;
						animateSequence();
					} else if ( loopType == 'reverse' ) {
						++currentLoop;
						reverse = true;
						currentFrame = currentFrame - 2;
						animateSequence();
					}
				} else if ( currentFrame < 10 ) {
					calcTrailing(digits - 1);
			          $('body').children('img').css('display', 'none');
			          $('body').children('img').eq(currentFrame).css('display', 'block');
					//changeSrc(currentFrame);
					animateSequence();
				} else if ( currentFrame < 100 ) {
					calcTrailing(digits - 2);
			          container.children('img').css('display', 'none');
			          container.children('img').eq(currentFrame).css('display', 'block');
					//changeSrc(currentFrame);
					animateSequence();
				}
				
			}



			// Start the image sequence
			function animateSequence() {
				onChange();
				animationRunning = true;
				setTimeout(nextFrame, fps);
			}

			// Restart animation
			function restartAnimation() {
				if ( loopAmount == 'infinite' || currentLoop < loopAmount ) {
					setTimeout(nextFrame, fps);
				}
			}

			function startAnimation() {
				onStart();
				container.children('.loading').css('display', 'none');
				animateSequence();
			}

		});
		
	}
}( jQuery ));