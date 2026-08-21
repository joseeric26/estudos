preço = float(input("Digite o preço do produto: "))
desconto = float(input("Digite o desconto do produto: "))
preço_final = preço - (preço * desconto)
print(f"O preço final do produto é: {preço_final}")