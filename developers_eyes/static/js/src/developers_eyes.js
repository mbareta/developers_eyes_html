/* Javascript for DevelopersEyesXBlock. */
function DevelopersEyesXBlock(runtime, element) {
    $('a').on('click', function() {
        var id = this.id;
        zoom.to({element: this, callback: function(){
          $('#'+id+'Content').fadeIn();

          if(id === 'goodBones') {
            $("#twentytwenty").twentytwenty();
          }
          else if(id === 'placemakingPotential') {
            PhotoSphereViewer({
              container: document.getElementById('panoContainer'),
              panorama: 'http://54.83.196.116:8080/asset-v1:edX+DemoX+Demo_Course+type@asset+block@pano2.jpg',
              mousemove: false,
              mousewheel: false
            });
          }
          else if (id === 'investmentPotential') {
            initMultibarChart();
          }
        }});
      });

      $('.back-to-aerial-view').on('click', function(){
        $('.developerEyesContent').fadeOut();
        zoom.out();
      });
}
