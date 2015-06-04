var ipc 			= require('ipc'),
	fs 				= require('fs'),
	stylus 			= require('stylus'),
	path 			= require('path'),
	Gaze 			= require('gaze'),
	csswring 		= require('csswring'),
	postcss			= require('postcss'),
	autoprefixer 	= require('autoprefixer-core'),
	_ 				= require('lodash'),
	currentFile		= 0,
	gaze,
	start,
	end;

$('#menu').on('click', function () {
	if( $('#menuOptions').css('display') === 'none' ) {
		$('#menuOptions').css('display', 'inline-block');
	} else {
		$('#menuOptions').css('display', 'none');
	}
});

function watchDirectory (bool) {
	if (bool) {
		gaze = new Gaze('*.styl', {cwd: options.watch.directory}, function (err, watcher) {
			this.on('changed', function (filepath) {
				console.log(filepath + ' was changed');
				var dest = getDestination(filepath);
				start = +new Date();
				readStylusFile(filepath, dest, compileStylus);
			});

			this.on('added', function (filepath) {
				console.log(filepath + ' was added');
				var dest = getDestination(filepath);
				start = +new Date();
				readStylusFile(filepath, dest, compileStylus);
			});
		});
	} else {
		try {
			gaze.close();
		} catch (err) {
			console.log('No watch open');
		}
	}
};

var holder = document.getElementById('holder');

holder.ondragover = function () { return false; };
holder.ondragleave = holder.ondragend = function () { return false; };

holder.ondrop = function (e) {
	e.preventDefault();
	start = +new Date();
	var files = e.dataTransfer.files;
	var file = e.dataTransfer.files[0];
	var dest = getDestination(file.path);
	//console.log(JSON.stringify(files, null, 4));
	if ( files.length === 1 ) {
		var extension = path.extname(files['0'].path);
		if ( extension === '.styl' ) {
			readStylusFile(file.path, dest, compileStylus);
		} else {
			changeInfoText("File was not a Stylus file.");
		};
	} else if ( files.length > 1 ) {
		var stylFiles = [];
		_.forEach(files, function(n, key) {
			if ( path.extname(files[key].path) === '.styl' ) {
				stylFiles.push(files[key].path);
			}
		});
		readManyStylusFiles(stylFiles, dest, compileStylus);
		//console.log(stylFiles);
	};
	return false;
};

function changeInfoText (text) {
	$('#info').text(text);
};

function getDestination (src) {
	var dest;
	if ( options.compile.sameFolder ) {
		dest = path.dirname(src) + '/';
	}
	else if ( options.compile.cssFolder ) {
		dest = path.dirname(path.dirname(src)) + '/css/';
	}
	else if ( options.compile.chooseFolder.enabled ) {
		dest = options.compile.chooseFolder.directory + '/';
	}
	return dest;
};

function minifyCss (fileName, css, dest) {
	fs.writeFile(dest + fileName + '.min.css', csswring.wring(css).css, function(err) {
		if (err) throw err;
		compileEnd(fileName);
	});
};

function autoprefixCss (css, fileName, dest) {
	postcss([ autoprefixer ]).process(css).then(function (result) {
		fs.writeFile(dest + fileName + '.css', result.css, function(err) {
			if (err) throw err;
			if (options.css.minify === false) {
				compileEnd(fileName);
			} else {
				minifyCss(fileName, result.css, dest);
			}
		});
	});
};

function compileEnd (fileName) {
	console.log("Saved " + fileName + '.css successfully!');
	end = +new Date();
	var compileTime = end - start;
	changeInfoText("Compiled " + fileName + '.css in ' + compileTime + 'ms');
};

function compileFileEnd (fileName) {
	currentFile += 1;
};

function compileStylus (stylusStr, fileName, dest , many) {
	stylus.render(stylusStr, function (err, css) {
		if (err) throw err;
		fs.writeFile(dest + fileName + '.css', css, function(err) {
			if (err) {
				changeInfoText('Directory does not exist');
				throw err;
			}

			if(options.css.autoprefix) {
				autoprefixCss(css, fileName, dest);
				return;
			};

			if(options.css.minify && options.css.autoprefix === false) {
				minifyCss(fileName, css, dest);
				return;
			}
			
			compileEnd(fileName);
			//end = +new Date();
			//var compileTime = end - start;
			//changeInfoText("Compiled " + fileName + '.css in ' + compileTime + 'ms');
		});
	});
};

function readStylusFile (src, dest, callback) {
	var fileName = path.basename(src, '.styl');
	fs.readFile(src, 'utf8', function (err, data) {
		if (err) throw err;
		callback(data, fileName, dest);
	});
};

function readManyStylusFiles (array, dest, callback) {
	array.forEach(function (filePath) {
		var fileName = path.basename(filePath, '.styl');
		fs.readFile(filePath, 'utf8', function (err, data) {
			if (err) throw err;
			callback(data, fileName, dest, true);
		});
	});
};

function fileDialogClicked (obj) {
	var clickedId = obj.attr('id');
	ipc.send('open-dialog', clickedId);
};

function compileOptionClicked (obj) {
	var clickedId = obj.attr('id');
	var selectArray = [];
	$('#compileOptions div').removeClass('selected');
	obj.addClass('selected');

	//options.compile[clickedId] = true;
	selectArray.push('compile', clickedId);
	selectOption(selectArray);
	//console.log(JSON.stringify(options,null,4));
};

function cssOptionClicked (obj) {
	var clickedId = obj.attr('id');
	var selectArray = [];
	if (obj.hasClass('selected')) {
		obj.removeClass('selected');
	} else {
		obj.addClass('selected');
	}

	selectArray.push('css', clickedId);
	selectOption(selectArray);
};

function watchOptionClicked (obj) {
	var clickedId = obj.attr('id');
	var selectArray = [];
	var option = $('#watchOptions div');

	if ( option.hasClass('selected') ){
		option.removeClass('selected');
	} else {
		option.addClass('selected');
	}

	selectArray.push('watch', clickedId);
	selectOption(selectArray);
};

function selectOption (array) {
	console.log(array[0]);
	if ( array[0] === 'compile' ) {
		options.compile.sameFolder = 			false;
		options.compile.cssFolder = 			false;
		options.compile.chooseFolder.enabled = 	false;
		if( array[1] === 'chooseFolder') {
			options.compile.chooseFolder.enabled = true;
		} else {
			options.compile[array[1]] = true;
		}
	} else if ( array[0] === 'watch') {
		if ( $('#' + array[1]).hasClass('selected') ) {
			options.watch.enabled = true;
		} else {
			options.watch.enabled = false;
		}
	} else if ( array[0] === 'css' ) {
		if ( $('#' + array[1]).hasClass('selected') ) {
			if ( array[1] === 'minifyCss' ) {
				options.css.minify = true;
			} else {
				options.css.autoprefix = true;
			}
		} else {
			if ( array[1] === 'minifyCss' ) {
				options.css.minify = false;
			} else {
				options.css.autoprefix = false;
			}
		}
	}
	if (options.watch.enabled === false) {
		gaze.close();
	} else {
		watchDirectory(options.watch.enabled);
	}
	writeOptionsToFile();
};

$('#chooseFolder, #watchFolder').on('click', function (e) {
	if ( !$(this).hasClass('selected') ) {
		fileDialogClicked($(this));
	}
});

$('#sameFolder, #cssFolder, #chooseFolder').on('click', function (e) {
	compileOptionClicked($(this));
});

$('#watchFolder').on('click', function (e) {
	watchOptionClicked($(this));
});

$('#minifyCss, #autoprefixCss').on('click', function (e) {
	cssOptionClicked($(this));
});

ipc.on('open-dialog-reply', function (arg) {
	console.log(arg[1]);
	if ( arg[1] === 'watchFolder' ) {
		options.watch.directory = arg[0].toString();
	} else if ( arg[1] === 'chooseFolder' ) {
		options.compile.chooseFolder.directory = arg[0].toString();
	}
	$('#' + arg[1]).children('.directoryBox').text(arg[0]);
	writeOptionsToFile();
});


// SAVING AND READING OPTIONS

// Options placeholder if the file doesn't exist
var options = {
	compile: {
		sameFolder: 	true,
		cssFolder: 		false,
		chooseFolder: {
			enabled: 	false,
			directory: 	null
		}
	},
	watch: {
		enabled: 		false,
		directory: 		null 
	},
	css: {
		minify: 		false,
		autoprefix: 	false
	}
};

readOptionsFromFile();


function writeOptionsToFile (callback) {
	fs.writeFile(__dirname + '/options.json', JSON.stringify(options, null, 4), function (err) {
		if (err) throw err;
		console.log("Wrote options to file.");
		if (callback) callback();
	});
};

function readOptionsFromFile () {
	fs.readFile(__dirname + '/options.json', 'utf8', function (err, data) {
		if (err) {
			writeOptionsToFile(selectOptionsFromFile);
		};
		options = JSON.parse(data);
		selectOptionsFromFile();
		watchDirectory(options.watch.enabled);
	});
};

function selectOptionsFromFile () {
	var filesToSelect = [];

	if ( options.compile.sameFolder ) {
		filesToSelect.push('#sameFolder');
	} else if ( options.compile.cssFolder ) {
		filesToSelect.push('#cssFolder');
	} else if ( options.compile.chooseFolder.enabled ) {
		filesToSelect.push('#chooseFolder');
		$('#chooseFolder .directoryBox').text(options.compile.chooseFolder.directory);
	} 

	if ( options.watch.enabled ) {
		filesToSelect.push('#watchFolder');
		$('#watchFolder .directoryBox').text(options.watch.directory);
	};

	if ( options.css.minify ) {
		filesToSelect.push('#minifyCss');
	}

	if ( options.css.autoprefix ) {
		filesToSelect.push('#autoprefixCss');
	}

	selectOptions(filesToSelect);
};

function selectOptions (array) {
	$.each(array, function (index, value) {
		var item = value;
		$(item).addClass('selected');
	});
};
