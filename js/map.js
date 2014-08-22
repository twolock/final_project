
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
	else if (iso3 == 'COD') {return 'Dem. Rep. Congo'}
	else if (iso3 == 'CIV') {return "Cote d'Ivoire"}
	else if (iso3 == 'GUF') {return 'France'}
	else {return (iso3 == 'SSD') ? 'South Sudan' : shape.features.filter(function(d) {return d.properties.adm0_a3 == iso3})[0].properties.brk_name}
}

function get_ISO3(name) {
	if (["Cote d'Ivoire", 'Palestine', 'South Sudan', 'Dem. Rep. Congo'].indexOf(name) == -1) {
		var tmp_data = shape.features.filter(function(d) {
		return (d.properties.brk_name == name)
		})[0]

		return tmp_data.properties.adm0_a3
	}
	else {
		switch (name) {
			case "Cote d'Ivoire":
				return 'CIV'
				break
			case "Palestine":
				return 'PSE'
				break				
			case "South Sudan":
				return 'SSD'
				break				
			case "Dem. Rep. Congo":
				return 'COD'
				break				
		}

	}
}

function top_neighbors(iso3, year, data, data2) {
	tmp_data = get_data(iso3, year, data2).data

	var sorted = []
	for (var key in tmp_data) {
		if (Math.abs(tmp_data[key]) > 0) {
			sorted.push([get_name(key), Math.abs(tmp_data[key]), key])
		}
	}
	sorted.sort(function(a, b){
		return b[1]-a[1]
	})

	return sorted.slice(0, 5)
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
		.range(settings.recip_color)
	var donor_scale = d3.scale.linear()
		.domain([0, max_val])
		.range(settings.donor_color)
	
	dash_g.selectAll('.scale-label').remove()
	dash_g.append('text')
		.text(d3.format('.3s')(Math.abs(0)))
		.attr('class', 'scale-label')
		.attr('x', 10)
		.attr('y', (353))		
	dash_g.append('text')
		.text(d3.format('.3s')(Math.abs(min_val)))
		.attr('class', 'scale-label')
		.attr('x', 280)
		.attr('y', (353))		
	dash_g.append('text')
		.text(d3.format('.3s')(Math.abs(0)))
		.attr('class', 'scale-label')
		.attr('x', 10)
		.attr('y', (408))		
	dash_g.append('text')
		.text(d3.format('.3s')(Math.abs(max_val)))
		.attr('class', 'scale-label')
		.attr('x', 280)
		.attr('y', (408))		


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
	$('#slider-label').text('(Currently ' + settings.year + ')')
	make_dash()
	return true

}

function make_list() {
	dash_g.selectAll('#recip-list').remove()
	var recip_text = dash_g.selectAll('#recip-list').data(top_neighbors(settings.iso3, settings.year, data, donor_data))
	recip_text.enter().append('text')
		.text(function(d,i){return (i+1)+'.  '+d[0]})
		.attr('y', function(d, i) {return i * 17 + settings.heading_gap + 200 + (0)})
		.attr('id', 'recip-list')
		.attr('class', 'rank-list')

	dash_g.selectAll('#donor-list').remove()
	var donor_text = dash_g.selectAll('#donor-list').data(top_neighbors(settings.iso3, settings.year, data, recip_data))
	donor_text.enter().append('text')
		.text(function(d,i){return (i+1)+'.  '+d[0]})
		.attr('x', 200)
		.attr('y', function(d, i) {return i * 17 + settings.heading_gap + 200 + (0)})
		.attr('id', 'donor-list')
		.attr('class', 'rank-list')
	$('.rank-list').on('click', function() {
		var tmp_iso3 = this.__data__[2]
		settings.iso3 = tmp_iso3
		draw_map() 
	})
}

function scale_gradients(arr, y) {
	make_gradient(arr[0], arr[1],dash_g)
	dash_g.append('rect')
		.attr('id', 'donor-scale')
		.attr('x', 10)
		.attr('y', y)
		.attr('height', 15)
		.attr('width', 300)
		.attr('fill', 'url(#gradient)')
}

function make_dash() {
	dash_g.selectAll('#country-name').remove()
	dash_g.append('text')
		.text(get_name(settings.iso3))
		.attr('transform', 'translate(0,' + (0) + ')')
		.attr('id', 'country-name')
	
	dash_g.selectAll('#selected-year').remove()
	dash_g.append('text')
		.text(settings.year)
		.attr('transform', 'translate(0,' + (0 + settings.country_to_year) + ')')
		.attr('id', 'selected-year')
	
	dash_g.selectAll('#amt-donated').remove()
	dash_g.append('text')
		.text(function() {
			return d3.format('.3s')(obj_sum(get_data(settings.iso3, settings.year, donor_data).data)) + ' metric tons donated'
		})
		.attr('transform', 'translate(0,' + (0
			+ settings.country_to_year + settings.year_to_donated) + ')')
		.attr('id', 'amt-donated')
		.attr('class', 'amt')
	
	dash_g.selectAll('#amt-received').remove()
	dash_g.append('text')
		.text(function() {
			return d3.format('.3s')(Math.abs(obj_sum(get_data(settings.iso3, settings.year, recip_data).data))) + ' metric tons received'
		})
		.attr('transform', 'translate(0,' + (0
			+ settings.country_to_year + settings.year_to_donated + settings.donated_to_received) + ')')
		.attr('id', 'amt-received')
		.attr('class', 'amt')

	var donor_text = (get_data(settings.iso3, settings.year, data).ALL > 0) ? 'Net Donor' : 'Net Recipient'
	if (get_data(settings.iso3, settings.year, data).ALL == 0) {var donor_text = 'No Relationships'}
	var donor_color = (get_data(settings.iso3, settings.year, data).ALL > 0) ? '#7A1B01' : '#086270'
	if (donor_text == 'No Relationships') {var donor_color = '#C9BE62'}
	dash_g.selectAll('#donor-status').remove()
	dash_g.append('text')
		.text(donor_text)
		.attr('transform', 'translate(0,' + (0
			+ settings.country_to_year + settings.year_to_donated + settings.donated_to_received + settings.received_to_status) + ')')
		.attr('id', 'donor-status')
		.attr('fill', donor_color)

	make_list()
	$('#country-menu').val(settings.iso3)
}

function get_country_list() {
	var list = Object.keys(get_data(settings.iso3, settings.year, data).data)
	var list = list.map(get_name)
	list.sort()
	return list
}

var settings = {
	iso3: 'USA',
	year: 1999,
	map_w: 1000,
	top_to_title: 50,
	title_to_subtitle: 25,
	subtitle_to_selection: 0,
	selection_to_map:20,
	heading_gap: 20,
	country_to_year: 30,
	year_to_donated: 55,
	donated_to_received: 30,
	received_to_status: 35,
	recip_color: ['#E3B1A3', '#7A1B01'],
	donor_color: ['#93BCC2', '#086270']
}
settings.title_dist = settings.top_to_title
settings.subtitle_dist = settings.title_dist + settings.title_to_subtitle
settings.selection_dist = settings.subtitle_dist + settings.subtitle_to_selection
settings.map_dist = settings.selection_dist + settings.selection_to_map

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

var country_list = get_country_list()
var country_menu = d3.select('#country-menu')
var country_list = country_menu.selectAll('option')
	.data(country_list)
	.enter().append('option')
	.attr('value', function(d) {return get_ISO3(d)})
	.text(function(d) {return d})

$('#country-menu').val(settings.iso3)
	.on('change', function() {
	settings.iso3 = $('#country-menu').val()
	draw_map()
})


var map_g = d3.select('#chart-svg')
	.append('g')
	.attr('id', 'map-g')
	// Set projection -- how the geography is distorted
var title = map_g.append('text')
	.attr('class', 'title')
	.text('Donors and Recipients of Food Aid')
	.attr('y', settings.top_to_title)
var subtitle = map_g.append('text')
	.text('Net metric tons (MT) of food aid sent and received globally, 1988-2012')
	.attr('x', 2)
	.attr('y', settings.subtitle_dist)
	.attr('class', 'subtitle')
var subtitle = map_g.append('text')
	.text("Click on a country to view that country's relationships in the selected year.")
	.attr('class', 'subtitle')
	.attr('x', 2)
	.attr('y', settings.subtitle_dist + 20)


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
	.attr('transform', 'translate(0,'+(settings.map_dist)+')')
	.style('cursor', 'pointer')
	.attr('id', function(d) {
		return d.properties.adm0_a3
	})

var dash_g = d3.select('#chart-svg').append('g')
	.attr('id', 'dash-g')
	.attr('transform', 'translate(' + settings.map_w + ','+(settings.map_dist + 50)+')')
d3.select('#dash-g').append('text').text('Top 5 Recipients')
	.attr('class', 'heading')
	.attr('transform', 'translate(0,' + (200 + 0) + ')')
d3.select('#dash-g').append('text').text('Top 5 Donors')
	.attr('transform', 'translate(200,' + (200 + 0) + ')')
	.attr('class', 'heading')
d3.select('#dash-g').append('text').text('Donors')
	.attr('transform', 'translate(10,' + (200 + 120) + ')')
scale_gradients(settings.recip_color, 325)

d3.select('#dash-g').append('text').text('Recipients')
	.attr('transform', 'translate(10,' + (200 + 175) + ')')
scale_gradients(settings.donor_color, 380)

$('.country').on('click', function() {
	var tmp_iso3 = this.__data__.properties.adm0_a3
	settings.iso3 = tmp_iso3
	draw_map()
})

$('.country').poshytip({
	alignTo: 'cursor', // Align to cursor
	followCursor: true, // follow cursor when it ©
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
		var name = get_name(obj.properties.adm0_a3) // Name from properties
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
					return name + '<br>Net ' + d3.format('.3s')(Math.abs(net_data)) + ' MT Received'
				}
				else {
					return name + '<br>Net ' + d3.format('.3s')(net_data) + ' MT Donated'
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

