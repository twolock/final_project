function get_data(iso3, year){
	var out_data = data.filter(function(d) {
		return d.iso3 == iso3 & d.year == year
	})

	var subset = out_data[0]
	var non_data_vars = ['year', 'iso3', 'donor_only', 'location_name', 'net_donor', 'net_recip', 'recip_only']

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
/*
var iso3 = 'USA'
var year = 1988

	var out_data = data.filter(function(d) {
		return d.iso3 == iso3 & d.year == year
	})

	var subset = out_data[0]
	var non_data_vars = ['year', 'iso3', 'donor_only', 'location_name', 'net_donor', 'net_recip', 'recip_only']

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
*/

