$(document).ready(function() {
	$('#raw-table').DataTable(
{"aLengthMenu": [[100, 200, -1], [100,  200, "All"]],
"pageLength": 100,
"columnDefs": [
        {"className": "dt-center", "targets": "_all"}]
});
});
