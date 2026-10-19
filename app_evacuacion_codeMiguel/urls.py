from django.urls import path
from . import views  # Importas las vistas de tu propia app

urlpatterns = [
    # Como tu vista se encarga de renderizar la evacuación, usa 'index' o 'evacuacion'
    path('', views.index, name='evacuacion.html'),
    path('', views.index, name='panel_codeMiguel'),
]