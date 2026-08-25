nome = input("Primeiro nome: ").strip().capitalize()
sobrenome = input("Sobrenome: ").strip().capitalize()
completo = f"{nome} {sobrenome}"
print(f"Nome formatado: {completo}")
print(f"Iniciais: {nome[0]}.{sobrenome[0]}.")