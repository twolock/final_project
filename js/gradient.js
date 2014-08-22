
function make_gradient(start, end, container) { 
var gradient = container.append("svg:defs")
  .append("svg:linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad");
 
gradient.append("svg:stop")
    .attr("offset", "0%")
    .attr("stop-color", start)
    .attr("stop-opacity", 1);
 
gradient.append("svg:stop")
    .attr("offset", "100%")
    .attr("stop-color", end)
    .attr("stop-opacity", 1);
return gradient
}