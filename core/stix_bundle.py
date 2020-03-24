from flask_assets import Bundle, Environment


def set_bundles(app):

    bundles = {
        'base_js':
        Bundle('vendor/js/jquery-3.4.1.min.js',
               'vendor/js/bootstrap.min.js',
               'vendor/js/solid.js',
               'vendor/js/fontawesome.js',
               'vendor/js/is.js',
               'vendor/js/jquery.mCustomScrollbar.concat.min.js',
               'vendor/js/moment.min.js',
               'vendor/js/daterangepicker.min.js',
               'vendor/js/jquery.dataTables.min.js',
               'vendor/js/dataTables.bootstrap4.min.js',
               'js/layout.js',
               output='gen/base.js',
               filters='jsmin'),
        'base_css':
        Bundle('vendor/css/bootstrap.min.css',
               'vendor/css/font-awesome.min.css',
               'vendor/css/jquery.mCustomScrollbar.min.css',
               'vendor/css/jquery.dataTables.min.css',
               'vendor/css/daterangepicker.css',
               'css/layout.css',
               output='gen/base.css',
               filters='cssmin'
               ),
        'baseplot_css':
        Bundle('vendor/css/font-awesome.min.css',
               'vendor/css/bootstrap.min.css',
               'css/stix.plot.css',
               'vendor/css/jquery.mCustomScrollbar.min.css',
               'vendor/css/jquery.dataTables.min.css',
               'vendor/css/bootstrap-datetimepicker.min.css',
               'css/layout.css',
               'css/detector.view.css',
               output='gen/baseplot.css',
               filters='cssmin'),
        'baseplot_js':
        Bundle('vendor/js/jquery-3.4.1.min.js',
               'vendor/js/bootstrap.min.js',
               'vendor/js/popper.min.js',
               'vendor/js/plotly-latest.min.js',
               'vendor/js/is.js',
               'vendor/js/solid.js',
               'vendor/js/fontawesome.js',
               'vendor/js/jquery.mCustomScrollbar.concat.min.js',
               'vendor/js/jquery.dataTables.min.js',
               'vendor/js/bootstrap-datetimepicker.js',
               'vendor/js/dataTables.bootstrap4.min.js',
               'js/layout.js',
               'js/stix.detector.view.js',
               output='gen/baseplot.js',
               filters='jsmin'
               ),


        'basepacket_css':
        Bundle('vendor/css/bootstrap.min.css',
               'vendor/css/font-awesome.min.css',
               'css/loader.css',
               'css/TMTC.css',
               'css/toolbar.css',
               'css/layout.css',
               'vendor/css/jquery.treetable.css',
               'vendor/css/jquery.treetable.theme.default.css',

               'vendor/css/jquery.mCustomScrollbar.min.css',
               'vendor/css/bootstrap-datetimepicker.min.css',
               output='gen/basepacket.css',
               filters='cssmin'),




        'basepacket_js_header':
        Bundle('vendor/js/jquery-3.4.1.min.js',
               'vendor/js/bootstrap.min.js',
               'vendor/js/popper.min.js',
               'vendor/js/solid.js',
               'vendor/js/fontawesome.js',
               'vendor/js/jquery.mCustomScrollbar.concat.min.js',
               'vendor/js/bootstrap-datetimepicker.js',
               output='gen/basepacket.header.js',
               filters='jsmin'),
        'basepacket_js_bottom':
        Bundle('js/layout.js',
               'js/stix.datetime.js',
               'js/stix.idb.js',
               'vendor/js/jquery.treetable.js',
               'js/packet.treeview.loader.js',
               output='gen/basepacket.bottom.js',
               filters='jsmin'
               ),

        'stix_js':
        Bundle('js/stix.idb.js',
               'js/stix.common.js',
               'js/stix.datetime.js',
               'js/stix.packet.analyzer.js',
               'js/stix.plot.js',
               output='gen/stix.js',
               filters='jsmin'),
        'lightcurve_js':
        Bundle('js/lightcurve.plot.response.js',
               output='gen/lc.js',
               filters='jsmin'),
        'hk_js':Bundle(
                'js/housekeeping.plot.js',
                'js/housekeeping.plot.request.js',
               output='gen/hk.js',
               filters='jsmin'
               ),
        'dettest_js':Bundle(
                'js/detector.tests.js',
               output='gen/dettest.js',
               filters='jsmin'),
        'calibration_js':Bundle(
                'js/calibration.plot.js',
               output='gen/cal.js',
               filters='jsmin'
               ),
        'qlbkg_js':Bundle(
                'js/qlbkg.plot.response.js',
               output='gen/qlbkg.js',
               filters='jsmin'),
        'listfile_js':Bundle(
                'js/stix.datetime.js',
                'js/rawfile.list.response.js',
               output='gen/lsfile.js',
               filters='jsmin'),
        'listior_js':Bundle(
                'js/stix.datetime.js',
                'js/ior.list.response.js',
               output='gen/lsior.js',
               filters='jsmin'
               ),

        'packetview_js':Bundle(
                'js/packet.browser.js',
               output='gen/pkg.view.js',
               filters='jsmin'
               ),
        'qlspectra_js':Bundle(
                'js/ql.spectra.js',
               output='gen/qlspectra.js',
               filters='jsmin'
               ),

        'iorviewer_css':
        Bundle(
               'css/loader.css',
               'css/TMTC.css',
               'css/toolbar.css',
               'css/layout.css',
               'vendor/css/jquery.treetable.css',
               'vendor/css/jquery.treetable.theme.default.css',
               'vendor/css/bootstrap-datetimepicker.min.css',
               output='gen/ior.css',
               filters='cssmin'),

    'iorviewer_js':
        Bundle(
               'js/stix.datetime.js',
               'js/stix.idb.js',
               'vendor/js/jquery.treetable.js',
               'js/ior.browser.js',
               'js/ior.loader.js',
               output='gen/ior.viewer.js',
               filters='jsmin'
               ),

    'ior_overview_js':
        Bundle(
               'js/stix.datetime.js',
               'js/stix.idb.js',
               'js/ior.overview.js',
               output='gen/ior.viewer.js',
               filters='jsmin'
               ),
   'ior_overview_latex_js':
        Bundle(
               'js/stix.datetime.js',
               'js/stix.idb.js',
               'js/stix.common.js',
               'js/ior.overview.latex.js',
               output='gen/ior.viewer.js',
               filters='jsmin'
               ),



    'uploadfile_js':
        Bundle(
               'js/upload.file.js',
               output='gen/fileupload.js',
               filters='jsmin'
               ),


    }

    assets = Environment(app)
    assets.register(bundles)
    return assets
