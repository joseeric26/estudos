segundos = int(input("Digite o número de segundos: "))
dias = segundos // 86400
dias_restantes = segundos % 86400
horas = dias_restantes // 3600
horas_restantes = dias_restantes % 3600
minutos = horas_restantes // 60
minutos_restantes = horas_restantes % 60
segundos_final = minutos_restantes
print(f"{segundos} segundos equivalem a {dias} dias, {horas} horas, {minutos} minutos e {segundos_final} segundos")
