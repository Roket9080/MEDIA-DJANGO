from django.shortcuts import render

def fn_transferencia(request):
    resultado = ""
    dato = None
    metodo = request.method
    
    if request.method == "GET":
        dato = request.GET.get("dato")
        if dato:
            resultado = "El dato llego mediante GET."
            
    elif request.method == "POST":
        dato = request.POST.get("dato")
        if dato:
            resultado = "El dato llego mediante POST."
            
    # El return debe estar afuera de los if/elif, al nivel principal de la función
    return render(
        request,
        "app_transferencia/index.html",
        {
            "resultado": resultado,
            "dato": dato,
            "metodo": metodo,
        }
    )