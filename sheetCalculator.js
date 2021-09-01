

//visibleRows means the number of rows you want to show the user besides de final one (ONLY APPLIES TO INPUT, OUTPUT WILL DISPLAY ALL ROWS WITH RESPECTIVE VALUES)

async function sheetCalculator(sheetUrl, primarySelector, secondarySelector, visibleRows, outputObj){ 

	createSelectors(primarySelector, secondarySelector); // CREATE THE SELECTOR BOXES
	const arrSheets = await sheetLoader(sheetUrl); // WAIT TILL AJAX GET THE XLSX FILE AND CONVERT IT TO A READABLE ARRAY
	mountSelectors(arrSheets, primarySelector, secondarySelector); // MOUNT (FILL WITH OPTIONS) THE PRIMARY SELECTOR AND PUT THE TRIGGER TO MOUNT THE SECONDARY ONE
	let viewTableExist = false; // SET THAT NO TABLE (CSS) HAS BEEN CREATED YET
	while(true){
		let defaultInstance = await triggerInput(arrSheets, primarySelector, secondarySelector); 							// CREATE "defaultInstance" (OBJ), A SPECIFIC LINE WITH ITS VALUES FROM FROM ITS SPECIFIC 
		let instance = $.extend(true,{},defaultInstance);	//CLONE "defaultInstance"									 	// SHEET AS SOON AS THE USER CHANGES THE SECONDARY SELECTOR OPTION
		let arrInstance = objToArr(instance); // TRANSFORM THE INSTANCE IN AN ARRAY TO MOUNT THE VIEW
		if (viewTableExist == false){ // CREATE AND MOUNT TABLE CSS
			mountViewTable(createViewTableCSS());
			viewTableExist = true;
		}
		emptyViewTable(); // EMPTY TABLE CONTENT
		let inputView = createView(arrInstance, visibleRows); // CREATE VIEW
		showView(inputView, true); // SHOW VIEW
		createCalcButton(instance, outputObj); // CREATES THE CALC BUTTON 

	}
					
};




function getInstance (arrSheets, primarySelector, secondarySelector){ //GET THE EXACT INSTANCE OF THE SHEET AS A OBJECT

	const primaryValue = getSelectorCurrentValue(primarySelector); // GET PRIMARY SELECTOR VALUE
	const secondaryValue = getSelectorCurrentValue(secondarySelector); // GET SECONDARY SELECTOR VALUE
	let instance = arrSheets[primaryValue - 1].instances[secondaryValue - 1]; // GET EXACT PRODUCT BASED ON PRIMARY AND SECONDARY SELECTOR
	return instance;	
};

function createOutput (instance, outputObj){ // CREATES THE OUTPUT BASED ON THE INSTANCE AND OUTPUTOBJ(OBJECT WITH PROPS)

	const newOutput = Object.create(outputObj);
	let names = Object.getOwnPropertyNames(outputObj);
	names.forEach(name => {
		let value = newOutput[name](instance); 
		if(!(Number.isNaN(value))){ //CHECK IF THE VALUE IS A NUMBER, IF IT IS NOT, ASSIGN 0 
			newOutput[name] = value;
		}else{ // DELETE ELSE IF YOU WANT TO EXCLUDE NaN FROM VIEW
			newOutput[name] = 0;
		}
	});
	return newOutput;

};

function objToArr(obj){ // RETURNS AN ARRAY OF OBJECTS (INSTANCE PROPS), SO IT CAN BE USED AS VIEW 

	let arr = Object.entries(obj).map(( [k, v] ) => ({ [k]: v }));
	arr.forEach((row,index) => {
		row.id = index;
	});
	return arr;

};

function createView(arrInstance, visibleRows){ // CREATES THE VISIBLE INPUT TABLE, NEEDS AN ARRAY 

	let view = arrInstance.slice(0);
	if(visibleRows >= 0 && (!Number.isNaN(visibleRows))){ //CHECKS IF "visibleRows" is a number and >= 0
		view.splice(0, 1); // DELETE THE "name" OBJ
		view.splice(visibleRows,(view.length - (visibleRows + 1))); // DELETE THE ROWS THE DEV DOES NOT WANT TO SHOW TO THE USER
		return view;
	}else if(visibleRows == "output"){
		return view;		
	}else {
		console.log("ERROR! Invalid parameter passed as 'visibleRows'");
	}
	

};

function showView(view, editable){ // ADDS ROWS TO THE VIEW TABLE. EDITABLE PARAMETER MUST BE "TRUE" IF INPUT AND "FALSE" IF OUTPUT

	view.forEach(row => {

		const rowName = Object.getOwnPropertyNames(row)[0];
		const value = Object.values(row)[0];
		const id = Object.values(row)[1];
		addInput(rowName, value, id, editable);


		
	})
};

function getSheet(sheetUrl){ // ASYNC, AJAX "GET". RETRIEVES A XLSX FILE AS A BLOB. 

    return new Promise(function(ajaxResolve,ajaxReject){
        $.get({
            url: sheetUrl,
            xhrFields:{
                responseType:'blob'
            },
            success: function(blob){
                ajaxResolve(blob);
            },
            error: function(err){
                ajaxReject(err);
            }
        });
    });
};

function parseSheet(event) { // USES SheetJS (xlsx.full.min.js) to

    let readData = event.target.result;
    let workbook = XLSX.read(readData, {
        type: "binary"

    });

    return workbook;


};


function createSheetArr(workbook){ // RECIEVES THE WORKBOOK(OBJECT) TO RETURN ARRAY WITH OBJECTS, EACH OBJECT INSIDE THE ARR IS A DIFFERENT SHEET

    let arrSheets = []; //ALL SHEETS ARRAY
    idIndex = 1;
    workbook.SheetNames.forEach(sheetName =>{ 
        let rowObject = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
        let objSheet = {
            id: idIndex, 
            type: sheetName, //TYPE IS ALWAYS THE SHEETNAME, THIS IS IMPORTANT
            instances: rowObject
        };        
        idIndex++;
        arrSheets.push(objSheet);       
    });

    return arrSheets;
};


function createSelectors(primarySelector, secondarySelector){ //CREATE THE SELECTORS (NO OPTIONS BESIDES THE DEFAULT)

	//CREATE SELECTORS
	addSelectors(primarySelector, secondarySelector);

	//ADD SELECTORS DEFAULT OPTION
	addOption(primarySelector, "Select", 0);
	addOption(secondarySelector, "Select", 0);
	
};

function mountSelectors(arrSheets, primarySelector, secondarySelector){ // MOUNT OPTIONS INSIDE THE SELECTORS

	modifyPrimaryOptions(arrSheets, primarySelector); // MOUNT THE PRIMARY OPTIONS
	loadSecondaryOptions(arrSheets, primarySelector, secondarySelector); // MOUNT THE SECONDARY OPTIONS AFTER PRIMARY OPTION HAS BEEN CHOOSED
	
};

function modifyPrimaryOptions(arrSheets, primarySelector) { // LOAD PRIMARY OPTIONS

	arrSheets.forEach(sheet => {
		addOption(primarySelector, sheet.type, sheet.id);
	}); 
}

function modifySecondaryOptions(arrSheets, primarySelector, secondarySelector) { //LOAD SECONDARY OPTIONS
	
	const arrPosition = (getSelectorCurrentValue(primarySelector) - 1); //Array starts with 0. First value besides default select is 1.
	let index = 1;
	arrSheets[arrPosition].instances.forEach(instance => {

		addOption(secondarySelector, instance.name, index);
		index++;

	});			
}

function sheetLoader(url) {                         // ASYNC 

    return new Promise(resolveSheet => {
        getSheet(url)                                   // RETRIEVES THE SHEET (XLSX > BLOB)
        .then(function(blob){

                const reader = new FileReader();
                reader.readAsBinaryString(blob);                // READ THE BLOB 
                reader.onload = function(event){            
                    const workbook = parseSheet(event);         // PARSE THE RESULT TO AN OBJECT
                    let arrSheets = createSheetArr(workbook);   
                    resolveSheet(arrSheets);                    // RETURN AN ARRAY OF OBJECTS(SHEETS)
                };
            

        })
        .catch(function(err){                             // RETURN AN ERROR IF UNABLE TO "GET" THE XLSX

            console.log("Cannot retrieve XLSX!");

        });
    })      
};

//DOM MANIPULATION FUNCTIONS



function addSelectors(primarySelector, secondarySelector) { // ADD THE PRIMARY AND SECONDARY SELECTORS
	$(".sheetCalculator").append(`<p>${primarySelector} : ${secondarySelector}:</p>`);
	$(".sheetCalculator").append(`<select id=${primarySelector} class="selector">`);
	$(".sheetCalculator").append(`<select id=${secondarySelector} class="selector">`);
};

function addOption(selector, optionName, valueString){ //CREATE OPTION IN THE SELECTOR
    $("#" + selector ).append(new Option(optionName, valueString));

    if(valueString == 0){ //DISABLE THE SELECT BUTTON (VAL = 0), SO IT CAN'T BE SELECTED AGAIN ONCE USER PICK AN OPTION
    	$("option[value='0']").attr("disabled","disabled");
    }
};

function emptyOptions(selector){ // EMPTY SELECTOR THEN GIVE IT DEFAULT "SELECT" OPTION
	$("#" + selector).empty();
	addOption(selector, "Select", 0);
}		

function getSelectorCurrentValue(selector) { // GET THE CURRENT SELECTED VALUE
	return $(`select#${selector} option:checked`).val();
}

function changeOptions(primarySelector, secondarySelector, arrSheets){ // CHANGE THE OPTIONS OF THE SECOND SELECTOR BASED ON THE FIRST ONE
	$("#" + primarySelector).change(function(){
		emptyOptions(secondarySelector);

	});
};

function triggerInput (arrSheets, primarySelector, secondarySelector){ // ASYNC, RETURN DATA WHEN THE SECOND SELECTOR CHOOSES AN OPTION

	return new Promise(resolveInstance => {
		$("#" + secondarySelector).change(function(){
			resolveInstance(getInstance(arrSheets, primarySelector, secondarySelector));			
		});		
	});
};

function createViewTableCSS(){ //INPUT AND OUTPUT VIEW CSS, NEED TO BE CHANGED (UGLY RIGHT NOW)

	return  css = {

				border: "5px outset red",
				backgroundColor: "lightblue",
				textAlign: "left"
	};
};

function mountViewTable(css){ //MOUNT THE VIEW IN A DIV WITH CLASS ".sheetCalculator" and APPLY THE CSS

	$(".sheetCalculator").append("<div class='view'></div>");
	$(".view").css(css);
	
};

function emptyViewTable(){ //EMPTY THE CONTENT OF THE TABLE, BUT DOES NOT DELETE THE TABLE CSS ITSELF

	$(".view").empty();

};

function addInput(rowName, value, id, editable){ //ADD LINES WITH INPUTS INTO THE DOM

	let disabled;

	if(!editable){ //CHECKS IF THE FIELDS ARE EDITABLE OR NOT
		disabled = "disabled"
	}

	$(".view").append(`<p>${rowName} <input class='input' type='number' id='${rowName}' value='${value}' ${disabled} /></p>`); 
																					//ROW NAME ACT AS ID AND TEXT BEFORE THE INPUT
};

function createCalcButton(instance,outputObj){ //CREATES THE BUTTON AND MOUNT ITS VIEW ON CLICK

	$(".view").append("<input type='button' id='calc' value='Calc'/>");
	$("#calc").click(function(){

		changeInputValue(instance);
		let newOutput = createOutput(instance, outputObj);
		let arrOutput = objToArr(newOutput);
		let outputView = createView(arrOutput, "output");
		emptyViewTable();
		showView(outputView, false); // SHOW OUTPUT		

	});	

};

function changeInputValue(instance){ //CHANGES THE VALUES OF THE INSTANCE TO THE USER INPUTTED ONES

	$(".input").each(function (){

		let id = $(this).attr("id");
		let newValue = $(this).val();
		instance[id] = parseFloat(newValue);


	});

};

function loadSecondaryOptions(arrSheets, primarySelector, secondarySelector){ //LOAD THE SECONDARY OPTIONS WHEN THE PRIMARY OPTION IS SELECTED

	$("#" + primarySelector).change(function(){
		emptyOptions(secondarySelector);
		modifySecondaryOptions(arrSheets, primarySelector, secondarySelector);

	});

};







	
