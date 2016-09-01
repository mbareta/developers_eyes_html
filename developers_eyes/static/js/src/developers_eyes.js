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
              panorama: 'http://localhost:8000/asset-v1:mitX+MITBE001+2017_T1+type@asset+block@pano.jpg',
              mousemove: false,
              mousewheel: false
            });
          }
        }});
      });

      $('.back-to-aerial-view').on('click', function(){
        $('.developerEyesContent').fadeOut();
        zoom.out();
      });
}
