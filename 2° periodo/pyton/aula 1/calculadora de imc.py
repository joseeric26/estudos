peso = float(input("Peso (kg): "))#tem que ser numero
altura = float(input("Altura (m): "))
imc = peso / (altura ** 2)
print(f"Seu IMC é {imc:.2f}")