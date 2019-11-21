$(function() {

var $modal = $('.modal');

// Show loader & then get content when modal is shown
$modal.on('show.bs.modal', function(e) {
  var calibrationId= $(e.relatedTarget).data('id');

  $(this)
    .addClass('modal-scrollfix')
    .find('.modal-body')
    .html('loading...')
    .load('/view/calibration/configuration/' + calibrationId, function() {
      // Use Bootstrap's built-in function to fix scrolling (to no avail)
      $modal
        .removeClass('modal-scrollfix')
        .modal('handleUpdate');
    });
});

});
