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

function draw_map(iso3, year) {
	var current_data = get_data(iso3, year)
	var current_vals = []
	for (var key in current_data.data) {
		if (key != 'ETH'){
			current_vals.push(current_data.data[key])
		}
	}
	var max_val = d3.max(current_vals)
	var min_val = d3.min(current_vals)

	var val_scale = d3.scale.linear()
		.domain([min_val, max_val])
		.range(['pink', 'maroon'])

	// Set projection -- how the geography is distorted
	var projection = d3.geo.equirectangular()

	var map_g = d3.select('#chart-svg')
		.append('g')
		.attr('id', 'map-g')

	// Set path generator -- how coordinates translate into a path element
	var path = d3.geo.path().projection(projection)

	d3.select('#map-g').selectAll('path').remove()
	// Draw paths
	var paths = d3.select('#map-g').selectAll('path')
		.data(shape.features)
		.enter().append("path")
		.attr("fill", function(d){
			var tmp_val = current_data.data[d.properties.adm0_a3]
			
			return (tmp_val == undefined | tmp_val == 0) ? '#d3d3d3' : val_scale(tmp_val)
		})
		.attr("stroke", "#000")
		.attr('d', path)

}

function tick() {
	draw_map(settings.iso3, settings.year)
	settings.year += 1
}

var settings = {
	iso3: 'ETH',
	year: 1988
}

window.setInterval(tick, 750)

