/* Javascript for DevelopersEyesXBlock. */
function DevelopersEyesXBlock(runtime, element, data) {
    $(".view-on-map").click(function() {
      parent.postMessage(JSON.stringify({action: 'openMap' }),'*');
    });

    $('a').on('click', function(evt) {
      var id = this.id;
      $(this).zoomTo({
        targetsize: 0.5,
        duration: 600,
        root: $('#container'),
        animationendcallback: function(){
          $('#'+id+'Content').fadeIn();

          if(id === 'goodBones') {
            $("#twentytwenty").twentytwenty();
          }
          else if(id === 'placemakingPotential') {
            PhotoSphereViewer({
              container: document.getElementById('panoContainer'),
              panorama: 'http://54.83.196.116:8080/asset-v1:edX+DemoX+Demo_Course+type@asset+block@pano2.jpg',
              mousemove: false,
              mousewheel: false,
              navbar: false
            });
          }
          else if (id === 'investmentPotential') {
            initMultibarChart(runtime, element, data);
          }
        }});
      evt.stopPropagation();
    });

    $('.back-to-aerial-view').on('click', function(){
      $('.developerEyesContent').fadeOut(400);
      setTimeout( zoom.out, 400 );
    });

    $(window).on('resize', function(){
      $('#container').css('width', window.innerWidth).css('height', window.innerHeight);
      $('.course-wrapper').css('max-width', window.innerWidth);
    });
}
