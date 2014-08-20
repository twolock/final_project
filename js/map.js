
function get_data(iso3, year){
	var out_data = data.filter(function(d) {
		return d.iso3 == iso3 & d.year == year
	})

	var subset = clone(out_data[0])
	var non_data_vars = ['year', 'iso3', 'donor_only', 'location_name', 'net_donor', 'net_recip', 'recip_only', 'ALL']

	var tmp_data = {}
	for (var i = Object.keys(subset).length - 1; i >= 0; i--) {
		var tmp_key = Object.keys(subset)[i]
		if (non_data_vars.indexOf(tmp_key) == -1){
			tmp_data[tmp_key] = subset[tmp_key]
			delete subset[tmp_key]
		}
	};
	subset['data'] = tmp_data
	return subset
}

function draw_map() {
	var iso3 = settings.iso3, year = settings.year
	var current_data = get_data(iso3, year)
	var current_vals = []
	for (var key in current_data.data) {
		if (key != 'ETH'){
			current_vals.push(current_data.data[key])
		}
	}
	var max_val = d3.max(current_vals)
	var min_val = d3.min(current_vals)

	var recip_scale = d3.scale.linear()
		.domain([0, min_val])
		.range(['#FFDFDD', 'maroon'])
	var donor_scale = d3.scale.linear()
		.domain([0, max_val])
		.range(['#C4DDFF', '#253D5E'])
	
	paths.transition(100)
		.attr("fill", function(d){
			var tmp_val = current_data.data[d.properties.adm0_a3]
			var tmp_scale = (tmp_val > 0) ? donor_scale : recip_scale
			var tmp_iso3 = d.properties.adm0_a3

			if (tmp_iso3 == settings.iso3) {
				return '#C9BE62'
			}
			else {
				return (tmp_val == undefined | tmp_val == 0) ? '#d3d3d3' : tmp_scale(tmp_val)
			}
		})

	return true

}



var settings = {
	iso3: 'USA',
	year: 1988
}

$('#slider-div').slider({
	min:1988,
	max:2012,
	value:settings.year,
	step: 1,
	slide: function(event, ui){
		settings.year = ui.value
		draw_map()
		$('#year-text').text(ui.value)
	}

})

var map_g = d3.select('#chart-svg')
	.append('g')
	.attr('id', 'map-g')
	// Set projection -- how the geography is distorted
var projection = d3.geo.equirectangular()

// Set path generator -- how coordinates translate into a path element
var path = d3.geo.path().projection(projection)

d3.select('#map-g').selectAll('.country').remove()
// Draw paths
var paths = d3.select('#map-g').selectAll('.country')
	.data(shape.features)
	.enter().append("path")
	.attr('class', 'country')
	.attr('fill', '#d3d3d3')
	.attr("stroke", "#ffffff")
	.attr('d', path)
	.style('cursor', 'pointer')

$('.country').on('click', function() {
	var tmp_iso3 = this.__data__.properties.adm0_a3
	settings.iso3 = tmp_iso3
	draw_map()
})

$('.country').poshytip({
	alignTo: 'cursor', // Align to cursor
	followCursor: true, // follow cursor when it moves
	fade:false,
	allowTipHover: false,
	showTimeout: 0, // No fade in
	hideTimeout: 0,  // No fade out
	alignX: 'center', // X alignment
	alignY: 'inner-bottom', // Y alignment
	className: 'tip-twitter', // Class for styling
	offsetY: 10, // Offset vertically
	slide: false, // No slide animation
	content: function(d){
		var obj = this.__data__ // Data associated with element
		var name = obj.properties.brk_name // Name from properties
		return name // String to return
	}

})

draw_map()
