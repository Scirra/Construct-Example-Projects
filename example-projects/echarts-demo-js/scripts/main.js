
let echarts = null;		// the module for echarts.esm.min.js
let chart = null;		// the currently showing chart (or null if none)

/////////////////////////////////////
// MARK: Startup
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	// On startup, dynamic import the ECharts library.
	// This is done dynamically for two reasons:
	// 1) It's a large library, and you might want to delay loading it until it is
	//    really needed.
	// 2) It keeps it as an external script so Construct won't attempt to minify
	//    it again - especially as this distribution is already minified.
	// Also note that as this script may be in a subfolder, the library must be
	// loaded from a URL in the root of the project location.
	echarts = await import(new URL("./echarts.esm.min.js", location.href).toString());
	
	// Add handlers for when the SimpleChart layout starts and ends
	const simpleChartLayout = runtime.getLayout("SimpleChart");
	simpleChartLayout.addEventListener("beforelayoutstart", () => OnStartSimpleChartLayout(runtime));
	simpleChartLayout.addEventListener("beforelayoutend", () => OnEndSimpleChartLayout());

	// Add handlers for when the ComplexChart layout starts and ends
	const complexChartLayout = runtime.getLayout("ComplexChart");
	complexChartLayout.addEventListener("beforelayoutstart", () => OnStartComplexChartLayout(runtime));
	complexChartLayout.addEventListener("beforelayoutend", () => OnEndComplexChartLayout());

	// To make sure the chart resizes when the window resizes, handle the runtime
	// "resize" event and update the chart size in the event handler.
	runtime.addEventListener("resize", () => OnResize());
}

function OnResize()
{
	// Call chart.resize() to update the chart to the new HTML element size.
	// Note that:
	// - the chart is null if none exists, so check it is set
	// - use string property syntax for external library calls to support advanced
	//   minification - see: https://www.construct.net/en/make-games/manuals/construct-3/scripting/guides/advanced-minification
	// - use a 50ms delay - this is a bit of a hack, but as Construct supports
	//   running in a web worker, updates are actually asynchronous and the HTML
	//   element size will actually update shortly after this event. Adding a short
	//   delay ensures the HTML element size has updated before calling resize().
	setTimeout(() =>
	{
		if (chart)
			chart["resize"]();
	}, 50);
}

/////////////////////////////////////
// MARK: Simple chart
function OnStartSimpleChartLayout(runtime)
{
	// Handle the button click to change layout
	const buttonInst = runtime.objects.ChangeLayoutButton.getFirstInstance();
	buttonInst.addEventListener("click", () => runtime.goToLayout("ComplexChart"));

	// Get the HTML Element object instance, and its corresponding actual HTML element
	const htmlInst = runtime.objects.HTMLElement.getFirstInstance();
	const htmlElem = htmlInst.getElement();

	// Initialize ECharts with this HTML element
	chart = echarts["init"](htmlElem);

	// Set the options for the chart.
	// This code is derived from the "Basic Line Chart" example:
	// https://echarts.apache.org/examples/en/editor.html?c=line-simple
	// For more details see the ECharts documentation:
	// https://echarts.apache.org/en/api.html
	const option = {
		"xAxis": {
			"type": "category",
			"data": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
		},
			"yAxis": {
			"type": "value"
		},
		"series": [{
			"data": [150, 230, 224, 218, 135, 147, 260],
			"type": "line"
		}]
	};

	chart["setOption"](option);
}

function OnEndSimpleChartLayout()
{
	chart = null;
}

/////////////////////////////////////
// MARK: Complex chart
async function OnStartComplexChartLayout(runtime)
{
	// Handle the button click to change layout
	const buttonInst = runtime.objects.ChangeLayoutButton.getFirstInstance();
	buttonInst.addEventListener("click", () => runtime.goToLayout("SimpleChart"));

	// Get the HTML Element object instance, and its corresponding actual HTML element
	const htmlInst = runtime.objects.HTMLElement.getFirstInstance();
	const htmlElem = htmlInst.getElement();

	// Load the chart data from the project file chart-data.json.
	// This file is a copy of the following sample data file from ECharts examples:
	// https://echarts.apache.org/examples/data/asset/data/life-expectancy-table.json
	const chartDataResponse = await fetch("chart-data.json");
	const chartDataJson = await chartDataResponse.json();

	// Initialize ECharts with this HTML element
	chart = echarts["init"](htmlElem);

	// Initialize the options for this chart.
	// This code is derived from the "Line Race" example:
	// https://echarts.apache.org/examples/en/editor.html?c=line-race
	// For more details see the ECharts documentation:
	// https://echarts.apache.org/en/api.html
	const countries = [
		"Finland",
		"France",
		"Germany",
		"Iceland",
		"Norway",
		"Poland",
		"Russia",
		"United Kingdom"
	];
	const datasetWithFilters = [];
	const seriesList = [];
	echarts["util"]["each"](countries, function (country)
	{
		const datasetId = 'dataset_' + country;
		datasetWithFilters.push({
			"id": datasetId,
			"fromDatasetId": "dataset_raw",
			"transform": {
				"type": "filter",
				"config": {
					"and": [
						{ "dimension": "Year", "gte": 1950 },
						{ "dimension": "Country", "=": country }
					]
				}
			}
		});
		seriesList.push({
			"type": "line",
			"datasetId": datasetId,
			"showSymbol": false,
			"name": country,
			"endLabel": {
				"show": true,
				"formatter": params => params["value"][3] + ": " + params["value"][0]
			},
			"labelLayout": {
				"moveOverlap": "shiftY"
			},
			"emphasis": {
				"focus": "series"
			},
			"encode": {
				"x": "Year",
				"y": "Income",
				"label": ["Country", "Income"],
				"itemName": "Year",
				"tooltip": ["Income"]
			}
		});
	});

	const option = {
		"animationDuration": 10000,
		"dataset": [
			{
				"id": "dataset_raw",
				"source": chartDataJson
			},
			...datasetWithFilters
		],
		"title": {
			"text": "Income of Germany and France since 1950"
		},
		"tooltip": {
			"order": "valueDesc",
			"trigger": "axis"
		},
		"xAxis": {
			"type": "category",
			"nameLocation": "middle"
		},
		"yAxis": {
			"name": "Income"
		},
		"grid": {
			"right": 140
		},
		"series": seriesList
	};
	chart["setOption"](option);
}

function OnEndComplexChartLayout()
{
	chart = null;
}