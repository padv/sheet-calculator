# sheet-calculator

Javascript function that reads an excel sheet and parse to the user as an editable view. Then, provides an output based on the rules parsed as an object and user input.

The excel file must follow a set of rules, use xlsx_template and xlsx_mockup to create your own.

"outputObj" parameter must be an object with functions, and each if its functions must recieve "instance" as parameter. Here is an example:

```
const outputObj = {

        "Yearly Minimum Cost": function(instance) {return (instance["Price"] + (instance["Monthly Taxes"] * 12))},
        "Cost per KM": function(instance) {return (instance["Full Gas Tank Cost"] / instance["KM/Gas Tank"])},
        "Yearly KM": function(instance) {return (instance["Yearly KM"])},
        "Yearly Total Cost": function(instance) {return (instance["Price"] + (instance["Monthly Taxes"] * 12) + (instance["Full Gas Tank Cost"] / instance["KM/Gas Tank"] * instance["Yearly KM"]))}
        
    };
```

You can see it working [**HERE**](https://data.victorpadilha.myscriptcase.com/)

Edit "createViewTableCSS" CSS if you want to change the table style


```
Installation:

Copy sheetCalculator.js into your project folder and create a <div> with "sheetCalculator" class.

```
Requires [**jQuery 1.7.4**](https://github.com/jquery/jquery) (other versions might work as well) and [**SheetJS 0.17.1**](http://oss.sheetjs.com/sheetjs/tests/)
