import random
n = random.randint(1, 20)
palpite = 0 # Initialize palpite to ensure the loop runs at least once
print("Tente adivinhar o número entre 1 e 20!")

while palpite != n: # Loop while the guess is incorrect
  try:
    palpite = int(input("Diga seu palpite: "))
  except ValueError:
    print("Entrada inválida. Por favor, digite um número inteiro.")
    continue # Skip to the next iteration to ask for a valid number

  if palpite == n:
    print("Parabéns! Você acertou!")
  else:
    print("Você errou.")while 
    quer_dica_str = input("Quer uma dica? (sim/não): ").lower()
    if quer_dica_str == 'sim':
      c = random.randint(1,3) # Random choice for hint type
      if c == 1:
        if n > 10:
          print("Dica: O número é maior que 10.")
        else:
          print("Dica: O número é menor que 10.")
      elif c == 2:
        if n % 2 == 0:
          print("Dica: O número é par.")
        else:
          print("Dica: O número é ímpar.")
      else:
        print("Dica: foda-se kkk")