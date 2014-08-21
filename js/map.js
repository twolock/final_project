
function get_data(iso3, year, obj){
	var out_data = obj.filter(function(d) {
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

function get_name(iso3) {
	if (iso3 == 'SSD') {return 'South Sudan'}
	else if (iso3 == 'PSE') {return 'Palestine'}
	else {return (iso3 == 'SSD') ? 'South Sudan' : shape.features.filter(function(d) {return d.properties.adm0_a3 == iso3})[0].properties.brk_name}
}

function top_neighbors(iso3, year, data, data2) {
	var net_data = get_data(iso3, year, data).ALL

/*
	if (net_data > 0) {
		var tmp_data = get_data(iso3, year, donor_data).data
	}
	else {
		var tmp_data = get_data(iso3, year, recip_data).data
	}
*/
	tmp_data = get_data(iso3, year, data2).data

	// var tmp_data = get_data(iso3, year, neighbor_obj).data
	var tmp_vals = []
	for (var i = Object.keys(tmp_data).length - 1; i >= 0; i--) {
		tmp_vals.push(Math.abs(tmp_data[Object.keys(tmp_data)[i]]))
	};
	tmp_vals.sort(function(a,b){
		return b-a
	})

	var rev_data = {}
	for (var i = Object.keys(tmp_data).length - 1; i >= 0; i--) {
		if (Math.abs(tmp_data[Object.keys(tmp_data)[i]]) > 0) {
			rev_data[Math.abs(tmp_data[Object.keys(tmp_data)[i]])] = Object.keys(tmp_data)[i]
		}
	};

	var out_list = []
	if (Object.keys(rev_data).length > 0){
		for (i = 0; i <= Math.min(9, Object.keys(rev_data).length-1); i++) {
			out_list.push([get_name(rev_data[tmp_vals[i]]), tmp_vals[i], rev_data[tmp_vals[i]]])
		}
	}

	return out_list
}

function draw_map() {
	var iso3 = settings.iso3, year = settings.year
	var current_data = get_data(iso3, year, data)
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
		.range(['#E3B1A3', '#7A1B01'])
	var donor_scale = d3.scale.linear()
		.domain([0, max_val])
		.range(['#93BCC2', '#086270'])
	
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
		.attr('class', function(d){
			if (d.properties.adm0_a3 == settings.iso3) {
				return 'selected'
			}
			else {
				return 'unselected'
			}
		})
	make_list()
	return true

}



var settings = {
	iso3: 'USA',
	year: 2000,
	map_w: 1000,
	subtitle_gap: 20
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

function make_list() {
	dash_g.selectAll('#recip-list').remove()
	var recip_text = dash_g.selectAll('#recip-list').data(top_neighbors(settings.iso3, settings.year, data, donor_data))
	recip_text.enter().append('text')
		.text(function(d,i){return (i+1)+'.  '+d[0]})
		.attr('y', function(d, i) {return i * 17 + settings.subtitle_gap})
		.attr('id', 'recip-list')
		.attr('class', 'rank-list')

	dash_g.selectAll('#donor-list').remove()
	var donor_text = dash_g.selectAll('#donor-list').data(top_neighbors(settings.iso3, settings.year, data, recip_data))
	donor_text.enter().append('text')
		.text(function(d,i){return (i+1)+'.  '+d[0]})
		.attr('y', function(d, i) {return i * 17 + settings.subtitle_gap + 200})
		.attr('id', 'donor-list')
		.attr('class', 'rank-list')

}

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

var dash_g = d3.select('#chart-svg').append('g')
	.attr('id', 'dash-g')
	.attr('transform', 'translate(' + settings.map_w + ',50)')
d3.select('#dash-g').append('text').text('Top 10 Recipients')
	.attr('class', 'subtitle')
d3.select('#dash-g').append('text').text('Top 10 Donors')
	.attr('transform', 'translate(0,' + 200 + ')')
	.attr('class', 'subtitle')

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
		var tmp_iso3 = obj.properties.adm0_a3
		var net_data = get_data(settings.iso3, settings.year, data).data[tmp_iso3]
		if (net_data != 0 & net_data != undefined){
			if (net_data > 0) {
				var tmp_data = get_data(settings.iso3, settings.year, donor_data).data[tmp_iso3]
				return name + '<br>' + d3.format('.3s')(tmp_data) + ' MT from ' + get_name(settings.iso3) // String to return
			}
			else {
				var tmp_data = get_data(settings.iso3, settings.year, recip_data).data[tmp_iso3]
				return name + '<br>' + d3.format('.3s')(Math.abs(tmp_data)) + ' MT to ' + get_name(settings.iso3) // String to return				
			}
		}
		else {
			if (tmp_iso3 == settings.iso3) {
				var net_data = get_data(tmp_iso3, settings.year, data)['ALL']
				if (net_data < 0) {
					return name + '<br>' + d3.format('.3s')(Math.abs(net_data)) + ' MT Received'
				}
				else {
					return name + '<br>' + d3.format('.3s')(net_data) + ' MT Donated'
				}
			}
			if (net_data == 0) {
				return name + '<br>No relationship'
			}
			else if (net_data == undefined) {
				return name + '<br>No data'
			}
		}
	}

})

$('.rank-list').poshytip({
	alignTo: 'target', // Align to cursor
	followCursor: true, // follow cursor when it moves
	fade:false,
	allowTipHover: false,
	showTimeout: 0, // No fade in
	hideTimeout: 0,  // No fade out
	alignX: 'left', // X alignment
	alignY: 'top', // Y alignment
	className: 'tip-twitter', // Class for styling
	slide: false, // No slide animation
	offsetY: -25,
	offsetX: 10,
	liveEvents:true,
	content: function(d){
		var obj = this.__data__ // Data associated with element
		var tmp_iso3 = obj[2]
		var net_data = get_data(settings.iso3, settings.year, data).data[tmp_iso3]
		var name = get_name(tmp_iso3) // Name from properties

		return d3.format('.3s')(Math.abs(net_data)) + ' Metric Tons'
	}

})

draw_map()

