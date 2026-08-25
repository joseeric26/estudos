#leia 3 valores, no caso, A,B e C, que são as notas de um aluno. A seguir, calcule a média do aluno, sabendo que a nota A tem peso 2, a nota B tem peso 3 e a nota C tem peso 5. Considere que cada nota pode ir de 0 até 10.0, sempre com uma casa decimal.
#pede a nota 
A = float(input("Digite a nota A: "))
B = float(input("Digite a nota B: "))
C = float(input("Digite a nota C: "))
#calculo
media = (A * 2 + B * 3 + C * 5) / 10
#resposta
print(f"Média = {media:.1f}")