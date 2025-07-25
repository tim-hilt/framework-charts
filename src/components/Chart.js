import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

/**
 * Other improvements:
 * - Virtualization => Render only what you see
 * - Don't load all data at pageload. Only an overview
 *   for the context and the initial data for the focus
 *   chart. Then reload data on select / scroll with
 *   infinite scroll methods
 */

export function FocusContextChart(data, width, x, ys) {
	const dispatch = d3.dispatch("timeWindow");

	function createFocus() {
		const spec = {
			width,
			marks: [
				Plot.lineY(data, {
					x,
					y: ys[0],
					clip: true,
					tip: true,
				}),
			],
			x: { type: "utc" },
		};

		let chart = Plot.plot(spec);
		const wrapper = d3
			.create("svg")
			.attr("viewBox", chart.getAttribute("viewBox"))
			.node();
		wrapper.appendChild(chart);

		const xScale = chart.scale("x");
		const yScale = chart.scale("y");
		let domain = xScale.domain;

		const redraw = () => {
			const newChart = Plot.plot({
				...spec,
				x: { type: "utc", domain },
				y: yScale,
			});
			chart.replaceWith(newChart);
			chart = newChart;
		};

		const X0 = d3.scaleUtc(xScale.domain, xScale.range);
		const E = [
			[xScale.range[0], 0],
			[xScale.range[1], 0],
		];

		const zoom = d3
			.zoom()
			.scaleExtent([1, Infinity])
			.extent(E)
			.translateExtent(E)
			.on("zoom end", (event) => {
				const { transform, sourceEvent } = event;
				domain = transform.rescaleX(X0).domain();
				redraw();
				// broadcast changes if they are originated here
				if (sourceEvent) dispatch.call("timeWindow", wrapper, domain);
			});

		d3.select(wrapper).call(zoom);

		dispatch.on("timeWindow.details", function (value) {
			if (this === wrapper) return; // ignore our own message
			domain = (value == null ? xScale.domain : value).slice();
			d3.select(wrapper).call(
				zoom.transform,
				d3.zoomIdentity
					.translate(xScale.range[0], 0)
					.scale(
						(xScale.domain[1] - xScale.domain[0]) / (domain[1] - domain[0]),
					)
					.translate(-X0(domain[0]), 0),
			);
		});

		return wrapper;
	}

	function createContext() {
		const chart = Plot.plot({
			width,
			height: 90,
			marks: [Plot.lineY(data, { x, y: ys[0] })],
			y: { ticks: 0, label: null },
		});

		const xScale = chart.scale("x");
		const [x1, x2] = xScale.range;
		const yScale = chart.scale("y");
		const [y1, y2] = yScale.range;
		let domain = xScale.domain;

		const wrapper = d3
			.create("svg")
			.attr("viewBox", chart.getAttribute("viewBox"))
			.node();
		wrapper.appendChild(chart);

		const brush = d3
			.brushX()
			.extent([
				[x1, y2],
				[x2, y1],
			])
			.on("brush end", (event) => {
				const { selection, sourceEvent } = event;
				domain = selection?.map(xScale.invert);
				// broadcast changes if they are originated here
				if (sourceEvent) dispatch.call("timeWindow", wrapper, domain);
			});

		d3.select(wrapper).call(brush).on("dblclick", focusLastThreeMonths);

		dispatch.on("timeWindow.focus", function (value) {
			if (this === wrapper) return; // ignore our own message
			if (value == null) return;
			domain = value;
			const b = domain.map(xScale.apply);
			if (b[0] < x1 || b[1] > x2) {
				d3.select(wrapper).call(brush.clear);
			} else {
				d3.select(wrapper).call(brush.move, domain.map(xScale.apply));
			}
		});

		return wrapper;
	}

	function focusLastThreeMonths() {
		const dataExtent = d3.extent(data, (d) => d.timestamp);
		const endDate = dataExtent[1];
		const startDate = new Date(endDate);
		startDate.setMonth(startDate.getMonth() - 3);

		dispatch.call("timeWindow", "reset", [startDate, endDate]);
	}

	const focus = createFocus();
	const context = createContext();

	const container = d3.create("div").node();

	container.appendChild(focus);
	container.appendChild(context);

	focusLastThreeMonths();

	return container;
}
