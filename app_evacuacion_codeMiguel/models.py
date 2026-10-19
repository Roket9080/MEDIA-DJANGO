from django.db import models

class Reporte(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    #cada tipo de archivo va a su subcarpeta dentro de media/
    foto = models.ImageField(upload_to='reportes/fotos/')
    documento = models.FileField(upload_to='reportes/documentos/', blank=True)
    audio = models.FileField(upload_to='reportes/audios/', blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    video = models.FileField(upload_to='reportes/videos/',blank=True)
    def __str__(self):
        return self.nombre