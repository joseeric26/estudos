preco_produto = float(input("Preço do produto: R$ "))
valor_pago = float(input("Valor pago: R$ "))
troco = valor_pago - preco_produto
if troco < 0:
    print("Valor pago insuficiente.")
else:
    print(f"Troco: R$ {troco:.2f}")