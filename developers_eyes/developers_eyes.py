"""TO-DO: Write a description of what this XBlock is."""

import pkg_resources

from xblock.core import XBlock
from xblock.fields import Scope, String
from xblock.fragment import Fragment


class DevelopersEyesXBlock(XBlock):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.

    # TO-DO: delete count, and define your own fields.
    xlsx_url = String(
        default=None, scope=Scope.user_state,
        help="URL to XLSX document with chart data",
    )

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        The primary view of the DevelopersEyesXBlock, shown to students
        when viewing courses.
        """
        html = self.resource_string("static/html/developers_eyes.html")
        frag = Fragment(html.format(self=self))
        frag.add_css_url(
            self.runtime.local_resource_url(
                self, 'public/css/twentytwenty.css'))
        frag.add_css_url(
            self.runtime.local_resource_url(
                self, 'public/css/photo-sphere-viewer.css'))
        frag.add_css_url(
            self.runtime.local_resource_url(
                self, 'public/css/developers_eyes.css'))
        frag.add_javascript(self.resource_string("static/js/lib/zoom.js"))
        frag.add_javascript(self.resource_string("static/js/lib/jquery.event.move.js"))
        frag.add_javascript(self.resource_string("static/js/lib/jquery.twentytwenty.js"))
        frag.add_javascript(self.resource_string("static/js/lib/three.js"))
        frag.add_javascript(self.resource_string("static/js/lib/D.js"))
        frag.add_javascript(self.resource_string("static/js/lib/uevent.js"))
        frag.add_javascript(self.resource_string("static/js/lib/doT.js"))
        frag.add_javascript(self.resource_string("static/js/lib/photo-sphere-viewer.js"))
        frag.add_javascript(self.resource_string("static/js/src/developers_eyes.js"))
        frag.initialize_js('DevelopersEyesXBlock')
        return frag

    def studio_view(self, context):
        """
        Create a fragment used to display the edit view in the Studio.
        """
        html_str = pkg_resources.resource_string(__name__, "static/html/studio_view.html")
        frag = Fragment(unicode(html_str).format(display_name=self.display_name))
        js_str = pkg_resources.resource_string(__name__, "static/js/src/studio_edit.js")
        frag.add_javascript(unicode(js_str))
        frag.initialize_js('StudioEdit')
        return frag

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):
        """
        Called when submitting the form in Studio.
        """
        self.display_name = data.get('display_name')

        return {'result': 'success'}

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("DevelopersEyesXBlock",
             """<developers_eyes/>
             """),
            ("Multiple DevelopersEyesXBlock",
             """<vertical_demo>
                <developers_eyes/>
                <developers_eyes/>
                <developers_eyes/>
                </vertical_demo>
             """),
        ]
