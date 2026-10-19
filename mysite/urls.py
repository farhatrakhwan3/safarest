from django.contrib import admin
from django.urls import path
from home import views  # Correctly importing views from your home app

urlpatterns = [

    # =========================
    # ADMIN
    # =========================
    path("admin/", admin.site.urls),

    # =========================
    # HOME & GENERAL
    # =========================
    path("", views.home, name="home"),  # This correctly handles your root URL
    path("about/", views.about, name="about"),
    path("assistant/", views.assistant, name="assistant"),

    # =========================
    # QA/QC
    # =========================
    path("qaqc/moisture/", views.qaqc_moisture, name="qaqc_moisture"),
    path("qaqc/sieve/", views.qaqc_sieve, name="qaqc_sieve"),
    path("qaqc/cube/", views.qaqc_cube, name="qaqc_cube"),
    path("qaqc/silt/", views.qaqc_silt, name="qaqc_silt"),
    path("qaqc/bulkage/", views.qaqc_bulkage, name="qaqc_bulkage"),

    # =========================
    # SURVEY
    # =========================
    path("survey/sympson/", views.sur_sympson, name="sur_sympson"),
    path("survey/area/", views.sur_area, name="sur_area"),

    # =========================
    # CIVIL APTITUDE
    # =========================
    path("aptitude/weight/", views.apt_weight, name="apt_weight"),
    path("aptitude/area/", views.apt_area, name="apt_area"),
    path("aptitude/volume/", views.apt_volume, name="apt_volume"),

    # =========================
    # PDF TOOLS
    # =========================
    path("pdf/merge/", views.pdf_merge, name="pdf_merge"),
    path("pdf/split/", views.pdf_split, name="pdf_split"),
    path("pdf/rotate/", views.pdf_rotate, name="pdf_rotate"),
    path("pdf/crop/", views.pdf_crop, name="pdf_crop"),
    path("pdf/unlock/", views.pdf_unlock, name="pdf_unlock"),
    path("pdf/lock/", views.pdf_lock, name="pdf_lock"),
    path("pdf/shade/", views.pdf_shade, name="pdf_shade"),
    path("pdf/save-shade/", views.pdf_save_shade, name="save_shade_sample"),

    # =========================
    # DOWNLOAD & UTILS
    # =========================
    path("download/", views.download_file, name="download_file"),

    # =========================
    # UNIFIED CAD & ESTIMATION WORKSPACE
    # =========================
    # Main CAD & Sheet Link
    path("cad-workspace/", views.workspace_view, name="cad_workspace"),
    
    # Estimation Submenus (Footing, Beam, Column, etc.)
    path("estimation/<str:tool_type>/", views.workspace_view, name="estimation_workspace"),
]
